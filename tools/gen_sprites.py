#!/usr/bin/env python3
"""
Kitty Kingdom sprite generator
==========================
Generates every sprite listed in tools/sprites.json with AI image generation,
removes the background, trims and resizes it, and saves it to assets/<key>.png.
The game picks the PNGs up automatically (procedural art is used for anything missing).

Keys are read from ../.env.local:
    OPENAI_API_KEY      image generation (gpt-image-1)
    REPLICATE_API_KEY   background removal (or REPLICATE_API_TOKEN)

Usage (from the CatTower folder):
    pip3 install pillow                 # recommended (trim/resize + local fallback)
    python3 tools/gen_sprites.py                       # generate everything that's missing
    python3 tools/gen_sprites.py --only cat_leader,r_drone --force
    python3 tools/gen_sprites.py --list                # show sprite keys
    python3 tools/gen_sprites.py --rebg                # redo background removal on assets/raw/*
    python3 tools/gen_sprites.py --embed               # also build cattower_standalone.html

Options:
    --model gpt-image-1    --quality low|medium|high (default medium)
    --bg replicate|openai|local   (default replicate; falls back to local white-key removal)
    --workers 4
Cost guide: ~74 images at medium quality is a few US dollars on OpenAI, plus a few cents on Replicate.
"""
import argparse, base64, io, json, os, sys, time, uuid, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')
RAW = os.path.join(ASSETS, 'raw')
try:
    from PIL import Image
except ImportError:
    Image = None

BG_MODELS = ['851-labs/background-remover', 'lucataco/remove-bg', 'cjwbw/rembg']


def load_env():
    env = {}
    for name in ('.env.local', '.env'):
        p = os.path.join(ROOT, name)
        if not os.path.exists(p):
            continue
        for line in open(p, encoding='utf-8'):
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    for k in ('OPENAI_API_KEY', 'REPLICATE_API_KEY', 'REPLICATE_API_TOKEN'):
        if os.environ.get(k):
            env[k] = os.environ[k]
    return env


def http(method, url, headers=None, data=None, timeout=300):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def jhttp(method, url, headers, body=None, timeout=300):
    h = dict(headers); data = None
    if body is not None:
        h['Content-Type'] = 'application/json'; data = json.dumps(body).encode()
    code, raw = http(method, url, h, data, timeout)
    try:
        js = json.loads(raw.decode() or '{}')
    except Exception:
        js = {'raw': raw[:300].decode(errors='replace')}
    return code, js


# ---------------- OpenAI generation ----------------
def openai_generate(env, prompt, model, quality, transparent):
    body = {'model': model, 'prompt': prompt, 'size': '1024x1024', 'quality': quality, 'n': 1,
            'background': 'transparent' if transparent else 'opaque', 'output_format': 'png'}
    for attempt in range(4):
        code, js = jhttp('POST', 'https://api.openai.com/v1/images/generations',
                         {'Authorization': 'Bearer ' + env['OPENAI_API_KEY']}, body, timeout=300)
        if code == 200 and js.get('data'):
            d = js['data'][0]
            if d.get('b64_json'):
                return base64.b64decode(d['b64_json'])
            if d.get('url'):
                return http('GET', d['url'])[1]
        if code in (429, 500, 502, 503):
            time.sleep(5 * (attempt + 1)); continue
        raise RuntimeError(f'OpenAI {code}: {json.dumps(js)[:400]}')
    raise RuntimeError('OpenAI: too many retries')


# ---------------- Replicate background removal ----------------
_version_cache = {}


def rep_headers(env):
    tok = env.get('REPLICATE_API_KEY') or env.get('REPLICATE_API_TOKEN')
    return {'Authorization': 'Bearer ' + tok}


def rep_version(env, model):
    if model not in _version_cache:
        code, js = jhttp('GET', f'https://api.replicate.com/v1/models/{model}', rep_headers(env))
        if code != 200 or not js.get('latest_version'):
            raise RuntimeError(f'Replicate model lookup {model}: {code}')
        _version_cache[model] = js['latest_version']['id']
    return _version_cache[model]


def rep_upload(env, png):
    boundary = uuid.uuid4().hex
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="content"; filename="sprite.png"\r\n'
            f'Content-Type: image/png\r\n\r\n').encode() + png + f'\r\n--{boundary}--\r\n'.encode()
    h = rep_headers(env); h['Content-Type'] = f'multipart/form-data; boundary={boundary}'
    code, raw = http('POST', 'https://api.replicate.com/v1/files', h, body)
    if code in (200, 201):
        return json.loads(raw)['urls']['get']
    # fall back to a data URI
    return 'data:image/png;base64,' + base64.b64encode(png).decode()


def replicate_remove_bg(env, png):
    url = rep_upload(env, png)
    last = None
    for model in BG_MODELS:
        try:
            ver = rep_version(env, model)
            h = rep_headers(env); h['Prefer'] = 'wait=60'
            code, js = jhttp('POST', 'https://api.replicate.com/v1/predictions', h, {'version': ver, 'input': {'image': url}})
            if code not in (200, 201):
                raise RuntimeError(f'{code} {json.dumps(js)[:200]}')
            t0 = time.time()
            while js.get('status') not in ('succeeded', 'failed', 'canceled'):
                if time.time() - t0 > 240:
                    raise RuntimeError('timeout')
                time.sleep(2)
                code, js = jhttp('GET', js['urls']['get'], rep_headers(env))
            if js.get('status') != 'succeeded':
                raise RuntimeError(f"status {js.get('status')}: {js.get('error')}")
            out = js['output']
            if isinstance(out, list):
                out = out[0]
            if isinstance(out, dict):
                out = out.get('image') or next(iter(out.values()))
            code, data = http('GET', out)
            if code == 200 and data[:4] == b'\x89PNG':
                return data
            raise RuntimeError('bad output')
        except Exception as e:  # try next model
            last = f'{model}: {e}'
    raise RuntimeError('Replicate background removal failed (' + str(last) + ')')


# ---------------- local helpers ----------------
def local_remove_white(png, tol=28):
    """Flood-fill near-white pixels connected to the image border -> transparent."""
    im = Image.open(io.BytesIO(png)).convert('RGBA')
    w, h = im.size; px = im.load()
    seen = bytearray(w * h); stack = []
    for x in range(w):
        stack += [(x, 0), (x, h - 1)]
    for y in range(h):
        stack += [(0, y), (w - 1, y)]
    def bg(c):
        return c[0] > 255 - tol and c[1] > 255 - tol and c[2] > 255 - tol
    while stack:
        x, y = stack.pop()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        c = px[x, y]
        if not bg(c):
            continue
        px[x, y] = (255, 255, 255, 0)
        if x > 0: stack.append((x - 1, y))
        if x < w - 1: stack.append((x + 1, y))
        if y > 0: stack.append((x, y - 1))
        if y < h - 1: stack.append((x, y + 1))
    out = io.BytesIO(); im.save(out, 'PNG'); return out.getvalue()


def finish(png, max_dim):
    if not Image:
        return png
    im = Image.open(io.BytesIO(png)).convert('RGBA')
    bbox = im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
    if bbox:
        im = im.crop(bbox)
    pad = 4
    canvas = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    canvas.paste(im, (pad, pad))
    im = canvas
    s = max_dim / max(im.size)
    if s < 1:
        im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    out = io.BytesIO(); im.save(out, 'PNG', optimize=True); return out.getvalue()


def write_manifest():
    keys = sorted(f[:-4] for f in os.listdir(ASSETS) if f.endswith('.png'))
    with open(os.path.join(ASSETS, 'manifest.js'), 'w') as f:
        f.write('// generated by tools/gen_sprites.py\nwindow.ASSET_LIST = ' + json.dumps(keys) + ';\n')
    return keys


def process(key, spec, style, args, env):
    raw_path = os.path.join(RAW, key + '.png')
    out_path = os.path.join(ASSETS, key + '.png')
    if os.path.exists(out_path) and not args.force and not args.rebg:
        return key, 'skip (exists)'
    if args.rebg or (os.path.exists(raw_path) and not args.force):
        raw = open(raw_path, 'rb').read()
    else:
        prompt = spec['prompt'] + '. ' + style
        raw = openai_generate(env, prompt, args.model, args.quality, transparent=(args.bg == 'openai'))
        open(raw_path, 'wb').write(raw)
    how = args.bg
    if args.bg == 'replicate':
        try:
            cut = replicate_remove_bg(env, raw)
        except Exception as e:
            if not Image:
                raise
            print(f'  [{key}] {e} -> using local white-key removal', flush=True)
            cut, how = local_remove_white(raw), 'local'
    elif args.bg == 'local':
        cut = local_remove_white(raw)
    else:
        cut = raw
    max_dim = 512 if spec['size'] >= 90 else 256
    open(out_path, 'wb').write(finish(cut, max_dim))
    return key, f'ok ({how})'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--only', default='')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--rebg', action='store_true')
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--embed', action='store_true')
    ap.add_argument('--model', default='gpt-image-1')
    ap.add_argument('--quality', default='medium')
    ap.add_argument('--bg', default='replicate', choices=['replicate', 'openai', 'local'])
    ap.add_argument('--workers', type=int, default=4)
    args = ap.parse_args()

    sprites = json.load(open(os.path.join(ROOT, 'tools', 'sprites.json')))
    style = sprites.pop('_style')
    if args.list:
        for k, v in sprites.items():
            print(f'{k:18s} {v["prompt"]}')
        return
    os.makedirs(RAW, exist_ok=True)
    env = load_env()
    if not args.rebg and not env.get('OPENAI_API_KEY'):
        sys.exit('OPENAI_API_KEY missing from .env.local')
    if args.bg == 'replicate' and not (env.get('REPLICATE_API_KEY') or env.get('REPLICATE_API_TOKEN')):
        print('No Replicate key found, using local background removal'); args.bg = 'local'
    if args.bg == 'local' and not Image:
        sys.exit('Local background removal needs Pillow: pip3 install pillow')
    if not Image:
        print('Note: Pillow not installed, so sprites are saved untrimmed. pip3 install pillow for best results.')

    keys = [k for k in sprites if not args.only or k in args.only.split(',')]
    if args.rebg:
        keys = [k for k in keys if os.path.exists(os.path.join(RAW, k + '.png'))]
    print(f'Generating {len(keys)} sprites with {args.model} ({args.quality}), background: {args.bg}')
    fails = []
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(process, k, sprites[k], style, args, env): k for k in keys}
        for i, f in enumerate(as_completed(futs), 1):
            k = futs[f]
            try:
                _, msg = f.result()
                print(f'[{i}/{len(keys)}] {k}: {msg}', flush=True)
            except Exception as e:
                fails.append(k); print(f'[{i}/{len(keys)}] {k}: FAILED {e}', flush=True)
    have = write_manifest()
    print(f'\n{len(have)} sprites in assets/. manifest.js updated.')
    if fails:
        print('Failed:', ','.join(fails), '\nRe-run with --only ' + ','.join(fails))
    if args.embed:
        sys.path.insert(0, os.path.join(ROOT, 'tools'))
        import build
        build.build(False); build.build(True)
    print('Open index.html in your browser to play with the new art.')


if __name__ == '__main__':
    main()
