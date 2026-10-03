// node tools/check_spacing.js [--fix]
// Checks that no building spot or its upgrade points overlap another spot, the bell, roads or blocked terrain.
// With --fix it nudges spots apart and rewrites their coordinates in src/data.js.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let src = fs.readFileSync(path.join(root, 'src/data.js'), 'utf8').replace("'use strict';", '');
src += '\nfunction rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }\n';
const D = new Function(src + '; return { PLOTS, TERRAIN, LANES, BELL, CASTLE };')();
const tr = fs.readFileSync(path.join(root, 'src/trees.js'), 'utf8').replace("'use strict';", '');
const TREES = new Function(tr + '; return TREES;')();
const PAD_R = 12;
const PAD_OFFS = { castle: [[-66, 14], [0, 58], [66, 14]], large: [[-36, 16], [0, 36], [36, 16]], small: [[-28, 12], [0, 28], [28, 12]] };
const R = p => TREES[p.type].r;
const mid = p => p.type === 'wall' ? { x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 } : p;
function pads(p) {
  if (p.type === 'wall') { const c = mid(p), dx = D.CASTLE.x - c.x, dy = D.CASTLE.y - c.y, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l; return [0, 1, 2].map(i => ({ x: c.x + ux * 30 - uy * (i - 1) * 30, y: c.y + uy * 30 + ux * (i - 1) * 30 })); }
  const o = PAD_OFFS[p.type === 'castle' ? 'castle' : R(p) >= 20 ? 'large' : 'small'];
  return o.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }));
}
function inPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function distSeg(px, py, x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy; let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t)); }
function distPoly(x, y, pts) { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distSeg(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; }
function blocked(x, y, m) {
  if (x < 20 || y < 20 || x > 1420 || y > 948) return true;
  if (inPoly(x, y, D.TERRAIN.sea) && !m) return true;
  if (inPoly(x, y + 10, D.TERRAIN.mountains)) return true;
  if (distPoly(x, y, D.TERRAIN.river.pts) < D.TERRAIN.river.w / 2 + 8) return true;
  return false;
}
function problems(P) {
  const out = [];
  for (const a of P) {
    const pa = pads(a);
    for (const q of pa) {
      if (blocked(q.x, q.y)) out.push([a.id, 'pad on blocked terrain']);
      if (Math.hypot(q.x - D.BELL.x, q.y - D.BELL.y) < 34) out.push([a.id, 'pad on bell']);
    }
    if (a.type !== 'wall' && a.type !== 'dock' && blocked(a.x, a.y)) out.push([a.id, 'building on blocked terrain']);
    if (a.type !== 'wall' && a.type !== 'tower' && a.type !== 'castle' && distPoly(a.x, a.y, D.LANES.E) < 30 + R(a)) out.push([a.id, 'on E road']);
    if (a.type !== 'wall' && a.type !== 'tower' && a.type !== 'castle' && distPoly(a.x, a.y, D.LANES.NE) < 30 + R(a)) out.push([a.id, 'on NE road']);
    if (a.type !== 'wall' && a.type !== 'tower' && a.type !== 'castle' && distPoly(a.x, a.y, D.LANES.S) < 30 + R(a)) out.push([a.id, 'on S road']);
    if (a.type !== 'wall' && Math.hypot(a.x - D.BELL.x, a.y - D.BELL.y) < R(a) + 40) out.push([a.id, 'on bell']);
    for (const b of P) {
      if (a === b) continue;
      const cb = mid(b), pb = pads(b);
      if (a.id < b.id && a.type !== 'wall' && b.type !== 'wall' && Math.hypot(a.x - b.x, a.y - b.y) < R(a) + R(b) + 24) out.push([a.id, 'body too close to ' + b.id]);
      for (const q of pa) {
        if (b.type !== 'wall' && Math.hypot(q.x - cb.x, q.y - cb.y) < R(b) + PAD_R + 8) out.push([a.id, 'pad touches ' + b.id]);
        if (b.type === 'wall' && distSeg(q.x, q.y, b.x1, b.y1, b.x2, b.y2) < PAD_R + 8) out.push([a.id, 'pad touches wall ' + b.id]);
        if (a.id < b.id) for (const r of pb) if (Math.hypot(q.x - r.x, q.y - r.y) < PAD_R * 2 + 6) { out.push([a.id, 'pads overlap ' + b.id]); break; }
      }
    }
  }
  return out;
}
const P = D.PLOTS.map(p => ({ ...p }));
let pr = problems(P);
console.log('problems:', pr.length); pr.forEach(x => console.log('  ', x.join(': ')));
if (process.argv.includes('--fix')) {
  const fixed = new Set(['castle', 'wE', 'wNE', 'wS']);
  const orig = Object.fromEntries(P.map(p => [p.id, [p.x, p.y]]));
  for (let it = 0; it < 400; it++) {
    let moved = false;
    for (const a of P) {
      if (fixed.has(a.id)) continue;
      let fx = 0, fy = 0;
      const pa = pads(a).concat([{ x: a.x, y: a.y }]);
      for (const b of P) {
        if (a === b) continue;
        const pb = pads(b).concat(b.type === 'wall' ? [] : [{ x: b.x, y: b.y }]);
        for (const q of pa) for (const r of pb) {
          const need = 34 + (q.x === a.x && q.y === a.y ? R(a) : 0) + (r.x === b.x && r.y === b.y ? R(b) : 0);
          const dx = q.x - r.x, dy = q.y - r.y, d = Math.hypot(dx, dy) || 0.01;
          if (d < need) { fx += dx / d * (need - d) * 0.5; fy += dy / d * (need - d) * 0.5; }
        }
        if (b.type === 'wall') for (const q of pa) { const d = distSeg(q.x, q.y, b.x1, b.y1, b.x2, b.y2); if (d < 24) { const m = mid(b); const dx = q.x - m.x, dy = q.y - m.y, l = Math.hypot(dx, dy) || 1; fx += dx / l * (24 - d); fy += dy / l * (24 - d); } }
      }
      for (const L of ['E', 'NE', 'S']) if (a.type !== 'tower') { const d = distPoly(a.x, a.y, D.LANES[L]); if (d < 30 + R(a)) { let best = null, bd = 1e9; for (const [ox, oy] of [[6, 0], [-6, 0], [0, 6], [0, -6]]) { const dd = distPoly(a.x + ox, a.y + oy, D.LANES[L]); if (dd > d && dd < bd + 1e9) { if (!best || dd > best[2]) best = [ox, oy, dd]; } } if (best) { fx += best[0]; fy += best[1]; } } }
      for (const q of pads(a)) if (Math.hypot(q.x - D.BELL.x, q.y - D.BELL.y) < 34) { fx += (a.x - D.BELL.x) * 0.05; fy += (a.y - D.BELL.y) * 0.05; }
      const L = Math.hypot(fx, fy); if (L < 0.2) continue;
      const s = Math.min(L, 4) / L, nx = a.x + fx * s, ny = a.y + fy * s;
      const ok = (a.type === 'dock' || !blocked(nx, ny)) && pads({ ...a, x: nx, y: ny }).every(q => !blocked(q.x, q.y)) && Math.hypot(nx - orig[a.id][0], ny - orig[a.id][1]) < 120;
      if (ok) { a.x = Math.round(nx * 10) / 10; a.y = Math.round(ny * 10) / 10; moved = true; }
    }
    if (!moved) break;
  }
  pr = problems(P);
  console.log('after fix:', pr.length); pr.forEach(x => console.log('  ', x.join(': ')));
  let data = fs.readFileSync(path.join(root, 'src/data.js'), 'utf8');
  for (const p of P) {
    const [ox, oy] = orig[p.id]; const nx = Math.round(p.x), ny = Math.round(p.y);
    if (nx === ox && ny === oy) continue;
    const re = new RegExp("(\\{ id:'" + p.id + "', type:'\\w+', )x:\\d+, y:\\d+");
    data = data.replace(re, '$1x:' + nx + ', y:' + ny);
    if (p.guard) { const rg = new RegExp("(\\{ id:'" + p.id + "'[^\\n]*guard:\\[)(\\d+),(\\d+)\\]"); data = data.replace(rg, (m, a, gx, gy) => a + (+gx + nx - ox) + ',' + (+gy + ny - oy) + ']'); }
    console.log('moved', p.id, ox + ',' + oy, '->', nx + ',' + ny);
  }
  fs.writeFileSync(path.join(root, 'src/data.js'), data);
}
