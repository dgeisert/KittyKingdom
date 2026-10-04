#!/usr/bin/env python3
"""
Build an itch.io-ready copy of Kitty Kingdom.

    python3 tools/build_itch.py

Creates:
    dist/itch/                        the game, and only what the game needs online
        index.html                    (rebuilt from src/)
        music.mp3                     (Paw Patrol Protocol.mp3, renamed: no spaces in web paths)
        assets/manifest.js            (list of AI sprites, if any)
        assets/<sprite>.png           (only the sprites the game uses; never assets/raw/)
    dist/kitty-kingdom-itch.zip       upload this file to itch.io

Never included: .env.local and other secrets, tools/, src/, docs, raw images, test output.

itch.io upload settings:
    Kind of project: HTML
    Upload the zip, then tick "This file will be played in the browser"
    Viewport dimensions: 960 x 640
    Optional: enable "Fullscreen button"
"""
import json, os, re, shutil, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
OUT = os.path.join(DIST, 'itch')
ZIP = os.path.join(DIST, 'kitty-kingdom-itch.zip')
MUSIC = 'Paw Patrol Protocol.mp3'

sys.path.insert(0, os.path.join(ROOT, 'tools'))
import build  # noqa: E402


def main():
    # 1. fresh index.html from src/
    build.build(False)
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

    # 2. clean output folder
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'assets'))

    # 3. music, renamed to a web-safe name
    if os.path.exists(os.path.join(ROOT, MUSIC)):
        shutil.copyfile(os.path.join(ROOT, MUSIC), os.path.join(OUT, 'music.mp3'))
        html = html.replace("'Paw%20Patrol%20Protocol.mp3'", "'music.mp3'")
    else:
        print('warning: ' + MUSIC + ' not found, the game will run without music')

    # 4. only the sprites the game knows about (keys in tools/sprites.json) that exist in assets/
    sprites = [k for k in json.load(open(os.path.join(ROOT, 'tools', 'sprites.json'))) if not k.startswith('_')]
    have = [k for k in sprites if os.path.exists(os.path.join(ROOT, 'assets', k + '.png'))]
    for k in have:
        shutil.copyfile(os.path.join(ROOT, 'assets', k + '.png'), os.path.join(OUT, 'assets', k + '.png'))
    with open(os.path.join(OUT, 'assets', 'manifest.js'), 'w') as f:
        f.write('window.ASSET_LIST = ' + json.dumps(have) + ';\n')

    with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)

    # 5. safety check: nothing secret or development-only made it in
    bad = []
    for dp, _, files in os.walk(OUT):
        for fn in files:
            if fn.startswith('.env') or fn.endswith(('.py', '.md', '.json')) or 'raw' in dp.split(os.sep):
                bad.append(os.path.join(dp, fn))
    if re.search(r'(sk-[A-Za-z0-9]{20,}|r8_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_\-]{20,})', html):
        bad.append('index.html contains something that looks like an API key')
    if bad:
        sys.exit('refusing to package, unexpected files:\n  ' + '\n  '.join(bad))

    # 6. zip (index.html at the root of the zip, as itch.io requires)
    if os.path.exists(ZIP):
        os.remove(ZIP)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for dp, _, files in os.walk(OUT):
            for fn in sorted(files):
                full = os.path.join(dp, fn)
                z.write(full, os.path.relpath(full, OUT).replace(os.sep, '/'))

    total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
    count = sum(len(fs) for _, _, fs in os.walk(OUT))
    print('itch.io build ready')
    print('  folder: dist/itch/  (%d files, %.1f MB)' % (count, total / 1e6))
    print('  upload: dist/kitty-kingdom-itch.zip  (%.1f MB)' % (os.path.getsize(ZIP) / 1e6))
    print('  sprites included: %d' % len(have))
    print('itch.io settings: Kind = HTML, "played in the browser", viewport 960 x 640')


if __name__ == '__main__':
    main()
