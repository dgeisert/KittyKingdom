// ============================================================
//  KITTY KINGDOM — game logic
// ============================================================
'use strict';

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
let TERRAIN_CV = null, BLOCK = null;
const keys = {};
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

// ---------- Audio (tiny synth) ----------
let AC = null, muted = false;
// ---------- Music ----------
const MUSIC_SRC = (typeof MUSIC_DATA !== 'undefined') ? MUSIC_DATA : 'Paw%20Patrol%20Protocol.mp3';
let music = null;
function startMusic() {   // browsers only allow audio after the first key press
  try {
    if (!music) { music = new Audio(MUSIC_SRC); music.loop = true; music.volume = 0.18; }
    music.muted = muted;
    if (music.paused) music.play().catch(() => { });
  } catch (e) { }
}
function setMuted(m) { muted = m; if (music) music.muted = m; }
function sfx(type) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    const S = {
      coin: ['square', 988, 1319, 0.08, 0.04], build: ['triangle', 523, 1046, 0.25, 0.09], upgrade: ['triangle', 392, 1175, 0.4, 0.1],
      bell: ['sine', 880, 440, 1.4, 0.18], hit: ['square', 180, 90, 0.06, 0.025], boom: ['sawtooth', 120, 30, 0.35, 0.1],
      shoot: ['triangle', 900, 600, 0.05, 0.02], meow: ['sine', 700, 1100, 0.18, 0.05], dawn: ['sine', 523, 784, 0.8, 0.1], bad: ['square', 200, 140, 0.15, 0.04],
      dash: ['sawtooth', 300, 900, 0.15, 0.05], zap: ['square', 1400, 500, 0.08, 0.03],
    }[type];
    if (!S) return;
    o.type = S[0]; o.frequency.setValueAtTime(S[1], t); o.frequency.exponentialRampToValueAtTime(S[2], t + S[3]);
    g.gain.setValueAtTime(S[4], t); g.gain.exponentialRampToValueAtTime(0.0001, t + S[3]);
    o.start(t); o.stop(t + S[3] + 0.02);
  } catch (e) { }
}

// ---------- stat helpers ----------
function finalize(s, deep) {
  for (const k of Object.keys(s)) {
    const b = k.slice(0, -3);
    if ((k.endsWith('Mul') || k.endsWith('Add')) && typeof s[b] === 'number') {
      s[b] = k.endsWith('Mul') ? s[b] * s[k] : s[b] + s[k]; delete s[k];
    } else if (k.endsWith('Add') && s[b] == null) { s[b] = s[k]; delete s[k]; }
  }
  if (deep) for (const k of deep) if (s[k]) finalize(s[k]);
  return s;
}
const M = (k, d) => (G.mod[k] == null ? (d == null ? 1 : d) : G.mod[k]);
const DEF_MOD = () => ({
  auto: { style: 'yarn', dmg: 6, cd: 0.7, range: 125, multi: 1, splash: 0 },
  dash: { dist: 85, dmg: 22, splash: 40, cd: 5 },
  squad: { count: 4, hp: 40, dmg: 3, cd: 0.8, range: 0, spd: 128, respawn: 14 },
});

// ---------- State ----------
let G;
function newGame() {
  G = {
    phase: 'title', night: 0, gold: START_GOLD, t: 0, nightBlend: 0, speed: 1, endT: 0,
    plots: {}, mod: DEF_MOD(), cam: { x: CASTLE.x - W / 2, y: CASTLE.y - H / 2 + 40 },
    leader: null, followers: [], units: [], decoys: [], enemies: [], proj: [], fx: [], pools: [], bubbles: [], bubbleQ: [],
    spawns: [], nightT: 0, seen: {}, hold: { key: null, p: 0, done: false }, pads: [], panel: null,
    chatT: 8, nightChatT: 8, castleHitT: 0, lowHpT: 0, msg: null, stats: { kills: 0 }, bounty: 0, nextId: 1, dmgLog: {},
  };
  const names = { house: ['Old Tom', 'Biscuit', 'Mochi', 'Pepper', 'Noodle', 'Luna', 'Ziggy', 'Waffles'], tower: ['Scout Nibbles', 'Pip', 'Marmalade', 'Clawdia', 'Sir Paws', 'Bean', 'Hazelnut', 'Dot'], farm: ['Farmer Butterbean', 'Farmer Clover', 'Farmer Sprout', 'Farmer Hay', 'Farmer Fig'] };
  const cnt = {};
  for (const d of PLOTS) {
    const p = { ...d, built: false, path: [], s: null, hp: 0, maxHp: 0, alive: true, cd: rand(0, 1), auraT: 0, kind: 'building', r: TREES[d.type].r };
    cnt[d.type] = (cnt[d.type] || 0) + 1;
    p.speaker = SPEAKERS[d.type] || HALL_SPEAKERS[d.id] || (names[d.type] ? names[d.type][(cnt[d.type] - 1) % names[d.type].length] : null);
    G.plots[d.id] = p;
  }
  G.leader = { kind: 'leader', x: CASTLE.x, y: CASTLE.y + 70, r: 9, hp: 100, maxHp: 100, cd: 0, dead: 0, flip: false, moving: false, dashCd: 0, dash: null, slowT: 0, target: null, hurtT: 0, shield: 0, invulnT: 0, swipes: 0, rallyT: 0 };
  // the castle starts as rubble: only the bell stands until the King earns enough to rebuild it
}
function plots() { return Object.values(G.plots); }
function tier(p) { return p.built ? p.path.length + 1 : 0; }
function castleTier() { return tier(G.plots.castle); }
// spots only appear once the castle reaches their level (at castle level 0 only the bell and castle site exist)
function plotVisible(p) { return p.type === 'castle' || (castleTier() >= 1 && p.req <= castleTier()); }
function plotUnlocked(p) { return p.req <= castleTier() && (!p.needs || (G.plots[p.needs] && G.plots[p.needs].built)); }
const BELL_SPK = { kind: 'npc', type: 'bell', x: BELL.x, y: BELL.y, speaker: QUEEN_NAME(), alive: true };
function QUEEN_NAME() { return 'Queen Purrsephone'; }
function queen() { return G.plots.castle.built ? G.plots.castle : BELL_SPK; }
function castleNextCost() { const c = G.plots.castle; if (!c.built) return cost(c, 0); return c.path.length < 3 ? cost(c, c.path.length + 1) : null; }
function castleHow(need) {
  const have = castleTier(), c = castleNextCost();
  return ['Needs Castle level ' + need + ' (yours is level ' + have + ').',
    have === 0 ? 'Rebuild the Castle in the middle of the kingdom first' + (c ? ' (' + c + ' gold).' : '.')
      : 'Walk to the Castle and buy its next upgrade' + (c ? ' (' + c + ' gold)' : '') + '. Every Castle upgrade adds 1 level.'];
}
// why an empty building spot can't be built yet (null = it can)
function plotLock(p) {
  if (p.req > castleTier()) return { title: TREES[p.type].name + ' is locked', lines: castleHow(p.req) };
  if (p.needs && !(G.plots[p.needs] && G.plots[p.needs].built)) return { title: 'Catnip Farm is locked', lines: ['Farms need a Windmill to grind the catnip.', 'Build the Windmill first (west of the castle, beside the fields).'] };
  return null;
}

// ---------- building stats & global mods ----------
function refreshPlot(p) {
  const s = finalize(nodeStats(p.type, p.path), ['unit']);
  if (s.unit) finalize(s.unit, []);
  p.s = s;
}
function recomputeMods() {
  const m = DEF_MOD();
  for (const p of plots()) if (p.built) {
    if (p.s.global) mergeFx(m, p.s.global);
    if (p.s.auto) mergeFx(m.auto, p.s.auto);
    if (p.s.dash) mergeFx(m.dash, p.s.dash);
    if (p.s.squad) mergeFx(m.squad, p.s.squad);
  }
  const res = G.plots.library && G.plots.library.research ? 1 + 0.06 * G.plots.library.research : 1;
  if (res > 1) for (const k of ['towerDmgMul', 'unitDmgMul', 'unitHpMul', 'kingDmgMul', 'kingHpMul', 'bldHpMul']) m[k] = (m[k] == null ? 1 : m[k]) * res;
  finalize(m.auto); finalize(m.dash); finalize(m.squad);
  m.dash.cd = Math.max(1, m.dash.cd);
  G.mod = m;
  for (const p of plots()) if (p.built) {
    const ratio = p.maxHp ? p.hp / p.maxHp : 1;
    p.maxHp = Math.round((p.s.hp + (p.type === 'farm' ? M('farmHpAdd', 0) : 0)) * M('bldHpMul')); p.hp = Math.max(1, p.maxHp * ratio);
  }
  const L = G.leader, r = L.maxHp ? L.hp / L.maxHp : 1;
  L.maxHp = Math.round(100 * M('kingHpMul')); L.hp = L.maxHp * r;
  syncSquad();
  for (const p of plots()) if (p.built && p.s.unit) syncUnits(p);
}
function buildPlot(p, silent) {
  p.built = true; p.path = []; p.alive = true;
  refreshPlot(p); p.maxHp = p.s.hp; p.hp = p.s.hp;
  recomputeMods(); p.hp = p.maxHp;
  if (!silent) {
    burst(p.x, p.y - 10, '#fff2a8', 14); sfx('build');
    const l = LINES.built[p.type]; if (l) say(p, pick(l));
  }
}
function upgradePlot(p, id) {
  if (id === 'R') { p.research = (p.research || 0) + 1; recomputeMods(); burst(p.x, p.y - 30, '#ffd34d', 24); sfx('upgrade'); say(p, 'Research complete! The whole kingdom grows stronger.'); return; }
  p.path.push(id); refreshPlot(p);
  const before = p.maxHp; recomputeMods(); p.hp = p.maxHp;
  const n = treeNodes(p.type, p.path).pop();
  burst(p.x, p.y - 30, n.id[0] === 'F' ? '#ffd34d' : OPT_COL[(n.id.charCodeAt(0) - 65)], 20); sfx('upgrade');
  if (p.type === 'castle') say(p, pick(LINES.queenUpgrade) + ' (' + n.name + ')');
  else if (p.speaker) say(p, pick(LINES.upgraded).replace('{n}', n.name));
}
// endless late-game sink: the finished Grand Library keeps researching kingdom-wide boosts
function researchOption(p) { const n = p.research || 0; return { id: 'R', name: 'Kingdom Research ' + (n + 1), desc: 'All towers, cats, buildings and the King +6% damage and HP. Can be repeated.', research: true }; }
function researchCost(p) { return 25 + 15 * (p.research || 0); }
function cost(p, t) { // t: 0 build, 1 level 2, 2 level 3, 3 level 4
  if (t >= 4) return researchCost(p);
  const base = TREES[p.type].cost[t];
  return Math.max(1, base - M('costReduceAdd', 0));
}
// the level this building would reach with its next upgrade, and the castle level that requires
function castleNeeded(p) {
  if (p.type === 'castle' || p.path.length >= 3) return 0;
  const next = p.path.length + 2;
  return next === 2 ? (EARLY_UPGRADE[p.type] ? 0 : 2) : next;
}
function lockReason(p) {
  const need = castleNeeded(p);
  return castleTier() < need ? 'Level ' + (p.path.length + 2) + ' upgrades need Castle level ' + need : null;
}
function lockLines(p) { return castleHow(castleNeeded(p)); }

// ---------- Units ----------
function unitStats(u) {
  if (u.role === 'squad') {
    const q = G.mod.squad;
    return { role: 'squad', hp: q.hp * M('followerHpMul') * M('unitHpMul'), dmg: q.dmg * M('followerDmgMul') * M('unitDmgMul'), cd: q.cd * M('followerCdMul') * M('unitCdMul'), range: q.range || 0,
      proj: q.proj || 'arrow', splash: q.splash || 0, spd: q.spd * M('followerSpdMul'), heal: q.heal || 0, armor: q.armor || 1, assassin: q.assassin || 1, leash: 150 };
  }
  const t = G.plots[u.home].s.unit, s = { ...t };
  s.hp = t.hp * M('unitHpMul');
  s.dmg = (t.dmg || 0) * M('unitDmgMul') * (t.range ? M('rangedDmgMul') : 1);
  s.cd = (t.cd || 1) * M('unitCdMul');
  return s;
}
function syncSquad() {
  const want = G.plots.den && G.plots.den.built ? Math.round(G.mod.squad.count + M('followerAdd', 0)) : 0;
  const coats = [['grey', 'sword'], ['black', 'shield'], ['white', 'spear'], ['calico', 'axe'], ['orange', 'sword'], ['brown', 'shield'], ['siamese', 'spear']];
  while (G.followers.length < want) {
    const i = G.followers.length, c = coats[i % coats.length];
    G.followers.push({ kind: 'unit', role: 'squad', coat: c[0], item: c[1], spriteKey: 'cat_follower_' + ((i % 4) + 1), slot: i, x: G.leader.x + rand(-12, 12), y: G.leader.y + 14, r: 7, hp: 1, maxHp: 1, cd: 0, dead: 0, flip: false, moving: false, hurtT: 0, hcd: 0 });
  }
  if (G.followers.length > want) G.followers.length = want;
  for (const u of G.followers) { u.S = unitStats(u); const r = u.maxHp > 1 ? u.hp / u.maxHp : 1; u.maxHp = u.S.hp; u.hp = u.S.hp * r; }
}
function syncUnits(p) {
  const want = Math.round(p.s.unit.count + (p.s.unit.countAdd || 0));
  const mine = G.units.filter(u => u.home === p.id);
  for (let i = mine.length; i < want; i++) {
    const u = { kind: 'unit', role: p.s.unit.role, home: p.id, idx: i, x: p.x + rand(-10, 10), y: p.y + 16, r: 7, hp: 1, maxHp: 1, cd: rand(0, 1), hcd: 0, dead: 0, flip: false, moving: false, hurtT: 0 };
    G.units.push(u); mine.push(u);
  }
  for (const u of mine.slice(want)) G.units.splice(G.units.indexOf(u), 1);
  for (const u of G.units) if (u.home === p.id) { u.role = p.s.unit.role; u.S = unitStats(u); const r = u.maxHp > 1 ? u.hp / u.maxHp : 1; u.maxHp = u.S.hp; u.hp = u.S.hp * r; }
}
function guardPos(u) {
  const p = G.plots[u.home];
  const g = p.guard || [p.x, p.y + 36];
  const n = Math.max(1, G.units.filter(v => v.home === u.home).length);
  const a = (u.idx / n) * Math.PI * 2, rr = n <= 1 ? 0 : 12 + 5 * Math.floor(u.idx / 5);
  return [g[0] + Math.cos(a) * rr, g[1] + Math.sin(a) * rr * 0.7];
}

// ---------- Speech bubbles ----------
function say(p, text, dur) {
  if (!p || !text) return;
  if (G.bubbles.some(b => b.text === text) || G.bubbleQ.some(b => b.text === text)) return;
  const b = { src: p, name: p.speaker || 'Cat', text, t: 0, dur: dur || Math.max(3.2, text.length * 0.065) };
  if (G.bubbles.length < 3 && !G.bubbles.some(x => x.src === p)) { G.bubbles.push(b); sfx('meow'); }
  else if (G.bubbleQ.length < 5) G.bubbleQ.push(b);
}
function nearestSpeaker(x, y) {
  let best = null, bd = 1e9;
  for (const p of plots()) if (p.built && p.alive && p.speaker) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } }
  return best;
}

// ---------- Pads (build / upgrade points) & side panel ----------
function wallMid(p) { return { x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 }; }
const PAD_OFFS = { castle: [[-66, 14], [0, 58], [66, 14]], large: [[-36, 16], [0, 36], [36, 16]], small: [[-28, 12], [0, 28], [28, 12]] };
function padPos(p, i) {
  if (p.type === 'wall') {
    const c = wallMid(p), dx = CASTLE.x - c.x, dy = CASTLE.y - c.y, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
    return { x: c.x + ux * 30 - uy * (i - 1) * 30, y: c.y + uy * 30 + ux * (i - 1) * 30 };
  }
  const R = PAD_OFFS[p.type === 'castle' ? 'castle' : p.r >= 20 ? 'large' : 'small'];
  return { x: p.x + R[i][0], y: p.y + R[i][1] };
}
function upgradeOptions(p) {
  const T = TREES[p.type];
  if (p.built && p.type === 'library' && p.path.length >= 3) return [researchOption(p)];
  if (!p.built || p.path.length >= 3) return [];
  if (p.path.length === 2) return T.final;
  return p.path.length === 0 ? T.opts : T.opts.find(o => o.id === p.path[0]).kids;
}
function computePanel() {
  const L = G.leader, cur = G.panel;
  // stay on the current building while the King stands on / next to one of its upgrade points
  if (cur && cur.built && upgradeOptions(cur).length) for (let i = 0; i < 3; i++) { const pp = padPos(cur, i); if (Math.hypot(pp.x - L.x, pp.y - L.y) < 30) return cur; }
  let best = null, bd = 1e9;
  for (const p of plots()) {
    if (!plotVisible(p)) continue;
    const c = p.type === 'wall' ? wallMid(p) : p, d = Math.hypot(c.x - L.x, c.y - L.y) - (p.built ? 0 : 20);
    const lim = p.built ? (p.type === 'castle' ? 200 : 150) : 60;
    if (d < lim && d < bd) { bd = d; best = p; }
  }
  return best;
}
function computePads() {
  const pads = [];
  for (const p of plots()) {
    if (!plotVisible(p) || p.built || !plotUnlocked(p)) continue;
    const c = p.type === 'wall' ? wallMid(p) : p;
    pads.push({ key: p.id + ':build', x: c.x, y: c.y, plot: p, cost: cost(p, 0), label: 'Build ' + TREES[p.type].name, desc: TREES[p.type].blurb, act: () => buildPlot(p), big: true });
  }
  // upgrade points only for the building shown in the side panel
  const p = G.panel;
  if (p && p.built) {
    // only offer what is available right now: no pads while the castle level locks the next upgrade
    const opts = lockReason(p) ? [] : upgradeOptions(p);
    opts.forEach((o, i) => {
      const slot = opts.length === 2 ? i * 2 : i;
      const pp = padPos(p, slot);
      pads.push({ key: p.id + ':' + o.id, x: pp.x, y: pp.y, plot: p, node: o, idx: i, cost: cost(p, p.path.length + 1), label: o.name, desc: o.desc, col: OPT_COL[slot], act: () => upgradePlot(p, o.id) });
    });
  }
  pads.push({ key: 'reset', x: RESET_SPOT.x, y: RESET_SPOT.y, cost: 0, label: 'Erase all game data', desc: 'Deletes your saved kingdom and restarts from Day 1', hold: 3, reset: true, act: resetAllData });
  pads.push({ key: 'bell', x: BELL.x, y: BELL.y + 8, cost: 0, label: 'Ring the Night Bell', desc: 'Start night ' + (G.night + 1) + ': ' + NIGHTS[G.night].name, icon: 'bell', hold: 1.0, act: startNight });
  return pads;
}
const SPAWN_ANCHORS = { E: [1380, 490], NE: [1290, 150], S: [905, 930], SEA: [150, 880], AIRN: [680, 120], AIRW: [130, 420] };
function laneGroups(lane) {
  const N = NIGHTS[G.night]; if (!N) return [];
  const m = {};
  for (const g of N.groups) if (g[2] === lane) { const k = g[0] + (g[5] ? '*' : ''); m[k] = m[k] || { type: g[0], elite: !!g[5], count: 0 }; m[k].count += g[1]; }
  return Object.values(m);
}
function computeLanePanel() {
  const L = G.leader; let best = null, bd = 260;
  for (const lane in SPAWN_ANCHORS) { const [ax, ay] = SPAWN_ANCHORS[lane], d = Math.hypot(ax - L.x, ay - L.y); if (d < bd && laneGroups(lane).length) { bd = d; best = lane; } }
  return best ? { lane: best, d: bd } : null;
}
function updatePads(dt) {
  G.panel = computePanel();
  const lp = computeLanePanel();
  G.lanePanel = null;
  if (lp) { const pd = G.panel ? Math.hypot((G.panel.type === 'wall' ? wallMid(G.panel) : G.panel).x - G.leader.x, (G.panel.type === 'wall' ? wallMid(G.panel) : G.panel).y - G.leader.y) : 1e9; if (lp.d < pd || lp.d < 170) { G.lanePanel = lp.lane; G.panel = null; } }
  G.resetPanel = Math.hypot(RESET_SPOT.x - G.leader.x, RESET_SPOT.y - G.leader.y) < 80;
  if (G.resetPanel) { G.panel = null; G.lanePanel = null; }
  G.pads = computePads();
  const L = G.leader;
  let on = null;
  if (!L.dead) for (const pd of G.pads) if (Math.hypot(pd.x - L.x, pd.y - L.y) < PAD_R + (pd.big ? 8 : 5)) { on = pd; break; }
  const H = G.hold;
  if (!on) { H.key = null; H.p = 0; H.done = false; return; }
  if (H.key !== on.key) { H.key = on.key; H.p = 0; H.done = false; }
  if (H.done || on.locked) return;
  if (G.gold < on.cost) { H.p = 0; return; }
  const need = on.hold || (on.key.endsWith(':build') ? HOLD_BUILD : HOLD_UPGRADE);
  const before = H.p; H.p += dt;
  const f0 = Math.floor(before / need * on.cost), f1 = Math.floor(H.p / need * on.cost);
  for (let i = f0; i < Math.min(f1, on.cost); i++) { G.fx.push({ type: 'coinfly', x: L.x, y: L.y - 22, tx: on.x, ty: on.y, t: 0, dur: 0.35 }); sfx('coin'); }
  if (H.p >= need) { H.done = true; H.p = 0; if (G.gold >= on.cost) { G.gold -= on.cost; on.act(); } else sfx('bad'); }
}

// ---------- Daily save (taken at the start of every day) ----------
const SAVE_KEY = 'cattower_save_v1';
function snapshot() {
  const plotsS = {};
  for (const p of plots()) if (p.built) plotsS[p.id] = { path: p.path.slice(), research: p.research || 0 };
  return { v: 1, night: G.night, gold: G.gold, seen: { ...G.seen }, kills: G.stats.kills, bounty: G.bounty, plots: plotsS };
}
function saveDay() {
  G.save = snapshot();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) { }
}
function loadSaved() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function resetAllData() {
  clearSave();
  try { for (const k of Object.keys(localStorage)) if (k.startsWith('cattower')) localStorage.removeItem(k); } catch (e) { }
  newGame(); G.saved = null; begin();
  G.msg = { text: 'All game data erased. A new kingdom begins!', t: 0 };
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
function restoreDay(snap) {
  newGame();
  for (const id in snap.plots) { const p = G.plots[id]; if (!p) continue; p.built = true; p.path = snap.plots[id].path.slice(); p.research = snap.plots[id].research || 0; refreshPlot(p); p.maxHp = p.hp = p.s.hp; }
  recomputeMods();
  for (const p of plots()) if (p.built) p.hp = p.maxHp;
  for (const u of G.units.concat(G.followers)) u.hp = u.maxHp;
  G.night = snap.night; G.gold = snap.gold; G.seen = { ...snap.seen }; G.stats.kills = snap.kills || 0; G.bounty = snap.bounty || 0;
  G.phase = 'day'; G.t = 60; G.save = snap;
  G.leader.x = CASTLE.x; G.leader.y = CASTLE.y + 70;
  G.msg = { text: 'Day ' + (G.night + 1) + ' — try again!', t: 0 };
  G.hintT = 2;
}

// ---------- Night flow ----------
function startNight() {
  if (G.phase !== 'day') return;
  G.phase = 'night'; G.nightT = 0; G.spawns = []; G.panel = null; G.lanePanel = null; G.batteryMsg = false;
  sfx('bell');
  const N = NIGHTS[G.night];
  for (const g of N.groups) for (let i = 0; i < g[1]; i++) G.spawns.push({ type: g[0], lane: g[2], at: g[3] + i * g[4], elite: !!g[5] });
  G.spawns.sort((a, b) => a.at - b.at);
  for (const p of plots()) p.rebuilt = false;
  say(queen(), pick(LINES.queenNight));
  G.msg = { text: 'Night ' + (G.night + 1) + ': ' + N.name, t: 0 };
}
function spawnEnemy(s) {
  const def = ENEMIES[s.type];
  let x, y;
  if (s.lane.startsWith('AIR')) { const p = pick(AIR[s.lane]); x = p[0] + rand(-40, 40); y = p[1] + rand(-20, 20); }
  else { const p = LANES[s.lane][0]; x = p[0] + rand(-8, 8); y = p[1] + rand(-8, 8); }
  const sc = nightScale(G.night + 1);
  const hp = def.hp * (s.elite ? 4 : 1) * M('enemyHpMul') * sc.hp;
  const e = { id: G.nextId++, kind: 'enemy', type: s.type, def, x, y, hp, maxHp: hp, r: def.r, lane: s.lane, wp: 1, cd: rand(0, def.cd), elite: s.elite,
    ox: rand(-12, 12), oy: rand(-12, 12), target: null, retarget: 0, slowT: 0, slowAmt: 0, stunT: 0, vulnT: 0, vulnAmt: 0, bleedT: 0, bleed: 0, auraSlow: 0,
    power: sc.dmg, burrowed: !!def.burrow, flip: false, t: rand(0, 5), hurtT: 0, suckT: 4, spawnT: 6 };
  G.enemies.push(e);
  if (!G.seen[s.type]) {
    G.seen[s.type] = true;
    const sp = nearestSpeaker(clamp(x, 80, WW - 80), clamp(y, 80, WH - 80)) || queen();
    if (LINES.firstSight[s.type]) say(sp, LINES.firstSight[s.type], 3.6);
  }
}
function dawnIncome() {
  const houses = plots().filter(p => p.built && p.type === 'house').length, towers = plots().filter(p => p.built && p.type === 'tower').length, farms = plots().filter(p => p.built && p.type === 'farm').length;
  let inc = 0;
  for (const p of plots()) if (p.built && p.alive) inc += (p.s.income || 0) + (p.s.perHouse || 0) * houses + (p.s.perTower || 0) * towers + (p.s.perFarm || 0) * farms;
  inc = Math.round(inc * M('incomeMul'));
  const interest = Math.min(10, Math.floor(G.gold * M('interest', 0)));
  const bounty = Math.floor(G.bounty); G.bounty -= bounty;
  return { inc, interest, bounty };
}
function endNight() {
  const N = NIGHTS[G.night];
  if (N.final) { clearSave(); G.phase = 'win'; G.endT = 0; say(queen(), LINES.victory, 8); sfx('dawn'); return; }
  const r = dawnIncome(), total = r.inc + r.interest + r.bounty + N.reward;
  G.gold += total;
  for (const p of plots()) if (p.built) { p.alive = true; p.hp = p.maxHp; p.complained = false; }
  for (const u of G.units.concat(G.followers)) { u.dead = 0; u.hp = u.maxHp; }
  for (const u of G.units) { const [gx, gy] = guardPos(u); u.x = gx; u.y = gy; }
  const L = G.leader; L.dead = 0; L.hp = L.maxHp; L.shield = 0;
  G.night++; G.phase = 'day'; G.proj = []; G.pools = []; G.decoys = [];
  sfx('dawn');
  G.msg = { text: 'Dawn! +' + total + ' gold', t: 0 };
  saveDay();
  say(queen(), pick(LINES.queenDawn));
  G.hintT = 3.5;
}

// ---------- Combat helpers ----------
function friendlyTargets() {
  const out = [];
  for (const p of plots()) if (p.built && p.alive) out.push(p);
  for (const u of G.followers) if (!u.dead) out.push(u);
  for (const u of G.units) if (!u.dead) out.push(u);
  for (const d of G.decoys) out.push(d);
  if (!G.leader.dead) out.push(G.leader);
  return out;
}
function edgeDist(a, t) {
  if (t.type === 'wall') return distSeg(a.x, a.y, t.x1, t.y1, t.x2, t.y2) - 6;
  return Math.hypot(a.x - t.x, a.y - t.y) - t.r;
}
function isAlive(t) {
  if (!t) return false;
  if (t.kind === 'building') return t.built && t.alive;
  if (t.kind === 'enemy') return t.hp > 0;
  if (t.kind === 'decoy') return t.hp > 0 && t.t > 0;
  return !t.dead;
}
function wardedBy(t) { for (const u of G.units) if (!u.dead && u.S && u.S.ward && Math.hypot(u.x - t.x, u.y - t.y) < 80) return u.S.ward; return 1; }
function hurtFriendly(t, amt, e, ranged) {
  if (!isAlive(t)) return;
  const d = e && e.def;
  if (d) {
    if (d.halfVsUnits && t.kind !== 'building') amt *= 0.5;
    if (d.vsUnits && t.kind !== 'building') amt *= d.vsUnits;
    if (d.vsTowers && t.type === 'tower') amt *= d.vsTowers;
    if (d.bonusLeader && t.kind === 'leader') amt += d.bonusLeader;
    if (d.antiMelee && t.kind === 'unit' && !(t.S && t.S.range)) amt *= 0.5;
    if (e.elite) amt *= 3;
    if (e.power) amt *= e.power;
  }
  if (t.kind === 'building') {
    amt *= M('bldArmor') * wardedBy(t);
    if (ranged && t.s.rangedArmor) amt *= t.s.rangedArmor;
    if (ranged) for (const m of plots()) if (m.built && m.alive && m.s.wind && Math.hypot(m.x - t.x, m.y - t.y) < m.s.windR) { amt *= m.s.wind; break; }
    if (!ranged && t.s.thorns && e && e.hp > 0) hurtEnemy(e, t.s.thorns, { thorns: true });
  } else if (t.kind === 'unit') {
    const S = t.S || {};
    if (S.dodge && Math.random() < S.dodge) { G.fx.push({ type: 'txt', x: t.x, y: t.y - 26, t: 0, dur: 0.6, txt: 'dodge', col: '#cfe' }); return; }
    if (S.armor) amt *= S.armor;
    if (ranged && S.rangedArmor) amt *= S.rangedArmor;
    if (t.armorT > 0) amt *= t.armorBuff;
  } else if (t.kind === 'leader') {
    if (t.invulnT > 0) return;
    if (t.shield > 0) { const a = Math.min(t.shield, amt); t.shield -= a; amt -= a; if (amt <= 0) return; }
    if (G.lowHpT <= 0 && t.hp - amt < t.maxHp * 0.3) { say(queen(), pick(LINES.queenLowHp)); G.lowHpT = 20; }
  }
  if (e && e.type) { const k = e.type + '>' + (t.kind === 'building' ? t.type : t.kind); G.dmgLog[k] = (G.dmgLog[k] || 0) + amt; }
  t.hp -= amt; t.hurtT = 0.15;
  if (t.kind === 'building') {
    if (t.type === 'castle' && G.castleHitT <= 0) { say(t, pick(LINES.queenCastleHit)); G.castleHitT = 14; }
    else if (t.hp < t.maxHp * 0.5 && !t.complained && t.speaker) { t.complained = true; say(t, pick(t.type === 'tower' ? LINES.towerHit : LINES.houseHit)); }
  }
  if (t.hp <= 0) killFriendly(t);
}
function killFriendly(t) {
  if (t.kind === 'building') {
    t.alive = false; t.hp = 0;
    burst(t.x, t.y - 10, '#9b8f7c', 18); sfx('boom');
    if (t.s.deathBlast) splashEnemies(t.x, t.y, 95, t.s.deathBlast, { tower: true });
    if (t.type === 'castle') { G.phase = 'lose'; G.endT = 0; say(t, LINES.defeat, 10); }
  } else if (t.kind === 'leader' && !G.plots.castle.built) { t.dead = 99; t.hp = 0; G.phase = 'lose'; G.endT = 0; G.loseWhy = 'king'; burst(t.x, t.y - 10, '#f0a04b', 12); }
  else if (t.kind === 'leader') { t.dead = 7 * M('kingRespawnMul'); t.hp = 0; burst(t.x, t.y - 10, '#f0a04b', 12); }
  else if (t.kind === 'decoy') { t.hp = 0; }
  else { t.dead = (t.role === 'squad' ? (G.mod.squad.respawn) * M('followerRespawnMul') : 12 * M('respawnMul')); t.hp = 0; burst(t.x, t.y - 8, '#ccc', 8); }
}
function hurtEnemy(e, amt, src) {
  if (e.hp <= 0) return;
  if (e.burrowed && !src.detect && !src.thorns) return;
  const d = e.def;
  if (src.ranged && d.armorRanged && !src.pierceArmor) amt *= 0.5;
  if (d.fly && src.airMul != null) amt *= src.airMul;
  if (d.fam === 'siege' && src.siegeMul != null) amt *= src.siegeMul;
  if (d.sea && src.seaMul) amt *= src.seaMul;
  if (src.leader && d.armorLeader) amt *= 0.6;
  if (src.melee && d.antiMelee) amt *= 0.5;
  if (src.magic) amt *= M('magicDmgMul');
  if (src.fastMul && d.spd >= 9) amt *= src.fastMul;
  if (src.assassin && (d.range || d.fam === 'siege')) amt *= src.assassin;
  if (e.vulnT > 0) amt *= 1 + e.vulnAmt;
  if (src.crit && Math.random() < src.crit) { amt *= 2; G.fx.push({ type: 'txt', x: e.x, y: e.y - 30, t: 0, dur: 0.6, txt: 'crit!', col: '#ffd34d' }); }
  e.hp -= amt; e.hurtT = 0.12;
  if (src.slow) { e.slowT = Math.max(e.slowT, src.slowT || 1.5); e.slowAmt = Math.max(e.slowAmt * (e.slowT > 0 ? 1 : 0), src.slow); }
  if (src.stun && Math.random() < (src.stun >= 1 ? 1 : src.stun)) e.stunT = Math.max(e.stunT, src.stunT || 1);
  if (src.vuln) { e.vulnT = 3; e.vulnAmt = Math.max(e.vulnAmt, src.vuln); }
  if (src.bleed) { e.bleedT = 3; e.bleed = src.bleed; }
  if (src.leader && src.melee && d.slowLeader) { G.leader.slowT = 1.5; hurtFriendly(G.leader, 2, e); }
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.hp = 0; G.stats.kills++; G.bounty += M('bountyAdd', 0);
  burst(e.x, e.y - 10, e.def.fly ? '#cfd6e0' : '#8e98a6', e.def.boss ? 60 : 8);
  if (e.def.explode) explode(e.x, e.y, e.def.explode, e.def.explodeDmg || e.def.dmg, e);
  if (e.def.boss) G.fx.push({ type: 'ring', x: e.x, y: e.y, t: 0, dur: 1.2, r: 160, col: '#ffd34d' });
}
function explode(x, y, R, dmg, e) {
  sfx('boom');
  G.fx.push({ type: 'ring', x, y, t: 0, dur: 0.45, r: R, col: '#ff9b3d' });
  burst(x, y, '#ffb030', 16);
  for (const t of friendlyTargets()) if (edgeDist({ x, y }, t) < R) hurtFriendly(t, dmg, e);
}
function burst(x, y, col, n) { for (let i = 0; i < n; i++) G.fx.push({ type: 'spark', x, y, vx: rand(-60, 60), vy: rand(-90, 10), t: 0, dur: rand(0.3, 0.7), col }); }
function splashEnemies(x, y, R, dmg, src, except) {
  G.fx.push({ type: 'ring', x, y, t: 0, dur: 0.3, r: R, col: src.magic ? '#d6a8ff' : src.slow ? '#9cf' : '#ffb070' });
  for (const e of G.enemies) if (e !== except && e.hp > 0 && Math.hypot(e.x - x, e.y - y) < R + e.r) hurtEnemy(e, dmg, src);
}

// ---------- Projectiles ----------
function shoot(from, to, o) { G.proj.push(Object.assign({ x: from.x, y: from.y, sx: from.x, sy: from.y, target: to, tx: to.x, ty: to.y, speed: 420, t: 0 }, o)); }
function lob(fx, fy, tx, ty, o) { G.proj.push(Object.assign({ x: fx, y: fy, sx: fx, sy: fy, tx, ty, lob: true, t: 0, dur: Math.max(0.45, Math.hypot(tx - fx, ty - fy) / 240) }, o)); }
function chainHit(from, first, n, dmg, src) {
  let cur = first, prev = from; const hit = new Set();
  for (let i = 0; i < n && cur; i++) {
    G.fx.push({ type: 'bolt', x1: prev.x, y1: prev.y, x2: cur.x, y2: cur.y - 10, t: 0, dur: 0.18 });
    hurtEnemy(cur, dmg * Math.pow(0.85, i), src); hit.add(cur);
    prev = { x: cur.x, y: cur.y - 10 };
    cur = nearestEnemy(cur.x, cur.y, 85, e => !hit.has(e));
  }
  sfx('zap');
}
// generic "fire a weapon" used by towers, castle, houses, walls, farms, docks, units, King
function fireWeapon(origin, tg, s, dmg, src) {
  const proj = s.proj || 'arrow', multi = s.multi || 1;
  src = Object.assign({}, src, { airMul: s.airMul, siegeMul: s.siegeMul, seaMul: s.seaMul, pierceArmor: s.pierceArmor || proj === 'magic' || proj === 'chain', magic: proj === 'magic' || proj === 'chain',
    slow: s.slow, slowT: s.slowT, stun: s.stun, stunT: s.stunT, vuln: s.vuln, crit: s.crit, detect: s.detect, fastMul: s.fastMul, assassin: s.assassin });
  if (proj === 'chain') { chainHit(origin, tg, s.chain || 3, dmg, src); return; }
  if (proj === 'beam') { G.fx.push({ type: 'beam', x1: origin.x, y1: origin.y, x2: tg.x, y2: tg.y - 10, t: 0, dur: 0.1 }); hurtEnemy(tg, dmg, src); return; }
  const targets = [tg];
  for (let i = 1; i < multi; i++) { const n = nearestEnemy(origin.x, origin.y + 40, (s.range || 130) * 1.1, e => !targets.includes(e) && (!e.burrowed || s.detect)); targets.push(n || tg); }
  for (const t of targets) {
    if (proj === 'lob') lob(origin.x, origin.y, t.x + rand(-4, 4), t.y + rand(-3, 3), { team: 'friend', dmg, splash: s.splash || 30, burn: s.burn, src, kind: 'shell' });
    else shoot(origin, t, { team: 'friend', dmg, kind: proj, splash: s.splash, burn: s.burn, pierce: s.pierce, bounce: s.bounce, src, speed: proj === 'bolt' || proj === 'harpoon' ? 560 : proj === 'magic' ? 330 : 440 });
  }
  sfx('shoot');
}
function friendImpact(p, tg, x, y) {
  if (p.splash) splashEnemies(x, y, p.splash, p.dmg, p.src);
  else if (tg) hurtEnemy(tg, p.dmg, p.src);
  if (p.pierce) for (const e of G.enemies) if (e !== tg && e.hp > 0 && distSeg(e.x, e.y - 8, p.sx, p.sy, x, y) < e.r + 8) hurtEnemy(e, p.dmg * 0.8, p.src);
  if (p.burn) G.pools.push({ x, y, r: (p.splash || 30) * 0.8, dps: p.burn, slow: p.src.slow || 0, t: 0, dur: 3 });
  if (p.bounce > 0 && tg) { const n = nearestEnemy(x, y, 110, e => e !== tg); if (n) shoot({ x, y }, n, Object.assign({}, p, { target: n, bounce: p.bounce - 1, t: 0, sx: x, sy: y, dead: false })); }
}
function updateProj(dt) {
  for (let i = 0; i < G.proj.length; i++) {
    const p = G.proj[i];
    p.t += dt;
    if (p.lob) {
      const k = p.t / p.dur;
      p.x = p.sx + (p.tx - p.sx) * k; p.y = p.sy + (p.ty - p.sy) * k - Math.sin(k * Math.PI) * 60;
      if (k >= 1) {
        p.dead = true;
        if (p.team === 'friend') friendImpact(p, null, p.tx, p.ty);
        else {
          G.fx.push({ type: 'ring', x: p.tx, y: p.ty, t: 0, dur: 0.35, r: p.splash || 20, col: '#ff6b4a' }); sfx('boom');
          for (const f of friendlyTargets()) if (edgeDist({ x: p.tx, y: p.ty }, f) < (p.splash || 20) && !(p.buildingsOnly && f.kind !== 'building')) hurtFriendly(f, p.dmg, p.src, true);
        }
      }
    } else {
      const tg = p.target, alive = isAlive(tg);
      if (alive) { const tp = tg.type === 'wall' ? { x: tg.x, y: tg.y } : tg; p.tx = tp.x; p.ty = tp.y - (tg.kind === 'building' ? 14 : 10) - (tg.def && tg.def.fly ? 16 : 0); }
      const dx = p.tx - p.x, dy = p.ty - p.y, L = Math.hypot(dx, dy), s = p.speed * dt;
      p.ang = Math.atan2(dy, dx);
      if (L <= s + 2) {
        p.dead = true;
        if (p.team === 'friend') { if (alive || p.splash) friendImpact(p, alive ? tg : null, p.tx, p.ty + 10); }
        else if (alive) {
          if (p.splash) { G.fx.push({ type: 'ring', x: p.tx, y: p.ty + 10, t: 0, dur: 0.3, r: p.splash, col: '#9cf' }); for (const f of friendlyTargets()) if (edgeDist({ x: p.tx, y: p.ty + 10 }, f) < p.splash) hurtFriendly(f, p.src.def.dmg, p.src, true); }
          else hurtFriendly(tg, p.src.def.dmg, p.src, true);
        }
      } else { p.x += dx / L * s; p.y += dy / L * s; }
    }
  }
  G.proj = G.proj.filter(p => !p.dead);
  for (const pl of G.pools) {
    pl.t += dt;
    for (const e of G.enemies) if (!e.def.fly && Math.hypot(e.x - pl.x, e.y - pl.y) < pl.r) { if (pl.dps) hurtEnemy(e, pl.dps * dt, { tower: true }); if (pl.slow) e.auraSlow = Math.max(e.auraSlow, pl.slow); }
  }
  G.pools = G.pools.filter(p => p.t < p.dur);
}

// ---------- Enemy AI ----------
function nearestOf(list, x, y, maxD, filter) {
  let best = null, bd = maxD;
  for (const t of list) { if (filter && !filter(t)) continue; const d = t.type === 'wall' ? distSeg(x, y, t.x1, t.y1, t.x2, t.y2) : Math.hypot(t.x - x, t.y - y) - (t.r || 0); if (d < bd) { bd = d; best = t; } }
  return best;
}
// ---- forward-only lane movement: robots never walk back down their road ----
const LANE_CUM = {};
for (const k in LANES) { const L = LANES[k], c = [0]; for (let i = 1; i < L.length; i++) c.push(c[i - 1] + Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1])); LANE_CUM[k] = c; }
function laneProj(lane, x, y) {
  const L = LANES[lane], C = LANE_CUM[lane]; let best = { s: 0, seg: 0, d: 1e9 };
  for (let i = 0; i < L.length - 1; i++) {
    const [x1, y1] = L[i], [x2, y2] = L[i + 1], dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
    let t = l2 ? ((x - x1) * dx + (y - y1) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t));
    if (d < best.d) best = { s: C[i] + t * Math.sqrt(l2), seg: i, d };
  }
  return best;
}
function laneBound(e) { const d = e.def; return LANES[e.lane] && e.lane !== 'SEA' && !d.fly && !d.sea && !e.burrowed && d.tgt !== 'leader'; }
function pickTarget(e, F) {
  const d = e.def, tgt = d.tgt || 'any', aggro = d.range ? d.range + 25 : 72;
  if (laneBound(e)) {   // only consider things ahead on the road (or level with the robot)
    e.prog = Math.max(e.prog || 0, laneProj(e.lane, e.x, e.y).s);
    F = F.filter(t => { const c = t.type === 'wall' ? wallMid(t) : t; return t.type === 'castle' || laneProj(e.lane, c.x, c.y).s >= e.prog - 30; });
  }
  const bld = t => t.kind === 'building' && t.type !== 'wall';
  if (!d.buildingsOnly) { const dec = nearestOf(G.decoys, e.x, e.y, 220); if (dec) return dec; }
  switch (tgt) {
    case 'castle': if (G.plots.castle.built) return G.plots.castle; break;
    case 'leader': if (!G.leader.dead) return G.leader; break;
    case 'eco': return nearestOf(F, e.x, e.y, 9999, t => t.kind === 'building' && (t.s.income > 0)) || nearestOf(F, e.x, e.y, 9999, bld);
    case 'defense': return nearestOf(F, e.x, e.y, 9999, t => t.type === 'tower' || t.type === 'wall') || nearestOf(F, e.x, e.y, 9999, bld);
    case 'units': return nearestOf(F, e.x, e.y, aggro * 1.8, t => t.kind !== 'building') || nearestOf(F, e.x, e.y, aggro, bld);
    case 'towers': return nearestOf(F, e.x, e.y, 170, t => t.type === 'tower') || nearestOf(F, e.x, e.y, aggro);
    case 'buildings': return nearestOf(F, e.x, e.y, d.fly || d.sea ? 9999 : aggro + (d.buildingsOnly ? 20 : 0), d.buildingsOnly ? (t => t.kind === 'building') : bld);
    case 'random': { const c = F.filter(t => edgeDist(e, t) < d.range); return c.length ? pick(c) : nearestOf(F, e.x, e.y, aggro, bld); }
  }
  return nearestOf(F, e.x, e.y, aggro, t => t.type !== 'wall');
}
function segX(ax, ay, bx, by, cx, cy, dx, dy) {
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (Math.abs(d) < 1e-9) return false;
  const u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, v = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1;
}
let WALLS = [];
function blockingWall(e, gx, gy) {
  const dx = gx - e.x, dy = gy - e.y, L = Math.hypot(dx, dy) || 1, la = e.r + 7;
  const lx = e.x + dx / L * la, ly = e.y + dy / L * la;
  for (const p of WALLS) if (p.built && p.alive && segX(e.x, e.y, lx, ly, p.x1, p.y1, p.x2, p.y2)) return p;
  return null;
}
function enemyAttack(e, t) {
  const d = e.def;
  e.cd = d.cd * (e.slowT > 0 ? 1.4 : 1);
  if (d.explode && !d.explodeDmg && t.kind === 'building') { killEnemy(e); return; }
  if (d.range) {
    const pos = t.type === 'wall' ? { x: t.x, y: t.y } : t;
    const fy = e.y - (d.fly ? 26 : 16);
    if (d.proj === 'shell' || d.proj === 'bomb') lob(e.x, fy, pos.x + rand(-8, 8), pos.y + rand(-6, 6), { team: 'enemy', src: e, dmg: d.dmg * (e.elite ? 3 : 1), splash: d.splash, kind: d.proj, buildingsOnly: d.buildingsOnly });
    else shoot({ x: e.x, y: fy }, t, { team: 'enemy', src: e, dmg: d.dmg, kind: d.proj, splash: d.splash, speed: d.proj === 'rail' ? 520 : 300 });
  } else {
    if (d.splash) { G.fx.push({ type: 'ring', x: e.x, y: e.y, t: 0, dur: 0.25, r: d.splash, col: '#ffffff' }); for (const f of friendlyTargets()) if (edgeDist(e, f) < d.splash) hurtFriendly(f, d.dmg, e); }
    else hurtFriendly(t, d.dmg, e);
    sfx('hit');
  }
}
function updateEnemy(e, dt, F) {
  const d = e.def;
  e.t += dt; e.hurtT -= dt; e.slowT -= dt; e.vulnT -= dt; e.retarget -= dt; e.stunT -= dt;
  if (e.bleedT > 0) { e.bleedT -= dt; hurtEnemy(e, e.bleed * dt, { bleed: 0 }); }
  if (e.stunT > 0) { e.auraSlow = 0; return; }
  e.cd -= dt;
  const slow = Math.max(e.slowT > 0 ? e.slowAmt : 0, e.auraSlow);
  e.auraSlow = 0;
  let spd = d.spd * SPEED_SCALE * (1 - slow) * M('enemySpdMul');
  if (d.boss) {
    e.suckT -= dt; e.spawnT -= dt;
    if (e.suckT <= 0) { e.suckT = 6; G.fx.push({ type: 'ring', x: e.x, y: e.y, t: 0, dur: 0.8, r: 170, col: '#c9a6ff', inward: true }); for (const u of G.followers.concat(G.units, [G.leader])) if (!u.dead && Math.hypot(u.x - e.x, u.y - e.y) < 170) { const a = Math.atan2(e.y - u.y, e.x - u.x); u.x += Math.cos(a) * 45; u.y += Math.sin(a) * 45; hurtFriendly(u, 6, e); } }
    if (e.spawnT <= 0) { e.spawnT = 8; for (let i = 0; i < 3; i++) G.enemies.push({ id: G.nextId++, kind: 'enemy', type: 'scrap', def: ENEMIES.scrap, x: e.x + rand(-30, 30), y: e.y + rand(-10, 20), hp: 8.7, maxHp: 8.7, r: 8, lane: e.lane, wp: e.wp, cd: 1, ox: rand(-10, 10), oy: rand(-10, 10), retarget: 0, slowT: 0, slowAmt: 0, stunT: 0, vulnT: 0, vulnAmt: 0, bleedT: 0, auraSlow: 0, flip: e.flip, t: 0, hurtT: 0 }); }
  }
  if (d.sea) {
    if (!e.target || !isAlive(e.target) || e.retarget <= 0) { e.retarget = 0.5; e.target = nearestOf(F, e.x, e.y, d.range, t => t.kind === 'building'); }
    if (e.target && edgeDist(e, e.target) <= d.range) { if (e.cd <= 0) enemyAttack(e, e.target); return; }
    const w = LANES.SEA[e.wp];
    if (!w) { e.hp = 0; return; }
    moveTo(e, w[0], w[1], spd, dt);
    if (Math.hypot(w[0] - e.x, w[1] - e.y) < 6) e.wp++;
    return;
  }
  if (e.burrowed) {
    if (!e.target || !isAlive(e.target) || e.retarget <= 0) { e.retarget = 1; e.target = nearestOf(F, e.x, e.y, 9999, t => t.kind === 'building' && t.type !== 'wall'); }
    if (!e.target) { e.burrowed = false; return; }
    if (Math.random() < dt * 8) G.fx.push({ type: 'dirt', x: e.x + rand(-5, 5), y: e.y, t: 0, dur: 1.2 });
    moveTo(e, e.target.x, e.target.y + 10, spd * 0.9, dt);
    if (edgeDist(e, e.target) < 26) { e.burrowed = false; burst(e.x, e.y, '#8a6a4a', 10); }
    return;
  }
  if (e.retarget <= 0 || !isAlive(e.target)) {
    const had = e.target && !isAlive(e.target);
    e.retarget = 0.35 + Math.random() * 0.2; e.target = pickTarget(e, F);
    if (laneBound(e) && (had || !e.target)) { const pr = laneProj(e.lane, e.x, e.y); e.wp = Math.max(e.wp, Math.min(pr.seg + 1, LANES[e.lane].length - 1)); }
  }
  let t = e.target;
  if (d.fly) {
    const goal = t || G.plots.castle;
    if (t && edgeDist(e, t) <= (d.range || (e.r + 4))) { if (e.cd <= 0) enemyAttack(e, t); e.flip = t.x < e.x; return; }
    moveTo(e, goal.x, goal.y - 4, spd, dt);
    return;
  }
  if (d.roll) {
    if (e.cd <= 0) { let hit = false; for (const f of F) if (edgeDist(e, f) < d.splash) { hurtFriendly(f, d.dmg, e); hit = true; } if (hit) e.cd = d.cd; }
    t = null;
  }
  let gx, gy, inRange = false;
  if (t) {
    inRange = d.range ? edgeDist(e, t) <= d.range : edgeDist(e, t) <= e.r + 5;
    const tp = t.type === 'wall' ? { x: t.x, y: t.y } : t; gx = tp.x; gy = tp.y;
  } else {
    const L = LANES[e.lane], w = L[Math.min(e.wp, L.length - 1)], last = e.wp >= L.length - 1;
    gx = w[0] + (last ? 0 : e.ox); gy = w[1] + (last ? 0 : e.oy);
    if (Math.hypot(gx - e.x, gy - e.y) < 10 && !last) e.wp++;
  }
  if (inRange) { if (e.cd <= 0) enemyAttack(e, t); e.flip = gx < e.x; return; }
  const wall = blockingWall(e, gx, gy);
  if (wall) { e.target = wall; e.retarget = 1.2; if (e.cd <= 0) enemyAttack(e, wall); e.flip = wall.x < e.x; return; }
  moveTo(e, gx, gy, spd, dt);
}
function moveTo(e, gx, gy, spd, dt) {
  const dx = gx - e.x, dy = gy - e.y, L = Math.hypot(dx, dy);
  if (L < 0.5) return;
  const s = Math.min(L, spd * dt);
  e.x += dx / L * s; e.y += dy / L * s;
  if (Math.abs(dx) > 1) e.flip = dx < 0;
}

// ---------- Friendly movement helpers ----------
function nearestEnemy(x, y, maxD, filter) {
  let best = null, bd = maxD;
  for (const e of G.enemies) { if (e.hp <= 0 || (filter ? !filter(e) : e.burrowed)) continue; const d = Math.hypot(e.x - x, e.y - y) - e.r; if (d < bd) { bd = d; best = e; } }
  return best;
}
function canMove(x, y) { if (x < 8 || y < 8 || x > WW - 8 || y > WH - 8) return false; return !BLOCK[(y | 0) * WW + (x | 0)]; }
function walk(u, dx, dy, spd, dt) {
  const L = Math.hypot(dx, dy); if (L < 0.5) { u.moving = false; return; }
  const s = Math.min(L, spd * dt), nx = u.x + dx / L * s, ny = u.y + dy / L * s;
  if (canMove(nx, u.y)) u.x = nx; if (canMove(u.x, ny)) u.y = ny;
  u.moving = true; if (Math.abs(dx) > 0.5) u.flip = dx < 0;
}

// ---------- The King ----------
function kingDmg(base) { return base * M('kingDmgMul') * (G.leader.rallyT > 0 ? 1.2 : 1); }
function dashTarget(L, dx, dy, dist) {
  const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
  // furthest walkable point along the dash; if blocked almost immediately, try other directions so the King always moves
  for (const [ux, uy] of [[dx, dy], [-dy, dx], [dy, -dx], [-dx, -dy]]) {
    let best = 0;
    for (let s = 6; s <= dist; s += 6) { if (canMove(L.x + ux * s, L.y + uy * s)) best = s; else break; }
    if (best >= 24) return { x: L.x + ux * best, y: L.y + uy * best };
  }
  return { x: L.x + dx * 10, y: L.y + dy * 10 };
}
function startDash(L, dx, dy, stage) {
  const D = G.mod.dash, t = dashTarget(L, dx, dy, D.dist);
  L.dash = { t: 0, dur: clamp(Math.hypot(t.x - L.x, t.y - L.y) / 650, 0.12, 0.3), sx: L.x, sy: L.y, tx: t.x, ty: t.y, hit: new Set(), stage, lastTrail: 0 };
  if (D.invuln) L.invulnT = L.dash.dur + 0.1;
  if (D.decoy && stage === 1) G.decoys.push({ kind: 'decoy', x: L.x, y: L.y, r: 9, hp: 80, maxHp: 80, t: D.decoy });
  sfx('dash');
}
function landDash(L) {
  const D = G.mod.dash, P = L.dash;
  if (D.dmg) {
    const src = { leader: true, melee: true, slow: D.slow, slowT: D.slowT, stun: D.stun ? 1 : 0, stunT: D.stun };
    G.fx.push({ type: 'ring', x: L.x, y: L.y, t: 0, dur: 0.35, r: D.splash, col: '#ffe9b0' });
    for (const e of G.enemies) if (e.hp > 0 && Math.hypot(e.x - L.x, e.y - L.y) < D.splash + e.r) {
      hurtEnemy(e, kingDmg(D.dmg), src);
      if (D.knock && !e.def.boss) { const a = Math.atan2(e.y - L.y, e.x - L.x); e.x += Math.cos(a) * D.knock; e.y += Math.sin(a) * D.knock; }
    }
    sfx('boom');
  }
  if (D.shield) L.shield = Math.max(L.shield, D.shield);
  if (D.healKing) L.hp = Math.min(L.maxHp, L.hp + D.healKing);
  if (D.healSquad) for (const f of G.followers) if (!f.dead) f.hp = Math.min(f.maxHp, f.hp + D.healSquad);
  if (D.healKing || D.healSquad) G.fx.push({ type: 'ring', x: L.x, y: L.y, t: 0, dur: 0.5, r: 70, col: '#5be38a' });
  if (D.rally) { L.rallyT = 4; G.followers.forEach((f, i) => { if (!f.dead) { const a = i / G.followers.length * Math.PI * 2; f.x = L.x + Math.cos(a) * 20; f.y = L.y + Math.sin(a) * 14; f.rallyT = 4; } }); }
  L.dash = null;
  if (D.double && P.stage === 1) {
    const n = nearestEnemy(L.x, L.y, 220);
    const dx = n ? n.x - L.x : (L.flip ? -1 : 1), dy = n ? n.y - L.y : 0;
    startDash(L, dx, dy, 2);
  }
}
function updateLeader(dt) {
  const L = G.leader;
  L.hurtT -= dt; L.slowT -= dt; L.dashCd -= dt; L.cd -= dt; L.invulnT -= dt; L.rallyT -= dt;
  let mx = 0, my = 0;
  if (keys.ArrowLeft || keys.KeyA) mx--; if (keys.ArrowRight || keys.KeyD) mx++;
  if (keys.ArrowUp || keys.KeyW) my--; if (keys.ArrowDown || keys.KeyS) my++;
  if (L.dead) {
    L.dead -= dt;
    walk(L, mx * 10, my * 10, 60, dt);
    if (L.dead <= 0) { L.dead = 0; L.hp = L.maxHp; L.x = CASTLE.x; L.y = CASTLE.y + 70; burst(L.x, L.y - 10, '#fff', 10); }
    return;
  }
  if (L.dash) {
    const P = L.dash, D = G.mod.dash; P.t += dt;
    const k = Math.min(1, P.t / P.dur);
    const px = L.x, py = L.y;
    L.x = P.sx + (P.tx - P.sx) * k; L.y = P.sy + (P.ty - P.sy) * k;
    L.flip = P.tx < P.sx; L.moving = true;
    if (D.path) for (const e of G.enemies) if (e.hp > 0 && !P.hit.has(e) && Math.hypot(e.x - L.x, e.y - L.y) < 24 + e.r) { P.hit.add(e); hurtEnemy(e, kingDmg(D.path), { leader: true, melee: true, slow: D.drag ? 0.5 : 0, slowT: 1.5 }); }
    if (D.drag) for (const e of P.hit) if (e.hp > 0 && !e.def.boss) { e.x += L.x - px; e.y += L.y - py; }
    if (D.trail && Math.hypot(L.x - P.sx, L.y - P.sy) - P.lastTrail > 18) { P.lastTrail = Math.hypot(L.x - P.sx, L.y - P.sy); G.pools.push({ x: L.x, y: L.y, r: 18, dps: D.trail, t: 0, dur: 2.5 }); }
    if (Math.random() < 0.6) G.fx.push({ type: 'ghost', x: L.x, y: L.y, flip: L.flip, t: 0, dur: 0.25 });
    if (k >= 1) landDash(L);
    return;
  }
  L.running = !!(keys.ShiftLeft || keys.ShiftRight);
  const spd = 120 * (L.slowT > 0 ? 0.5 : 1) * (L.running ? 2 : 1);
  walk(L, mx * 10, my * 10, spd, dt);
  if (keys.Space && L.dashCd <= 0) {
    let dx = mx, dy = my; const tg = nearestEnemy(L.x, L.y, 160);
    if (!dx && !dy && tg) { dx = tg.x - L.x; dy = tg.y - L.y; }
    if (!dx && !dy) dx = L.flip ? -1 : 1;
    startDash(L, dx, dy, 1); L.dashCd = G.mod.dash.cd;
    return;
  }
  // regen
  const regen = M('kingRegenAdd', 0) + (L.hurtT < -2.5 ? 4 : 0);
  if (regen) L.hp = Math.min(L.maxHp, L.hp + regen * dt);
  // auto attack
  const A = G.mod.auto;
  if (G.phase === 'night' && L.cd <= 0 && !L.running) {
    const reach = A.range;
    let tg = (L.target && L.target.hp > 0 && !L.target.burrowed && Math.hypot(L.target.x - L.x, L.target.y - L.y) < reach + 10 + L.target.r) ? L.target : nearestEnemy(L.x, L.y, reach);
    L.target = tg;
    if (tg) {
      L.cd = A.cd * M('kingCdMul');
      const dmg = kingDmg(A.dmg);
      if (A.style === 'claw') {
        L.swipes++; L.flip = tg.x < L.x;
        const stun = A.stunEvery && L.swipes % A.stunEvery === 0;
        const cx = A.spin ? L.x : (L.x + tg.x) / 2, cy = A.spin ? L.y : (L.y + tg.y) / 2;
        G.fx.push({ type: A.spin ? 'spin' : 'claw', x: cx, y: cy - 10, flip: L.flip, t: 0, dur: 0.22, r: A.splash });
        for (const e of G.enemies) if (e.hp > 0 && !e.burrowed && Math.hypot(e.x - cx, e.y - cy) < (A.splash || 30) + e.r) hurtEnemy(e, dmg, { leader: true, melee: true, bleed: A.bleed, stun: stun ? 1 : 0, stunT: A.stunT });
        sfx('hit');
      } else if (A.style === 'magic') {
        fireWeapon({ x: L.x, y: L.y - 26 }, tg, { proj: 'magic', multi: A.multi, splash: A.splash, slow: A.slow, slowT: A.slowT, range: reach }, dmg, { leader: true, ranged: true });
      } else if (A.style === 'beam') {
        fireWeapon({ x: L.x, y: L.y - 24 }, tg, { proj: 'beam' }, dmg, { leader: true, ranged: true });
      } else if (A.style === 'lob') {
        fireWeapon({ x: L.x, y: L.y - 26 }, tg, { proj: 'lob', splash: A.splash, burn: A.burn, slow: A.slow, slowT: A.slowT, range: reach }, dmg, { leader: true, ranged: true });
      } else {
        fireWeapon({ x: L.x, y: L.y - 24 }, tg, { proj: 'yarn', multi: A.multi, slow: A.slow, slowT: A.slowT, bounce: A.bounce, range: reach }, dmg, { leader: true, ranged: true });
      }
    }
  }
}

// ---------- Units ----------
function unitAttack(u, tg, S, dmgMul) {
  const dmg = S.dmg * dmgMul;
  if (!S.range) {
    const src = { melee: true, siegeMul: S.siegeMul, fastMul: S.fastMul, slow: S.slow, slowT: S.slowT, assassin: S.assassin };
    if (S.splash) splashEnemies(tg.x, tg.y, S.splash, dmg, src); else hurtEnemy(tg, dmg, src);
    G.fx.push({ type: 'slash', x: tg.x, y: tg.y - 8, t: 0, dur: 0.15 });
  } else {
    fireWeapon({ x: u.x, y: u.y - 20 }, tg, S, dmg, { ranged: true });
  }
}
function updateUnit(u, dt) {
  u.hurtT -= dt; u.cd -= dt; u.hcd -= dt; u.rallyT -= dt; u.armorT -= dt; u.dmgBuffT -= dt;
  const L = G.leader, S = u.S;
  if (u.dead) {
    u.dead -= dt;
    if (u.dead <= 0) {
      if (u.role === 'squad') { u.dead = 0; u.hp = u.maxHp; u.x = L.x + rand(-10, 10); u.y = L.y + 10; }
      else { const h = G.plots[u.home]; if (h.alive) { u.dead = 0; u.hp = u.maxHp; u.x = h.x; u.y = h.y + 16; } else u.dead = 1; }
    }
    return;
  }
  if (S.selfRegen) u.hp = Math.min(u.maxHp, u.hp + S.selfRegen * dt);
  let home, leash, center;
  if (u.role === 'squad' || (u.role === 'healer' && S.follow)) {
    const n = G.followers.length + (u.role === 'healer' ? 4 : 0), i = u.role === 'squad' ? u.slot : n - 1 - u.idx;
    const a = Math.PI * 0.5 + (i - (n - 1) / 2) * (2.4 / Math.max(3, n));
    const ring = 26 + (u.role === 'healer' ? 10 : 0);
    home = [L.x + Math.cos(a) * ring * (L.flip ? -1 : 1) * 0.8 + (L.flip ? 16 : -16), L.y + Math.sin(a) * ring * 0.6 - 4];
    leash = 150; center = L;
  } else { home = guardPos(u); leash = S.leash || 120; center = { x: home[0], y: home[1] }; }
  const spd = (S.spd || 90) * M('unitSpdMul');
  // --- healers
  if (u.role === 'healer') {
    if (S.aura) {
      for (const f of G.followers.concat(G.units, [L])) if (!f.dead && Math.hypot(f.x - u.x, f.y - u.y) < S.auraR) {
        f.hp = Math.min(f.maxHp, f.hp + S.aura * dt);
        if (S.auraDmg) { f.dmgBuffT = 0.3; f.dmgBuff = S.auraDmg; }
        if (S.auraArmor) { f.armorT = 0.3; f.armorBuff = S.auraArmor; }
      }
    }
    let goal = home;
    if (S.healBld) {
      const hurt = plots().filter(p => p.built && p.alive && p.hp < p.maxHp && Math.hypot(p.x - center.x, p.y - center.y) < leash).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (hurt) goal = [hurt.x + (u.idx % 2 ? 18 : -18), hurt.y + 14];
      if (S.rebuild) { const w = plots().find(p => p.type === 'wall' && p.built && !p.alive && !p.rebuilt && Math.hypot(wallMid(p).x - center.x, wallMid(p).y - center.y) < leash); if (w) { const m = wallMid(w); goal = [m.x + 30, m.y]; if (Math.hypot(m.x - u.x, m.y - u.y) < 60) { w.alive = true; w.rebuilt = true; w.hp = w.maxHp * 0.4; burst(m.x, m.y - 10, '#ffe27a', 16); say(G.plots[u.home], 'Wall rebuilt! Hold it this time!'); } } }
    }
    if (u.hcd <= 0) {
      u.hcd = S.healCd || 1.2;
      let tgt = null;
      if (S.healBld) tgt = plots().filter(p => p.built && p.alive && p.hp < p.maxHp && Math.hypot(p.x - u.x, p.y - u.y) < S.healRange + p.r).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      else tgt = G.followers.concat(G.units, [L]).filter(f => !f.dead && f.hp < f.maxHp && Math.hypot(f.x - u.x, f.y - u.y) < S.healRange).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (tgt) { tgt.hp = Math.min(tgt.maxHp, tgt.hp + S.heal); G.fx.push({ type: 'heal', x: tgt.x, y: tgt.y - 18, t: 0, dur: 0.6 }); G.fx.push({ type: 'beam', x1: u.x, y1: u.y - 16, x2: tgt.x, y2: tgt.y - 14, t: 0, dur: 0.12, col: '#5be38a' }); }
    }
    if (S.dmg && G.phase === 'night' && u.cd <= 0) { const tg = nearestEnemy(u.x, u.y, S.range || 110); if (tg) { u.cd = S.cd || 1; unitAttack(u, tg, S, 1); } }
    const dx = goal[0] - u.x, dy = goal[1] - u.y;
    const run = S.follow && L.running ? Math.max(spd * 2, 250) : spd * (Math.hypot(dx, dy) > 40 ? 1.3 : 0.8);
    if (Math.hypot(dx, dy) > 4) walk(u, dx, dy, run, dt); else u.moving = false;
    return;
  }
  // --- squad healer kittens
  if (u.role === 'squad' && S.heal && u.hcd <= 0) { u.hcd = 1.5; const t = G.followers.concat([L]).filter(f => !f.dead && f.hp < f.maxHp && Math.hypot(f.x - u.x, f.y - u.y) < 90).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; if (t) { t.hp = Math.min(t.maxHp, t.hp + S.heal); G.fx.push({ type: 'heal', x: t.x, y: t.y - 18, t: 0, dur: 0.5 }); } }
  // --- fighters
  let tg = null;
  const regroup = (u.role === 'squad' || (u.role === 'healer' && S.follow)) && L.running;
  if (G.phase === 'night' && !(u.role === 'squad' && L.dead) && !regroup) tg = nearestEnemy(u.x, u.y, S.range ? S.range : 85, e => !e.burrowed && Math.hypot(e.x - center.x, e.y - center.y) < leash + (S.range || 0) && !(e.def.fly && !S.range));
  if (tg) {
    const d = Math.hypot(tg.x - u.x, tg.y - u.y) - tg.r;
    let mul = 1;
    if (S.rage) mul *= 1 + (1 - u.hp / u.maxHp) * 1.5;
    if (u.rallyT > 0) mul *= 1.5;
    if (u.dmgBuffT > 0) mul *= u.dmgBuff;
    if (M('commandAura', 1) > 1 && Math.hypot(u.x - L.x, u.y - L.y) < 120) mul *= M('commandAura');
    if (S.range) {
      if (d <= S.range) { u.moving = false; u.flip = tg.x < u.x; if (u.cd <= 0) { u.cd = S.cd; unitAttack(u, tg, S, mul); } }
      else walk(u, tg.x - u.x, tg.y - u.y, spd, dt);
    } else {
      if (d <= u.r + 4 + (S.reach || 0)) { u.moving = false; u.flip = tg.x < u.x; if (u.cd <= 0) { u.cd = S.cd; unitAttack(u, tg, S, mul); } }
      else walk(u, tg.x - u.x, tg.y - u.y, spd, dt);
    }
  } else {
    const dx = home[0] - u.x, dy = home[1] - u.y;
    const run = regroup ? Math.max(spd * 2, 250) : spd * (Math.hypot(dx, dy) > 40 ? 1.3 : 0.8);
    if (Math.hypot(dx, dy) > 4) walk(u, dx, dy, run, dt); else u.moving = false;
  }
}

// ---------- Buildings (turrets + auras) ----------
function topOf(p) {
  if (p.type === 'tower') return { x: p.x, y: p.y - towerHeight(p) - 12 };
  if (p.type === 'castle') return { x: p.x, y: p.y - 80 };
  if (p.type === 'wall') return { x: p.x, y: p.y - 22 };
  return { x: p.x, y: p.y - 30 };
}
function beaconMul(p) { let m = 1; for (const q of plots()) if (q.built && q.alive && q.s.buffTowers && Math.hypot(q.x - p.x, q.y - p.y) < q.s.buffR) m *= q.s.buffTowers; return m; }
function updateBuilding(p, dt) {
  if (!p.built || !p.alive) return;
  const s = p.s;
  if (s.regen) p.hp = Math.min(p.maxHp, p.hp + s.regen * dt);
  // auras
  if (s.auraR) {
    p.auraT -= dt;
    const stunNow = s.auraStun && p.auraT <= 0;
    if (stunNow) { p.auraT = s.auraStunEvery; G.fx.push({ type: 'ring', x: p.x, y: p.y, t: 0, dur: 0.5, r: s.auraR, col: '#ffe27a' }); }
    for (const e of G.enemies) if (e.hp > 0 && !e.def.fly && Math.hypot(e.x - p.x, e.y - p.y) < s.auraR) {
      if (s.auraSlow) e.auraSlow = Math.max(e.auraSlow, s.auraSlow);
      if (s.auraBurn) hurtEnemy(e, s.auraBurn * dt, { tower: true });
      if (stunNow) e.stunT = Math.max(e.stunT, s.auraStun);
    }
    if (s.auraHeal) for (const f of G.followers.concat(G.units, [G.leader])) if (!f.dead && Math.hypot(f.x - p.x, f.y - p.y) < s.auraR) f.hp = Math.min(f.maxHp, f.hp + s.auraHeal * dt);
  }
  // turret (Scarecrow Ring gives every farm an anti-air scarecrow)
  if (p.type === 'farm' && !s.dmg && M('farmScarecrow', 0)) Object.assign(s, { dmg: 7, cd: 1, range: 115, proj: 'arrow', airOnly: true, airMul: 1 });
  if (s.dmg && s.range) {
    p.cd -= dt;
    if (p.cd > 0) return;
    const isTower = p.type === 'tower';
    const range = s.range * (isTower ? M('towerRangeMul') : 1);
    const tg = nearestEnemy(p.x, p.y, range, e => (!e.burrowed || s.detect) && (s.airOnly ? e.def.fly : true) && (s.airMul === 0 ? !e.def.fly : true));
    if (!tg) return;
    p.cd = s.cd; p.aimFlip = tg.x < p.x;
    const dmg = s.dmg * (isTower ? M('towerDmgMul') * beaconMul(p) : 1);
    fireWeapon(topOf(p), tg, Object.assign({}, s, { range }), dmg, { tower: true, ranged: true });
  }
}

// ---------- FX & chatter ----------
function updateFx(dt) {
  for (const f of G.fx) { f.t += dt; if (f.type === 'spark') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 200 * dt; } }
  G.fx = G.fx.filter(f => f.t < f.dur);
  for (const b of G.bubbles) b.t += dt;
  G.bubbles = G.bubbles.filter(b => b.t < b.dur && (b.src.kind !== 'building' || b.src.alive));
  while (G.bubbles.length < 3 && G.bubbleQ.length) { const b = G.bubbleQ.shift(); if (!G.bubbles.some(x => x.src === b.src)) { G.bubbles.push(b); sfx('meow'); } else { G.bubbleQ.push(b); break; } }
}
function updateChatter(dt) {
  G.castleHitT -= dt; G.lowHpT -= dt;
  if (G.hintT != null) { G.hintT -= dt; if (G.hintT <= 0) { G.hintT = null; if (G.phase === 'day' && NIGHTS[G.night]) say(queen(), NIGHTS[G.night].hint, 6); } }
  if (G.phase === 'day') {
    G.chatT -= dt;
    if (G.chatT <= 0) {
      G.chatT = rand(9, 15);
      const pool = plots().filter(p => p.built && p.speaker && p.type !== 'castle' && LINES.idle[p.type]);
      if (pool.length) { const p = pick(pool); say(p, pick(LINES.idle[p.type])); }
    }
  } else if (G.phase === 'night') {
    G.nightChatT -= dt;
    if (G.nightChatT <= 0) { G.nightChatT = rand(7, 12); const tw = plots().filter(p => p.built && p.alive && p.type === 'tower' && nearestEnemy(p.x, p.y, 160)); if (tw.length) say(pick(tw), pick(LINES.towerNight), 2.4); }
  }
}

// ---------- Camera ----------
function updateCamera(dt) {
  const L = G.leader;
  const tx = clamp(L.x - W / 2, 0, WW - W), ty = clamp(L.y - H / 2 - 20, 0, WH - H);
  const k = Math.min(1, dt * 5);
  G.cam.x += (tx - G.cam.x) * k; G.cam.y += (ty - G.cam.y) * k;
}

// ---------- Main update ----------
function update(dt) {
  G.t += dt; G.endT += dt;
  if (G.msg) { G.msg.t += dt; if (G.msg.t > 3) G.msg = null; }
  G.nightBlend = clamp(G.nightBlend + (G.phase === 'night' ? dt : -dt) * 0.8, 0, 1);
  updateFx(dt);
  updateCamera(dt);
  if (G.phase === 'title') { G.newHold = keys.Space ? (G.newHold || 0) + dt : 0; if (G.newHold > 2) { clearSave(); G.saved = null; G.newHold = 0; begin(); } }
  if (G.phase === 'title' || G.phase === 'win' || G.phase === 'lose') return;
  WALLS = plots().filter(p => p.type === 'wall');
  updateLeader(dt);
  for (const u of G.followers) updateUnit(u, dt);
  for (const u of G.units) updateUnit(u, dt);
  for (const d of G.decoys) d.t -= dt;
  G.decoys = G.decoys.filter(d => d.t > 0 && d.hp > 0);
  updateChatter(dt);
  if (G.phase === 'day') { updatePads(dt); return; }
  G.pads = []; G.hold.key = null; G.panel = null; G.lanePanel = null;
  G.nightT += dt;
  while (G.spawns.length && G.spawns[0].at <= G.nightT) spawnEnemy(G.spawns.shift());
  // anti-stall: robots that linger long after the last spawn run out of battery
  const lastAt = NIGHTS[G.night] ? Math.max(...NIGHTS[G.night].groups.map(g => g[3] + g[1] * g[4])) : 0;
  if (!G.spawns.length && G.nightT > lastAt + 120) {
    if (!G.batteryMsg) { G.batteryMsg = true; G.msg = { text: 'Robot batteries are running low!', t: 0 }; }
    for (const e of G.enemies) { e.hp -= e.maxHp * 0.03 * dt; if (e.hp <= 0) killEnemy(e); }
  }
  for (const p of plots()) updateBuilding(p, dt);
  const F = friendlyTargets();
  for (const e of G.enemies) if (e.hp > 0) updateEnemy(e, dt, F);
  const en = G.enemies;
  for (let i = 0; i < en.length; i++) { const a = en[i]; if (a.def.fly || a.burrowed) continue; for (let j = i + 1; j < en.length; j++) { const b = en[j]; if (b.def.fly || b.burrowed) continue; const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, m = (a.r + b.r) * 0.8; if (d2 < m * m && d2 > 0.01) { const d = Math.sqrt(d2), push = (m - d) * 0.5; a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push; } } }
  updateProj(dt);
  G.enemies = G.enemies.filter(e => e.hp > 0 && e.x > -250 && e.x < WW + 250 && e.y > -250 && e.y < WH + 250);
  if (G.phase === 'night' && !G.spawns.length && !G.enemies.length) endNight();
}
