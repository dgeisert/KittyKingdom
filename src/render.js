// ============================================================
//  KITTY KINGDOM — rendering: sprite loader + procedural fallbacks
// ============================================================
'use strict';

// ---------- Sprite loading (AI-generated PNGs override procedural art) ----------
const SPR = {};
function loadSprites() {
  // assets/manifest.js (written by tools/gen_sprites.py) lists the PNGs that exist
  const have = (typeof ASSET_DATA !== 'undefined') ? Object.keys(ASSET_DATA) : (window.ASSET_LIST || []);
  const keys = Object.keys(SPRITES).filter(k => k[0] !== '_' && have.includes(k));
  for (const k of keys) {
    const src = (typeof ASSET_DATA !== 'undefined' && ASSET_DATA[k]) ? ASSET_DATA[k] : 'assets/' + k + '.png';
    const img = new Image();
    img.onload = () => { SPR[k] = img; };
    img.onerror = () => {};
    img.src = src;
  }
}
// draws a sprite anchored bottom-centre at (x,y). returns false if not loaded
function spr(ctx, key, x, y, size, o) {
  const img = SPR[key];
  if (!img) return false;
  o = o || {};
  const sc = size / Math.max(img.width, img.height);
  const w = img.width * sc, h = img.height * sc;
  ctx.save();
  ctx.translate(x, y);
  if (o.flip) ctx.scale(-1, 1);
  if (o.squash) ctx.scale(1 + o.squash, 1 - o.squash);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.drawImage(img, -w / 2, -h, w, h);
  if (o.flash) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(255,255,255,' + o.flash + ')'; ctx.fillRect(-w / 2, -h, w, h); }
  ctx.restore();
  return true;
}

// ---------- tiny helpers ----------
function ell(ctx, x, y, rx, ry, fill, stroke) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
function poly(ctx, pts, fill, stroke, lw) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw || 1; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function rrect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
function line(ctx, x1, y1, x2, y2, col, lw) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = lw || 1; ctx.stroke();
}
function shadow(ctx, x, y, rx, a) { ell(ctx, x, y, rx, rx * 0.38, 'rgba(30,40,60,' + (a || 0.22) + ')'); }
function shade(hex, f) { // f>0 lighten, f<0 darken
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
}

// ---------- CATS ----------
const CAT_COATS = {
  orange: { body: '#f0a04b', stripe: '#c96f22', belly: '#fde3c0' },
  grey:   { body: '#a3a9b5', stripe: '#6f7684', belly: '#e3e6ec' },
  black:  { body: '#3a3a46', stripe: '#24242e', belly: '#5a5a68' },
  white:  { body: '#f4f1ea', stripe: '#d9d2c4', belly: '#ffffff' },
  calico: { body: '#f3ece0', stripe: '#d7853a', belly: '#ffffff', patch: '#3b3434' },
  brown:  { body: '#9c6b43', stripe: '#6e4628', belly: '#e6c9a8' },
  siamese:{ body: '#efe2cc', stripe: '#6b4a36', belly: '#fff6e8' },
};
// draw a cat standing, anchored at feet (x,y), s = overall height
function drawCat(ctx, x, y, s, coat, o) {
  o = o || {};
  const c = CAT_COATS[coat] || CAT_COATS.orange;
  const k = s / 30, f = o.flip ? -1 : 1, t = o.t || 0;
  const step = o.moving ? Math.sin(t * 14) : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(f * k, k);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  // tail
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-6, -7);
  ctx.quadraticCurveTo(-16, -8 + Math.sin(t * 4) * 2, -14, -20 + Math.sin(t * 3) * 3);
  ctx.strokeStyle = c.stripe; ctx.lineWidth = 3.4; ctx.stroke();
  ctx.strokeStyle = c.body; ctx.lineWidth = 2.2; ctx.stroke();
  // legs
  ell(ctx, -4, -1 + step, 3, 2, c.stripe); ell(ctx, 4, -1 - step, 3, 2, c.stripe);
  // body
  ell(ctx, 0, -9, 8, 9, c.body);
  ell(ctx, 1, -7, 4.5, 6, c.belly);
  if (c.patch) ell(ctx, -4, -12, 3.5, 3, c.patch);
  // armour / cape
  if (o.cape) poly(ctx, [[-7, -15], [7, -15], [9, -2], [-9, -2]], o.cape);
  if (o.armor) { rrect(ctx, -7.5, -16, 15, 12, 4, o.armor); rrect(ctx, -2, -15, 4, 10, 2, o.tabard || '#3a6fd8'); }
  // head
  const hy = -21;
  poly(ctx, [[-7.5, hy - 3], [-5, hy - 12], [-1.5, hy - 5]], c.body); poly(ctx, [[7.5, hy - 3], [5, hy - 12], [1.5, hy - 5]], c.body);
  poly(ctx, [[-6, hy - 4], [-5, hy - 9.5], [-3, hy - 5]], '#f6b7c0'); poly(ctx, [[6, hy - 4], [5, hy - 9.5], [3, hy - 5]], '#f6b7c0');
  ell(ctx, 0, hy, 8, 7, c.body);
  if (c.patch) ell(ctx, 4, hy - 3, 3.5, 3, c.patch);
  line(ctx, -2, hy - 6.5, -2, hy - 3.5, c.stripe, 1.2); line(ctx, 2, hy - 6.5, 2, hy - 3.5, c.stripe, 1.2);
  ell(ctx, 1.5, hy + 2.5, 3.6, 2.4, c.belly);
  // eyes (look in facing direction)
  ell(ctx, 0, hy, 1.4, 1.7, '#222'); ell(ctx, 4.4, hy, 1.4, 1.7, '#222');
  ell(ctx, 0.4, hy - 0.6, 0.5, 0.5, '#fff'); ell(ctx, 4.8, hy - 0.6, 0.5, 0.5, '#fff');
  ell(ctx, 2.2, hy + 2, 0.9, 0.7, '#e57a8a');
  // helmet
  if (o.helmet) { ctx.beginPath(); ctx.arc(0, hy - 2, 7.8, Math.PI, 0); ctx.fillStyle = o.helmet; ctx.fill(); if (o.plume) poly(ctx, [[0, hy - 9], [-6, hy - 16], [3, hy - 10]], o.plume); }
  if (o.wizard) { poly(ctx, [[-8.5, hy - 4], [8.5, hy - 4], [1, hy - 22]], o.wizard, shade(o.wizard, -0.3)); ell(ctx, 1, hy - 4, 9.5, 2, shade(o.wizard, -0.2)); ell(ctx, -1, hy - 12, 1.2, 1.2, '#ffe27a'); }
  if (o.band) { rrect(ctx, -8, hy - 4.5, 16, 3, 1, o.band); line(ctx, -8, hy - 3, -13, hy - 1, o.band, 1.5); }
  if (o.cross) { rrect(ctx, -1.2, -15, 2.4, 7, 0.5, o.cross); rrect(ctx, -3.5, -12.7, 7, 2.4, 0.5, o.cross); }
  // held item
  const it = o.item;
  if (it === 'sword') { line(ctx, 8, -8, 14, -20, '#d6dbe4', 2.2); line(ctx, 6.5, -10, 10, -9, '#7a5a32', 2); }
  else if (it === 'staff') { line(ctx, 9, -2, 9, -24, '#8a5a2b', 1.8); ell(ctx, 9, -26, 3.6, 3.6, '#e04f6d'); line(ctx, 6.5, -27, 11.5, -25, '#fff', 0.8); }
  else if (it === 'shield') { ell(ctx, 8, -10, 5, 6, '#b87436', '#6b3f17'); ell(ctx, 8, -10, 1.6, 1.6, '#e6c25a'); }
  else if (it === 'spear') { line(ctx, 9, 0, 13, -26, '#8a5a2b', 1.6); poly(ctx, [[13, -26], [11.5, -31], [15, -29]], '#cfd6e0'); }
  else if (it === 'axe') { line(ctx, 8, -4, 12, -20, '#8a5a2b', 1.8); poly(ctx, [[11, -20], [17, -22], [16, -15]], '#cfd6e0'); }
  else if (it === 'sling') { line(ctx, 8, -10, 12, -18, '#8a5a2b', 1.2); ell(ctx, 13, -19, 2, 2, '#888'); }
  else if (it === 'wand') { line(ctx, 8, -8, 13, -18, '#6b4423', 1.4); ell(ctx, 13.5, -19, 2, 2, '#ffe27a'); }
  else if (it === 'bow') { ctx.beginPath(); ctx.arc(9, -12, 8, -1.2, 1.2); ctx.strokeStyle = '#7a4f22'; ctx.lineWidth = 1.6; ctx.stroke(); line(ctx, 12, -19.5, 12, -4.5, '#eee', 0.6); }
  ctx.restore();
}

// tower-top cats (upper body only)
// tower-top cats, chosen by the tower's upgrade path
const TCAT = {
  base: { coat: 'orange', item: 'bow' },
  A:  { coat: 'grey', helmet: '#9aa3ae', item: 'bow' },
  A1: { coat: 'black', helmet: '#3d7b4f', plume: '#e05050', item: 'bow' },
  A2: { coat: 'white', helmet: '#e6c25a', item: 'bow' },
  A3: { coat: 'brown', helmet: '#4d8a4a', plume: '#f7d35c', item: 'bow' },
  B:  { coat: 'grey', wizard: '#7a4fd0', item: 'staff' },
  B1: { coat: 'black', wizard: '#3b6fd8', item: 'staff' },
  B2: { coat: 'white', wizard: '#8fd3ff', item: 'staff' },
  B3: { coat: 'black', wizard: '#a02fa0', item: 'staff' },
  C:  { coat: 'orange', helmet: '#8a5a2b', item: null },
  C1: { coat: 'brown', helmet: '#555', item: null },
  C2: { coat: 'calico', helmet: '#e04f6d', item: null },
  C3: { coat: 'orange', helmet: '#7c8794', plume: '#e6c25a', item: null },
};
function pathKey(p) { const q = (p.path || []).filter(id => id[0] !== 'F'); return q.length ? q[q.length - 1] : 'base'; }

// ---------- BUILDINGS ----------
const STONE = '#c9c3b6', STONE_D = '#9d9789', STONE_L = '#e4dfd3', ROOF_B = '#4b78c8', ROOF_R = '#d0574b', WOOD = '#a26b3c', WOOD_D = '#7a4c25';

function catEarRoof(ctx, x, y, w, h, col) {
  poly(ctx, [[x - w / 2, y], [x - w / 2 + w * 0.18, y - h], [x - w * 0.05, y - h * 0.62], [x + w * 0.05, y - h * 0.62], [x + w / 2 - w * 0.18, y - h], [x + w / 2, y]], col, shade(col, -0.3), 1);
  poly(ctx, [[x - w / 2 + w * 0.12, y - h * 0.25], [x - w / 2 + w * 0.18, y - h * 0.8], [x - w * 0.12, y - h * 0.5]], '#f6b7c0');
  poly(ctx, [[x + w / 2 - w * 0.12, y - h * 0.25], [x + w / 2 - w * 0.18, y - h * 0.8], [x + w * 0.12, y - h * 0.5]], '#f6b7c0');
}
function turret(ctx, x, y, w, h, roof) {
  rrect(ctx, x - w / 2, y - h, w, h, 3, STONE); rrect(ctx, x - w / 2, y - h, w * 0.35, h, 3, STONE_L);
  catEarRoof(ctx, x, y - h + 2, w + 6, w * 0.95, roof);
}
// upgrade badge: a pennant in the branch colour, plus a pip per tier
function drawBadge(ctx, x, y, path) {
  if (!path || !path.length) return;
  const c = OPT_COL[path[0].charCodeAt(0) - 65];
  line(ctx, x, y, x, y - 16, '#5a4a3a', 1.5);
  poly(ctx, [[x, y - 16], [x + 11, y - 13], [x, y - 9]], c, shade(c, -0.3));
  if (path.length > 1) { const c2 = OPT_COL[+path[1][1] - 1]; ell(ctx, x + 4, y - 4, 3.2, 3.2, c2, '#fff'); }
}
function drawCastle(ctx, x, y, p, t) {
  const lvl = p.path.length + 1;
  shadow(ctx, x, y, 52, 0.25);
  const sc = [0, 0.9, 1.0, 1.1][lvl];
  const roof = p.path[0] === 'B' ? '#e6b93a' : p.path[0] === 'C' ? '#b0478a' : ROOF_B;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  rrect(ctx, -38, -48, 76, 50, 4, STONE, STONE_D);
  rrect(ctx, -38, -48, 22, 50, 4, STONE_L);
  for (let i = -36; i < 36; i += 10) rrect(ctx, i, -54, 7, 7, 1, STONE);
  ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-10, -16); ctx.arc(0, -16, 10, Math.PI, 0); ctx.lineTo(10, 2); ctx.fillStyle = '#5a3a22'; ctx.fill();
  ell(ctx, 0, -32, 5, 4, '#f0c94a'); ell(ctx, -5, -38, 2, 2, '#f0c94a'); ell(ctx, -1.7, -40, 2, 2, '#f0c94a'); ell(ctx, 1.7, -40, 2, 2, '#f0c94a'); ell(ctx, 5, -38, 2, 2, '#f0c94a');
  turret(ctx, -40, 0, 18, 62, roof); turret(ctx, 40, 0, 18, 62, roof);
  if (lvl >= 2) turret(ctx, 0, -46, 20, 30, roof);
  if (lvl >= 3) { turret(ctx, -20, -42, 14, 24, '#e6c25a'); turret(ctx, 20, -42, 14, 24, '#e6c25a'); }
  if (p.path[0] === 'A') { rrect(ctx, -48, -12, 96, 14, 3, STONE_D); for (let i = -46; i < 48; i += 9) rrect(ctx, i, -16, 6, 5, 1, STONE_D); }
  if (p.path[0] === 'B') { for (let i = 0; i < 4; i++) ell(ctx, -26 + i * 4, -4 - i * 2, 4, 3, '#ffd34d', '#a07d22'); }
  const wv = Math.sin(t * 3) * 2;
  line(ctx, -40, -80, -40, -96, '#555', 1.5); poly(ctx, [[-40, -96], [-28 + wv, -93], [-40, -89]], '#e04f6d');
  line(ctx, 40, -80, 40, -96, '#555', 1.5); poly(ctx, [[40, -96], [52 + wv, -93], [40, -89]], '#e04f6d');
  ctx.restore();
}
function drawHouse(ctx, x, y, p, t) {
  const b = p.path[0], leaf = p.path[1];
  shadow(ctx, x, y, 20);
  const big = b === 'A', w = big ? 36 : 28, h = big ? 26 : 18;
  const wallC = b === 'B' ? (leaf === 'B3' ? '#b8b2a6' : '#d9cdb5') : b === 'C' ? '#f6e7d2' : '#efd9b0';
  rrect(ctx, x - w / 2, y - h, w, h, 3, wallC, '#b99d73');
  if (b === 'B') { for (let i = -w / 2; i < w / 2; i += 7) rrect(ctx, x + i, y - h - 4, 5, 5, 1, wallC); rrect(ctx, x + 7, y - h + 5, 3, 8, 1, '#3d3a36'); }
  rrect(ctx, x - 4, y - 11, 8, 11, 2, '#8a5a2b');
  if (b !== 'B') {
    ell(ctx, x + 9, y - h + 9, 4.5, 4.5, '#ffe7a3', '#8a5a2b'); ell(ctx, x + 9, y - h + 10, 2.6, 2.2, '#3a3a46');
    poly(ctx, [[x + 6.8, y - h + 9], [x + 7.4, y - h + 6], [x + 8.6, y - h + 8.5]], '#3a3a46'); poly(ctx, [[x + 11.2, y - h + 9], [x + 10.6, y - h + 6], [x + 9.4, y - h + 8.5]], '#3a3a46');
  }
  if (b !== 'B') catEarRoof(ctx, x, y - h + 2, w + 10, big ? 26 : 22, b === 'A' ? ROOF_R : b === 'C' ? '#6aa84f' : '#d9b25a');
  if (b === 'C') { for (let i = -12; i < 12; i += 6) poly(ctx, [[x + i, y - 12], [x + i + 6, y - 12], [x + i + 3, y - 8]], i % 12 === 0 ? '#e04f6d' : '#fff'); }
  if (leaf === 'A2') { line(ctx, x - 18, y - 22, x - 18, y - 8, WOOD_D, 1.5); rrect(ctx, x - 26, y - 22, 9, 6, 1, '#e6c25a'); }
  if (leaf === 'A3') { rrect(ctx, x - w / 2 - 12, y - 10, 12, 10, 1, '#f2c66a'); poly(ctx, [[x - w / 2 - 13, y - 10], [x - w / 2 + 1, y - 10], [x - w / 2 - 6, y - 15]], '#e04f6d'); }
  if (leaf === 'B2') { ctx.beginPath(); ctx.arc(x, y - h - 10, 4, Math.PI, 0); ctx.fillStyle = '#e6c25a'; ctx.fill(); }
  if (leaf === 'C2') { ell(ctx, x - 16, y - 8, 4, 5, '#fff', '#c33'); ell(ctx, x - 16, y - 14, 3, 3, '#fff'); }
  if (Math.sin(t + x) > -0.2) ell(ctx, x - 9, y - h - 18 - (t * 8 % 10), 2.5, 2.5, 'rgba(230,230,230,0.5)');
}
function towerHeight(p) {
  const b = p.path && p.path[0], k = pathKey(p);
  if (!b) return 40;
  return { A: 46, A1: 58, A2: 50, A3: 54, B: 50, B1: 58, B2: 54, B3: 52, C: 38, C1: 40, C2: 40, C3: 44 }[k] || 44;
}
function drawTowerBody(ctx, x, y, p) {
  const b = p.path && p.path[0], k = pathKey(p), tall = towerHeight(p);
  shadow(ctx, x, y, 18);
  if (!b) {
    line(ctx, x - 10, y, x - 7, y - tall, WOOD_D, 3); line(ctx, x + 10, y, x + 7, y - tall, WOOD_D, 3);
    line(ctx, x - 9, y - 8, x + 9, y - 22, WOOD, 2); line(ctx, x + 9, y - 8, x - 9, y - 22, WOOD, 2);
    rrect(ctx, x - 14, y - tall - 4, 28, 7, 2, WOOD, WOOD_D);
    return tall;
  }
  if (b === 'A') {
    const body = k === 'A2' ? '#f4f2ec' : STONE;
    rrect(ctx, x - 12, y - tall, 24, tall, 4, body, STONE_D);
    rrect(ctx, x - 12, y - tall, 8, tall, 4, 'rgba(255,255,255,0.35)');
    for (let i = -14; i < 12; i += 7) rrect(ctx, x + i, y - tall - 6, 5, 7, 1, body);
    poly(ctx, [[x + 3, y - 30], [x + 11, y - 30], [x + 11, y - 18], [x + 7, y - 21], [x + 3, y - 18]], OPT_COL[0]);
    if (k === 'A2') { rrect(ctx, x - 12, y - tall + 6, 24, 3, 1, '#e6c25a'); }
    if (k === 'A3') { for (const s of [-1, 1]) poly(ctx, [[x + s * 12, y - tall + 10], [x + s * 22, y - tall + 2], [x + s * 12, y - tall + 18]], '#4d8a4a'); }
  } else if (b === 'B') {
    const body = k === 'B2' ? '#dfeaf5' : k === 'B3' ? '#4a3a5a' : '#8f7fb8';
    poly(ctx, [[x - 13, y], [x - 9, y - tall], [x + 9, y - tall], [x + 13, y]], body, shade('#6a5a8a', -0.2));
    poly(ctx, [[x - 13, y], [x - 9, y - tall], [x - 4, y - tall], [x - 6, y]], 'rgba(255,255,255,0.25)');
    const orb = k === 'B1' ? '#7ad3ff' : k === 'B2' ? '#e8f8ff' : k === 'B3' ? '#ff6bd8' : '#c9a6ff';
    const pulse = 1 + Math.sin(G.t * 4 + x) * 0.15;
    ctx.save(); ctx.globalAlpha = 0.3; ell(ctx, x, y - tall - 20, 10 * pulse, 10 * pulse, orb); ctx.restore();
    ell(ctx, x, y - tall - 20, 5, 5, orb, '#fff');
    line(ctx, x - 9, y - tall, x - 5, y - tall - 16, '#5a4a7a', 2); line(ctx, x + 9, y - tall, x + 5, y - tall - 16, '#5a4a7a', 2);
    if (k === 'B1') for (let i = 0; i < 3; i++) ell(ctx, x, y - 12 - i * 9, 14, 2.5, null, '#e0a060');
  } else {
    // catapult roost: squat wooden fort
    rrect(ctx, x - 16, y - tall, 32, tall, 3, k === 'C3' ? STONE : '#b88a5a', WOOD_D);
    for (let i = -16; i < 16; i += 8) line(ctx, x + i + 4, y - tall, x + i + 4, y, 'rgba(90,60,30,0.35)', 1);
    rrect(ctx, x - 18, y - tall - 4, 36, 6, 2, WOOD_D);
    if (k === 'C1') { ctx.save(); ctx.translate(x + 8, y - tall - 6); ctx.rotate(-0.6); rrect(ctx, -5, -18, 10, 20, 3, '#444'); ctx.restore(); }
    else if (k === 'C3') { line(ctx, x - 14, y - tall - 10, x + 18, y - tall - 6, WOOD_D, 3); line(ctx, x + 10, y - tall - 16, x + 10, y - tall, WOOD_D, 2); }
    else { line(ctx, x - 6, y - tall - 2, x + 10, y - tall - 22, WOOD_D, 3); ell(ctx, x + 11, y - tall - 23, 4, 3, k === 'C2' ? '#e04f6d' : '#777'); }
  }
  return tall;
}
function drawWall(ctx, p) {
  const b = p.path[0], k = pathKey(p);
  const dx = p.x2 - p.x1, dy = p.y2 - p.y1, L = Math.hypot(dx, dy), n = Math.max(3, Math.round(L / 11));
  if (b === 'B') { // trap line: low fence + ground effect
    const col = k === 'B1' ? 'rgba(40,30,30,0.45)' : k === 'B2' ? 'rgba(255,120,40,0.35)' : k === 'B3' ? 'rgba(60,120,40,0.4)' : 'rgba(120,90,60,0.3)';
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 36; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke(); ctx.restore();
  }
  for (let i = 0; i <= n; i++) {
    const x = p.x1 + dx * i / n, y = p.y1 + dy * i / n;
    if (b === 'A' || b === 'C') {
      shadow(ctx, x, y, 8);
      const c = k === 'A3' ? '#dfe8f0' : STONE;
      rrect(ctx, x - 7, y - 20, 14, 20, 2, c, STONE_D); rrect(ctx, x - 7, y - 24, 6, 5, 1, c);
      if (k === 'A2') poly(ctx, [[x - 3, y - 10], [x + 7, y - 13], [x - 3, y - 6]], '#cfd6e0');
    } else if (b === 'B') {
      shadow(ctx, x, y, 5);
      if (k === 'B3') { ell(ctx, x, y - 6, 7, 6, '#4f7a3a'); poly(ctx, [[x - 2, y - 10], [x, y - 16], [x + 2, y - 10]], '#ddd'); }
      else { rrect(ctx, x - 3, y - 12, 6, 12, 2, WOOD, WOOD_D); poly(ctx, [[x - 3, y - 12], [x, y - 17], [x + 3, y - 12]], '#c48a55'); }
      if (k === 'B2' && Math.random() < 0.3) ell(ctx, x + rand(-6, 6), y - rand(0, 8), 2, 3, '#ffb030');
    } else { shadow(ctx, x, y, 6); rrect(ctx, x - 4, y - 18, 8, 18, 3, WOOD, WOOD_D); poly(ctx, [[x - 4, y - 18], [x, y - 24], [x + 4, y - 18]], '#c48a55'); }
  }
  if (b === 'C') { const m = { x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 }; rrect(ctx, m.x - 11, m.y - 34, 22, 34, 3, STONE, STONE_D); for (let i = -11; i < 11; i += 6) rrect(ctx, m.x + i, m.y - 38, 4, 5, 1, STONE); drawCat(ctx, m.x, m.y - 30, 18, 'grey', { helmet: '#9aa3ae', item: k === 'C2' ? null : 'bow', t: G.t }); if (k === 'C2') ell(ctx, m.x + 8, m.y - 40, 4, 3, '#555'); if (k === 'C3') { line(ctx, m.x + 12, m.y - 6, m.x + 20, m.y - 18, '#8a5a2b', 2); rrect(ctx, m.x + 16, m.y - 22, 8, 5, 1, '#999'); } }
}
function drawFarm(ctx, x, y, p, t) {
  const b = p.path[0], k = pathKey(p);
  const soil = k === 'A2' ? '#cfe8f2' : '#b5843f';
  poly(ctx, [[x - 20, y - 6], [x + 4, y - 15], [x + 22, y - 4], [x - 2, y + 5]], soil);
  if (k === 'A2') { poly(ctx, [[x - 20, y - 6], [x + 4, y - 15], [x + 22, y - 4], [x - 2, y + 5]], null, '#9ab', 1.5); }
  const crop = b === 'C' ? '#9fd36b' : k === 'B1' ? '#f08a2c' : '#d9b44a';
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
    const px = x - 16 + i * 7.5 + j * 5, py = y - 4 - i * 2 + j * 3;
    if (k === 'B1') { ell(ctx, px, py - 3, 3.5, 3, '#f08a2c', '#a85a1a'); continue; }
    if (k === 'C1') { ell(ctx, px, py - 1, 3, 1.8, '#5aa9d6'); continue; }
    line(ctx, px, py, px + Math.sin(t * 2 + i + j) * 1.2, py - 8, b === 'C' ? '#6aa84f' : '#c9a23a', 1.6);
    ell(ctx, px + Math.sin(t * 2 + i + j) * 1.2, py - 9, 1.5, 2.2, crop);
  }
  if (b === 'B' || (typeof G !== 'undefined' && G && G.mod && G.mod.farmScarecrow && p.built)) { // scarecrow / sunflower turret
    line(ctx, x + 2, y - 4, x + 2, y - 32, WOOD_D, 2); line(ctx, x - 7, y - 24, x + 11, y - 24, WOOD_D, 2);
    if (k === 'B2') { for (let a = 0; a < 8; a++) ell(ctx, x + 2 + Math.cos(a * 0.8) * 6, y - 34 + Math.sin(a * 0.8) * 6, 3, 3, '#f7d35c'); ell(ctx, x + 2, y - 34, 4, 4, '#7a4c25'); }
    else { ell(ctx, x + 2, y - 34, 5, 5, '#f2c66a'); poly(ctx, [[x - 4, y - 37], [x + 2, y - 46], [x + 8, y - 37]], '#8a5a2b'); rrect(ctx, x - 4, y - 28, 12, 10, 2, '#5c8ad6'); }
  }
  if (k === 'B3') for (let i = 0; i < 6; i++) line(ctx, x - 22 + i * 8, y + 8, x - 20 + i * 8, y - 16, '#7aa64a', 3);
  if (b === 'C' && k !== 'C1') { rrect(ctx, x + 14, y - 22, 14, 14, 2, k === 'C2' ? '#e8e2d2' : '#d0574b'); poly(ctx, [[x + 12, y - 22], [x + 21, y - 30], [x + 30, y - 22]], '#8a5a2b'); }
}
function drawMill(ctx, x, y, p, t) {
  const b = p.path[0], k = pathKey(p);
  shadow(ctx, x, y, 22);
  const body = b === 'B' ? '#8f8a80' : b === 'C' ? '#e8eef5' : STONE;
  poly(ctx, [[x - 14, y], [x - 10, y - 40], [x + 10, y - 40], [x + 14, y]], body, STONE_D);
  rrect(ctx, x - 3, y - 11, 6, 11, 2, '#8a5a2b');
  if (b === 'B') { rrect(ctx, x + 8, y - 8, 9, 8, 1, '#5a3a22'); ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 7px sans-serif'; ctx.fillText('!', x + 11, y - 2); }
  catEarRoof(ctx, x, y - 38, 28, 16, b === 'A' ? '#e6b93a' : b === 'C' ? '#8fd3ff' : ROOF_R);
  const spin = t * (k === 'B3' || b === 'C' ? 3.2 : 1.6);
  ctx.save(); ctx.translate(x, y - 42); ctx.rotate(spin);
  const sail = k === 'B2' ? '#cfd6e0' : b === 'C' ? '#f4fbff' : '#f4ecd8';
  for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); poly(ctx, [[0, -2], [26, -6], [26, 3], [0, 2]], sail, k === 'B2' ? '#777' : '#a58b62'); if (k === 'B2') poly(ctx, [[26, -6], [31, -1], [26, 3]], '#e0e6ee'); }
  ctx.restore(); ell(ctx, x, y - 42, 2.5, 2.5, '#6b4423');
  if (b === 'C') for (let i = 0; i < 3; i++) { const a = t * 1.5 + i * 2.1; ell(ctx, x + Math.cos(a) * 26, y - 30 + Math.sin(a) * 8, 3, 2, 'rgba(220,240,255,0.8)'); }
  if (b === 'A') for (let i = 0; i < 3; i++) rrect(ctx, x + 12 + i * 4, y - 7 + (i % 2) * 2, 5, 7, 1, '#e8d08a');
}
function drawHall(ctx, x, y, p, t) { // melee hall
  const b = p.path[0], col = b ? OPT_COL[b.charCodeAt(0) - 65] : '#4b78c8';
  shadow(ctx, x, y, 26);
  poly(ctx, [[x - 24, y], [x - 24, y - 14], [x, y - 36], [x + 24, y - 14], [x + 24, y]], '#f2f0ea', '#9aa');
  for (let i = -18; i <= 18; i += 12) poly(ctx, [[x + i - 3, y - 14], [x, y - 36], [x + i + 3, y - 14]], col);
  poly(ctx, [[x - 6, y], [x, y - 16], [x + 6, y]], '#3a3a46');
  line(ctx, x, y - 36, x, y - 48, '#555', 1.5); poly(ctx, [[x, y - 48], [x + 10 + Math.sin(t * 3) * 2, y - 45], [x, y - 42]], '#e04f6d');
  line(ctx, x + 26, y, x + 26, y - 16, '#cfd6e0', 1.5); line(ctx, x + 30, y, x + 30, y - 14, '#cfd6e0', 1.5); line(ctx, x + 24, y - 12, x + 32, y - 12, WOOD, 2);
}
function drawRange(ctx, x, y, p, t) {
  const b = p.path[0];
  shadow(ctx, x, y, 24);
  rrect(ctx, x - 20, y - 20, 30, 20, 2, b === 'B' ? '#c8b8e8' : '#d8b98c', '#8a6a3c');
  catEarRoof(ctx, x - 5, y - 18, 38, 18, b === 'B' ? '#7a4fd0' : b === 'C' ? '#b07a4a' : '#5c9e4f');
  ell(ctx, x + 18, y - 14, 8, 9, '#f0dca0', '#b48a40'); ell(ctx, x + 18, y - 14, 5, 6, '#e04f6d'); ell(ctx, x + 18, y - 14, 2, 2.4, '#f0dca0');
  line(ctx, x + 18, y - 5, x + 18, y, WOOD_D, 2);
}
function drawClinic(ctx, x, y, p, t) {
  shadow(ctx, x, y, 24);
  rrect(ctx, x - 22, y - 24, 44, 24, 3, '#f7f4ee', '#b8b2a6');
  catEarRoof(ctx, x, y - 22, 52, 20, p.path[0] === 'C' ? '#6aa84f' : p.path[0] === 'B' ? '#b07a4a' : '#e05a6a');
  rrect(ctx, x - 3, y - 20, 6, 14, 1, '#4cc27a'); rrect(ctx, x - 7, y - 16, 14, 6, 1, '#4cc27a');
  rrect(ctx, x + 10, y - 12, 7, 12, 2, '#8a5a2b');
}
function drawMine(ctx, x, y, p, t) {
  const b = p.path[0];
  shadow(ctx, x, y, 28);
  poly(ctx, [[x - 30, y], [x - 22, y - 22], [x - 6, y - 32], [x + 14, y - 28], [x + 30, y]], '#a79f88', '#7d7564');
  poly(ctx, [[x - 6, y - 32], [x + 14, y - 28], [x + 30, y], [x + 8, y]], '#8c846f');
  ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 10, y - 12); ctx.arc(x, y - 12, 10, Math.PI, 0); ctx.lineTo(x + 10, y); ctx.fillStyle = '#2b2520'; ctx.fill();
  line(ctx, x - 11, y, x - 11, y - 14, WOOD, 3); line(ctx, x + 11, y, x + 11, y - 14, WOOD, 3); line(ctx, x - 13, y - 14, x + 13, y - 14, WOOD, 3);
  rrect(ctx, x + 14, y - 8, 12, 7, 2, '#6b5a4a'); ell(ctx, x + 16, y - 1, 2, 2, '#333'); ell(ctx, x + 24, y - 1, 2, 2, '#333');
  const gem = b === 'B' ? '#ff8a3d' : b === 'C' ? '#7ad3ff' : '#ffd34d';
  for (let i = 0; i < 3; i++) ell(ctx, x + 16 + i * 4, y - 10, 2.2, 2, gem);
  if (b === 'B') { ell(ctx, x - 20, y - 26 - (t * 10 % 12), 3, 3, 'rgba(90,90,90,0.4)'); line(ctx, x - 20, y - 22, x - 20, y - 30, '#555', 3); }
}
function drawDock(ctx, x, y, p, t) {
  const b = p.path[0], k = pathKey(p);
  // pier stretches into the sea (west)
  rrect(ctx, x - 52, y - 8, 56, 14, 2, '#b98a55', WOOD_D);
  for (let i = -50; i < 2; i += 7) line(ctx, x + i, y - 8, x + i, y + 6, WOOD_D, 1);
  for (const px of [-48, -30, -12]) line(ctx, x + px, y + 6, x + px, y + 14, WOOD_D, 2.5);
  const bob = Math.sin(t * 2 + x) * 1.5;
  poly(ctx, [[x - 40, y + 14 + bob], [x - 18, y + 14 + bob], [x - 22, y + 22 + bob], [x - 36, y + 22 + bob]], '#c0392b');
  line(ctx, x - 29, y + 14 + bob, x - 29, y + bob, '#555', 1.2); poly(ctx, [[x - 29, y + bob], [x - 21, y + 10 + bob], [x - 29, y + 10 + bob]], '#fff');
  shadow(ctx, x + 8, y, 14);
  if (b === 'C') { // lighthouse
    poly(ctx, [[x, y], [x + 4, y - 42], [x + 14, y - 42], [x + 18, y]], '#f4f1ea', '#c33');
    for (let i = 0; i < 3; i++) rrect(ctx, x + 1 + i * 1.2, y - 12 - i * 12, 16 - i * 2.4, 4, 1, '#d63031');
    ell(ctx, x + 9, y - 46, 6, 5, '#ffe27a'); ctx.save(); ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 3); poly(ctx, [[x + 9, y - 46], [x + 70, y - 60], [x + 70, y - 32]], '#fff3b0'); ctx.restore();
  } else {
    rrect(ctx, x, y - 20, 22, 20, 2, b === 'B' ? STONE : '#d8b98c', '#8a6a3c');
    catEarRoof(ctx, x + 11, y - 18, 28, 14, b === 'B' ? '#555f6d' : '#4f9fd1');
    if (b === 'B') { ctx.save(); ctx.translate(x + 11, y - 28); ctx.rotate(p.aimFlip ? -2.6 : -0.5); rrect(ctx, -3, -3, k === 'B2' ? 22 : 16, 6, 2, '#333'); ctx.restore(); }
    else { line(ctx, x + 22, y - 4, x + 30, y - 18, '#7a4c25', 2); ell(ctx, x + 30, y - 18, 2, 2, '#ccc'); }
  }
}
function drawPost(ctx, x, y, p, t) { // scratching post
  shadow(ctx, x, y, 16);
  rrect(ctx, x - 14, y - 6, 28, 8, 2, '#b98a55', WOOD_D);
  rrect(ctx, x - 5, y - 46, 10, 42, 2, '#e3cc9a');
  for (let i = 0; i < 9; i++) line(ctx, x - 5, y - 8 - i * 4.5, x + 5, y - 10 - i * 4.5, '#c9a86a', 1.2);
  rrect(ctx, x - 13, y - 52, 26, 7, 2, '#b98a55', WOOD_D);
  const b = p.path[0]; const col = b === 'A' ? '#e05a4a' : b === 'B' ? '#e04f6d' : b === 'C' ? '#9a6be0' : '#e04f6d';
  ell(ctx, x + 9, y - 30 + Math.sin(t * 3) * 3, 4, 4, col); line(ctx, x + 6, y - 46, x + 9, y - 30 + Math.sin(t * 3) * 3, '#ddd', 0.8);
  if (b === 'A') for (let i = 0; i < 3; i++) line(ctx, x - 4 + i * 3, y - 40, x - 2 + i * 3, y - 30, '#7a3a2a', 1.3);
}
function drawGym(ctx, x, y, p, t) { // pounce gym: climbing frame
  shadow(ctx, x, y, 22);
  const b = p.path[0], col = b ? OPT_COL[b.charCodeAt(0) - 65] : '#e6c25a';
  line(ctx, x - 20, y, x - 20, y - 34, WOOD_D, 3); line(ctx, x + 20, y, x + 20, y - 46, WOOD_D, 3);
  rrect(ctx, x - 26, y - 36, 16, 4, 1, '#b98a55'); rrect(ctx, x + 12, y - 48, 16, 4, 1, '#b98a55'); rrect(ctx, x - 6, y - 22, 16, 4, 1, '#b98a55');
  line(ctx, x - 1, y - 22, x + 3, y, WOOD_D, 2);
  ctx.beginPath(); ctx.arc(x, y - 40, 7, 0, Math.PI * 2); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
  ell(ctx, x - 8, y - 2, 10, 3, '#d9cdb5');
}
function drawDen(ctx, x, y, p, t) { // cosy cat den
  shadow(ctx, x, y, 24);
  ctx.beginPath(); ctx.ellipse(x, y, 26, 24, 0, Math.PI, 0); ctx.fillStyle = p.path[0] === 'B' ? '#6aa84f' : p.path[0] === 'C' ? '#9aa3ae' : '#c48a55'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
  for (let i = -18; i <= 18; i += 9) line(ctx, x + i, y - Math.sqrt(Math.max(0, 1 - (i / 26) ** 2)) * 24, x + i * 0.8, y, 'rgba(0,0,0,0.12)', 2);
  ctx.beginPath(); ctx.ellipse(x, y, 10, 13, 0, Math.PI, 0); ctx.fillStyle = '#2b2520'; ctx.fill();
  ell(ctx, x - 3, y - 6, 1.5, 1.8, '#ffe27a'); ell(ctx, x + 3, y - 6, 1.5, 1.8, '#ffe27a');
  poly(ctx, [[x - 18, y - 18], [x - 14, y - 30], [x - 8, y - 22]], '#c48a55'); poly(ctx, [[x + 18, y - 18], [x + 14, y - 30], [x + 8, y - 22]], '#c48a55');
}
function drawLibrary(ctx, x, y, p, t) {
  shadow(ctx, x, y, 28);
  rrect(ctx, x - 26, y - 34, 52, 34, 3, '#e8e0cc', '#a89c80');
  for (let i = -20; i <= 20; i += 10) rrect(ctx, x + i - 2.5, y - 30, 5, 30, 1, '#f6f1e4');
  ctx.beginPath(); ctx.ellipse(x, y - 34, 20, 18, 0, Math.PI, 0); ctx.fillStyle = p.path[0] === 'B' ? '#e6c25a' : p.path[0] === 'C' ? '#7a4fd0' : p.path[0] === 'A' ? '#c0392b' : '#4b78c8'; ctx.fill();
  poly(ctx, [[x - 28, y - 34], [x + 28, y - 34], [x + 24, y - 38], [x - 24, y - 38]], '#cfc4a8');
  rrect(ctx, x - 6, y - 14, 12, 14, 2, '#6b4423');
  for (let i = 0; i < 3; i++) rrect(ctx, x + 14 + i * 3, y - 8, 3, 8, 0.5, ['#e04f6d', '#4f9df0', '#6aa84f'][i]);
}
function drawBell(ctx, x, y, t, active) {
  shadow(ctx, x, y, 12);
  line(ctx, x - 10, y, x - 10, y - 28, WOOD_D, 3); line(ctx, x + 10, y, x + 10, y - 28, WOOD_D, 3); line(ctx, x - 12, y - 28, x + 12, y - 28, WOOD, 3);
  const sw = active ? Math.sin(t * 16) * 0.5 : Math.sin(t * 1.5) * 0.08;
  ctx.save(); ctx.translate(x, y - 27); ctx.rotate(sw);
  ctx.beginPath(); ctx.moveTo(-7, 14); ctx.quadraticCurveTo(-7, 2, 0, 2); ctx.quadraticCurveTo(7, 2, 7, 14); ctx.closePath(); ctx.fillStyle = '#e6c25a'; ctx.fill(); ctx.strokeStyle = '#a07d22'; ctx.stroke();
  ell(ctx, 0, 15, 2, 2, '#a07d22'); ctx.restore();
}
const BUILDING_DRAW = { mill: drawMill, castle: drawCastle, house: drawHouse, farm: drawFarm, melee: drawHall, ranged: drawRange, clinic: drawClinic, mine: drawMine, dock: drawDock, post: drawPost, gym: drawGym, den: drawDen, library: drawLibrary };

// The King's royal regalia: a tall banner behind him and a big crown on top
function drawKingBanner(ctx, x, y, flip, t) {
  const f = flip ? 1 : -1, px = x + f * 11, top = y - 66;
  line(ctx, px, y - 4, px, top, '#5a3a1a', 2.5);
  ell(ctx, px, top - 2, 3, 3, '#ffd34d', '#a07d22');
  const w = Math.sin(t * 4) * 3, w2 = Math.sin(t * 4 + 1) * 3, d = -f;
  ctx.beginPath(); ctx.moveTo(px, top + 2);
  ctx.quadraticCurveTo(px + d * 12, top + 2 + w, px + d * 26, top + 4 + w2);
  ctx.lineTo(px + d * 26, top + 22 + w2);
  ctx.lineTo(px + d * 20, top + 17 + w2); ctx.lineTo(px + d * 14, top + 22 + w);
  ctx.quadraticCurveTo(px + d * 8, top + 20 + w, px, top + 22);
  ctx.closePath(); ctx.fillStyle = '#2f55c8'; ctx.fill(); ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 1.5; ctx.stroke();
  const cx = px + d * 13, cy = top + 12 + (w + w2) / 2;
  ell(ctx, cx, cy + 1, 3.2, 2.6, '#ffd34d'); ell(ctx, cx - 3, cy - 3, 1.2, 1.2, '#ffd34d'); ell(ctx, cx, cy - 4, 1.2, 1.2, '#ffd34d'); ell(ctx, cx + 3, cy - 3, 1.2, 1.2, '#ffd34d');
}
function drawCrown(ctx, x, y, s) {
  s = s || 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(255,210,80,0.9)'; ctx.shadowBlur = 6;
  poly(ctx, [[-9, 0], [-10, -9], [-5, -4], [0, -12], [5, -4], [10, -9], [9, 0]], '#ffd34d', '#a07d22', 1.2);
  ctx.shadowBlur = 0;
  rrect(ctx, -9, -2, 18, 4, 1, '#f0b82a');
  ell(ctx, 0, -12, 1.8, 1.8, '#fff'); ell(ctx, -10, -9, 1.5, 1.5, '#fff'); ell(ctx, 10, -9, 1.5, 1.5, '#fff');
  ell(ctx, 0, 0, 2, 1.6, '#e0304a'); ell(ctx, -5, 0, 1.4, 1.2, '#3b6fd8'); ell(ctx, 5, 0, 1.4, 1.2, '#3b6fd8');
  ctx.restore();
}

// ---------- ROBOTS ----------
// all robots anchored at feet (x,y); facing via flip; t for animation
function eyeGlow(ctx, x, y, r, col) { ell(ctx, x, y, r * 2, r * 2, col.replace(')', ',0.25)').replace('rgb', 'rgba')); ell(ctx, x, y, r, r, col); }
function legs2(ctx, t, col, spread, len, sp) { const a = Math.sin(t * (sp || 12)) * 2; line(ctx, -spread, -len, -spread + a, 0, col, 2.4); line(ctx, spread, -len, spread - a, 0, col, 2.4); }
function wheel(ctx, x, y, r, t, col) { ell(ctx, x, y, r, r, col || '#333'); ctx.save(); ctx.translate(x, y); ctx.rotate(t * 10); line(ctx, -r * 0.7, 0, r * 0.7, 0, '#888', 1.2); line(ctx, 0, -r * 0.7, 0, r * 0.7, '#888', 1.2); ctx.restore(); }
function rotor(ctx, x, y, r, t) { ell(ctx, x, y, r, r * 0.3, 'rgba(220,230,240,0.55)'); line(ctx, x - r * Math.cos(t * 40), y, x + r * Math.cos(t * 40), y, '#555', 1); }

const ROBOT_DRAW = {
  scrap(ctx, t) { legs2(ctx, t, '#6b5a4a', 3, 6); rrect(ctx, -6, -17, 12, 12, 3, '#b07a4a', '#6b4a2a'); ell(ctx, -2, -14, 2, 2, '#c58b5a'); eyeGlow(ctx, 2, -13, 1.6, 'rgb(255,220,60)'); line(ctx, 0, -17, 1, -21, '#6b5a4a', 1); },
  tintot(ctx, t) { legs2(ctx, t, '#8a6a2a', 3, 6); ell(ctx, 0, -12, 6.5, 7, '#d4a83c', '#8a6a2a'); eyeGlow(ctx, -2, -13, 1.3, 'rgb(80,200,255)'); eyeGlow(ctx, 2, -13, 1.3, 'rgb(80,200,255)'); ctx.save(); ctx.translate(-7, -12); ctx.rotate(t * 3); line(ctx, -3, 0, 3, 0, '#8a6a2a', 2); ctx.restore(); },
  blade(ctx, t) { legs2(ctx, t, '#555', 4, 8); rrect(ctx, -6, -22, 12, 15, 3, '#8f97a3', '#555b66'); rrect(ctx, -5, -28, 10, 7, 2, '#a7afba'); rrect(ctx, -3, -26, 8, 2.5, 1, '#ff3b3b'); ctx.save(); ctx.translate(9, -14); ctx.rotate(t * 20); for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); poly(ctx, [[0, -6], [2, -4], [0, -2]], '#dfe5ee'); } ctx.restore(); ell(ctx, 9, -14, 4.5, 4.5, null, '#aab'); },
  laser(ctx, t) { legs2(ctx, t, '#777', 3, 9); rrect(ctx, -4, -24, 8, 16, 3, '#eef0f4', '#9aa'); ell(ctx, 0, -27, 5, 5, '#eef0f4', '#9aa'); eyeGlow(ctx, 1.5, -27, 2, 'rgb(255,50,50)'); line(ctx, 3, -18, 15, -20, '#555', 2.5); ell(ctx, 15, -20, 1.5, 1.5, '#ff4040'); },
  prong(ctx, t) { legs2(ctx, t, '#333', 4, 8); rrect(ctx, -6, -22, 12, 15, 3, '#f2c230', '#333'); for (let i = -4; i < 6; i += 4) line(ctx, i, -21, i + 2, -9, '#222', 1.6); ell(ctx, 0, -26, 5, 4.5, '#f2c230', '#333'); eyeGlow(ctx, 1.5, -26, 1.5, 'rgb(80,200,255)'); line(ctx, -8, -4, 14, -32, '#555', 1.8); line(ctx, 12, -34, 16, -30, '#555', 1.5); line(ctx, 14, -36, 18, -32, '#555', 1.5); if (Math.sin(t * 25) > 0) line(ctx, 14, -34, 19, -38, '#6cf', 1.2); },
  spin(ctx, t) { legs2(ctx, t, '#555', 4, 7); ell(ctx, 0, -14, 8, 8, '#e67e22', '#9a4f10'); eyeGlow(ctx, 2, -15, 2, 'rgb(255,255,255)'); const a = t * 9; for (const s of [0, Math.PI]) { const ex = Math.cos(a + s) * 15, ey = -14 + Math.sin(a + s) * 6; line(ctx, 0, -14, ex, ey, '#777', 1.2); ell(ctx, ex, ey, 3.5, 3.5, '#555'); } },
  railgun(ctx, t) { legs2(ctx, t, '#223', 5, 8); rrect(ctx, -8, -24, 16, 17, 4, '#2c3e70', '#121c3a'); ell(ctx, 0, -28, 5.5, 5, '#3b528f'); eyeGlow(ctx, 2, -28, 1.6, 'rgb(80,220,255)'); rrect(ctx, -6, -34, 24, 6, 2, '#5a6a8a'); ell(ctx, 18, -31, 2.5, 2.5, `rgba(80,220,255,${0.5 + Math.sin(t * 8) * 0.4})`); },
  barrel(ctx, t) { legs2(ctx, t, '#444', 5, 6); rrect(ctx, -9, -28, 18, 23, 5, '#4a7b8c', '#2a4b56'); line(ctx, -9, -21, 9, -21, '#2a4b56', 2); line(ctx, -9, -12, 9, -12, '#2a4b56', 2); eyeGlow(ctx, 3, -24, 1.7, 'rgb(255,140,40)'); line(ctx, -10, -17, -14, -11, '#444', 2.5); line(ctx, 10, -17, 14, -11, '#444', 2.5); },
  shadow(ctx, t) { legs2(ctx, t, '#111', 4, 9); poly(ctx, [[-7, -24], [7, -24], [5, -8], [-5, -8]], '#1e1726', '#5b2a86'); poly(ctx, [[-5, -32], [5, -32], [6, -24], [-6, -24]], '#2a2036'); line(ctx, -4, -28, 4, -28, '#c06bff', 2); line(ctx, -9, -16, -17, -30, '#c06bff', 2); line(ctx, 9, -16, 17, -30, '#c06bff', 2); },
  brute(ctx, t) { legs2(ctx, t, '#333', 8, 10, 7); rrect(ctx, -15, -38, 30, 30, 7, '#f2c230', '#333'); for (let i = -12; i < 15; i += 6) line(ctx, i, -37, i + 4, -9, '#2b2b2b', 2); rrect(ctx, -7, -46, 14, 10, 3, '#555'); eyeGlow(ctx, 0, -42, 2.4, 'rgb(255,60,60)'); ell(ctx, -19, -16, 7, 7, '#555'); ell(ctx, 19, -16, 7, 7, '#555'); },
  tesla(ctx, t) { const b = Math.sin(t * 4) * 2; rotor(ctx, -8, -30 + b, 7, t); rotor(ctx, 8, -30 + b, 7, t); rrect(ctx, -4, -28 + b, 8, 16, 2, '#c87533', '#7a4214'); for (let i = 0; i < 4; i++) ell(ctx, 0, -25 + i * 4 + b, 5.5, 1.3, '#e09a5a'); ell(ctx, 0, -12 + b, 4, 4, '#9cf'); if (Math.sin(t * 30) > 0.3) { line(ctx, 0, -12 + b, -6, -4 + b, '#bdf', 1); line(ctx, 0, -12 + b, 6, -5 + b, '#bdf', 1); } },
  roller(ctx, t) { ell(ctx, 0, -9, 9, 9, '#6d7b8a', '#3b4652'); ctx.save(); ctx.translate(0, -9); ctx.rotate(t * 15); line(ctx, -9, 0, 9, 0, '#3b4652', 1.5); ctx.restore(); rrect(ctx, -6, -12, 12, 3, 1.5, '#5cff8a'); },
  hound(ctx, t) { const a = Math.sin(t * 16) * 2.5; for (const lx of [-8, -4, 4, 8]) line(ctx, lx, -8, lx + (lx > 0 ? a : -a), 0, '#444', 2); rrect(ctx, -10, -15, 20, 8, 3, '#7a808a', '#444'); ell(ctx, 11, -17, 5, 4, '#7a808a', '#444'); poly(ctx, [[9, -20], [10, -26], [12, -20]], '#7a808a'); eyeGlow(ctx, 13, -18, 1.4, 'rgb(255,40,40)'); line(ctx, -10, -13, -15, -18, '#444', 1.6); },
  bike(ctx, t) { wheel(ctx, 0, -8, 8, t); rrect(ctx, -10, -15, 20, 5, 2, '#d23d3d'); legs2(ctx, 0, '#333', 2, 4); rrect(ctx, -4, -27, 8, 12, 3, '#9aa3ae', '#555'); ell(ctx, 0, -30, 4, 4, '#9aa3ae'); eyeGlow(ctx, 2, -30, 1.4, 'rgb(255,200,40)'); line(ctx, 3, -22, 9, -16, '#555', 1.6); },
  drone(ctx, t) { const b = Math.sin(t * 6) * 2; for (const [rx, ry] of [[-9, -22], [9, -22], [-6, -28], [6, -28]]) rotor(ctx, rx, ry + b, 5, t); line(ctx, -9, -22 + b, 9, -22 + b, '#333', 1.4); ell(ctx, 0, -20 + b, 6, 4.5, '#f2c230', '#333'); line(ctx, -3, -23 + b, -3, -17 + b, '#222', 1.6); line(ctx, 2, -23 + b, 2, -17 + b, '#222', 1.6); poly(ctx, [[-2, -16 + b], [2, -16 + b], [0, -11 + b]], '#333'); eyeGlow(ctx, 4, -21 + b, 1.2, 'rgb(255,60,60)'); },
  jet(ctx, t) { const b = Math.sin(t * 6) * 1.5; poly(ctx, [[14, -22 + b], [-10, -32 + b], [-5, -22 + b], [-10, -12 + b]], '#d63031', '#8b1a1a'); ell(ctx, 4, -22 + b, 4, 2.4, '#9cf'); ell(ctx, -10, -22 + b, 3, 2, `rgba(255,170,60,${0.6 + Math.random() * 0.4})`); },
  blimp(ctx, t) { const b = Math.sin(t * 2) * 2; ell(ctx, 0, -36 + b, 22, 11, '#8e98a6', '#555f6d'); line(ctx, -22, -36 + b, 22, -36 + b, '#c0392b', 3); poly(ctx, [[-22, -36 + b], [-30, -46 + b], [-30, -28 + b]], '#555f6d'); rrect(ctx, -6, -26 + b, 12, 7, 2, '#555f6d'); ell(ctx, 0, -17 + b, 4, 4.5, '#222'); line(ctx, 0, -21 + b, 1, -24 + b, '#f80', 1.5); eyeGlow(ctx, 14, -38 + b, 1.8, 'rgb(255,60,60)'); },
  boom(ctx, t) { legs2(ctx, t, '#222', 3, 5, 16); ell(ctx, 0, -12, 9, 9, '#2d2d34', '#000'); ell(ctx, -3, -15, 2.5, 2, 'rgba(255,255,255,0.35)'); eyeGlow(ctx, 3, -12, 1.6, 'rgb(255,60,60)'); line(ctx, 0, -21, 3, -26, '#a87', 1.5); ell(ctx, 3, -27, 2 + Math.random() * 1.5, 2 + Math.random() * 1.5, '#ffb030'); },
  snail(ctx, t) { rrect(ctx, -12, -6, 22, 6, 3, '#555'); ell(ctx, 8, -9, 5, 4, '#888', '#555'); line(ctx, 10, -12, 12, -18, '#555', 1.4); eyeGlow(ctx, 12, -18, 1.2, 'rgb(255,200,60)'); ell(ctx, -3, -14, 9, 9, '#d63031', '#7a1515'); ctx.font = 'bold 7px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('!', -5, -11); line(ctx, -3, -23, -1, -27, '#a87', 1.2); ell(ctx, -1, -28, 1.6, 1.6, '#ffb030'); },
  blob(ctx, t) { const s = 1 + Math.sin(t * 8) * 0.12; ell(ctx, 0, -5 * s, 7 / s, 5.5 * s, '#9fa8b4', '#6d7684'); ell(ctx, -2, -6 * s, 1.2, 1.4, '#222'); ell(ctx, 2, -6 * s, 1.2, 1.4, '#222'); ell(ctx, -3, -8 * s, 1.8, 1, 'rgba(255,255,255,0.6)'); },
  spikeblob(ctx, t) { const s = 1 + Math.sin(t * 8) * 0.1; for (let i = 0; i < 8; i++) { const a = Math.PI + i * Math.PI / 7; poly(ctx, [[Math.cos(a - 0.15) * 9, -8 + Math.sin(a - 0.15) * 8], [Math.cos(a) * 15, -8 + Math.sin(a) * 13], [Math.cos(a + 0.15) * 9, -8 + Math.sin(a + 0.15) * 8]], '#cfd6e0'); } ell(ctx, 0, -8 * s, 10 / s, 8 * s, '#8a94a2', '#5a6270'); line(ctx, -5, -12, -1, -10, '#222', 1.4); line(ctx, 5, -12, 1, -10, '#222', 1.4); ell(ctx, -3, -8, 1.2, 1.2, '#f33'); ell(ctx, 3, -8, 1.2, 1.2, '#f33'); },
  turretblob(ctx, t) { ell(ctx, 0, -6, 9, 6.5, '#9fa8b4', '#6d7684'); line(ctx, 0, -9, 2 + Math.sin(t * 3) * 2, -24, '#9fa8b4', 3.5); rrect(ctx, -1 + Math.sin(t * 3) * 2, -29, 9, 5, 2, '#555'); eyeGlow(ctx, 8 + Math.sin(t * 3) * 2, -27, 1.2, 'rgb(255,60,60)'); },
  heavyturret(ctx, t) { ell(ctx, 0, -8, 13, 9, '#4f5763', '#2a2f37'); ell(ctx, -4, -11, 4, 2, 'rgba(255,255,255,0.3)'); line(ctx, 0, -12, 2 + Math.sin(t * 2) * 2, -30, '#4f5763', 5); rrect(ctx, -2 + Math.sin(t * 2) * 2, -37, 14, 8, 2, '#333'); line(ctx, 12 + Math.sin(t * 2) * 2, -35, 17 + Math.sin(t * 2) * 2, -35, '#222', 2); line(ctx, 12 + Math.sin(t * 2) * 2, -31, 17 + Math.sin(t * 2) * 2, -31, '#222', 2); },
  spiderS(ctx, t) { for (let i = 0; i < 3; i++) { const a = Math.sin(t * 22 + i) * 2; line(ctx, -2, -5, -8 + a, -1 - i * 2 + 2, '#777', 1.2); line(ctx, 2, -5, 8 - a, -1 - i * 2 + 2, '#777', 1.2); } ell(ctx, 0, -6, 4.5, 3.5, '#c3cad4', '#777'); eyeGlow(ctx, 0, -6, 1.2, 'rgb(255,40,40)'); },
  spiderM(ctx, t) { for (let i = 0; i < 4; i++) { const a = Math.sin(t * 18 + i) * 3; line(ctx, -3, -9, -14 + a, -2 - i * 3 + 4, '#3d434c', 2); line(ctx, 3, -9, 14 - a, -2 - i * 3 + 4, '#3d434c', 2); } ell(ctx, 0, -10, 7, 6, '#5d6570', '#2d3138'); for (const [ex, ey] of [[-2, -12], [2, -12], [0, -9]]) eyeGlow(ctx, ex, ey, 1.1, 'rgb(255,40,40)'); },
  spiderL(ctx, t) { for (let i = 0; i < 4; i++) { const a = Math.sin(t * 10 + i) * 5; ctx.lineCap = 'round'; line(ctx, -8, -24, -30 + a, -36 + i * 9, '#1d1d22', 4); line(ctx, -30 + a, -36 + i * 9, -36 + a, -4 + i * 2, '#1d1d22', 3); line(ctx, 8, -24, 30 - a, -36 + i * 9, '#1d1d22', 4); line(ctx, 30 - a, -36 + i * 9, 36 - a, -4 + i * 2, '#1d1d22', 3); } ell(ctx, 0, -26, 18, 14, '#2a2a30', '#8b1a1a'); ell(ctx, 0, -40, 11, 8, '#2a2a30', '#8b1a1a'); for (const [ex, ey] of [[-5, -42], [0, -44], [5, -42], [-3, -38], [3, -38]]) eyeGlow(ctx, ex, ey, 1.6, 'rgb(255,40,40)'); line(ctx, -14, -26, 14, -26, '#d63031', 2); },
  drill(ctx, t) { legs2(ctx, t, '#555', 5, 6); ell(ctx, -1, -12, 10, 8, '#8a6a4a', '#5a3a1a'); ctx.save(); ctx.translate(9, -12); poly(ctx, [[0, -6], [12, 0], [0, 6]], '#c0c6cf', '#777'); for (let i = 0; i < 3; i++) line(ctx, 2 + i * 3 + (t * 30 % 3), -5 + i * 1.6, 2 + i * 3 + (t * 30 % 3), 5 - i * 1.6, '#777', 1); ctx.restore(); eyeGlow(ctx, 4, -16, 1.5, 'rgb(255,200,60)'); line(ctx, -10, -6, -14, -2, '#555', 2); },
  drillgun(ctx, t) { ROBOT_DRAW.drill(ctx, t); rrect(ctx, -9, -26, 12, 5, 2, '#444'); line(ctx, 3, -24, 9, -26, '#222', 2); },
  glitch(ctx, t) { ctx.save(); ctx.globalAlpha *= 0.55 + Math.sin(t * 13) * 0.25; const g = (Math.random() < 0.15) ? (Math.random() * 6 - 3) : 0; poly(ctx, [[-9 + g, -30], [9 + g, -30], [11, -12], [5, -6], [0, -10], [-5, -6], [-11, -12]], '#56e6ff', '#ff4fd8', 1.5); rrect(ctx, -6 + g, -26, 12, 4, 1, '#ff4fd8'); for (let i = 0; i < 3; i++) line(ctx, -10, -28 + i * 7 + (t * 40 % 7), 10, -28 + i * 7 + (t * 40 % 7), 'rgba(255,255,255,0.5)', 1); ctx.restore(); },
  smash(ctx, t) { legs2(ctx, t, '#333', 9, 12, 6); rrect(ctx, -14, -40, 28, 28, 6, '#6f7d5c', '#3a4430'); rrect(ctx, -8, -48, 16, 10, 3, '#576348'); eyeGlow(ctx, 0, -44, 2.2, 'rgb(255,180,40)'); const a = Math.sin(t * 5) * 6; line(ctx, -14, -30, -22, -18 + a, '#444', 4); rrect(ctx, -30, -22 + a, 14, 10, 2, '#555'); line(ctx, 14, -30, 22, -18 - a, '#444', 4); rrect(ctx, 16, -22 - a, 14, 10, 2, '#555'); },
  minigun(ctx, t) { legs2(ctx, t, '#333', 5, 7); rrect(ctx, -9, -24, 18, 17, 4, '#6b7a3c', '#3a4420'); ell(ctx, 0, -27, 6, 5, '#7d8c4a'); eyeGlow(ctx, 2, -27, 1.6, 'rgb(255,80,40)'); rrect(ctx, 6, -20, 14, 7, 2, '#333'); for (let i = 0; i < 3; i++) line(ctx, 20, -19 + i * 2.5, 25, -19 + i * 2.5 + Math.sin(t * 50 + i), '#222', 1.2); },
  monolith(ctx, t) { poly(ctx, [[-14, 0], [-18, -66], [18, -66], [14, 0]], '#18181c', '#3a3a44'); ell(ctx, 0, -40, 6 + Math.sin(t * 4) * 1.5, 6 + Math.sin(t * 4) * 1.5, '#fff'); ell(ctx, 0, -40, 12, 12, 'rgba(255,255,255,0.15)'); for (let i = 0; i < 4; i++) { const a = Math.sin(t * 9 + i * 1.7) * 6; line(ctx, i < 2 ? -16 : 16, -20 - (i % 2) * 18, (i < 2 ? -28 : 28) + a, -14 - (i % 2) * 18, '#2a2a33', 2.5); } },
  mortar(ctx, t) { for (const lx of [-12, -5, 5, 12]) line(ctx, lx * 0.6, -10, lx, 0, '#4a3a2a', 2.5); rrect(ctx, -14, -18, 28, 10, 3, '#a68a5b', '#5a4a2a'); ctx.save(); ctx.translate(2, -18); ctx.rotate(-0.7); rrect(ctx, -4, -18, 9, 20, 3, '#5a4a2a'); ell(ctx, 0.5, -18, 4.5, 2, '#222'); ctx.restore(); eyeGlow(ctx, -9, -14, 1.5, 'rgb(255,200,60)'); },
  ram(ctx, t) { wheel(ctx, -10, -5, 5, t); wheel(ctx, 10, -5, 5, t); rrect(ctx, -18, -24, 30, 18, 4, '#7a6a5a', '#3a2a1a'); rrect(ctx, -16, -30, 14, 8, 2, '#5a4a3a'); ell(ctx, -9, -26, 3, 2, '#9cf'); const p = Math.max(0, Math.sin(t * 6)) * 6; rrect(ctx, 12, -19, 8 + p, 6, 1, '#999'); rrect(ctx, 18 + p, -22, 6, 12, 2, '#555'); },
  saw(ctx, t) { ctx.save(); ctx.translate(0, -18); ctx.rotate(t * 18); ell(ctx, 0, 0, 17, 17, '#b8c0ca', '#555'); for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); poly(ctx, [[-3, -16], [0, -22], [3, -16]], '#dfe5ee', '#777'); } ctx.restore(); ell(ctx, 0, -18, 6, 6, '#333'); ell(ctx, 0, -18, 3, 2, '#9cf'); },
  walker(ctx, t) { const a = Math.sin(t * 6) * 4; line(ctx, -8, -28, -12 + a, 0, '#333', 4); line(ctx, 8, -28, 12 - a, 0, '#333', 4); rrect(ctx, -15, -54, 30, 28, 4, '#5d6876', '#2e3540'); for (let i = -12; i < 15; i += 7) rrect(ctx, i, -60, 5, 7, 1, '#5d6876'); line(ctx, -15, -44, 15, -44, '#2e3540', 2); rrect(ctx, 10, -50, 12, 5, 2, '#222'); eyeGlow(ctx, -6, -48, 1.8, 'rgb(255,60,60)'); eyeGlow(ctx, 2, -48, 1.8, 'rgb(255,60,60)'); },
  barge(ctx, t) { const b = Math.sin(t * 2) * 2; ell(ctx, 0, -6 + b, 26, 7, 'rgba(160,220,255,0.5)'); poly(ctx, [[-26, -12 + b], [26, -12 + b], [20, -2 + b], [-22, -2 + b]], '#6d7a88', '#38424e'); rrect(ctx, -12, -24 + b, 18, 12, 3, '#8a96a4'); rrect(ctx, 2, -30 + b, 24, 5, 2, '#38424e'); ell(ctx, -6, -20 + b, 2, 2, '#9cf'); line(ctx, -16, -24 + b, -16, -40 + b, '#555', 1.5); poly(ctx, [[-16, -40 + b], [-4, -34 + b], [-16, -30 + b]], '#d63031'); },
  megavac(ctx, t) { const b = Math.sin(t * 2) * 2; ell(ctx, 0, -8, 48, 14, '#2a1e36'); rrect(ctx, -44, -56 + b, 88, 50, 22, '#5b2a86', '#2a1040'); rrect(ctx, -40, -54 + b, 80, 12, 8, '#7d3fb3'); for (let i = -36; i <= 36; i += 12) poly(ctx, [[i - 4, -56 + b], [i, -68 + b], [i + 4, -56 + b]], '#2a1040'); eyeGlow(ctx, -14, -38 + b, 4, 'rgb(255,40,60)'); eyeGlow(ctx, 14, -38 + b, 4, 'rgb(255,40,60)'); rrect(ctx, -30, -22 + b, 60, 10, 4, '#1b1b22'); const s = (t * 3) % 1; ell(ctx, 0, -17 + b, 26 * (1 - s), 4 * (1 - s), null, 'rgba(200,180,255,0.6)'); ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#ffd34d'; ctx.textAlign = 'center'; ctx.fillText('9000', 0, -46 + b); ctx.textAlign = 'left'; },
};
function drawRobot(ctx, type, x, y, o) {
  o = o || {};
  const def = ENEMIES[type], size = (SPRITES['r_' + type] || {}).size || 30;
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.elite) { ctx.shadowColor = '#ffd34d'; ctx.shadowBlur = 10; }
  const used = spr(ctx, 'r_' + type, x, y + (def.fly ? -16 : 0) + (o.bob || 0), size, { flip: o.flip, flash: o.flash, squash: o.squash });
  if (!used) {
    ctx.translate(x, y);
    if (o.flip) ctx.scale(-1, 1);
    (ROBOT_DRAW[type] || ROBOT_DRAW.scrap)(ctx, o.t || 0);
    if (o.flash) { ctx.globalCompositeOperation = 'source-atop'; }
  }
  ctx.restore();
}

// ---------- TERRAIN (pre-rendered, whole world) ----------
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function drawTree(ctx, x, y, r, col) {
  shadow(ctx, x + 2, y, r * 0.9, 0.18);
  line(ctx, x, y, x, y - r * 0.6, '#7a5a3a', 2);
  const c2 = shade(col, -0.18), c3 = shade(col, 0.18);
  ell(ctx, x, y - r, r, r * 0.95, c2); ell(ctx, x - r * 0.2, y - r * 1.1, r * 0.75, r * 0.7, col); ell(ctx, x - r * 0.35, y - r * 1.3, r * 0.35, r * 0.3, c3);
}
function drawPine(ctx, x, y, h, col) {
  shadow(ctx, x + 2, y, h * 0.28, 0.18);
  poly(ctx, [[x, y - h], [x - h * 0.3, y - h * 0.15], [x + h * 0.3, y - h * 0.15]], shade(col, -0.15));
  poly(ctx, [[x, y - h], [x - h * 0.3, y - h * 0.15], [x, y - h * 0.22]], col);
}
function buildTerrain() {
  const cv = document.createElement('canvas'); cv.width = WW; cv.height = WH;
  const g = cv.getContext('2d'), R = rng(7);
  const gr = g.createLinearGradient(0, 0, WW, WH); gr.addColorStop(0, '#8fc277'); gr.addColorStop(1, '#79b267');
  g.fillStyle = gr; g.fillRect(0, 0, WW, WH);
  for (let i = 0; i < 520; i++) { const x = R() * WW, y = R() * WH, r = 12 + R() * 50; ell(g, x, y, r, r * 0.6, R() < 0.5 ? 'rgba(255,255,220,0.06)' : 'rgba(40,90,40,0.06)'); }
  const rv = TERRAIN.river;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(rv.pts[0][0], rv.pts[0][1]); for (const p of rv.pts) g.lineTo(p[0], p[1]);
  g.strokeStyle = '#d9cfa0'; g.lineWidth = rv.w + 12; g.stroke();
  g.strokeStyle = '#5aa9d6'; g.lineWidth = rv.w; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 3; g.setLineDash([12, 22]); g.stroke(); g.setLineDash([]);
  for (const k of ['E', 'NE', 'S']) {
    const L = LANES[k];
    g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]);
    g.strokeStyle = '#c7ad7e'; g.lineWidth = 34; g.stroke();
    g.strokeStyle = '#dcc596'; g.lineWidth = 25; g.stroke();
    for (let i = 0; i < L.length - 1; i++) { const [x1, y1] = L[i], [x2, y2] = L[i + 1]; for (let s = 0; s < 1; s += 0.05) if (R() < 0.5) ell(g, x1 + (x2 - x1) * s + (R() - 0.5) * 18, y1 + (y2 - y1) * s + (R() - 0.5) * 18, 1.6, 1.1, 'rgba(120,90,50,0.35)'); }
  }
  const b = TERRAIN.bridge;
  g.save(); g.translate(b.x, b.y); g.rotate(-0.1);
  g.fillStyle = 'rgba(40,60,80,0.25)'; g.fillRect(-b.w / 2 + 3, -b.h / 2 + 4, b.w, b.h);
  for (let yy = -b.h / 2; yy < b.h / 2; yy += 6) rrect(g, -b.w / 2, yy, b.w, 5, 1.5, (yy / 6 | 0) % 2 ? '#c99a62' : '#b98a55');
  rrect(g, -b.w / 2 - 3, -b.h / 2 - 2, 5, b.h + 4, 2, '#8a5a2b'); rrect(g, b.w / 2 - 2, -b.h / 2 - 2, 5, b.h + 4, 2, '#8a5a2b');
  for (const yy of [-b.h / 2, 0, b.h / 2]) { ell(g, -b.w / 2 - 0.5, yy, 3.5, 3.5, '#6b4423'); ell(g, b.w / 2 + 0.5, yy, 3.5, 3.5, '#6b4423'); }
  g.restore();
  const sea = TERRAIN.sea;
  poly(g, sea.map(p => [p[0] + 10, p[1]]), '#e8dcae');
  poly(g, sea, '#4f9fd1');
  poly(g, sea.map(p => [p[0] - 18, p[1]]), '#3f8cc0');
  for (let i = 0; i < 70; i++) { const y = R() * WH, x = R() * 70; line(g, x, y, x + 12, y, 'rgba(255,255,255,0.3)', 1.2); }
  poly(g, TERRAIN.mountains, '#c9c1a8');
  for (let x = 90; x < 1200; x += 55 + R() * 25) {
    const h = 70 + R() * 70, w = 70 + R() * 55, y = 80 + R() * 34;
    poly(g, [[x - w / 2, y], [x + (R() - 0.5) * 12, y - h], [x + w / 2, y]], '#d8cfb1');
    poly(g, [[x + (R() - 0.5) * 8, y - h + 2], [x + w / 2, y], [x + 8, y]], '#a79f88');
    poly(g, [[x - 8, y - h + 18], [x + 2, y - h + 2], [x + 10, y - h + 18]], '#f4f1ea');
  }
  const clumps = [[1290, 345, 100, 20], [1395, 675, 90, 14], [1245, 700, 60, 9], [1140, 915, 110, 14], [1410, 180, 70, 12], [450, 150, 60, 7], [190, 300, 50, 7], [1035, 870, 40, 5], [380, 920, 90, 10], [840, 180, 60, 8], [1360, 450, 40, 6], [600, 880, 50, 6], [180, 600, 40, 5]];
  const trees = [];
  for (const [cx, cy, rr, n] of clumps) for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, d = R() * rr; trees.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 10 + R() * 8, R()]); }
  for (let i = 0; i < 26; i++) trees.push([1200 + R() * 240, 60 + R() * 180, 22 + R() * 14, 2]);
  trees.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r, k] of trees) {
    if (nearLane(x, y, 30)) continue;
    if (k === 2) drawPine(g, x, y, r, '#4f8a5b'); else drawTree(g, x, y, r, k < 0.5 ? '#e7d36a' : '#a9cf6b');
  }
  for (let i = 0; i < 120; i++) { const x = 120 + R() * 1320, y = 130 + R() * 820; if (nearLane(x, y, 24)) continue; if (R() < 0.3) poly(g, [[x - 5, y], [x - 2, y - 6], [x + 4, y - 5], [x + 6, y]], '#b9b4a8'); else ell(g, x, y, 1.6, 1.6, ['#fff', '#f7d35c', '#f28bb0'][i % 3]); }
  return cv;
}
function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}
function nearLane(x, y, d) {
  for (const k of ['E', 'NE', 'S']) { const L = LANES[k]; for (let i = 0; i < L.length - 1; i++) if (distSeg(x, y, L[i][0], L[i][1], L[i + 1][0], L[i + 1][1]) < d) return true; }
  for (const p of PLOTS) if (Math.hypot(p.x - x, p.y - y) < (p.type === 'castle' ? 90 : 52)) return true;
  if (Math.hypot(BELL.x - x, BELL.y - y) < 40 || Math.hypot(RESET_SPOT.x - x, RESET_SPOT.y - y) < 55) return true;
  return false;
}
function buildBlockMask() {
  const cv = document.createElement('canvas'); cv.width = WW; cv.height = WH;
  const g = cv.getContext('2d');
  poly(g, TERRAIN.sea, '#f00'); poly(g, TERRAIN.mountains.map(p => [p[0], p[1] - 4]), '#f00');
  const rv = TERRAIN.river; g.lineCap = 'round'; g.beginPath(); g.moveTo(rv.pts[0][0], rv.pts[0][1]); for (const p of rv.pts) g.lineTo(p[0], p[1]); g.strokeStyle = '#f00'; g.lineWidth = rv.w - 8; g.stroke();
  const b = TERRAIN.bridge; g.clearRect(b.x - b.w / 2 + 6, b.y - b.h / 2 - 8, b.w - 12, b.h + 16);
  const d = g.getImageData(0, 0, WW, WH).data, m = new Uint8Array(WW * WH);
  for (let i = 0; i < WW * WH; i++) m[i] = d[i * 4] > 128 ? 1 : 0;
  return m;
}
