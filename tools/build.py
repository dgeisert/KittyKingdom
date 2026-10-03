#!/usr/bin/env python3
"""Bundle src/*.js into a single index.html.

  python3 tools/build.py            -> index.html (loads sprites from assets/*.png if present)
  python3 tools/build.py --embed    -> also writes cattower_standalone.html with every PNG inlined
"""
import base64, json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = lambda *p: os.path.join(ROOT, *p)

def build(embed=False):
    tpl = open(src('src', 'template.html')).read()
    sprites = json.load(open(src('tools', 'sprites.json')))
    sprites = {k: ({'size': v['size']} if isinstance(v, dict) else v) for k, v in sprites.items() if not k.startswith('_')}
    code = '\n'.join(open(src('src', f)).read() for f in ('data.js', 'trees.js', 'render.js', 'game.js', 'draw.js'))
    assets = ''
    if embed:
        data = {}
        for k in sprites:
            p = src('assets', k + '.png')
            if os.path.exists(p):
                data[k] = 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
        assets = 'const ASSET_DATA = ' + json.dumps(data) + ';'
        mp3 = src('Paw Patrol Protocol.mp3')
        if os.path.exists(mp3):
            assets += '\nconst MUSIC_DATA = "data:audio/mpeg;base64,' + base64.b64encode(open(mp3, 'rb').read()).decode() + '";'
    out = tpl.replace('/*__SPRITES__*/', 'const SPRITES = ' + json.dumps(sprites) + ';') \
             .replace('/*__ASSETS__*/', assets).replace('/*__CODE__*/', code)
    name = 'cattower_standalone.html' if embed else 'index.html'
    open(src(name), 'w').write(out)
    print('wrote', name, f'({len(out)//1024} KB)')

if __name__ == '__main__':
    build(False)
    if '--embed' in sys.argv:
        build(True)
