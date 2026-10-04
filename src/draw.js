// ============================================================
//  KITTY KINGDOM — scene drawing, HUD, side panel, input, main loop
// ============================================================
'use strict';

const DARK = document.createElement('canvas'); DARK.width = W / 2; DARK.height = H / 2;
const dctx = DARK.getContext('2d');
const PANEL_W = 262;

function sprChain(keys, x, y, size, o) { for (const k of keys) if (SPR[k]) return spr(ctx, k, x, y, size, o); return false; }

// ---------- cats ----------
function unitLook(u) {
  if (u.role === 'squad') {
    const q = G.mod.squad;
    return { coat: u.coat, item: q.heal ? 'wand' : q.range ? (q.proj === 'magic' ? 'wand' : 'bow') : u.item, cross: q.heal ? '#4cc27a' : null, helmet: q.armor ? '#9aa3ae' : null, size: 24, keys: ['cat_follower_' + ((u.slot % 4) + 1)] };
  }
  const p = G.plots[u.home], k = pathKey(p), b = p.path[0];
  if (p.type === 'house') return { coat: 'grey', item: 'spear', helmet: '#8a5a2b', size: 24, keys: ['u_militia'] };
  const keys = ['u_' + p.type + '_' + k, 'u_' + p.type + '_' + (b || ''), 'u_' + p.type];
  if (p.type === 'melee') {
    const L = { base: { coat: 'brown', armor: '#b8c2cc', helmet: '#9aa3ae', item: 'sword' }, A: { coat: 'brown', armor: '#b8c2cc', helmet: '#9aa3ae', item: 'shield' }, A1: { coat: 'white', armor: '#f0d890', helmet: '#e6c25a', item: 'sword' }, A2: { coat: 'grey', armor: '#9aa3ae', helmet: '#6c95e0', item: 'shield' }, A3: { coat: 'brown', armor: '#7c8794', helmet: '#555', item: 'axe' },
      B: { coat: 'black', item: 'sword' }, B1: { coat: 'black', band: '#e0304a', item: 'sword' }, B2: { coat: 'orange', band: '#7a1a1a', item: 'axe' }, B3: { coat: 'calico', helmet: '#c0392b', plume: '#fff', item: 'sword' },
      C: { coat: 'grey', helmet: '#9aa3ae', item: 'spear' }, C1: { coat: 'grey', helmet: '#3d7b4f', item: 'spear' }, C2: { coat: 'orange', helmet: '#e6c25a', plume: '#e04f6d', item: 'spear', big: true }, C3: { coat: 'brown', helmet: '#7c8794', item: 'axe' } }[k];
    return Object.assign({ size: L.big ? 30 : 26, keys }, L);
  }
  if (p.type === 'ranged') {
    const L = { base: { coat: 'siamese', helmet: '#4d8a4a', item: 'bow' }, A: { coat: 'siamese', helmet: '#3d7b4f', item: 'bow' }, A1: { coat: 'black', helmet: '#2f4f2f', plume: '#e05050', item: 'bow' }, A2: { coat: 'grey', helmet: '#7c8794', item: 'bow' }, A3: { coat: 'brown', helmet: '#c48a55', plume: '#fff', item: 'bow' },
      B: { coat: 'white', wizard: '#7a4fd0', item: 'wand' }, B1: { coat: 'orange', wizard: '#e05a2a', item: 'wand' }, B2: { coat: 'white', wizard: '#8fd3ff', item: 'wand' }, B3: { coat: 'black', wizard: '#f7d35c', item: 'wand' },
      C: { coat: 'calico', item: 'sling' }, C1: { coat: 'brown', helmet: '#555', item: 'sling' }, C2: { coat: 'grey', helmet: '#4d8a4a', item: 'bow' }, C3: { coat: 'orange', band: '#e6c25a', item: 'sling' } }[k];
    return Object.assign({ size: 25, keys }, L);
  }
  // healers
  const L = { base: { coat: 'white', cross: '#4cc27a', item: 'wand' }, A: { coat: 'white', cross: '#e0304a', item: 'wand' }, B: { coat: 'brown', cross: '#e6c25a', item: 'axe' }, C: { coat: 'white', wizard: '#4d8a4a', item: 'staff' } }[b || 'base'];
  return Object.assign({ size: 24, keys }, L);
}
function drawUnit(u) {
  if (u.dead) return;
  const t = G.t, lk = unitLook(u);
  shadow(ctx, u.x, u.y, 8);
  const bob = u.moving ? Math.abs(Math.sin(t * 14 + u.x)) * 2 : 0;
  if (!sprChain(lk.keys, u.x, u.y - bob, lk.size, { flip: u.flip, flash: u.hurtT > 0 ? 0.6 : 0 }))
    drawCat(ctx, u.x, u.y - bob, lk.size, lk.coat, { flip: u.flip, t: t + u.x, moving: u.moving, item: lk.item, helmet: lk.helmet, plume: lk.plume, armor: lk.armor, wizard: lk.wizard, band: lk.band, cross: lk.cross });
  if (u.rallyT > 0) ell(ctx, u.x, u.y, 10, 4, null, '#ffd34d');
}
function drawKing() {
  const L = G.leader, t = G.t;
  const alpha = L.dead ? 0.35 : 1;
  ctx.save(); ctx.globalAlpha = alpha;
  // golden royal ring + shadow
  ell(ctx, L.x, L.y, 15, 6, 'rgba(255,211,77,0.25)', 'rgba(255,211,77,0.9)');
  shadow(ctx, L.x, L.y, 10);
  drawKingBanner(ctx, L.x, L.y, L.flip, t);
  const bob = L.moving ? Math.abs(Math.sin(t * 14)) * 2 : 0;
  const size = 34;
  const used = spr(ctx, 'cat_leader', L.x, L.y - bob, size, { flip: L.flip, flash: L.hurtT > 0 ? 0.6 : 0 });
  if (!used) drawCat(ctx, L.x, L.y - bob, size, 'orange', { flip: L.flip, t, moving: L.moving, cape: '#c0303a', item: 'staff' });
  // big crown on the head
  drawCrown(ctx, L.x + (L.flip ? -1 : 1) * 1.5, L.y - bob - size * 0.93, 1.15);
  if (L.shield > 0) { ctx.globalAlpha = 0.35; ell(ctx, L.x, L.y - 18, 20, 26, null, '#9cf'); ctx.lineWidth = 1; }
  if (L.invulnT > 0) { ctx.globalAlpha = 0.3; ell(ctx, L.x, L.y - 18, 18, 24, '#fff'); }
  ctx.restore();
  if (L.dead) { ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('respawn ' + Math.ceil(L.dead), L.x, L.y - 80); ctx.textAlign = 'left'; }
}
function drawDecoy(d) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(G.t * 10) * 0.2; drawCat(ctx, d.x, d.y, 32, 'orange', { t: G.t, cape: '#c0303a' }); drawCrown(ctx, d.x, d.y - 30, 0.9); ctx.restore(); }

// ---------- buildings ----------
function drawBuilding(p) {
  const t = G.t;
  if (!p.alive) {
    shadow(ctx, p.x, p.y, p.r);
    if (p.type === 'wall') { for (let i = 0; i <= 4; i++) { const x = p.x1 + (p.x2 - p.x1) * i / 4, y = p.y1 + (p.y2 - p.y1) * i / 4; ell(ctx, x, y - 2, 5, 3, '#9b8f7c'); } return; }
    for (let i = 0; i < 6; i++) ell(ctx, p.x + Math.cos(i * 2.1) * p.r * 0.5, p.y - 3 + Math.sin(i * 1.3) * 4, 5, 3.5, i % 2 ? '#a89c88' : '#857a68');
    ell(ctx, p.x, p.y - 18 - (t * 10 % 12), 4, 4, 'rgba(90,90,90,0.35)');
    return;
  }
  const k = pathKey(p), b = p.path[0] || '';
  const keys = ['b_' + p.type + '_' + k, 'b_' + p.type + '_' + b, 'b_' + p.type];
  const size = (SPRITES['b_' + p.type] || {}).size || 50;
  ctx.save();
  if (p.hurtT > 0) { p.hurtT -= 1 / 60; ctx.filter = 'brightness(1.6)'; }
  if (p.type === 'wall') drawWall(ctx, p);
  else if (p.type === 'tower') {
    let topY;
    if (sprChain(keys, p.x, p.y + 4, size)) topY = p.y + 4 - size * 0.86;
    else topY = p.y - drawTowerBody(ctx, p.x, p.y, p) - 3;
    const tc = TCAT[k], bob = Math.sin(t * 3 + p.x) * 0.8;
    if (!sprChain(['tcat_' + k, 'tcat_' + b, 'tcat_base'], p.x, topY + 4 + bob, 22, { flip: p.aimFlip })) {
      ctx.save(); ctx.beginPath(); ctx.rect(p.x - 20, topY - 50, 40, 50); ctx.clip();
      drawCat(ctx, p.x, topY + 10 + bob, 26, tc.coat, { flip: p.aimFlip, t, helmet: tc.helmet, plume: tc.plume, wizard: tc.wizard, item: tc.item });
      ctx.restore();
    }
  } else if (!sprChain(keys, p.x, p.y + 6, size)) BUILDING_DRAW[p.type](ctx, p.x, p.y, p, t);
  ctx.restore();
  // garrison / gate cats etc are units; badge shows chosen path
  if (G.phase === 'day' && upgradeOptions(p).length && lockReason(p) && Math.hypot(p.x - G.leader.x, p.y - G.leader.y) < 260) {
    const ly = (p.type === 'wall' ? wallMid(p).y : p.y) - (p.type === 'tower' ? towerHeight(p) + 40 : p.type === 'castle' ? 120 : 52);
    drawLock(ctx, p.type === 'wall' ? wallMid(p).x : p.x, ly + Math.sin(G.t * 2) * 1.5, 1.1);
  }
  if (p.type !== 'castle') drawBadge(ctx, p.type === 'wall' ? wallMid(p).x + 14 : p.x + p.r + 2, (p.type === 'wall' ? wallMid(p).y : p.y) - 2, p.path);
}
// padlock icon used on locked spots, locked upgrades and in the side panel
function drawLock(c, x, y, s) {
  s = s || 1;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.arc(0, -5, 4.2, Math.PI, 0); c.lineWidth = 2.2; c.strokeStyle = '#cfd6e0'; c.stroke();
  c.beginPath(); c.moveTo(-4.2, -5); c.lineTo(-4.2, -2); c.moveTo(4.2, -5); c.lineTo(4.2, -2); c.stroke();
  rrect(c, -6, -2.5, 12, 10, 2, '#f0b82a', '#7a5a10');
  ell(c, 0, 1.5, 1.5, 1.5, '#5a3a10'); rrect(c, -0.7, 2, 1.4, 3, 0.5, '#5a3a10');
  c.restore();
}
function drawPlotGhost(p) {
  const locked = !plotUnlocked(p);
  const near = Math.hypot(p.x - G.leader.x, p.y - G.leader.y) < 110;
  const c = p.type === 'wall' ? wallMid(p) : p;
  ctx.save(); ctx.globalAlpha = locked ? (near ? 0.3 : 0.16) : (near ? 0.42 : 0.22);
  const fake = { ...p, path: [], aimFlip: false };
  if (p.type === 'castle') { for (let i = 0; i < 9; i++) ell(ctx, p.x + Math.cos(i * 1.9) * 26, p.y - 4 + Math.sin(i * 1.3) * 10, 8, 5, i % 2 ? '#a89c88' : '#857a68'); ctx.globalAlpha = 1; }
  else if (p.type === 'wall') { ctx.setLineDash([5, 5]); line(ctx, p.x1, p.y1, p.x2, p.y2, '#fff', 3); ctx.setLineDash([]); }
  else if (p.type === 'tower') drawTowerBody(ctx, p.x, p.y, fake);
  else BUILDING_DRAW[p.type](ctx, p.x, p.y, fake, 0);
  ctx.restore();
  if (locked) {
    ctx.save(); ctx.globalAlpha = near ? 1 : 0.75;
    ell(ctx, c.x, c.y, PAD_R + 2, (PAD_R + 2) * 0.55, 'rgba(40,40,60,0.25)', 'rgba(200,205,220,0.6)');
    drawLock(ctx, c.x, c.y - 8, near ? 1.4 : 1.1);
    ctx.restore();
  }
}
function hpBar(x, y, w, f, col) {
  if (f >= 0.999) return;
  rrect(ctx, x - w / 2 - 1, y - 1, w + 2, 5, 2, 'rgba(0,0,0,0.55)');
  rrect(ctx, x - w / 2, y, w * Math.max(0, f), 3, 1.5, col);
}
function costCoins(x, y, n) {
  // up to 5 coins with a 1px yellow outline; more than 5 shows one coin and "xN"
  ctx.save(); ctx.lineWidth = 1;
  if (n <= 5) {
    const cw = 9, sx = x - (n - 1) * cw / 2;
    for (let i = 0; i < n; i++) ell(ctx, sx + i * cw, y, 3.6, 3.6, i < G.gold ? '#f5c534' : 'rgba(60,50,30,0.45)', '#ffe45c');
  } else {
    ell(ctx, x - 9, y, 3.6, 3.6, G.gold >= n ? '#f5c534' : 'rgba(60,50,30,0.45)', '#ffe45c');
    ctx.font = 'bold 10px "Trebuchet MS", sans-serif'; ctx.textAlign = 'left'; ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(30,25,10,0.7)';
    ctx.strokeText('x' + n, x - 3, y + 3.5); ctx.fillStyle = G.gold >= n ? '#ffe45c' : '#ffb0a0'; ctx.fillText('x' + n, x - 3, y + 3.5);
  }
  ctx.restore();
}
function drawResetSpot(pd) {
  const H = G.hold, active = H.key === pd.key, t = G.t;
  ctx.save();
  ctx.lineWidth = 2.5; ell(ctx, pd.x, pd.y, 20, 11, 'rgba(255,60,60,0.18)', '#ff5a5a');
  ctx.setLineDash([4, 4]); ell(ctx, pd.x, pd.y, 26, 14, null, 'rgba(255,90,90,0.6)'); ctx.setLineDash([]);
  if (active) { const k = H.done ? 1 : H.p / pd.hold; ctx.beginPath(); ctx.ellipse(pd.x, pd.y, 30, 17, 0, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 4; ctx.stroke(); }
  // bin icon
  const by = pd.y - 30 + Math.sin(t * 2) * 1.5;
  rrect(ctx, pd.x - 8, by - 2, 16, 3, 1, '#ffd0d0', '#7a1a1a'); rrect(ctx, pd.x - 3, by - 5, 6, 3, 1, '#ffd0d0', '#7a1a1a');
  ctx.lineWidth = 1; rrect(ctx, pd.x - 6.5, by + 2, 13, 14, 2, '#e04848', '#7a1a1a');
  for (const ox of [-3, 0, 3]) line(ctx, pd.x + ox, by + 5, pd.x + ox, by + 13, '#ffd0d0', 1.2);
  ctx.fillStyle = '#ffd0d0'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(40,0,0,0.7)'; ctx.strokeText('RESET GAME', pd.x, pd.y + 26); ctx.fillText('RESET GAME', pd.x, pd.y + 26); ctx.textAlign = 'left';
  ctx.restore();
}
function drawResetPanel() {
  if (!G.resetPanel || G.phase !== 'day') return;
  const sx = RESET_SPOT.x - G.cam.x, x = sx > W / 2 ? 12 : W - PANEL_W - 12, y = 52, w = PANEL_W, h = 150;
  G.panelRect = { x, y, w, h };
  ctx.save();
  ctx.lineWidth = 1.5; rrect(ctx, x, y, w, h, 12, 'rgba(50,10,14,0.92)', '#ff6a6a');
  ctx.fillStyle = '#ffb0b0'; ctx.font = 'bold 15px "Trebuchet MS", sans-serif'; ctx.fillText('Erase all game data', x + 12, y + 24);
  ctx.fillStyle = '#ffe2e2'; ctx.font = '12px "Trebuchet MS", sans-serif';
  const k = G.hold.key === 'reset' ? Math.ceil(3 - G.hold.p) : 3;
  ['Stand still here for 3 seconds to delete your', 'saved kingdom (Day ' + (G.night + 1) + ', all buildings and gold)', 'and start again from Day 1.', '', 'This cannot be undone. Walk away to cancel.'].forEach((l, i) => ctx.fillText(l, x + 12, y + 46 + i * 16));
  if (G.hold.key === 'reset' && !G.hold.done) { ctx.fillStyle = '#ff5a5a'; ctx.font = 'bold 14px "Trebuchet MS", sans-serif'; ctx.fillText('Erasing in ' + k + '...', x + 12, y + 140); }
  ctx.restore();
}
function drawPad(pd) {
  if (pd.reset) return drawResetSpot(pd);
  const L = G.leader, H = G.hold, active = H.key === pd.key;
  const dist = Math.hypot(pd.x - L.x, pd.y - L.y);
  const afford = G.gold >= pd.cost && !pd.locked;
  const pulse = 1 + Math.sin(G.t * 4 + pd.x) * 0.06;
  const r = (pd.big ? PAD_R + 4 : PAD_R) * pulse;
  ctx.save();
  // thin ring outline
  ctx.lineWidth = 2.2;
  ell(ctx, pd.x, pd.y, r, r * 0.55, afford ? 'rgba(255,240,170,0.18)' : 'rgba(255,140,120,0.14)', pd.col || (afford ? '#fff3b8' : '#ffb0a0'));
  if (active) {
    const need = pd.hold || (pd.key.endsWith(':build') ? HOLD_BUILD : HOLD_UPGRADE);
    const k = H.done ? 1 : H.p / need;
    ctx.beginPath(); ctx.ellipse(pd.x, pd.y, r + 4, (r + 4) * 0.55, 0, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
    ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 2.5; ctx.stroke();
  }
  ctx.lineWidth = 1;
  if (pd.idx != null) {
    ell(ctx, pd.x, pd.y - 15, 8, 8, pd.col, '#fff');
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(pd.idx + 1), pd.x, pd.y - 11);
  }
  if (pd.cost > 0 && (pd.big ? dist < 170 : dist < 70)) costCoins(pd.x, pd.y + (pd.idx != null ? 12 : -r - 8), pd.cost);
  ctx.restore();
}
function drawEnemy(e) {
  const d = e.def;
  if (e.burrowed) { ell(ctx, e.x, e.y, 9, 4, '#8a6a4a'); ell(ctx, e.x - 3, e.y - 2, 3, 2, '#a07d5a'); return; }
  if (!d.fly) shadow(ctx, e.x, e.y, e.r); else ell(ctx, e.x, e.y + 4, e.r * 0.8, e.r * 0.3, 'rgba(30,40,60,0.15)');
  // thin red enemy ring at the robot's feet (the King has a gold one)
  ctx.save(); ctx.lineWidth = 1.5; const rr = e.r * (d.fly ? 0.8 : 1) + 3; ell(ctx, e.x, e.y + (d.fly ? 4 : 0), rr, rr * 0.42, 'rgba(255,30,45,0.14)', 'rgba(255,40,55,0.85)'); ctx.restore();
  const bob = d.fly ? Math.sin(e.t * 5) * 2 : (Math.abs(Math.sin(e.t * 10)) * -1.2);
  drawRobot(ctx, e.type, e.x, e.y, { t: e.stunT > 0 ? 0 : e.t, flip: e.flip, elite: e.elite, bob, flash: e.hurtT > 0 ? 0.7 : 0, squash: d.fly ? 0 : Math.sin(e.t * 10) * 0.03 });
  if (e.slowT > 0 || e.auraSlowShow) ell(ctx, e.x, e.y - 2, e.r + 2, (e.r + 2) * 0.4, null, '#9cf');
  if (e.stunT > 0) for (let i = 0; i < 3; i++) ell(ctx, e.x + Math.cos(G.t * 6 + i * 2.1) * 9, e.y - e.r * 2 - 14 + Math.sin(G.t * 6 + i * 2.1) * 3, 1.8, 1.8, '#ffe27a');
  if (e.vulnT > 0) { ctx.fillStyle = '#ff6bd8'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('✦', e.x + e.r, e.y - e.r * 2); }
}
function drawProj(p) {
  ctx.save();
  if (p.lob) {
    const col = p.kind === 'bomb' ? '#333' : p.burn ? '#ff8a3d' : p.team === 'friend' ? '#7a6a5a' : '#5a4a2a';
    ell(ctx, p.tx, p.ty, 6, 3, 'rgba(255,60,40,0.25)');
    ell(ctx, p.x, p.y, 4.5, 4.5, col); if (p.burn) ell(ctx, p.x, p.y, 7, 7, 'rgba(255,150,60,0.35)');
    ctx.restore(); return;
  }
  ctx.translate(p.x, p.y); ctx.rotate(p.ang || 0);
  switch (p.kind) {
    case 'yarn': ell(ctx, 0, 0, 4, 4, '#e04f6d'); line(ctx, -3, -1, 3, 1, '#fff', 0.8); line(ctx, -4, 0, -10, 0, 'rgba(224,79,109,0.5)', 1); break;
    case 'arrow': line(ctx, -7, 0, 5, 0, '#5a3a1a', 1.5); poly(ctx, [[7, 0], [3, -2.5], [3, 2.5]], '#ddd'); line(ctx, -7, 0, -9, -2, '#fff', 1); line(ctx, -7, 0, -9, 2, '#fff', 1); break;
    case 'bolt': case 'harpoon': line(ctx, -10, 0, 6, 0, '#3a2a1a', 2.5); poly(ctx, [[9, 0], [4, -3.5], [4, 3.5]], '#ccc'); break;
    case 'magic': ell(ctx, 0, 0, 5, 5, 'rgba(201,166,255,0.45)'); ell(ctx, 0, 0, 3, 3, '#f0e0ff'); break;
    case 'laser': line(ctx, -8, 0, 4, 0, '#ff3b3b', 2.5); line(ctx, -8, 0, 4, 0, '#ffd0d0', 1); break;
    case 'rail': line(ctx, -14, 0, 4, 0, '#5ad8ff', 3); line(ctx, -14, 0, 4, 0, '#fff', 1); break;
    case 'zap': ell(ctx, 0, 0, 4, 4, '#bdf'); line(ctx, -6, -3, 6, 3, '#fff', 1); break;
    case 'sting': line(ctx, -4, 0, 4, 0, '#f2c230', 2); break;
    case 'bullet': ell(ctx, 0, 0, 2, 1.5, '#ffe08a'); break;
    default: ell(ctx, 0, 0, 3, 3, '#fff');
  }
  ctx.restore();
}
function drawFx() {
  for (const f of G.fx) {
    const k = f.t / f.dur;
    if (f.type === 'spark') { ctx.globalAlpha = 1 - k; ell(ctx, f.x, f.y, 2, 2, f.col); }
    else if (f.type === 'ring') { ctx.globalAlpha = 1 - k; const rr = f.inward ? f.r * (1 - k) : f.r * (0.3 + 0.7 * k); ell(ctx, f.x, f.y, rr, rr * 0.55, null, f.col); }
    else if (f.type === 'coinfly') { const x = f.x + (f.tx - f.x) * k, y = f.y + (f.ty - f.y) * k - Math.sin(k * Math.PI) * 26; ell(ctx, x, y, 3.5, 3.5, '#ffd34d', '#a07d22'); }
    else if (f.type === 'slash') { ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(f.x, f.y, 8, -1, 1); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
    else if (f.type === 'claw') { ctx.globalAlpha = 1 - k; for (let i = -1; i <= 1; i++) line(ctx, f.x - 10 + i * 4, f.y - 10 + i * 5, f.x + 10 + i * 4, f.y + 8 + i * 5, '#fff', 2); }
    else if (f.type === 'spin') { ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(f.x, f.y + 10, f.r, f.r * 0.5, 0, k * 6, k * 6 + 4.5); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
    else if (f.type === 'heal') { ctx.globalAlpha = 1 - k; ctx.fillStyle = '#5be38a'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('+', f.x - 3, f.y - k * 14); }
    else if (f.type === 'txt') { ctx.globalAlpha = 1 - k; ctx.fillStyle = f.col; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f.txt, f.x, f.y - k * 12); ctx.textAlign = 'left'; }
    else if (f.type === 'dirt') { ctx.globalAlpha = 1 - k; ell(ctx, f.x, f.y, 4, 2, '#8a6a4a'); }
    else if (f.type === 'bolt') { ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); for (let i = 1; i < 6; i++) { const q = i / 6; ctx.lineTo(f.x1 + (f.x2 - f.x1) * q + rand(-5, 5), f.y1 + (f.y2 - f.y1) * q + rand(-5, 5)); } ctx.lineTo(f.x2, f.y2); ctx.strokeStyle = '#bde6ff'; ctx.lineWidth = 2; ctx.stroke(); }
    else if (f.type === 'beam') { ctx.globalAlpha = 1 - k; line(ctx, f.x1, f.y1, f.x2, f.y2, f.col || '#ff4040', 3); line(ctx, f.x1, f.y1, f.x2, f.y2, '#fff', 1); }
    else if (f.type === 'ghost') { ctx.globalAlpha = 0.35 * (1 - k); drawCat(ctx, f.x, f.y, 32, 'orange', { flip: f.flip, cape: '#c0303a' }); }
    ctx.globalAlpha = 1;
  }
}
function drawNight() {
  const a = G.nightBlend;
  if (a <= 0.01) return;
  const cx = G.cam.x, cy = G.cam.y;
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.globalCompositeOperation = 'source-over';
  dctx.clearRect(0, 0, W, H);
  dctx.fillStyle = 'rgba(14,20,58,' + (0.275 * a) + ')'; dctx.fillRect(0, 0, W, H);
  dctx.setTransform(0.5, 0, 0, 0.5, -cx * 0.5, -cy * 0.5);
  dctx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, s) => { if (x < cx - r || x > cx + W + r || y < cy - r || y > cy + H + r) return; const g = dctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(0,0,0,' + s + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); dctx.fillStyle = g; dctx.fillRect(x - r, y - r, r * 2, r * 2); };
  for (const p of plots()) if (p.built && p.alive && p.type !== 'wall' && p.type !== 'farm') hole(p.x, p.y - 20, p.type === 'castle' ? 140 : p.type === 'tower' ? 90 : 60, 0.75);
  if (!G.leader.dead) hole(G.leader.x, G.leader.y - 14, 90, 0.85);
  for (const pl of G.pools) hole(pl.x, pl.y, pl.r * 2, 0.7);
  ctx.drawImage(DARK, cx, cy, W, H);
}

// ---------- tutorial arrows ----------
function goldArrow(x, y, ang, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(255,200,60,0.8)'; ctx.shadowBlur = 8;
  poly(ctx, [[0, 0], [-11, -12], [-4.5, -12], [-4.5, -24], [4.5, -24], [4.5, -12], [11, -12]], '#ffd34d', '#7a5410', 2);
  ctx.shadowBlur = 0;
  poly(ctx, [[0, -4], [-6, -10.5], [-2.5, -10.5], [-2.5, -21], [-0.5, -21], [-0.5, -10.5]], 'rgba(255,255,220,0.7)');
  ctx.restore();
}
function drawTutorialArrows() {
  const st = tutStep(); if (!st) return;
  const L = G.leader;
  const tg = tutTargets(st).sort((a, b) => Math.hypot(a.x - L.x, a.y - L.y) - Math.hypot(b.x - L.x, b.y - L.y)).slice(0, 2);
  const bounce = Math.abs(Math.sin(G.t * 4.5)) * 10;
  for (const t of tg) {
    const sx = t.x - G.cam.x, sy = t.y - t.off - G.cam.y;
    if (sx > 16 && sx < W - 16 && sy > 60 && sy < H - 10) goldArrow(sx, sy - bounce, 0, 1);   // tip points down at the spot
    else {
      const ex = clamp(sx, 26, W - 26), ey = clamp(sy, 76, H - 26), a = Math.atan2(sy - ey, sx - ex);
      goldArrow(ex + Math.cos(a) * bounce * 0.6, ey + Math.sin(a) * bounce * 0.6, a - Math.PI / 2, 0.8);
    }
  }
}

// ---------- speech bubbles (never covering robots or the King) ----------
function wrapText(text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (ctx.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; }
  if (cur) lines.push(cur); return lines;
}
function rectHit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function blockersOnScreen() {
  const cx = G.cam.x, cy = G.cam.y, out = [];
  const L = G.leader;
  out.push({ x: L.x - cx - 30, y: L.y - cy - 82, w: 60, h: 92 });
  for (const e of G.enemies) {
    const s = ((SPRITES['r_' + e.type] || {}).size || 30), up = e.def.fly ? 22 : 0;
    out.push({ x: e.x - cx - s / 2 - 6, y: e.y - cy - s - up - 14, w: s + 12, h: s + up + 20 });
  }
  if (G.panelRect) out.push(G.panelRect);
  return out;
}
function drawBubbles() {
  const placed = [], blockers = blockersOnScreen(), cx = G.cam.x, cy = G.cam.y;
  for (const b of G.bubbles) {
    const s = b.src;
    const topOff = s.type === 'castle' ? 118 : s.type === 'tower' ? 92 : s.type === 'library' || s.type === 'mine' ? 66 : 58;
    const ax = s.x - cx, ay = s.y - cy - topOff;
    if (ax < -20 || ax > W + 20 || ay < -60 || ay > H + 40) continue;
    ctx.font = '12px "Trebuchet MS", sans-serif';
    const lines = wrapText(b.text, 168);
    const w = Math.max(...lines.map(l => ctx.measureText(l).width), ctx.measureText(b.name).width) + 18, h = lines.length * 15 + 22;
    const bx = clamp(ax - w / 2, 6, W - w - 6); let by = ay - h - 8;
    if (by < 46) by = 46;
    for (const p of placed) if (rectHit({ x: bx, y: by, w, h }, p)) by = p.y - h - 6;
    const rect = { x: bx, y: by, w, h: h + 12 };
    if (by < 0 || blockers.some(r => rectHit(rect, r))) continue;   // would hide a robot or the King: don't show it
    placed.push(rect);
    const a = Math.min(1, b.t * 6, (b.dur - b.t) * 3);
    ctx.save(); ctx.globalAlpha = a;
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    rrect(ctx, bx, by, w, h, 10, '#fffdf6');
    ctx.shadowColor = 'transparent';
    poly(ctx, [[clamp(ax - 7, bx + 10, bx + w - 22), by + h - 1], [clamp(ax + 7, bx + 24, bx + w - 8), by + h - 1], [clamp(ax, bx + 12, bx + w - 12), Math.min(ay - 2, by + h + 12)]], '#fffdf6');
    ctx.fillStyle = s.type === 'castle' ? '#b0478a' : '#3d6fb6'; ctx.font = 'bold 10px "Trebuchet MS", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(b.name, bx + 9, by + 14);
    ctx.fillStyle = '#2b2b38'; ctx.font = '12px "Trebuchet MS", sans-serif';
    lines.forEach((l, i) => ctx.fillText(l, bx + 9, by + 29 + i * 15));
    ctx.restore();
  }
}

// ---------- side panel: only what can be bought right now ----------
function drawPanel() {
  G.panelRect = null;
  const p = G.panel;
  if (!p || G.phase !== 'day') return;
  const T = TREES[p.type], sx = (p.type === 'wall' ? wallMid(p).x : p.x) - G.cam.x;
  const x = sx > W / 2 ? 12 : W - PANEL_W - 12, y = 52, w = PANEL_W;
  const nodes = treeNodes(p.type, p.path), lvl = p.built ? p.path.length + 1 : 0;
  const lock = p.built ? (upgradeOptions(p).length ? lockReason(p) : null) : null;
  const plock = !p.built ? plotLock(p) : null;
  const opts = p.built && !lock ? upgradeOptions(p) : [];
  if (plock || lock) return drawLockPanel(p, x, y, w, sx, plock ? plock.title : 'Level ' + (p.path.length + 2) + ' upgrades are locked', plock ? plock.lines : lockLines(p), p.built ? (nodes.length ? nodes.map(n => n.name).join(' › ') : 'Level 1') : null, p.built ? (nodes.length ? nodes[nodes.length - 1].desc : T.blurb) : T.blurb);
  ctx.font = '11px "Trebuchet MS", sans-serif';
  // cards = exactly what you can do here now
  let cards = [];
  if (!p.built) cards = [{ name: 'Build ' + T.name, desc: T.blurb, num: null, col: '#ffe9a8', cost: cost(p, 0), key: p.id + ':build' }];
  else cards = opts.map((o, i) => { const slot = opts.length === 2 ? i * 2 : i; return { name: o.name, desc: o.desc, num: i + 1, col: OPT_COL[slot], cost: cost(p, p.path.length + 1), key: p.id + ':' + o.id }; });
  for (const c of cards) { c.d = wrapText(c.desc, w - 54); c.h = 26 + c.d.length * 13; }
  const sub = !p.built ? 'Empty building spot' : 'Level ' + lvl + (nodes.length ? ' · ' + nodes.map(n => n.name).join(' › ') : '');
  const subLines = wrapText(sub, w - 24).slice(0, 2);
  const note = !p.built ? (G.gold < cost(p, 0) ? (p.type === 'castle' && G.night === 0 ? 'Survive tonight: robot scrap pays for it' : 'Not enough gold yet (' + G.gold + '/' + cost(p, 0) + ')') : 'Stand on the glowing spot to build') : lock ? lock : opts.length ? (opts[0].research ? 'Repeatable research · ' : opts.length === 2 ? 'Final upgrade · ' : 'Upgrade to level ' + (lvl + 1) + ' · ') + 'stand on a numbered point' : '★ Fully upgraded';
  const curDesc = p.built && (lock || !opts.length) ? wrapText(nodes.length ? nodes[nodes.length - 1].desc : T.blurb, w - 24) : [];
  let hTot = 30 + subLines.length * 12 + 22 + curDesc.length * 13 + cards.reduce((a, c) => a + c.h + 6, 0) + 6;
  G.panelRect = { x, y, w, h: hTot };
  ctx.save();
  rrect(ctx, x, y, w, hTot, 12, 'rgba(22,26,46,0.88)', 'rgba(255,233,168,0.5)');
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 15px "Trebuchet MS", sans-serif'; ctx.fillText(T.name, x + 12, y + 22);
  ctx.font = '11px "Trebuchet MS", sans-serif'; ctx.fillStyle = '#b8c4e0';
  subLines.forEach((l, i) => ctx.fillText(l, x + 12, y + 38 + i * 12));
  let cy = y + 30 + subLines.length * 12 + 8;
  ctx.fillStyle = lock ? '#ffb0a0' : (p.built && !opts.length) ? '#9fe39a' : '#cfe0ff';
  ctx.font = (p.built && !opts.length ? 'bold 12px' : '11px') + ' "Trebuchet MS", sans-serif';
  ctx.fillText((lock ? '🔒 ' : '') + note, x + 12, cy + 4); cy += 14;
  ctx.fillStyle = '#dfe6f6'; ctx.font = '11px "Trebuchet MS", sans-serif';
  curDesc.forEach((l, i) => ctx.fillText(l, x + 12, cy + 4 + i * 13)); cy += curDesc.length * 13 + (curDesc.length ? 4 : 0);
  for (const c of cards) {
    const onIt = G.hold.key === c.key, afford = G.gold >= c.cost;
    rrect(ctx, x + 8, cy, w - 16, c.h, 8, onIt ? 'rgba(255,233,168,0.18)' : 'rgba(255,255,255,0.06)', onIt ? '#ffe9a8' : null);
    rrect(ctx, x + 8, cy, 5, c.h, 2, c.col);
    let tx = x + 18;
    if (c.num) { ell(ctx, x + 26, cy + 13, 8, 8, c.col, '#fff'); ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(c.num), x + 26, cy + 17); ctx.textAlign = 'left'; tx = x + 40; }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px "Trebuchet MS", sans-serif'; ctx.fillText(c.name, tx, cy + 17);
    ctx.textAlign = 'right'; ctx.fillStyle = afford ? '#ffe45c' : '#ffb0a0'; ctx.fillText(c.cost + 'g', x + w - 16, cy + 17); ctx.textAlign = 'left';
    ctx.font = '11px "Trebuchet MS", sans-serif'; ctx.fillStyle = '#dfe6f6';
    c.d.forEach((l, i) => ctx.fillText(l, tx, cy + 31 + i * 13));
    cy += c.h + 6;
  }
  ctx.restore();
  const bx = sx, byy = (p.type === 'wall' ? wallMid(p).y : p.y) - G.cam.y - 20;
  ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(255,233,168,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(x < W / 2 ? x + w : x, y + 20); ctx.lineTo(bx, byy); ctx.stroke(); ctx.restore();
}

function panelLink(x, w, sx, wy) {
  ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(255,233,168,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(x < W / 2 ? x + w : x, 72); ctx.lineTo(sx, wy); ctx.stroke(); ctx.restore();
}
function drawLockPanel(p, x, y, w, sx, title, lines, cur, what) {
  const T = TREES[p.type];
  ctx.font = '12px "Trebuchet MS", sans-serif';
  const body = []; for (const l of lines) body.push(...wrapText(l, w - 28));
  ctx.font = '11px "Trebuchet MS", sans-serif';
  const whatL = wrapText((p.built ? 'Right now: ' : 'What it does: ') + what, w - 24);
  const h = 66 + (cur ? 14 : 0) + body.length * 15 + 12 + whatL.length * 13 + 10;
  G.panelRect = { x, y, w, h };
  ctx.save();
  rrect(ctx, x, y, w, h, 12, 'rgba(22,26,46,0.9)', 'rgba(255,176,160,0.7)');
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 15px "Trebuchet MS", sans-serif'; ctx.fillText(T.name, x + 12, y + 22);
  let cy = y + 22;
  if (cur) { ctx.fillStyle = '#b8c4e0'; ctx.font = '11px "Trebuchet MS", sans-serif'; ctx.fillText(cur, x + 12, cy + 16); cy += 14; }
  rrect(ctx, x + 8, cy + 10, w - 16, 34 + body.length * 15, 8, 'rgba(255,120,100,0.14)', 'rgba(255,150,130,0.6)');
  drawLock(ctx, x + 24, cy + 30, 1.3);
  ctx.fillStyle = '#ffc4b4'; ctx.font = 'bold 13px "Trebuchet MS", sans-serif'; ctx.fillText(title, x + 38, cy + 28);
  ctx.fillStyle = '#ffe2d8'; ctx.font = '12px "Trebuchet MS", sans-serif';
  body.forEach((l, i) => ctx.fillText(l, x + 16, cy + 54 + i * 15));
  cy += 34 + body.length * 15 + 22;
  ctx.fillStyle = '#b8c4e0'; ctx.font = '11px "Trebuchet MS", sans-serif';
  whatL.forEach((l, i) => ctx.fillText(l, x + 12, cy + 6 + i * 13));
  ctx.restore();
  panelLink(x, w, sx, (p.type === 'wall' ? wallMid(p).y : p.y) - G.cam.y - 20);
}
// sidebar describing tonight's robots on the spawn the King is standing near
function drawLanePanel() {
  const lane = G.lanePanel; if (!lane || G.phase !== 'day') return;
  const groups = laneGroups(lane).slice(0, 9), more = laneGroups(lane).length - groups.length;
  const [ax, ay] = SPAWN_ANCHORS[lane], sx = ax - G.cam.x;
  const x = sx > W / 2 ? 12 : W - PANEL_W - 12, y = 52, w = PANEL_W;
  const title = { E: 'East Road', NE: 'North-East Road', S: 'South Bridge', SEA: 'From the Sea', AIRN: 'From the Northern Skies', AIRW: 'From the Western Skies' }[lane];
  ctx.font = '11px "Trebuchet MS", sans-serif';
  const rows = groups.map(g => ({ g, d: wrapText(ENEMY_INFO[g.type] || '', w - 66) }));
  const sc = nightScale(G.night + 1);
  let h = 62 + rows.reduce((a, r) => a + 22 + r.d.length * 12 + 6, 0) + (more > 0 ? 16 : 0) + (sc.hp > 1 ? 14 : 0);
  h = Math.min(h, H - y - 56);
  G.panelRect = { x, y, w, h };
  ctx.save();
  rrect(ctx, x, y, w, h, 12, 'rgba(40,16,26,0.9)', 'rgba(255,120,120,0.7)');
  ctx.fillStyle = '#ffd0d0'; ctx.font = 'bold 15px "Trebuchet MS", sans-serif'; ctx.fillText('Tonight: ' + title, x + 12, y + 22);
  ctx.fillStyle = '#e8c0c8'; ctx.font = '11px "Trebuchet MS", sans-serif'; ctx.fillText('Night ' + (G.night + 1) + ' · ' + NIGHTS[G.night].name, x + 12, y + 38);
  let cy = y + 48;
  if (sc.hp > 1) { ctx.fillStyle = '#ffb070'; ctx.fillText('Robots have x' + sc.hp.toFixed(2) + ' HP and x' + sc.dmg.toFixed(2) + ' damage', x + 12, cy + 4); cy += 14; }
  for (const r of rows) {
    if (cy > y + h - 30) break;
    const d = ENEMIES[r.g.type], rh = 22 + r.d.length * 12;
    ctx.lineWidth = 1.5; rrect(ctx, x + 8, cy, w - 16, rh, 8, 'rgba(255,255,255,0.06)', r.g.elite ? '#ffd34d' : null);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 10, cy + 1, 40, rh - 2); ctx.clip();
    ctx.translate(x + 30, cy + rh - 4); const s2 = Math.min(0.9, 26 / ((SPRITES['r_' + r.g.type] || {}).size || 30)); ctx.scale(s2, s2);
    drawRobot(ctx, r.g.type, 0, d.fly ? 16 : 0, { t: G.t, elite: r.g.elite }); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px "Trebuchet MS", sans-serif'; ctx.fillText(d.name + (r.g.elite ? ' (Elite)' : ''), x + 54, cy + 15);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ffd0d0'; ctx.fillText('x' + r.g.count, x + w - 16, cy + 15); ctx.textAlign = 'left';
    const tags = [d.fly ? 'Flying' : null, d.fam === 'siege' ? 'Siege' : null, d.range ? 'Ranged' : null, d.boss ? 'BOSS' : null].filter(Boolean).join(' · ');
    ctx.fillStyle = '#dfe6f6'; ctx.font = '11px "Trebuchet MS", sans-serif';
    r.d.forEach((l, i) => ctx.fillText(l, x + 54, cy + 29 + i * 12));
    if (tags) { ctx.fillStyle = '#9fb0d8'; ctx.font = 'italic 9px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(tags, x + w - 16, cy + 27 + (r.d.length - 1) * 12 + 12 > cy + rh ? cy + 27 : cy + 27); ctx.textAlign = 'left'; }
    cy += rh + 6;
  }
  if (more > 0) { ctx.fillStyle = '#e8c0c8'; ctx.fillText('+' + more + ' more robot types', x + 12, cy + 8); }
  ctx.restore();
  panelLink(x, w, sx, ay - G.cam.y);
}

// ---------- wave preview + offscreen indicators ----------
function toScreenClamped(x, y, mw, mh) { return [clamp(x - G.cam.x, 8 + mw / 2, W - 8 - mw / 2), clamp(y - G.cam.y, 50 + mh / 2, H - 10 - mh / 2)]; }
function coin(x, y, r) { ell(ctx, x, y, r, r, '#ffd34d', '#a07d22'); ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.3, '#fff3b8'); }
function drawWavePreview() {
  if (G.phase !== 'day' || !NIGHTS[G.night]) return;
  const N = NIGHTS[G.night], byLane = {};
  for (const g of N.groups) { (byLane[g[2]] = byLane[g[2]] || {}); byLane[g[2]][g[0]] = (byLane[g[2]][g[0]] || 0) + g[1]; }
  const anchor = SPAWN_ANCHORS;
  for (const lane in byLane) {
    const types = Object.entries(byLane[lane]).slice(0, 8), w = types.length * 30 + 10;
    const [sx, sy] = toScreenClamped(anchor[lane][0], anchor[lane][1], w, 40);
    const bx = sx - w / 2, by = sy - 20;
    if (G.panelRect && rectHit({ x: bx, y: by, w, h: 40 }, G.panelRect)) continue;
    const pl = 0.7 + Math.sin(G.t * 3) * 0.15;
    rrect(ctx, bx, by, w, 40, 8, 'rgba(120,20,40,' + (0.55 * pl) + ')', 'rgba(255,120,120,0.8)');
    types.forEach(([ty, n], i) => {
      ctx.save(); ctx.translate(bx + 20 + i * 30, by + 30); const sc = Math.min(1, 24 / ((SPRITES['r_' + ty] || {}).size || 30)); ctx.scale(sc, sc);
      drawRobot(ctx, ty, 0, 0, { t: G.t }); ctx.restore();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('x' + n, bx + 20 + i * 30, by + 39);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd0d0'; ctx.font = 'bold 9px sans-serif'; ctx.fillText(lane === 'SEA' ? 'BY SEA' : lane.startsWith('AIR') ? 'BY AIR' : lane + ' ROAD', bx + 4, by - 3);
  }
}
function drawOffscreen() {
  if (G.phase !== 'night') return;
  const cx = G.cam.x, cy = G.cam.y, seen = new Set();
  for (const e of G.enemies) {
    const x = e.x - cx, y = e.y - cy;
    if (x > 0 && x < W && y > 30 && y < H) continue;
    const ex = clamp(x, 14, W - 14), ey = clamp(y, 54, H - 14), key = ((ex / 30) | 0) + ':' + ((ey / 30) | 0);
    if (seen.has(key)) continue; seen.add(key);
    const a = Math.atan2(y - ey, x - ex);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); poly(ctx, [[8, 0], [-5, -6], [-5, 6]], e.def.boss ? '#b04fff' : '#ff4a4a', '#fff'); ctx.restore();
  }
}

// ---------- help button (top right): reopens the controls overlay ----------
const HELP_BTN = { x: W - 42, y: 8, w: 34, h: 34 };
let mouse = { x: -1, y: -1 };
function helpBtnShown() { return G.phase !== 'title'; }
function overHelpBtn(x, y) { const b = HELP_BTN; return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
function drawHelpButton() {
  if (!helpBtnShown()) return;
  const b = HELP_BTN, hov = overHelpBtn(mouse.x, mouse.y) || G.help;
  ctx.save(); ctx.lineWidth = 1.5;
  rrect(ctx, b.x, b.y, b.w, b.h, 10, hov ? 'rgba(60,66,100,0.9)' : 'rgba(25,30,50,0.75)', hov ? '#ffe9a8' : 'rgba(255,233,168,0.45)');
  // mini keycap with a question mark
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  rrect(ctx, cx - 10, cy - 8, 20, 19, 4, '#9a8f7a'); rrect(ctx, cx - 10, cy - 10, 20, 18, 4, hov ? '#ffe9a8' : '#fbf6ea', '#6b5f4a');
  ctx.fillStyle = '#3a3226'; ctx.font = 'bold 14px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?', cx, cy + 4); ctx.textAlign = 'left';
  ctx.restore();
}
function toggleHelp(on) { G.help = on == null ? !G.help : on; for (const k in keys) keys[k] = false; }

function drawHUD() {
  rrect(ctx, 8, 8, 312, 34, 10, 'rgba(25,30,50,0.75)');
  coin(28, 25, 9);
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 18px "Trebuchet MS", sans-serif'; ctx.fillText(G.gold, 42, 31);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  const nn = Math.min(G.night + 1, NIGHTS.length);
  ctx.fillText((G.phase === 'night' ? '🌙 Night ' : '☀ Day ') + nn + ' / ' + NIGHTS.length, 92, 30);
  ctx.fillStyle = '#b8c4e0'; ctx.font = '11px "Trebuchet MS", sans-serif';
  if (G.phase === 'night') ctx.fillText('Robots left: ' + (G.enemies.length + G.spawns.length), 210, 30);
  else ctx.fillText('Castle Lv' + castleTier(), 214, 30);
  const L = G.leader;
  ctx.save(); ctx.translate(-(HELP_BTN.w + 6), 0);   // King box sits left of the help button
  rrect(ctx, W - 230, 8, 222, 34, 10, 'rgba(25,30,50,0.75)');
  drawCrown(ctx, W - 214, 26, 0.7);
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 11px "Trebuchet MS", sans-serif'; ctx.fillText('King Whiskers', W - 202, 22);
  rrect(ctx, W - 202, 27, 100, 7, 3, '#3a2030'); rrect(ctx, W - 202, 27, 100 * clamp(L.hp / L.maxHp, 0, 1), 7, 3, '#e04f6d');
  if (L.shield > 0) rrect(ctx, W - 202, 27, Math.min(100, L.shield), 3, 1, '#9cf');
  const squad = G.followers.filter(f => !f.dead).length;
  ctx.fillStyle = '#cfe'; ctx.font = '10px "Trebuchet MS", sans-serif'; ctx.fillText(G.followers.length ? 'Squad ' + squad + '/' + G.followers.length : 'No squad yet', W - 92, 22);
  ctx.fillStyle = L.dashCd > 0 ? '#889' : '#ffe9a8'; ctx.fillText(L.dashCd > 0 ? 'Dash ' + Math.ceil(L.dashCd) + 's' : 'SPACE Dash', W - 92, 35);
  ctx.restore();
  drawHelpButton();
  if (G.phase === 'day') {
    const near = G.pads.filter(p => Math.hypot(p.x - L.x, p.y - L.y) < 36).sort((a, b) => Math.hypot(a.x - L.x, a.y - L.y) - Math.hypot(b.x - L.x, b.y - L.y))[0];
    if (near) {
      const txt = (near.idx != null ? (near.idx + 1) + '. ' : '') + near.label + (near.cost ? '  (' + near.cost + ' gold)' : ''), sub = near.locked || (G.gold < near.cost ? 'Not enough gold' : 'Stand still to activate');
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif'; const w1 = ctx.measureText(txt).width; ctx.font = '11px "Trebuchet MS", sans-serif'; const w = Math.max(w1, ctx.measureText(sub).width) + 24;
      rrect(ctx, W / 2 - w / 2, H - 52, w, 42, 10, 'rgba(25,30,50,0.85)');
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 13px "Trebuchet MS", sans-serif'; ctx.fillText(txt, W / 2, H - 34);
      ctx.fillStyle = near.locked || G.gold < near.cost ? '#ffb0a0' : '#cfe0ff'; ctx.font = '11px "Trebuchet MS", sans-serif'; ctx.fillText(sub, W / 2, H - 18); ctx.textAlign = 'left';
    } else if (tutStep()) {
      const txt = tutStep().tip; ctx.font = 'bold 12px "Trebuchet MS", sans-serif'; const w = ctx.measureText(txt).width + 40;
      rrect(ctx, W / 2 - w / 2, H - 38, w, 28, 9, 'rgba(25,30,50,0.8)', 'rgba(255,211,77,0.6)');
      ctx.save(); ctx.translate(W / 2 - w / 2 + 16, H - 24); ctx.scale(0.5, 0.5); goldArrow(0, 0, -Math.PI / 2, 1); ctx.restore();
      ctx.textAlign = 'left'; ctx.fillStyle = '#ffe9a8'; ctx.fillText(txt, W / 2 - w / 2 + 28, H - 20);
    } else if (G.night === 0 && G.t < 50) {
      ctx.textAlign = 'center'; ctx.font = '12px "Trebuchet MS", sans-serif'; rrect(ctx, W / 2 - 250, H - 36, 500, 26, 9, 'rgba(25,30,50,0.7)');
      ctx.fillStyle = '#e8eefc'; ctx.fillText('Move with WASD · stand on glowing spots to build · ring the bell to start the night', W / 2, H - 19); ctx.textAlign = 'left';
    }
  }
  if (G.msg) {
    const a = Math.min(1, G.msg.t * 3, (3 - G.msg.t) * 2);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = 'bold 28px "Trebuchet MS", sans-serif';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,20,40,0.8)'; ctx.strokeText(G.msg.text, W / 2, 110); ctx.fillStyle = '#fff2c4'; ctx.fillText(G.msg.text, W / 2, 110); ctx.restore();
  }
  if (G.speed > 1) { ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('>> x' + G.speed, 330, 30); }
  if (muted) { ctx.fillStyle = '#aaa'; ctx.font = '10px sans-serif'; ctx.fillText('muted (M)', 330, 44); }
  const boss = G.enemies.find(e => e.def.boss);
  if (boss) {
    rrect(ctx, W / 2 - 200, 52, 400, 22, 8, 'rgba(25,10,40,0.8)');
    rrect(ctx, W / 2 - 194, 62, 388 * boss.hp / boss.maxHp, 7, 3, '#b04fff');
    ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MEGA-VAC 9000', W / 2, 60); ctx.textAlign = 'left';
  }
}
function drawOverlay(title, sub, lines) {
  ctx.fillStyle = 'rgba(16,20,44,0.72)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px "Trebuchet MS", sans-serif'; ctx.lineWidth = 8; ctx.strokeStyle = '#2a1e40'; ctx.strokeText(title, W / 2, 170); ctx.fillStyle = '#ffd34d'; ctx.fillText(title, W / 2, 170);
  ctx.font = 'bold 18px "Trebuchet MS", sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(sub, W / 2, 210);
  ctx.font = '14px "Trebuchet MS", sans-serif'; ctx.fillStyle = '#cfe0ff';
  lines.forEach((l, i) => { if (i === lines.length - 1) { ctx.font = 'bold 16px "Trebuchet MS", sans-serif'; ctx.fillStyle = 'rgba(255,233,168,' + (0.7 + Math.sin(G.t * 4) * 0.3) + ')'; } ctx.fillText(l, W / 2, 450 + i * 24); });
  ctx.textAlign = 'left';
}

function render() {
  const cx = G.cam.x, cy = G.cam.y;
  ctx.save(); ctx.translate(-Math.round(cx), -Math.round(cy));
  ctx.drawImage(TERRAIN_CV, cx, cy, W, H, cx, cy, W, H);
  const onScreen = (x, y, m) => x > cx - m && x < cx + W + m && y > cy - m && y < cy + H + m;
  if (G.phase !== 'night' || !G.plots.castle.built) for (const p of plots()) if (!p.built && plotVisible(p) && onScreen(p.x, p.y, 80) && (G.phase !== 'night' || p.type === 'castle')) drawPlotGhost(p);
  for (const pl of G.pools) { ctx.globalAlpha = 0.55 * (1 - pl.t / pl.dur); ell(ctx, pl.x, pl.y, pl.r, pl.r * 0.5, pl.slow && !pl.dps ? '#9cf' : '#ff7a2a'); ell(ctx, pl.x, pl.y, pl.r * 0.6, pl.r * 0.3, pl.slow ? '#e6f4ff' : '#ffd34d'); ctx.globalAlpha = 1; }
  if (G.phase === 'day') for (const pd of G.pads) if (onScreen(pd.x, pd.y, 40)) drawPad(pd);
  drawBell(ctx, BELL.x, BELL.y, G.t, G.hold.key === 'bell');
  const list = [];
  for (const p of plots()) if (p.built && onScreen(p.x, p.y, 140)) list.push([p.type === 'wall' ? Math.max(p.y1, p.y2) : p.y, () => drawBuilding(p)]);
  for (const e of G.enemies) if (!e.def.fly && onScreen(e.x, e.y, 80)) list.push([e.y, () => drawEnemy(e)]);
  for (const u of G.units) if (!u.dead && onScreen(u.x, u.y, 40)) list.push([u.y, () => drawUnit(u)]);
  for (const u of G.followers) if (!u.dead) list.push([u.y, () => drawUnit(u)]);
  for (const d of G.decoys) list.push([d.y, () => drawDecoy(d)]);
  list.push([G.leader.y, drawKing]);
  list.sort((a, b) => a[0] - b[0]);
  for (const [, f] of list) f();
  for (const e of G.enemies) if (e.def.fly && onScreen(e.x, e.y, 80)) drawEnemy(e);
  for (const p of G.proj) drawProj(p);
  drawFx();
  drawNight();
  for (const p of plots()) if (p.built && p.alive) hpBar(p.type === 'wall' ? wallMid(p).x : p.x, (p.type === 'wall' ? wallMid(p).y : p.y) + 6, p.type === 'castle' ? 60 : 30, p.hp / p.maxHp, p.type === 'castle' ? '#e6c25a' : '#7ad36b');
  for (const e of G.enemies) if (!e.burrowed && !e.def.boss) hpBar(e.x, e.y - e.r * 2 - (e.def.fly ? 26 : 12), Math.max(16, e.r * 2), e.hp / e.maxHp, e.elite ? '#ffd34d' : '#ff5a5a');
  for (const u of G.followers.concat(G.units)) if (!u.dead) hpBar(u.x, u.y - 30, 16, u.hp / u.maxHp, '#7ad3ff');
  if (G.phase === 'day' && Math.hypot(BELL.x - G.leader.x, BELL.y - G.leader.y) < 100) { ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Stand here to start the night', BELL.x, BELL.y + 30); ctx.textAlign = 'left'; }
  ctx.restore();
  drawTutorialArrows();
  drawPanel();
  drawLanePanel();
  drawResetPanel();
  drawWavePreview();
  drawOffscreen();
  drawBubbles();
  drawHUD();
  if (G.phase === 'title') drawTitle();
  if (G.help && G.phase !== 'title') { drawTitle(true); drawHelpButton(); }
  if (G.phase === 'win') drawOverlay('VICTORY!', 'The MEGA-VAC 9000 is scrap. ' + G.stats.kills + ' robots defeated.', ['The cats of the realm will nap safely tonight.', 'Move to play again']);
  if (G.phase === 'lose') drawOverlay(G.loseWhy === 'king' ? 'THE KING FELL' : 'THE CASTLE FELL', 'Night ' + (G.night + 1) + ': ' + NIGHTS[G.night].name, ['The robots took the yarn reserves... but cats have nine lives.', G.save ? 'Move to retry Day ' + (G.save.night + 1) + ' from its start, before you built anything' : 'Move to try again']);
}


// ---------- title screen with drawn keycaps ----------
function keyCap(x, y, w, label, code, h) {
  h = h || 30;
  const down = code && keys[code];
  const dy = down ? 3 : 0;
  rrect(ctx, x, y + 4, w, h, 6, '#9a8f7a');                         // key side
  rrect(ctx, x, y + dy, w, h, 6, down ? '#ffe9a8' : '#fbf6ea', '#6b5f4a'); // key top
  rrect(ctx, x + 3, y + dy + 2, w - 6, h - 9, 4, down ? '#fff3c8' : '#ffffff');
  ctx.fillStyle = '#3a3226'; ctx.font = 'bold ' + (label.length > 2 ? 11 : 14) + 'px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + dy + h / 2 + 3); ctx.textAlign = 'left';
}
function arrowGlyph(x, y, dir) { ctx.save(); ctx.translate(x, y); ctx.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[dir]); poly(ctx, [[0, -6], [6, 3], [-6, 3]], '#3a3226'); ctx.restore(); }
function arrowCap(x, y, dir, code) { keyCap(x, y, 30, '', code); arrowGlyph(x + 15, y + (keys[code] ? 3 : 0) + 13, dir); }
function card(x, y, w, h, title) {
  ctx.lineWidth = 1.5; rrect(ctx, x, y, w, h, 14, 'rgba(24,28,52,0.88)', 'rgba(255,233,168,0.55)'); ctx.lineWidth = 1;
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 16px "Trebuchet MS", sans-serif'; ctx.fillText(title, x + 18, y + 28);
  line(ctx, x + 18, y + 38, x + w - 18, y + 38, 'rgba(255,233,168,0.25)', 1);
}
function rowText(x, y, t1, t2) {
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px "Trebuchet MS", sans-serif'; ctx.fillText(t1, x, y);
  if (t2) { ctx.fillStyle = '#b8c4e0'; ctx.font = '11px "Trebuchet MS", sans-serif'; ctx.fillText(t2, x, y + 15); }
}
function drawTitle(help) {
  ctx.fillStyle = 'rgba(14,18,40,0.74)'; ctx.fillRect(0, 0, W, H);
  // title
  ctx.textAlign = 'center';
  ctx.font = 'bold 54px "Trebuchet MS", sans-serif'; ctx.lineWidth = 8; ctx.strokeStyle = '#2a1e40';
  ctx.strokeText('KITTY KINGDOM', W / 2, 66); ctx.fillStyle = '#ffd34d'; ctx.fillText('KITTY KINGDOM', W / 2, 66);
  ctx.font = 'bold italic 22px "Trebuchet MS", sans-serif'; ctx.lineWidth = 5;
  ctx.strokeText('And the Robot Menace', W / 2, 96); ctx.fillStyle = '#ff9b7a'; ctx.fillText('And the Robot Menace', W / 2, 96);
  ctx.font = '13px "Trebuchet MS", sans-serif'; ctx.fillStyle = '#e8eefc';
  ctx.fillText('Defend the cat kingdom from the robot invasion for 100 nights', W / 2, 120);
  ctx.textAlign = 'left';
  drawCrown(ctx, W / 2 - 262, 56, 1.3); drawCrown(ctx, W / 2 + 262, 56, 1.3);
  // --- controls card
  const cx = 40, cy = 138, cw = 430, chh = 340;
  card(cx, cy, cw, chh, 'Controls');
  // move: WASD + arrows
  let y = cy + 58;
  keyCap(cx + 54, y, 30, 'W', 'KeyW'); keyCap(cx + 20, y + 34, 30, 'A', 'KeyA'); keyCap(cx + 54, y + 34, 30, 'S', 'KeyS'); keyCap(cx + 88, y + 34, 30, 'D', 'KeyD');
  ctx.fillStyle = '#b8c4e0'; ctx.font = 'italic 11px sans-serif'; ctx.fillText('or', cx + 128, y + 54);
  arrowCap(cx + 180, y, 'up', 'ArrowUp'); arrowCap(cx + 146, y + 34, 'left', 'ArrowLeft'); arrowCap(cx + 180, y + 34, 'down', 'ArrowDown'); arrowCap(cx + 214, y + 34, 'right', 'ArrowRight');
  rowText(cx + 262, y + 30, 'Move', 'King Whiskers leads;'); ctx.fillText('his squad follows', cx + 262, y + 60);
  // shift
  y += 92; keyCap(cx + 20, y, 96, 'SHIFT', 'ShiftLeft');
  rowText(cx + 132, y + 13, 'Hold to run (2x speed)', 'No attacking; your squad regroups on you');
  // space
  y += 56; keyCap(cx + 20, y, 200, 'SPACE', 'Space');
  rowText(cx + 236, y + 13, 'Dash attack', 'Leap forward and hit robots');
  // mute
  y += 56; keyCap(cx + 20, y, 30, 'M', 'KeyM');
  rowText(cx + 66, y + 13, 'Mute music and sound' + (muted ? ' (muted)' : ''), 'Music: Paw Patrol Protocol');
  ctx.fillStyle = '#9fb0d8'; ctx.font = 'italic 11px "Trebuchet MS", sans-serif';
  ctx.fillText('The King attacks robots near him on his own.', cx + 20, cy + chh - 16);
  // --- how to play card
  const hx = 490, hw = 430;
  card(hx, cy, hw, chh, 'How to play');
  let hy = cy + 66;
  // build ring with coins
  ctx.lineWidth = 2.2; ell(ctx, hx + 44, hy + 6, 16, 9, 'rgba(255,240,170,0.18)', '#fff3b8'); ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) ell(ctx, hx + 35 + i * 9, hy - 12, 3.6, 3.6, '#f5c534', '#ffe45c');
  rowText(hx + 84, hy, 'Build', 'Stand still on a glowing ring; coins fly in');
  hy += 62;
  for (let i = 0; i < 3; i++) { ell(ctx, hx + 22 + i * 22, hy - 4, 9, 9, OPT_COL[i], '#fff'); ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), hx + 22 + i * 22, hy); ctx.textAlign = 'left'; }
  rowText(hx + 84, hy - 6, 'Upgrade', 'Choices for the nearest building appear at the side.'); ctx.fillText('Step on its matching numbered point.', hx + 84, hy + 24);
  hy += 66;
  drawBell(ctx, hx + 44, hy + 16, G.t, false);
  rowText(hx + 84, hy, 'Start the night', 'Stand on the bell when your defences are ready');
  hy += 62;
  ctx.save(); ctx.translate(hx + 44, hy + 18); ctx.scale(0.36, 0.36); drawCastle(ctx, 0, 0, { path: [] }, G.t); ctx.restore();
  rowText(hx + 84, hy, 'Protect the Castle', 'Upgrading it unlocks new buildings. If it falls, the night is lost.');
  // --- footer: save + start prompt
  ctx.textAlign = 'center';
  if (help) {
    ctx.fillStyle = '#cfe0ff'; ctx.font = '13px "Trebuchet MS", sans-serif'; ctx.fillText('Game paused. Progress is saved at the start of every day.', W / 2, 508);
    ctx.fillStyle = '#9fb0d8'; ctx.font = 'italic 11px "Trebuchet MS", sans-serif'; ctx.fillText('To erase all game data, stand on the red RESET GAME spot in the far bottom-right corner of the map.', W / 2, 528);
    ctx.font = 'bold 18px "Trebuchet MS", sans-serif'; ctx.fillStyle = 'rgba(255,233,168,' + (0.7 + Math.sin(performance.now() / 250) * 0.3) + ')';
    ctx.fillText('Click anywhere or press Esc to return to the game', W / 2, 566); ctx.textAlign = 'left';
    return;
  }
  ctx.fillStyle = '#cfe0ff'; ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillText(G.saved ? 'Your kingdom is saved at Day ' + (G.saved.night + 1) + '.  Hold SPACE for 2 seconds to start a new kingdom instead.' : 'Progress is saved at the start of every day.', W / 2, 508);
  ctx.fillStyle = '#9fb0d8'; ctx.font = 'italic 11px "Trebuchet MS", sans-serif'; ctx.fillText('To erase all game data, stand on the red RESET GAME spot in the far bottom-right corner of the map.', W / 2, 528);
  const prompt = G.saved ? (G.newHold > 0 ? 'Starting a new kingdom... ' + Math.ceil(2 - G.newHold) : 'to continue from Day ' + (G.saved.night + 1)) : 'to begin';
  ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
  const pw = ctx.measureText(prompt).width, kw = G.newHold > 0 ? 0 : 4 * 34 + 52, total = kw + pw, sx = W / 2 - total / 2;
  if (!(G.newHold > 0)) {
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffe9a8'; ctx.fillText('Move', sx, 566);
    ['W', 'A', 'S', 'D'].forEach((k, i) => keyCap(sx + 50 + i * 34, 546, 30, k, 'Key' + k));
    ctx.font = 'bold 18px "Trebuchet MS", sans-serif'; ctx.fillStyle = 'rgba(255,233,168,' + (0.7 + Math.sin(G.t * 4) * 0.3) + ')'; ctx.fillText(' ' + prompt, sx + 50 + 4 * 34, 566);
  } else { ctx.fillStyle = '#ffe9a8'; ctx.fillText(prompt, W / 2, 566); }
  ctx.textAlign = 'left';
}

// ---------- Input & loop ----------
function begin() {
  if (G.phase === 'title') {
    const saved = G.saved !== undefined ? G.saved : loadSaved();
    if (saved && (G.newHold || 0) <= 0.15) { restoreDay(saved); return; }
    G.phase = 'day'; G.t = 0; saveDay();
    LINES.intro.forEach((l, i) => setTimeout(() => { if (G.phase === 'day') say(queen(), l, 5); }, 600 + i * 5400));
    setTimeout(() => { if (G.phase === 'day' && G.night === 0) say(queen(), NIGHTS[0].hint, 8); }, 17000);
  } else if (G.phase === 'lose' && G.endT > 1.5 && G.save) { restoreDay(G.save); }
  else if ((G.phase === 'win' || G.phase === 'lose') && G.endT > 1.5) { newGame(); G.saved = null; begin(); }
}
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (MOVE_KEYS.includes(e.code) || e.code === 'Enter') { if (G.phase !== 'title' || !(G.newHold > 0)) begin(); }
  if (e.code === 'KeyM') setMuted(!muted);
  if (G.phase !== 'title' && (e.code === 'KeyH' || e.code === 'Slash')) toggleHelp();
  else if (G.help && e.code === 'Escape') toggleHelp(false);
  startMusic();
});
function canvasPos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
cv.addEventListener('mousemove', e => { mouse = canvasPos(e); cv.style.cursor = helpBtnShown() && overHelpBtn(mouse.x, mouse.y) ? 'pointer' : 'default'; });
cv.addEventListener('mouseleave', () => { mouse = { x: -1, y: -1 }; });
cv.addEventListener('mousedown', e => {
  const m = canvasPos(e);
  if (G.help) toggleHelp(false);
  else if (helpBtnShown() && overHelpBtn(m.x, m.y)) toggleHelp(true);
  startMusic();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

let last = performance.now(), acc = 0;
const STEP = 1 / 60;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000); last = now;
  if (!G.paused && !G.help) while (acc >= STEP) { for (let i = 0; i < G.speed; i++) update(STEP); acc -= STEP; }
  else acc = 0;
  render();
  if (G.paused) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', W / 2, H / 2); ctx.textAlign = 'left'; }
  requestAnimationFrame(frame);
}
function boot() {
  TERRAIN_CV = buildTerrain(); BLOCK = buildBlockMask();
  loadSprites(); newGame(); G.saved = loadSaved();
  window.CT = { get G() { return G; }, update, startNight, begin, newGame, computePads, render, recomputeMods };
  requestAnimationFrame(frame);
}
boot();
