// ============================================================
//  KITTY KINGDOM — data: map, plots, enemies, waves, dialogue
// ============================================================
'use strict';

const W = 960, H = 640;           // screen
const WW = 1440, WH = 960;        // world (camera follows the King)
const SPEED_SCALE = 7;            // Thronefall speed units -> px/s
const START_GOLD = 4;
const HOLD_BUILD = 1.0;           // seconds standing on a plot to build
const HOLD_UPGRADE = 1.4;         // seconds standing on an upgrade point
const PAD_R = 12;

// ---------- Map ----------
const CASTLE = { x: 705, y: 495 };

const LANES = {
  E:   [[1500,528],[1320,540],[1185,528],[1050,519],[900,513],[780,504],[CASTLE.x,CASTLE.y]],
  NE:  [[1335,-45],[1282,105],[1185,225],[1050,300],[900,375],[795,438],[CASTLE.x,CASTLE.y]],
  S:   [[915,1035],[900,900],[888,822],[858,732],[810,645],[758,570],[CASTLE.x,CASTLE.y]],
  SEA: [[57,1050],[51,780],[66,540],[54,300],[45,90],[-90,15]],
};
const AIR = { AIRN: [[420,-60],[930,-60]], AIRW: [[-60,300],[-60,495]] };

const TERRAIN = {
  sea: [[0,0],[105,0],[87,120],[108,255],[90,390],[117,525],[99,660],[126,780],[165,885],[240,960],[0,960]],
  mountains: [[105,0],[1200,0],[1185,57],[1110,93],[1035,72],[960,105],[870,87],[780,111],[705,90],[615,117],[525,93],[435,120],[345,96],[255,123],[165,105],[99,123]],
  river: { pts: [[1500,750],[1350,780],[1200,810],[1050,834],[930,840],[810,877],[705,918],[630,975]], w: 44 },
  bridge: { x: 891, y: 836, w: 52, h: 66 },
};

// Plots. req = castle tier needed for the plot to appear (1 = from the start, 2 = after first castle upgrade)
const PLOTS = [
  { id:'castle', type:'castle', x:CASTLE.x, y:CASTLE.y, req:0 },
  { id:'h1', type:'house', x:572, y:386, req:1 },
  { id:'h2', type:'house', x:500, y:470, req:1 },
  { id:'h3', type:'house', x:555, y:650, req:1 },
  { id:'h4', type:'house', x:450, y:370, req:1 },
  { id:'h5', type:'house', x:440, y:600, req:1 },
  { id:'h6', type:'house', x:665, y:705, req:2 },
  { id:'h7', type:'house', x:706, y:329, req:2 },
  { id:'h8', type:'house', x:350, y:510, req:2 },
  { id:'mill', type:'mill', x:295, y:688, req:1 },
  { id:'f1', type:'farm', x:200, y:750, req:1, needs:'mill' },
  { id:'f2', type:'farm', x:313, y:774, req:1, needs:'mill' },
  { id:'f3', type:'farm', x:405, y:745, req:1, needs:'mill' },
  { id:'f4', type:'farm', x:299, y:850, req:2, needs:'mill' },
  { id:'f5', type:'farm', x:395, y:850, req:2, needs:'mill' },
  // the northern windmill and its fields, between the houses and the mountains
  { id:'mill2', type:'mill', x:588, y:241, req:2 },
  { id:'f6', type:'farm', x:527, y:186, req:2, needs:'mill2' },
  { id:'f7', type:'farm', x:601, y:155, req:2, needs:'mill2' },
  { id:'f8', type:'farm', x:680, y:180, req:2, needs:'mill2' },
  { id:'f9', type:'farm', x:755, y:208, req:2, needs:'mill2' },
  { id:'f10', type:'farm', x:683, y:257, req:2, needs:'mill2' },
  { id:'tE1', type:'tower', x:1107, y:452, req:1 },
  { id:'tE2', type:'tower', x:1107, y:615, req:1 },
  { id:'tNE1', type:'tower', x:1029, y:195, req:1 },
  { id:'tNE2', type:'tower', x:930, y:292, req:1 },
  { id:'tS1', type:'tower', x:752, y:752, req:1 },
  { id:'tS2', type:'tower', x:970, y:669, req:1 },
  { id:'tW', type:'tower', x:349, y:629, req:2 },
  { id:'tC1', type:'tower', x:647, y:416, req:1 },
  // back-line towers to cover the air routes (west sea, northern mountains)
  { id:'tB1', type:'tower', x:215, y:330, req:1 },
  { id:'tB2', type:'tower', x:215, y:580, req:1 },
  { id:'tB3', type:'tower', x:465, y:234, req:2 },
  { id:'tB5', type:'tower', x:520, y:880, req:2 },
  { id:'tC2', type:'tower', x:830, y:575, req:1 },
  // forward towers out near the spawn points
  { id:'tFE1', type:'tower', x:1330, y:465, req:2 },
  { id:'tFE2', type:'tower', x:1330, y:610, req:2 },
  { id:'tFNE1', type:'tower', x:1165, y:165, req:2 },
  { id:'tFNE2', type:'tower', x:1300, y:250, req:3 },
  { id:'tFS1', type:'tower', x:1110, y:885, req:3 },
  { id:'tFS2', type:'tower', x:985, y:905, req:2 },
  { id:'wE', type:'wall', x:1188, y:531, x1:1188, y1:466, x2:1188, y2:596, req:1 },
  { id:'wNE', type:'wall', x:1119, y:262, x1:1078, y1:196, x2:1160, y2:328, req:1 },
  { id:'wS', type:'wall', x:886, y:762, x1:822, y1:790, x2:950, y2:733, req:1 },
  // one melee + one ranged hall for every road
  { id:'mE', type:'melee', x:960, y:440, req:1, guard:[1075,530], lane:'E' },
  { id:'rE', type:'ranged', x:1009, y:603, req:2, guard:[1044,568], lane:'E' },
  { id:'mNE', type:'melee', x:870, y:205, req:1, guard:[1010,300], lane:'NE' },
  { id:'rNE', type:'ranged', x:787, y:282, req:2, guard:[902,312], lane:'NE' },
  { id:'mS', type:'melee', x:1060, y:735, req:1, guard:[885,712], lane:'S' },
  { id:'rS', type:'ranged', x:640, y:785, req:2, guard:[790,700], lane:'S' },
  { id:'clinic', type:'clinic', x:545, y:545, req:2, guard:[700,600] },
  { id:'mine1', type:'mine', x:330, y:205, req:1 },
  { id:'mine2', type:'mine', x:1250, y:895, req:2 },
  { id:'dock1', type:'dock', x:142, y:440, req:1 },
  { id:'dock2', type:'dock', x:220, y:877, req:2 },
  { id:'post', type:'post', x:520, y:300, req:2 },
  { id:'gym', type:'gym', x:905, y:620, req:2 },
  { id:'den', type:'den', x:370, y:430, req:1 },
  { id:'library', type:'library', x:808, y:369, req:2 },
];
const BELL = { x: 612, y: 580 };
// stand here (bottom-right corner of the map, past the south bridge) to erase all saved data and start over
const RESET_SPOT = { x: 1385, y: 905 };

const SPEAKERS = { castle:'Queen Purrsephone', mill:'Miller Mungo', mine:'Digger Dot', dock:'Captain Mackerel', clinic:'Nurse Nim', post:'Coach Claws', gym:'Coach Pounce', den:'Den Mother Mittens', library:'Professor Purrcival' };
const HALL_SPEAKERS = { mill2:'Miller Maisie', mE:'Sgt. Socks', mNE:'Sgt. Boots', mS:'Sgt. Tabby', rE:'Robin Hiss', rNE:'Archer Ash', rS:'Maid Mew' };

// ---------- Enemies (all Thronefall enemy types, as robots) ----------
// fam: human->'infantry', monster->'critter', siege->'siege'
// tgt: any | castle | leader | eco | defense | units | buildings | towers | random
const ENEMIES = {
  scrap:      { name:'Scrap Bot',        tf:'Weakling',          fam:'infantry', hp:8.7,  dmg:1,    spd:4,   cd:1,    r:8 },
  tintot:     { name:'Tin Tot',          tf:'Peasant',           fam:'infantry', hp:8.7,  dmg:1,    spd:4,   cd:1,    r:8 },
  blade:      { name:'Blade Bot',        tf:'Swordsman',         fam:'infantry', hp:25,   dmg:2.5,  spd:5,   cd:1,    r:10 },
  laser:      { name:'Laser Bot',        tf:'Archer',            fam:'infantry', hp:20,   dmg:2.5,  spd:5,   cd:2,    r:9,  range:115, proj:'laser' },
  prong:      { name:'Prong Bot',        tf:'Pikes',             fam:'infantry', hp:25,   dmg:3.5,  spd:5,   cd:1,    r:10, slowLeader:true },
  spin:       { name:'Spin Bot',         tf:'Flail',             fam:'infantry', hp:55,   dmg:2.2,  spd:5,   cd:1,    r:11, splash:26 },
  railgun:    { name:'Railgun Bot',      tf:'Elite Crossbowman', fam:'infantry', hp:40,   dmg:15,   spd:4,   cd:2.5,  r:11, range:155, proj:'rail' },
  barrel:     { name:'Barrel Bot',       tf:'Barrel Knight',     fam:'siege',    hp:100,  dmg:3.5,  spd:8,   cd:1.25, r:12, armorRanged:true },
  shadow:     { name:'Shadow Bot',       tf:'Dark Warrior',      fam:'infantry', hp:135,  dmg:10,   spd:7,   cd:1,    r:12, antiMelee:true },
  brute:      { name:'Brute Bot',        tf:'Ogre',              fam:'infantry', hp:200,  dmg:20,   spd:4,   cd:1.5,  r:17, halfVsUnits:true },
  tesla:      { name:'Tesla Drone',      tf:'Flying Mage',       fam:'infantry', hp:45,   dmg:2,    spd:7,   cd:1.4,  r:10, fly:true, range:105, proj:'zap', splash:22, tgt:'units' },
  roller:     { name:'Roller Bot',       tf:'Racer',             fam:'critter',  hp:35,   dmg:2.5,  spd:10,  cd:1,    r:9,  tgt:'castle', armorLeader:true },
  hound:      { name:'Hound Bot',        tf:'Hunterling',        fam:'critter',  hp:30,   dmg:5,    spd:10,  cd:0.5,  r:10, tgt:'leader', bonusLeader:10 },
  bike:       { name:'Bike Bot',         tf:'Monster Rider',     fam:'critter',  hp:40,   dmg:3,    spd:11,  cd:1,    r:11 },
  drone:      { name:'Drone',            tf:'Wasp',              fam:'critter',  hp:25,   dmg:2.5,  spd:8,   cd:1,    r:9,  fly:true, range:55, proj:'sting', tgt:'eco' },
  jet:        { name:'Jet Drone',        tf:'Bloodwing',         fam:'critter',  hp:50,   dmg:3,    spd:12,  cd:0.5,  r:10, fly:true },
  blimp:      { name:'Bomber Blimp',     tf:'Fury',              fam:'critter',  hp:75,   dmg:30,   spd:3,   cd:4,    r:18, fly:true, range:150, proj:'bomb', splash:30, tgt:'defense' },
  boom:       { name:'Boom Bot',         tf:'Exploder',          fam:'critter',  hp:65,   dmg:90,   spd:9,   cd:1,    r:10, explode:46, tgt:'buildings' },
  snail:      { name:'Fuse Snail',       tf:'Fire Snail',        fam:'critter',  hp:45,   dmg:1.2,  spd:3,   cd:0.4,  r:10, explode:46, explodeDmg:45 },
  blob:       { name:'Nano Blob',        tf:'Slime',             fam:'critter',  hp:12.5, dmg:1.2,  spd:5,   cd:0.4,  r:7 },
  spikeblob:  { name:'Spike Blob',       tf:'Spiky Slime',       fam:'critter',  hp:50,   dmg:3.6,  spd:5,   cd:0.4,  r:10 },
  turretblob: { name:'Turret Blob',      tf:'Giraffe Slime',     fam:'critter',  hp:30,   dmg:1.5,  spd:5,   cd:1,    r:10, range:90,  proj:'laser' },
  heavyturret:{ name:'Heavy Turret Blob',tf:'Strong Giraffe Slime',fam:'critter',hp:100,  dmg:3.5,  spd:7,   cd:1,    r:13, range:100, proj:'laser' },
  spiderS:    { name:'Tick Bot',         tf:'Small Spider',      fam:'critter',  hp:12.5, dmg:2.4,  spd:15,  cd:0.4,  r:7 },
  spiderM:    { name:'Spider Bot',       tf:'Medium Spider',     fam:'critter',  hp:50,   dmg:4,    spd:14,  cd:0.5,  r:11 },
  spiderL:    { name:'Arachno-Mech',     tf:'Big Spider',        fam:'critter',  hp:800,  dmg:12,   spd:10,  cd:0.3,  r:24 },
  drill:      { name:'Drill Bot',        tf:'Moleman',           fam:'critter',  hp:60,   dmg:5,    spd:5,   cd:1,    r:11, burrow:true, tgt:'buildings' },
  drillgun:   { name:'Drill Gunner',     tf:'Moleman Archer',    fam:'critter',  hp:50,   dmg:3.75, spd:5,   cd:2,    r:11, burrow:true, range:100, proj:'laser', vsUnits:1.4, tgt:'buildings' },
  glitch:     { name:'Glitch Bot',       tf:'Ghost',             fam:'critter',  hp:100,  dmg:6.5,  spd:3.33,cd:1,    r:12, vsTowers:1.55, tgt:'towers' },
  smash:      { name:'Smash Mech',       tf:'Flogre',            fam:'critter',  hp:275,  dmg:9,    spd:4,   cd:1,    r:19, splash:30 },
  minigun:    { name:'Minigun Bot',      tf:'Quicksling',        fam:'critter',  hp:55,   dmg:9.78, spd:3,   cd:0.45, r:12, range:115, proj:'bullet', tgt:'random' },
  monolith:   { name:'The Monolith',     tf:'Thing',             fam:'critter',  hp:1100, dmg:2.2,  spd:4,   cd:0.3,  r:26, splash:34 },
  mortar:     { name:'Mortar Bot',       tf:'Catapult',          fam:'siege',    hp:45,   dmg:45,   spd:2,   cd:5,    r:15, range:175, proj:'shell', splash:24, tgt:'buildings', buildingsOnly:true },
  ram:        { name:'Battering Bot',    tf:'Ram',               fam:'siege',    hp:250,  dmg:15,   spd:2.25,cd:1,    r:18, armorRanged:true, tgt:'buildings', buildingsOnly:true },
  saw:        { name:'Saw Wheel',        tf:'Wheel',             fam:'siege',    hp:180,  dmg:3.5,  spd:15,  cd:0.25, r:15, splash:24, roll:true },
  walker:     { name:'Siege Walker',     tf:'Iron Tower',        fam:'siege',    hp:200,  dmg:3.5,  spd:5,   cd:0.8,  r:20, range:125, proj:'bullet' },
  barge:      { name:'Hover Barge',      tf:'Windboat',          fam:'siege',    hp:300,  dmg:15,   spd:3,   cd:1,    r:22, sea:true, range:165, proj:'rail', tgt:'buildings' },
  megavac:    { name:'MEGA-VAC 9000',    tf:'Boss (Corrupt King / Eldermole)', fam:'siege', hp:1800, dmg:22, spd:2.2, cd:1.4, r:44, boss:true, splash:52, tgt:'buildings' },
};

// ---------- Nights (Neuland/Nordfels-style pacing: introduce one idea per night) ----------
// group: [type, count, lane, startTime, interval, elite?]
const NIGHTS = [
  { name:'Scrap Scouts', reward:6, solo:true, hint:"Robots are coming and our castle is rubble! Fight them yourself, Your Majesty. Walk close and you attack on your own, and SPACE dashes. Their scrap will pay for a new castle.",
    groups:[['scrap',3,'E',2,3],['scrap',3,'E',16,2.5]] },
  { name:'Scrap Patrol', reward:5, hint:'Scouts report a few rusty Scrap Bots coming up the east road. Build some houses for income!',
    groups:[['scrap',6,'E',1,1.4],['tintot',3,'E',8,1.2]] },
  { name:'Blades & Lasers', reward:6, hint:'Blade Bots and Laser Bots from the east, and scrap through the north-east woods. Towers will help!',
    groups:[['blade',6,'E',1,1.4],['laser',4,'E',5,1.5],['scrap',8,'NE',3,1]] },
  { name:'Rollers Rush the Castle', reward:7, hint:'Roller Bots ignore everything and race for my castle from the south bridge! Hound Bots will hunt you, Your Majesty.',
    groups:[['roller',7,'S',1,1.1],['hound',3,'NE',6,1.6],['blade',8,'E',2,1.2]] },
  { name:'Drones & Goo', reward:10, hint:'Drones fly over walls to wreck our homes and fields. Nano goo from the south.',
    groups:[['drone',8,'AIRN',2,1.2],['blob',14,'S',1,0.6],['spikeblob',3,'S',9,1.5],['turretblob',4,'E',4,1.5]] },
  { name:'Prongs, Spinners & Bikes', reward:11, hint:'Prong Bots zap anyone who charges into them, Your Majesty. A Brute Bot lumbers behind them.',
    groups:[['prong',6,'E',1,1.2],['spin',4,'E',5,1.6],['bike',9,'NE',3,0.8],['brute',1,'E',14,1],['laser',5,'E',8,1.2]] },
  { name:'Spiders & Drills', reward:12, hint:'Drill Bots burrow under walls! Spider Bots skitter through the woods. Boom Bots explode on buildings.',
    groups:[['spiderS',12,'NE',1,0.5],['spiderM',3,'NE',6,1.2],['drill',4,'S',3,1.8],['drillgun',3,'S',7,1.8],['boom',3,'E',11,2],['blade',8,'E',2,1]] },
  { name:'Siege Engines', reward:14, hint:'Mortar Bots out-range our towers. Dive them, Your Majesty! Glitch Bots hunt towers, Jet Drones from the sea.',
    groups:[['barrel',6,'E',1,1.3],['mortar',3,'E',7,2.5],['ram',2,'S',4,4],['jet',7,'AIRW',9,0.8],['glitch',4,'NE',3,2],['blade',10,'NE',1,1],['brute',2,'E',14,3]] },
  { name:'Storm from Sky & Sea', reward:16, hint:'Hover Barges up the west coast, Bomber Blimps and Tesla Drones overhead. Protect the mill!',
    groups:[['tesla',6,'AIRN',3,1.4],['blimp',3,'AIRW',8,4],['barge',2,'SEA',1,8],['railgun',4,'E',5,2],['shadow',4,'E',10,1.6],['snail',5,'S',2,2],['prong',8,'S',6,1],['spikeblob',6,'NE',3,1]] },
  { name:'MEGA-VAC 9000', reward:20, boss:true, hint:'This is it. Everything they have, and the MEGA-VAC 9000 itself. Hold the castle, Your Majesty!',
    groups:[['scrap',12,'NE',1,0.6],['blade',10,'E',2,0.9],['laser',6,'E',6,1.1],['roller',8,'S',4,0.8],['drone',6,'AIRN',8,1],
            ['barrel',4,'E',16,1.4],['mortar',1,'E',22,4],['spiderM',4,'NE',24,0.9],['shadow',3,'E',30,1.6],['megavac',1,'E',36,1]] },
];
// ---------- Nights 11-100: seeded generator (boss every 10th night, final boss on 100) ----------
const TOTAL_NIGHTS = 100;
const WAVE_NAMES_A = ['Iron','Rusty','Chrome','Static','Copper','Neon','Steel','Gearbox','Voltage','Scrap','Turbo','Grinding','Clockwork','Laser','Atomic','Midnight','Hydraulic','Magnetic','Tin','Titanium'];
const WAVE_NAMES_B = ['Tide','Parade','Storm','Swarm','March','Rush','Siege','Stampede','Uprising','Onslaught','Convoy','Horde','Barrage','Invasion','Crawl','Blitz'];
function enemyThreat(t) { return Math.max(1, ENEMIES[t].hp / 9); }
function nightScale(n) { const k = Math.max(0, n - 10); return { hp: 1 + 0.035 * k, dmg: 1 + 0.015 * k }; }
function generateNight(n) {
  const r = rng(n * 7919 + 13), k = n - 10; r(); r(); r();
  const pickR = a => a[(r() * a.length) | 0];
  const boss = n % 10 === 0;
  const pool = Object.keys(ENEMIES).filter(t => t !== 'megavac' && !(k < 10 && (t === 'monolith' || t === 'spiderL')));
  const groundLanes = ['E', 'NE', 'S'].filter(() => r() < 0.75); if (!groundLanes.length) groundLanes.push(pickR(['E', 'NE', 'S']));
  const nTypes = 3 + ((r() * 3) | 0) + (k > 40 ? 1 : 0);
  const types = []; while (types.length < nTypes) { const t = pickR(pool); if (!types.includes(t)) types.push(t); }
  let budget = 300 + 18 * k + (boss ? -60 : 0);
  const groups = [], used = {};
  types.forEach((t, i) => {
    const d = ENEMIES[t];
    const lane = d.fly ? (r() < 0.5 ? 'AIRN' : 'AIRW') : d.sea ? 'SEA' : pickR(groundLanes);
    const share = budget / (types.length - i) * (0.6 + r() * 0.8);
    const cap = d.sea ? 6 : d.explode ? 6 + Math.floor(k / 8) : d.roll ? 3 + Math.floor(k / 12) : d.boss ? 1 : 80;   // exploders hit too hard to come in hordes
    const count = Math.max(1, Math.min(cap, Math.round(share / enemyThreat(t))));
    budget -= count * enemyThreat(t);
    const elite = r() < Math.min(0.35, k / 150) && enemyThreat(t) < 40 && !d.explode;
    const start = 1 + r() * 30, gap = Math.max(0.25, Math.min(4, 40 / count * (0.6 + r() * 0.5)));
    groups.push([t, count, lane, Math.round(start * 10) / 10, Math.round(gap * 100) / 100, elite || undefined]);
    used[lane] = (used[lane] || []).concat(ENEMIES[t].name);
  });
  if (boss) groups.push(['megavac', 1 + Math.floor(k / 35), pickR(['E', 'NE', 'S']), 28, 12]);
  const name = boss ? (n === TOTAL_NIGHTS ? 'The Last MEGA-VAC' : 'MEGA-VAC Returns') : pickR(WAVE_NAMES_A) + ' ' + pickR(WAVE_NAMES_B);
  const where = Object.entries(used).map(([l, ns]) => ns.slice(0, 3).join(', ') + ({ E: ' from the east', NE: ' from the north-east', S: ' from the south', AIRN: ' flying in from the north', AIRW: ' flying in from the sea', SEA: ' by sea' })[l]).join('; ');
  const hint = (boss ? 'A MEGA-VAC is coming! ' : '') + 'Night ' + n + ': ' + where + '.' + (k > 0 && n % 5 === 0 ? ' The robots grow stronger every night.' : '');
  return { name, reward: n === TOTAL_NIGHTS ? 0 : 18 + Math.floor(k * 0.6), boss, final: n === TOTAL_NIGHTS, hint, groups };
}
for (let n = NIGHTS.length + 1; n <= TOTAL_NIGHTS; n++) NIGHTS.push(generateNight(n));

// ---------- What each robot does (shown in the spawn sidebar) ----------
const ENEMY_INFO = {
  scrap:'Weak rusty scout. Comes in swarms.', tintot:'Wind-up toy bot. Weak but numerous.', blade:'Basic melee bot. Attacks buildings and cats.',
  laser:'Ranged. Shoots from behind the front line.', prong:'Zaps and slows the King if he fights it up close.', spin:'Spinning flails hit every cat around it.',
  railgun:'Long-range sniper with heavy shots.', barrel:'Tough siege bot. Arrows do half damage.', shadow:'Tanky. Melee cats deal half damage to it.',
  brute:'Huge and slow. Hits buildings very hard.', tesla:'Flyer. Zaps your cats with splash damage.', roller:'Ignores everything and rushes your Castle.',
  hound:'Hunts the King and hits him extra hard.', bike:'Very fast raider.', drone:'Flyer. Ignores walls, goes for houses and farms.',
  jet:'Fast flyer that attacks anything.', blimp:'Slow flyer. Bombs towers and walls from range.', boom:'Runs at buildings and explodes.',
  snail:'Slow. Explodes when destroyed.', blob:'Tiny goo. Weak alone, comes in big groups.', spikeblob:'Bigger, tougher goo.',
  turretblob:'Goo with a little laser. Ranged.', heavyturret:'Tough goo with a double laser.', spiderS:'Tiny and very fast.',
  spiderM:'Fast spider that bites hard.', spiderL:'Mini-boss. Huge HP, shreds anything up close.', drill:'Tunnels under walls to buildings. Only detection towers hit it underground.',
  drillgun:'Tunnels, then shoots. Extra damage to cats.', glitch:'Hunts towers and deals them extra damage.', smash:'Big mech; hammers hit everything nearby.',
  minigun:'Sprays bullets at random targets.', monolith:'Enormous HP. Slowly grinds through defences.', mortar:'Out-ranges towers and shells buildings. Dash in and break it!',
  ram:'Breaks walls. Arrows do half damage.', saw:'Rolls down the road shredding everything it passes.', walker:'Walking gun tower that shoots defenders.',
  barge:'Sails up the coast shooting buildings near the shore.', megavac:'BOSS. Sucks cats in, spawns Scrap Bots, flattens buildings.',
};


// ---------- Dialogue ----------
const HOUSE_CATS = ['Old Tom','Biscuit','Mochi','Pepper','Noodle','Luna','Ziggy'];
const TOWER_CATS = ['Scout Nibbles','Pip','Marmalade','Clawdia','Sir Paws','Bean','Hazelnut','Dot'];
const QUEEN = 'Queen Purrsephone';

const LINES = {
  intro: [
    "King Whiskers! The robots smashed our castle and stole our gold!",
    "All we have left is this bell. Ring it when you're ready and fight the robots yourself.",
    "Their scrap will pay to rebuild the castle. Then we can build houses, towers and walls.",
  ],
  queenNight: ["To your posts, kittens!","Hold the line! No robot touches my castle.","Here they come. Claws out!","Nine lives, one kingdom. Defend it!"],
  queenDawn: ["The sun is up. We survived! Rebuild and collect taxes.","Well fought! Damaged buildings have been rebuilt.","Morning, Your Majesty. The fishmongers paid their taxes."],
  queenLowHp: ["Your Majesty, you're hurt! Fall back to the castle!","Careful, my King! Even you only have nine lives."],
  queenCastleHit: ["They're scratching at my castle!","Robots at the gate! Somebody help!","My throne! Defend the castle!"],
  queenUpgrade: ["The castle grows! New building spots have appeared.","Splendid! More of the realm is ours to build on."],
  built: {
    house: ["Ooh, a new home! Thank you, Your Majesty!","Finally, a roof over my whiskers.","I'll pay my taxes in fish. Or gold. Mostly gold."],
    tower: ["Tower manned! I can see my house from here!","Eyes on the road, claws on the bow.","Perfect perch. Purrfect, even."],
    mill: ["The sails are turning! Time to plant some catnip.","Grind, grind, grind. Lovely."],
    farm: ["Catnip, sown! Smells wonderful already.","Fields planted. Keep the drones off them!"],
    wall: null,
    melee: ["Knights! Fall in! Tails up!","No robot passes this road while I stand."],
    ranged: ["Archers ready. Robots make lovely targets.","Nock! Draw! Purr!"],
    clinic: ["Clinic open! Bring me your scratches.","Bandages, check. Catnip tea, check."],
    mine: ["Dig, dig, dig! There's gold in these hills.","My pickaxe is itching!"],
    dock: ["Ahoy! Fish and harpoons, coming right up.","The boats are out. Fresh mackerel tomorrow!"],
    post: ["Sharpen those claws, Your Majesty!","Swipe, swipe, SWIPE! Good form."],
    gym: ["Pounce practice! Wiggle your bottom first.","Leap like nobody's watching!"],
    den: ["Your squad will be the finest kittens in the realm.","Tails high, everyone. Follow the King!"],
    library: ["So many books. So many sunny spots to nap on them.","Knowledge is power. And power is purr."],
  },
  idle: {
    house: ["Has anyone seen my ball of yarn?","I'm not saying I knocked the vase over, but...","Nap time. Wake me at nightfall.","The robots smell like oil and sadness.","I heard the MEGA-VAC eats cats whole!","My cousin says robots hate cucumbers."],
    tower: ["Quiet... too quiet.","I've counted 42 birds today. Zero robots.","Does anyone have a snack? I'm on watch."],
    mill: ["Windy today. Good for business.","Keep the robots off my sails!"],
    farm: ["The catnip harvest looks wonderful this year.","Keep those drones away from my fields!"],
    melee: ["Polish your armour, kittens!","Drill time! Left paw, right paw!"],
    ranged: ["Steady paws, aim for the eyes.","Who keeps chewing the bowstrings?"],
    clinic: ["Remember to stretch after battle.","Hairballs are not a medical emergency, Gerald."],
    mine: ["Found a shiny rock! Is it gold? It's gold!","Mind the low ceiling. Ow."],
    dock: ["The tide's coming in.","Smells like fish. Excellent."],
    post: ["A good scratch keeps the claws sharp.","Again! From the top!"],
    gym: ["Higher! Further! Pouncier!","Did you see that leap? Magnificent."],
    den: ["The kittens are restless. They want to fight!","Who left a toy mouse in the barracks?"],
    library: ["Chapter 9: Robots and Why They Hate Water.","Shh! This is a library."],
  },
  houseHit: ["Eek! My roof!","Get off my lawn, tin can!","Help! A robot in the garden!","Mrrrow! Not my house!"],
  towerNight: ["Contact! Fire at will!","Arrows away!","Got one! That's my tenth!","Hiss! Get back, bucket-heads!"],
  towerHit: ["They're hitting my tower!","Need repairs up here!","My perch is wobbling!"],
  upgraded: ["Ooh, {n}! Fancy.","{n}! Purrfect choice.","Behold: {n}!","{n} it is. The robots won't know what hit them."],
  victory: "The MEGA-VAC is scrap! King Whiskers, the realm is saved!",
  defeat: "The castle has fallen... the robots have taken our yarn.",
  firstSight: {
    scrap:"Scrap Bots! Rusty little things.",
    tintot:"Tin Tots? They're wind-up toys!",
    blade:"Blade Bots! Watch those saw arms!",
    laser:"Laser Bots shooting from the back!",
    prong:"Prong Bots! Your Majesty, don't charge into those forks!",
    spin:"Spin Bots! Keep the squad spread out!",
    railgun:"Railgun Bots! Those shots hurt!",
    barrel:"Barrel Bots! Arrows bounce off them!",
    shadow:"Shadow Bots! They shrug off claws!",
    brute:"A Brute Bot! Big, slow, and very angry.",
    tesla:"Tesla Drones! They zap our soldiers!",
    roller:"Rollers! They're going straight for the castle!",
    hound:"Hound Bots hunting the King!",
    bike:"Bike Bots! So fast!",
    drone:"Drones! They're after our houses!",
    jet:"Jet Drones screaming in from the sea!",
    blimp:"Bomber Blimps targeting our towers!",
    boom:"Boom Bots! Don't let them reach the buildings!",
    snail:"Fuse Snails. Slow, but they explode!",
    blob:"Nano goo! Ew, it's sticky!",
    spikeblob:"Spike Blobs! Ouch!",
    turretblob:"Turret Blobs with little lasers!",
    heavyturret:"Heavy Turret Blobs!",
    spiderS:"Tick Bots! Thousands of tiny legs!",
    spiderM:"Spider Bots in the woods!",
    spiderL:"ARACHNO-MECH! Everyone panic!",
    drill:"Drill Bots! They burrow under the walls!",
    drillgun:"Drill Gunners popping up!",
    glitch:"Glitch Bots! They're scrambling the towers!",
    smash:"Smash Mech with hammer arms!",
    minigun:"Minigun Bots spraying everywhere!",
    monolith:"The Monolith... it just keeps coming.",
    mortar:"Mortar Bots! They out-range the towers! Captain, get them!",
    ram:"Battering Bots! Protect the walls!",
    saw:"SAW WHEELS! Out of the way!",
    walker:"Siege Walkers! Moving gun towers!",
    barge:"Hover Barges on the coast!",
    megavac:"It's the MEGA-VAC 9000! It wants to suck us all up!",
  },
};
