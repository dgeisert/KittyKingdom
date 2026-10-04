// ============================================================
//  KITTY KINGDOM — upgrade trees
//  Every building: build -> choose 1 of 3 branches -> choose 1 of 3 finishers
//  (a 3x3 tree, unlike Thronefall's independent level-2/level-3 picks).
//  fx merge rules: key ending in Mul multiplies, Add adds, anything else overwrites.
//  Nested objects (unit, global, auto, dash, squad) merge with the same rules.
//  `from` names the tower-defense game that inspired the choice.
// ============================================================
'use strict';

const OPT_COL = ['#4f9df0', '#c070f0', '#f59a3c'];   // pad / card colours for options 1,2,3

const TREES = {
  // ---------------- DEFENCE ----------------
  tower: {
    name: 'Cat Tower', icon: 'tower', cost: [3, 6, 12], r: 16,
    base: { hp: 100, dmg: 8, cd: 0.9, range: 130, proj: 'arrow', airMul: 2, siegeMul: 0.6 },
    blurb: 'A cat archer shoots robots. x2 damage vs flyers.',
    opts: [
      { id: 'A', name: 'Archer Loft', from: 'Kingdom Rush: Archer towers', desc: 'Faster arrows, longer reach.', fx: { cd: 0.6, range: 150, hpAdd: 100 },
        kids: [
          { id: 'A1', name: 'Longbow Nest', from: 'Bloons TD: Sniper Monkey', desc: '32 dmg shots, huge range, 20% crits.', fx: { dmg: 32, cd: 1.5, range: 240, crit: 0.2, proj: 'bolt' } },
          { id: 'A2', name: 'Volley Roost', from: 'Kingdom Rush: Musketeer / multishot', desc: 'Fires 3 arrows at once.', fx: { multi: 3, cd: 0.5, dmg: 8 } },
          { id: 'A3', name: "Hunter's Perch", from: 'Bloons TD: camo detection', desc: 'x3.5 vs flyers, can hit burrowed Drill Bots.', fx: { airMul: 3.5, detect: true, dmg: 12 } },
        ] },
      { id: 'B', name: 'Mystic Spire', from: 'Kingdom Rush: Mage tower', desc: 'Magic bolts ignore armour.', fx: { proj: 'magic', dmg: 14, cd: 1.1, pierceArmor: true, siegeMul: 1 },
        kids: [
          { id: 'B1', name: 'Storm Coil', from: 'Kingdom Rush: Tesla x104', desc: 'Lightning chains to 4 robots.', fx: { proj: 'chain', chain: 4, dmg: 16, cd: 1.0 } },
          { id: 'B2', name: 'Frost Lantern', from: 'Warcraft III TD: frost towers', desc: 'Freezing splash slows robots 50%.', fx: { splash: 34, slow: 0.5, slowT: 2.2, dmg: 8, cd: 0.9 } },
          { id: 'B3', name: 'Hex Totem', from: 'Bloons TD: Glue / debuff support', desc: 'Hexed robots take +40% damage from everything.', fx: { vuln: 0.4, dmg: 10, cd: 0.7, multi: 2 } },
        ] },
      { id: 'C', name: 'Catapult Roost', from: 'Kingdom Rush: Artillery', desc: 'Lobbed boulders with splash.', fx: { proj: 'lob', dmg: 14, cd: 1.6, splash: 36, siegeMul: 1, airMul: 0 },
        kids: [
          { id: 'C1', name: 'Big Purrtha', from: 'Kingdom Rush: Big Bertha', desc: 'Huge shells: 34 dmg, wide splash.', fx: { dmg: 34, splash: 58, cd: 2.2, range: 175 } },
          { id: 'C2', name: 'Yarn Bomber', from: 'Plants vs Zombies: Winter Melon', desc: 'Sticky yarn leaves slowing, burning pools.', fx: { burn: 6, slow: 0.4, slowT: 2, dmg: 12, cd: 1.3 } },
          { id: 'C3', name: 'Siege Ballista', from: 'Defense Grid: Cannon / siege killer', desc: 'Piercing 70 dmg bolts, x2 vs siege.', fx: { proj: 'bolt', pierce: true, dmg: 70, cd: 2.0, siegeMul: 2, splash: 0, airMul: 1, range: 200 } },
        ] },
    ],
  },
  wall: {
    name: 'Wall', icon: 'wall', cost: [3, 3, 6], r: 10,
    base: { hp: 240 }, blurb: 'Blocks the road. Robots must chew through it.',
    opts: [
      { id: 'A', name: 'Stone Wall', from: 'Classic maze TD walls', desc: '640 HP stone.', fx: { hp: 640 },
        kids: [
          { id: 'A1', name: 'Bastion', from: 'Stronghold', desc: '1300 HP.', fx: { hp: 1300 } },
          { id: 'A2', name: 'Spiked Wall', from: 'Orcs Must Die: spike walls', desc: '850 HP, robots that hit it take 6 damage.', fx: { hp: 850, thorns: 6 } },
          { id: 'A3', name: 'Mirror Wall', from: 'Dungeon Defenders: reflect walls', desc: '850 HP, ranged attacks deal half damage.', fx: { hp: 850, rangedArmor: 0.5 } },
        ] },
      { id: 'B', name: 'Trap Line', from: 'Orcs Must Die: floor traps', desc: 'Damages robots crowding the wall (4 dps).', fx: { hp: 320, auraR: 56, auraBurn: 4 },
        kids: [
          { id: 'B1', name: 'Tar Moat', from: 'Kingdom Rush: Tar pits', desc: 'Robots near the wall are slowed 55%.', fx: { auraSlow: 0.55, auraR: 70 } },
          { id: 'B2', name: 'Fire Trench', from: 'Orcs Must Die: brimstone', desc: 'Burns robots near the wall for 12 dps.', fx: { auraBurn: 12, auraR: 64 } },
          { id: 'B3', name: 'Bramble Snare', from: 'Bloons TD: Spike Factory', desc: 'Roots everything nearby for 1.2s every 4s.', fx: { auraStun: 1.2, auraStunEvery: 4, auraR: 70 } },
        ] },
      { id: 'C', name: 'Gatehouse', from: 'Thronefall-like gate towers', desc: 'Cat guards shoot from the wall.', fx: { hp: 480, dmg: 5, cd: 1.1, range: 120, proj: 'arrow', airMul: 2 },
        kids: [
          { id: 'C1', name: 'Arrow Gate', from: 'Kingdom Rush: Ranger posts', desc: 'Two arrows per volley.', fx: { multi: 2, dmg: 7 } },
          { id: 'C2', name: 'Boiling Oil Gate', from: 'Stronghold: boiling oil', desc: 'Pours burning oil on attackers.', fx: { proj: 'lob', splash: 40, burn: 8, dmg: 14, cd: 1.8, range: 90 } },
          { id: 'C3', name: 'Repair Crew', from: 'Rogue Tower: repair upgrades', desc: 'Wall regenerates 14 HP/s.', fx: { regen: 14, hp: 700 } },
        ] },
    ],
  },
  // ---------------- ECONOMY ----------------
  house: {
    name: 'Cat House', icon: 'house', cost: [2, 3, 6], r: 16,
    base: { hp: 30, income: 1 }, blurb: '+1 gold every morning.',
    opts: [
      { id: 'A', name: 'Cottage', from: 'Bloons TD: Banana Farm', desc: '+2 gold per morning.', fx: { income: 2, hp: 40 },
        kids: [
          { id: 'A1', name: 'Manor', from: 'Bloons TD: Banana Plantation', desc: '+4 gold per morning.', fx: { income: 4, hp: 60 } },
          { id: 'A2', name: 'Adventurers\' Inn', from: 'Kingdom Rush: Barracks heroes', desc: '+2 gold and +1 cat in the King\'s squad.', fx: { income: 2, global: { followerAdd: 1 } } },
          { id: 'A3', name: 'Market Hall', from: 'Bloons TD: Marketplace', desc: '+1 gold, plus +1 per 2 other houses.', fx: { income: 1, perHouse: 0.5 } },
        ] },
      { id: 'B', name: 'Watch House', from: 'Thronefall: fortified houses', desc: '120 HP, shoots arrows.', fx: { hp: 120, dmg: 4, cd: 1.2, range: 105, proj: 'arrow', airMul: 2 },
        kids: [
          { id: 'B1', name: 'Garrison House', from: 'Kingdom Rush: Militia barracks', desc: '2 militia cats defend the house.', fx: { unit: { role: 'melee', count: 2, hp: 50, dmg: 3, cd: 0.9, spd: 90, leash: 80 } } },
          { id: 'B2', name: 'Bell House', from: 'Warcraft III TD: slow auras', desc: 'Its alarm bell slows robots nearby 30%.', fx: { auraR: 100, auraSlow: 0.3 } },
          { id: 'B3', name: 'Stone House', from: 'Stronghold: keeps', desc: '400 HP, robots that hit it take 5 damage.', fx: { hp: 400, thorns: 5 } },
        ] },
      { id: 'C', name: 'Cat Café', from: 'Dungeon Defenders: support auras', desc: '+1 gold, heals cats nearby (3 HP/s).', fx: { income: 1, auraR: 95, auraHeal: 3 },
        kids: [
          { id: 'C1', name: 'Bakery', from: 'Bloons TD: Monkey Village buffs', desc: '+1 gold, all cats +15% max HP.', fx: { income: 1, global: { unitHpMul: 1.15, followerHpMul: 1.15 } } },
          { id: 'C2', name: 'Lucky Cat Shrine', from: 'Maneki-neko charms', desc: '+3 gold per morning.', fx: { income: 3 } },
          { id: 'C3', name: 'Nap Spot', from: 'Kingdom Rush: Barracks respawn upgrades', desc: 'All cats respawn 40% faster.', fx: { income: 1, global: { respawnMul: 0.6, followerRespawnMul: 0.6 } } },
        ] },
    ],
  },
  farm: {
    name: 'Catnip Farm', icon: 'farm', cost: [1, 2, 4], r: 16,
    base: { hp: 15, income: 1 }, blurb: '+1 gold. Fragile.',
    opts: [
      { id: 'A', name: 'Catnip Field', from: 'Plants vs Zombies: Sunflower', desc: '+2 gold.', fx: { income: 2 },
        kids: [
          { id: 'A1', name: 'Catnip Plantation', from: 'PvZ: Twin Sunflower', desc: '+4 gold.', fx: { income: 4 } },
          { id: 'A2', name: 'Greenhouse', from: 'Bloons TD: Banana Research', desc: '+2 gold, 250 HP.', fx: { income: 2, hp: 250 } },
          { id: 'A3', name: 'Herb Garden', from: 'Dungeon Defenders: healing auras', desc: '+2 gold, the King regenerates +1 HP/s.', fx: { income: 2, global: { kingRegenAdd: 1 } } },
        ] },
      { id: 'B', name: 'Scarecrow Field', from: 'Thronefall: scarecrows', desc: 'A scarecrow shoots flyers. 60 HP.', fx: { hp: 60, dmg: 7, cd: 1, range: 115, proj: 'arrow', airOnly: true, airMul: 1 },
        kids: [
          { id: 'B1', name: 'Pumpkin Patch', from: 'PvZ: Pumpkin', desc: '300 HP, +1 gold.', fx: { hp: 300, income: 2 } },
          { id: 'B2', name: 'Sunflower Turret', from: 'PvZ: Peashooter', desc: 'Shoots ground robots too.', fx: { airOnly: false, dmg: 8, airMul: 1.5 } },
          { id: 'B3', name: 'Corn Maze', from: 'Maze-building TDs', desc: 'Robots nearby are slowed 40%.', fx: { auraR: 90, auraSlow: 0.4 } },
        ] },
      { id: 'C', name: 'Feed Farm', from: 'Bloons TD: Village support', desc: '+1 gold, all units +8% HP.', fx: { income: 1, global: { unitHpMul: 1.08 } },
        kids: [
          { id: 'C1', name: 'Fish Farm', from: 'Kingdom Rush: Elven upgrades', desc: '+2 gold, the King regenerates +2 HP/s.', fx: { income: 2, global: { kingRegenAdd: 2 } } },
          { id: 'C2', name: 'Milk Barn', from: 'Bloons TD: Monkey Village (Jungle Drums)', desc: 'All units +12% damage.', fx: { global: { unitDmgMul: 1.12 } } },
          { id: 'C3', name: 'Treat Factory', from: 'Bloons TD: Primary Training', desc: 'Squad cats attack 25% faster.', fx: { global: { followerCdMul: 0.75 } } },
        ] },
    ],
  },
  mine: {
    name: 'Gold Mine', icon: 'mine', cost: [5, 6, 10], r: 20,
    base: { hp: 150, income: 3 }, blurb: '+3 gold. Upgrade for money or unit power.',
    opts: [
      { id: 'A', name: 'Gold Vein', from: 'Bloons TD: Banana Farm money path', desc: '+6 gold per morning.', fx: { income: 6 },
        kids: [
          { id: 'A1', name: 'Deep Shaft', from: 'Bloons TD: Banana Central', desc: '+10 gold per morning.', fx: { income: 10 } },
          { id: 'A2', name: 'Gem Cutter', from: 'Kingdom Rush: Gold bounties', desc: '+6 gold, +1 gold per 6 robots defeated.', fx: { income: 6, global: { bountyAdd: 1 / 6 } } },
          { id: 'A3', name: 'Royal Mint', from: 'Thronefall: Royal Mint perk', desc: '+5 gold, +1 per house.', fx: { income: 5, perHouse: 1 } },
        ] },
      { id: 'B', name: 'Forge Tunnels', from: 'Kingdom Rush: Barracks armoury', desc: 'All units +20% damage.', fx: { income: 1, global: { unitDmgMul: 1.2 } },
        kids: [
          { id: 'B1', name: 'Steel Forge', from: 'Bloons TD: Monkey Village armour', desc: 'All units +30% HP, +10% damage.', fx: { global: { unitHpMul: 1.3, unitDmgMul: 1.1 } } },
          { id: 'B2', name: 'Arrow Foundry', from: 'Defense Grid: tower boosts', desc: 'Towers and ranged units +20% damage.', fx: { global: { towerDmgMul: 1.2, rangedDmgMul: 1.2 } } },
          { id: 'B3', name: 'Royal Armoury', from: 'Kingdom Rush: hero gear', desc: 'King\'s squad +50% HP, +30% damage.', fx: { global: { followerHpMul: 1.5, followerDmgMul: 1.3 } } },
        ] },
      { id: 'C', name: 'Crystal Cavern', from: 'Mindustry: mixed resources', desc: '+5 gold, all units +10% damage.', fx: { income: 5, global: { unitDmgMul: 1.1 } },
        kids: [
          { id: 'C1', name: 'Mana Crystals', from: 'Kingdom Rush: Arcane upgrades', desc: '+5 gold, magic attacks +35%.', fx: { income: 5, global: { magicDmgMul: 1.35 } } },
          { id: 'C2', name: 'Geode Market', from: 'Bloons TD: Marketplace', desc: '+8 gold.', fx: { income: 8 } },
          { id: 'C3', name: 'Quartz Lenses', from: 'Bloons TD: Radar Scanner', desc: '+5 gold, towers +15% range.', fx: { income: 5, global: { towerRangeMul: 1.15 } } },
        ] },
    ],
  },
  dock: {
    name: 'Fishing Dock', icon: 'dock', cost: [4, 5, 10], r: 20,
    base: { hp: 150, income: 2, dmg: 6, cd: 1.5, range: 150, proj: 'harpoon', seaMul: 2 }, blurb: '+2 gold and a little harpoon defence.',
    opts: [
      { id: 'A', name: 'Fishing Wharf', from: 'Thronefall: harbours', desc: '+4 gold per morning.', fx: { income: 4 },
        kids: [
          { id: 'A1', name: 'Fishing Fleet', from: 'Bloons TD: Merchantman', desc: '+7 gold per morning.', fx: { income: 7 } },
          { id: 'A2', name: 'Fish Market', from: 'Bloons TD: Favoured Trades', desc: '+5 gold, all units +10% HP.', fx: { income: 5, global: { unitHpMul: 1.1 } } },
          { id: 'A3', name: 'Trade Port', from: 'Bloons TD: Trade Empire', desc: '+3 gold, +1 per tower you own.', fx: { income: 3, perTower: 1 } },
        ] },
      { id: 'B', name: 'Harbour Battery', from: 'Bloons TD: Monkey Buccaneer cannons', desc: 'Cannon: 16 dmg splash, range 190 (+1 gold).', fx: { proj: 'lob', dmg: 16, splash: 34, cd: 1.6, range: 190, hp: 300, income: 1 },
        kids: [
          { id: 'B1', name: 'Coastal Mortar', from: 'Bloons TD: Mortar Monkey', desc: '32 dmg shells, range 240.', fx: { dmg: 32, splash: 48, range: 240, cd: 2 } },
          { id: 'B2', name: 'Harpoon Gun', from: 'Bloons TD: Destroyer', desc: '55 dmg harpoons, x2 vs siege.', fx: { proj: 'harpoon', dmg: 55, splash: 0, siegeMul: 2, cd: 1.6, range: 220 } },
          { id: 'B3', name: 'Torpedo Bay', from: 'Bloons TD: Submarine', desc: 'x4 damage to boats, x2 to ground.', fx: { seaMul: 4, dmg: 26, cd: 1.1 } },
        ] },
      { id: 'C', name: 'Lighthouse', from: 'Defense Grid: Command tower', desc: '+2 gold. Its light slows robots 25%.', fx: { income: 2, auraR: 160, auraSlow: 0.25 },
        kids: [
          { id: 'C1', name: 'Beacon', from: 'Bloons TD: Monkey Village', desc: 'Towers within 260 deal +25% damage.', fx: { buffR: 260, buffTowers: 1.25 } },
          { id: 'C2', name: 'Fog Horn', from: 'Kingdom Rush: Earthquake', desc: 'Stuns robots within 170 for 1s every 5s.', fx: { auraR: 170, auraStun: 1, auraStunEvery: 5 } },
          { id: 'C3', name: "Smuggler's Cove", from: 'Bloons TD: Pirate Lord loot', desc: '+5 gold per morning.', fx: { income: 5 } },
        ] },
    ],
  },
  // ---------------- ARMY ----------------
  melee: {
    name: 'Melee Hall', icon: 'melee', cost: [4, 6, 10], r: 22,
    base: { hp: 60, unit: { role: 'melee', count: 3, hp: 60, dmg: 3, cd: 1, spd: 90, leash: 130 } }, blurb: '3 cat knights hold this road.',
    opts: [
      { id: 'A', name: 'Guardians', from: 'Kingdom Rush: Footmen → Holy Order', desc: 'Tough knights: 120 HP.', fx: { unit: { hp: 120, dmg: 3.5, armor: 0.85 } },
        kids: [
          { id: 'A1', name: 'Paladins', from: 'Kingdom Rush: Paladins', desc: '150 HP, heal themselves 3 HP/s.', fx: { unit: { hp: 150, selfRegen: 3 } } },
          { id: 'A2', name: 'Shield Wall', from: 'Kingdom Rush: Templars', desc: '230 HP, ranged attacks deal half damage.', fx: { unit: { hp: 230, rangedArmor: 0.5 } } },
          { id: 'A3', name: 'Juggernauts', from: 'Warcraft III: Knights', desc: '180 HP, cleaving 6 dmg splash hits.', fx: { unit: { hp: 180, dmg: 6, splash: 26 } } },
        ] },
      { id: 'B', name: 'Duelists', from: 'Kingdom Rush: Barbarians', desc: 'Quick blades: 6 dmg, fast.', fx: { unit: { hp: 55, dmg: 6, cd: 0.65, spd: 125 } },
        kids: [
          { id: 'B1', name: 'Ninja Cats', from: 'Bloons TD: Ninja Monkey', desc: 'Dodge 40% of attacks, 8 dmg.', fx: { unit: { dmg: 8, dodge: 0.4 } } },
          { id: 'B2', name: 'Berserkers', from: 'Thronefall: Berserks', desc: 'More damage when hurt, x2 vs siege.', fx: { unit: { rage: true, siegeMul: 2, hp: 75 } } },
          { id: 'B3', name: 'Swashbucklers', from: 'Kingdom Rush: Pirates', desc: '+2 more duelists.', fx: { unit: { countAdd: 2 } } },
        ] },
      { id: 'C', name: 'Lancers', from: 'Thronefall: Spearmen', desc: 'Long reach, x2 damage vs fast robots.', fx: { unit: { hp: 80, dmg: 4, reach: 14, fastMul: 2 } },
        kids: [
          { id: 'C1', name: 'Pikecats', from: 'Age of Empires: Pikemen', desc: 'x3 vs fast robots and slows them.', fx: { unit: { fastMul: 3, slow: 0.4, slowT: 1.5 } } },
          { id: 'C2', name: 'Lion Riders', from: 'Kingdom Rush: Elven riders', desc: '150 HP, 9 dmg splash charges.', fx: { unit: { hp: 150, dmg: 9, splash: 24, spd: 130 } } },
          { id: 'C3', name: 'Halberdiers', from: 'Stronghold: Halberds', desc: 'Wide 30 splash sweeps.', fx: { unit: { splash: 32, dmg: 6 } } },
        ] },
    ],
  },
  ranged: {
    name: 'Ranged Hall', icon: 'ranged', cost: [4, 6, 10], r: 22,
    base: { hp: 50, unit: { role: 'ranged', count: 3, hp: 28, dmg: 4, cd: 1.3, range: 140, spd: 85, leash: 110, proj: 'arrow', airMul: 1.5 } }, blurb: '3 cat archers cover this road.',
    opts: [
      { id: 'A', name: 'Marksmen', from: 'Kingdom Rush: Marksmen', desc: '7 dmg, range 170.', fx: { unit: { dmg: 7, range: 170 } },
        kids: [
          { id: 'A1', name: 'Snipers', from: 'Bloons TD: Sniper Monkey', desc: '24 dmg shots, range 240.', fx: { unit: { dmg: 24, cd: 2, range: 240, proj: 'bolt' } } },
          { id: 'A2', name: 'Crossbowcats', from: 'Thronefall: Crossbowmen', desc: '10 dmg, pierces armour.', fx: { unit: { dmg: 10, cd: 1.1, pierceArmor: true, proj: 'bolt' } } },
          { id: 'A3', name: 'Falconers', from: 'Bloons TD: Monkey Ace', desc: 'x3 vs flyers, fast shots.', fx: { unit: { airMul: 3, cd: 0.8 } } },
        ] },
      { id: 'B', name: 'Apprentice Mages', from: 'Kingdom Rush: Mage tower', desc: 'Magic splash bolts.', fx: { unit: { proj: 'magic', dmg: 5, splash: 18, pierceArmor: true } },
        kids: [
          { id: 'B1', name: 'Pyromancers', from: 'Bloons TD: Wizard (Phoenix)', desc: 'Leave burning pools.', fx: { unit: { burn: 5, dmg: 6 } } },
          { id: 'B2', name: 'Cryomancers', from: 'Bloons TD: Ice Monkey', desc: 'Slow robots 45%.', fx: { unit: { slow: 0.45, slowT: 2 } } },
          { id: 'B3', name: 'Sparkcasters', from: 'Kingdom Rush: Tesla', desc: 'Lightning chains to 3 robots.', fx: { unit: { proj: 'chain', chain: 3, dmg: 7, splash: 0 } } },
        ] },
      { id: 'C', name: 'Skirmishers', from: 'Age of Empires: Skirmishers', desc: '+2 slingers, quick shots.', fx: { unit: { countAdd: 2, dmg: 3, cd: 0.7 } },
        kids: [
          { id: 'C1', name: 'Bombardiers', from: 'Kingdom Rush: Dwarven bombards', desc: 'Lob bombs: 10 dmg splash.', fx: { unit: { proj: 'lob', dmg: 10, splash: 30, cd: 1.6 } } },
          { id: 'C2', name: 'Rangers', from: 'Kingdom Rush: Rangers', desc: 'Roam far to hunt robots.', fx: { unit: { leash: 260, spd: 120, dmg: 5 } } },
          { id: 'C3', name: 'Bolas Throwers', from: 'Bloons TD: Glue Gunner', desc: '30% chance to stun for 1s.', fx: { unit: { stun: 0.3, stunT: 1 } } },
        ] },
    ],
  },
  clinic: {
    name: 'Cat Clinic', icon: 'clinic', cost: [4, 6, 10], r: 22,
    base: { hp: 60, unit: { role: 'healer', count: 2, hp: 30, heal: 4, healCd: 1.2, healRange: 95, spd: 90, leash: 160 } }, blurb: '2 nurse cats heal your army.',
    opts: [
      { id: 'A', name: 'Field Medics', from: 'Kingdom Rush: Paladin healing', desc: 'Medics follow the King and heal 6.', fx: { unit: { follow: true, heal: 6 } },
        kids: [
          { id: 'A1', name: 'Battle Medics', from: 'Team Fortress-style medics', desc: '+1 medic, heals 10.', fx: { unit: { countAdd: 1, heal: 10 } } },
          { id: 'A2', name: 'Revivers', from: 'Kingdom Rush: respawn upgrades', desc: 'Squad cats respawn 3x faster.', fx: { unit: { heal: 7 }, global: { followerRespawnMul: 0.33 } } },
          { id: 'A3', name: 'Combat Medics', from: 'Bloons TD: Druid', desc: 'Medics also fight (6 dmg magic).', fx: { unit: { dmg: 6, cd: 1, range: 110, proj: 'magic' } } },
        ] },
      { id: 'B', name: 'Menders', from: 'Rogue Tower: repair', desc: 'Nurses repair buildings (8 HP).', fx: { unit: { healBld: true, heal: 8, leash: 320 } },
        kids: [
          { id: 'B1', name: 'Master Masons', from: 'Stronghold: engineers', desc: 'Repair 18 HP per tap.', fx: { unit: { heal: 18 } } },
          { id: 'B2', name: 'Wardens', from: 'Dungeon Defenders: shields', desc: 'Buildings near a Warden take 30% less damage.', fx: { unit: { ward: 0.7, heal: 10 } } },
          { id: 'B3', name: 'Engineers', from: 'Kingdom Rush: Dwarven engineers', desc: 'Rebuild fallen walls during the night.', fx: { unit: { rebuild: true, heal: 10 } } },
        ] },
      { id: 'C', name: 'Herbalists', from: 'Warcraft III: healing wards', desc: 'Healing aura near the castle (3 HP/s).', fx: { unit: { aura: 3, auraR: 120 } },
        kids: [
          { id: 'C1', name: 'Druids', from: 'Bloons TD: Druid of the Jungle', desc: 'Aura heals 6 HP/s in a wide area.', fx: { unit: { aura: 6, auraR: 170 } } },
          { id: 'C2', name: 'Alchemists', from: 'Bloons TD: Alchemist', desc: 'Cats in the aura deal +30% damage.', fx: { unit: { auraDmg: 1.3 } } },
          { id: 'C3', name: 'Spirit Healers', from: 'Warcraft III: Spirit Walkers', desc: 'Cats in the aura take 30% less damage.', fx: { unit: { auraArmor: 0.7 } } },
        ] },
    ],
  },
  // ---------------- THE KING ----------------
  castle: {
    name: 'Cat Castle', icon: 'castle', cost: [5, 8, 18], r: 40,
    base: { hp: 600, dmg: 6, cd: 1, range: 150, proj: 'arrow', airMul: 2, income: 1 }, blurb: 'Rebuild the heart of the kingdom. Unlocks houses, towers, walls and more. If it falls, all is lost.',
    opts: [
      { id: 'A', name: 'Royal Keep', from: 'Stronghold: keeps', desc: '1300 HP, fires twin arrows.', fx: { hp: 1300, multi: 2 },
        kids: [
          { id: 'A1', name: 'Fortress', from: 'Stronghold: fortresses', desc: '2400 HP, attackers take 10 damage.', fx: { hp: 2400, thorns: 10 } },
          { id: 'A2', name: 'Bombard Keep', from: 'Kingdom Rush: Artillery', desc: 'Castle cannon: 30 dmg splash.', fx: { proj: 'lob', dmg: 30, splash: 50, cd: 1.6, multi: 1, range: 190, hpAdd: 500 } },
          { id: 'A3', name: 'Sanctuary', from: 'Warcraft III: Fountain of Health', desc: 'Heals all cats within 220 (5 HP/s).', fx: { auraR: 220, auraHeal: 5, hpAdd: 500 } },
        ] },
      { id: 'B', name: 'Royal Treasury', from: 'Thronefall: Royal Mint', desc: '+4 gold per morning, 900 HP.', fx: { income: 4, hp: 900 },
        kids: [
          { id: 'B1', name: 'Tax Office', from: 'Bloons TD: Monkey Wall Street', desc: '+1 gold per house.', fx: { perHouse: 1, hpAdd: 500 } },
          { id: 'B2', name: 'Royal Bank', from: 'Bloons TD: Monkey Bank', desc: 'Interest: +1 per 3 gold saved at dawn (max 10).', fx: { global: { interest: 1 / 3 }, hpAdd: 500 } },
          { id: 'B3', name: 'Bounty Board', from: 'Kingdom Rush: bounty gold', desc: '+1 gold per 4 robots defeated.', fx: { global: { bountyAdd: 0.25 }, hpAdd: 500 } },
        ] },
      { id: 'C', name: 'Throne Room', from: 'Kingdom Rush: hero upgrades', desc: 'King +75% HP, +50% damage. Castle 1000 HP.', fx: { hp: 1000, global: { kingHpMul: 1.75, kingDmgMul: 1.5 } },
        kids: [
          { id: 'C1', name: 'Warrior King', from: 'Thronefall: Royal Mastery', desc: 'King +100% damage, attacks 25% faster.', fx: { global: { kingDmgMul: 2, kingCdMul: 0.75 }, hpAdd: 500 } },
          { id: 'C2', name: 'Commander King', from: 'Thronefall: Commander', desc: 'Cats near the King deal +40% damage.', fx: { global: { commandAura: 1.4 }, hpAdd: 500 } },
          { id: 'C3', name: 'Undying King', from: 'Kingdom Rush: hero revive', desc: 'Respawn in 2s, +3 HP/s regen.', fx: { global: { kingRespawnMul: 0.3, kingRegenAdd: 3 }, hpAdd: 500 } },
        ] },
    ],
  },
  post: {
    name: 'Scratching Post', icon: 'post', cost: [4, 6, 10], r: 16,
    base: { hp: 50, auto: { dmgMul: 1.15 } }, blurb: "Trains the King's auto-attack (+15% damage).",
    opts: [
      { id: 'A', name: 'Claw Training', from: 'Kingdom Rush: melee heroes', desc: 'Auto-attack becomes a claw swipe (14 dmg, short range).', fx: { auto: { style: 'claw', dmg: 14, cd: 0.6, range: 46, splash: 30 } },
        kids: [
          { id: 'A1', name: 'Whirlwind Claws', from: 'Diablo: Whirlwind', desc: '360° spin hits everything within 56.', fx: { auto: { spin: true, range: 56, splash: 56 } } },
          { id: 'A2', name: 'Razor Claws', from: 'Path of Exile: bleed', desc: '22 dmg swipes that make robots bleed.', fx: { auto: { dmg: 22, bleed: 6 } } },
          { id: 'A3', name: "Lion's Roar", from: 'Kingdom Rush: Beresad roar', desc: 'Every 3rd swipe stuns for 1.2s.', fx: { auto: { stunEvery: 3, stunT: 1.2 } } },
        ] },
      { id: 'B', name: 'Yarn Slinger', from: 'Bloons TD: Dart Monkey', desc: 'Faster, longer yarn throws.', fx: { auto: { cd: 0.45, range: 150 } },
        kids: [
          { id: 'B1', name: 'Twin Yarn', from: 'Bloons TD: Triple Shot', desc: 'Hits 2 robots at once.', fx: { auto: { multi: 2 } } },
          { id: 'B2', name: 'Tangle Yarn', from: 'Bloons TD: Glue', desc: 'Yarn slows robots 40%.', fx: { auto: { slow: 0.4, slowT: 1.6 } } },
          { id: 'B3', name: 'Bouncing Ball', from: 'Bloons TD: Ricochet', desc: 'Yarn bounces to 3 more robots.', fx: { auto: { bounce: 3 } } },
        ] },
      { id: 'C', name: 'Hairball Magic', from: 'Kingdom Rush: Arcane', desc: 'Homing magic hairballs with splash.', fx: { auto: { style: 'magic', dmg: 10, cd: 0.8, splash: 24, range: 140 } },
        kids: [
          { id: 'C1', name: 'Hairball Barrage', from: 'Bloons TD: Arcane Spike', desc: 'Fires 3 hairballs.', fx: { auto: { multi: 3, dmg: 8 } } },
          { id: 'C2', name: 'Laser Pointer', from: 'Bloons TD: Dartling laser', desc: 'Rapid laser beam (4 dmg x5/s), range 190.', fx: { auto: { style: 'beam', dmg: 4, cd: 0.2, range: 190, splash: 0 } } },
          { id: 'C3', name: 'Catnip Cloud', from: 'Plants vs Zombies: Fume-shroom', desc: 'Lobbed catnip clouds: splash + slow + burn.', fx: { auto: { style: 'lob', dmg: 12, splash: 44, slow: 0.35, slowT: 2, burn: 5, cd: 1.1, range: 150 } } },
        ] },
    ],
  },
  gym: {
    name: 'Pounce Gym', icon: 'gym', cost: [4, 6, 10], r: 18,
    base: { hp: 50, dash: { cdAdd: -1 } }, blurb: "Trains the King's dash (SPACE). Every dash still moves the King.",
    opts: [
      { id: 'A', name: 'Power Pounce', from: 'Kingdom Rush: hero leap', desc: 'Landing hits 40 dmg in a 55 radius.', fx: { dash: { dmg: 40, splash: 55 } },
        kids: [
          { id: 'A1', name: 'Meteor Pounce', from: 'Diablo: Leap Attack', desc: 'Long 140 leap: 70 dmg, stuns 1s.', fx: { dash: { dist: 140, dmg: 70, splash: 70, stun: 1 } } },
          { id: 'A2', name: 'Double Pounce', from: 'Hades: double dash', desc: 'Leaps twice; the 2nd hunts the nearest robot.', fx: { dash: { double: true } } },
          { id: 'A3', name: 'Shockwave Pounce', from: 'Kingdom Rush: Earthquake', desc: 'Landing knocks back and slows robots 50%.', fx: { dash: { knock: 40, slow: 0.5, slowT: 2.5, splash: 80 } } },
        ] },
      { id: 'B', name: 'Zoomies', from: 'Hades: dash strike', desc: 'Long 150 dash, 3s cooldown, hits everything on the path.', fx: { dash: { dist: 150, cdAdd: -1, path: 20 } },
        kids: [
          { id: 'B1', name: 'Afterimage', from: 'Hades: Blade Dash', desc: 'Leaves a burning trail.', fx: { dash: { trail: 10 } } },
          { id: 'B2', name: 'Blink', from: 'Dota: Blink Dagger', desc: '1.5s cooldown, invulnerable while dashing.', fx: { dash: { cd: 3.5, invuln: true, path: 25 } } },
          { id: 'B3', name: 'Tornado Zoom', from: 'Kingdom Rush: Tornado', desc: 'Drags robots along the dash path.', fx: { dash: { path: 30, drag: true } } },
        ] },
      { id: 'C', name: 'Tail Swipe', from: 'Dungeon Defenders: shields', desc: 'After dashing the King gets a 40 HP shield.', fx: { dash: { shield: 40 } },
        kids: [
          { id: 'C1', name: 'Rally Dash', from: 'Kingdom Rush: Rally point', desc: 'Squad jumps with you, +50% damage for 4s.', fx: { dash: { rally: true } } },
          { id: 'C2', name: 'Healing Leap', from: 'Overwatch: Lúcio boost', desc: 'Heals the King 25 and squad 15.', fx: { dash: { healKing: 25, healSquad: 15 } } },
          { id: 'C3', name: 'Decoy Dash', from: 'Orcs Must Die: Decoy', desc: 'Leaves a decoy cat that taunts robots for 3s.', fx: { dash: { decoy: 3 } } },
        ] },
    ],
  },
  den: {
    name: 'Squad Den', icon: 'den', cost: [4, 6, 10], r: 18,
    base: { hp: 50, squad: { hpMul: 1.2 } }, blurb: "4 cats join the King's squad and follow him into battle.",
    opts: [
      { id: 'A', name: 'Warband', from: 'Kingdom Rush: reinforcements', desc: '+2 squad cats.', fx: { squad: { countAdd: 2 } },
        kids: [
          { id: 'A1', name: 'Horde', from: 'Total War: bigger units', desc: '+3 more squad cats.', fx: { squad: { countAdd: 3 } } },
          { id: 'A2', name: 'Kitten Swarm', from: 'Bloons TD: Spike swarm', desc: '+5 cats, but 30% less HP each.', fx: { squad: { countAdd: 5, hpMul: 0.7 } } },
          { id: 'A3', name: 'Phalanx', from: 'Age of Empires: Hoplites', desc: 'Squad +60% HP, take 25% less damage.', fx: { squad: { hpMul: 1.6, armor: 0.75 } } },
        ] },
      { id: 'B', name: 'Archer Kittens', from: 'Kingdom Rush: Elven archers', desc: 'Squad shoots arrows (range 110).', fx: { squad: { range: 110, dmg: 3, cd: 1, proj: 'arrow' } },
        kids: [
          { id: 'B1', name: 'Crossbow Kittens', from: 'Thronefall: Crossbowmen', desc: '7 dmg bolts.', fx: { squad: { dmg: 7, cd: 1.2, proj: 'bolt' } } },
          { id: 'B2', name: 'Spark Kittens', from: 'Bloons TD: Wizard', desc: 'Magic splash bolts.', fx: { squad: { proj: 'magic', dmg: 4, splash: 22 } } },
          { id: 'B3', name: 'Healer Kittens', from: 'Warcraft III: Priests', desc: 'Squad also heals the King and each other.', fx: { squad: { heal: 3 } } },
        ] },
      { id: 'C', name: 'Elite Guard', from: 'Kingdom Rush: Holy Order', desc: 'Squad x2 HP, x1.5 damage.', fx: { squad: { hpMul: 2, dmgMul: 1.5 } },
        kids: [
          { id: 'C1', name: 'Royal Knights', from: 'Kingdom Rush: Templars', desc: 'Another x1.5 HP and armour.', fx: { squad: { hpMul: 1.5, armor: 0.8 } } },
          { id: 'C2', name: 'Assassins', from: 'Bloons TD: Ninja (Grandmaster)', desc: 'x2 damage vs ranged and siege robots.', fx: { squad: { assassin: 2, dmgMul: 1.2 } } },
          { id: 'C3', name: 'Spirit Cats', from: 'Warcraft III: Spirit Walkers', desc: 'Fallen squad cats return after 3s.', fx: { squad: { respawn: 3 } } },
        ] },
    ],
  },
  library: {
    name: 'Grand Library', icon: 'library', cost: [5, 8, 14], r: 22,
    base: { hp: 80, global: { towerDmgMul: 1.1 } }, blurb: 'Kingdom-wide research (+10% tower damage).',
    opts: [
      { id: 'A', name: 'School of War', from: 'Bloons TD: Monkey Knowledge', desc: 'All units and towers +15% damage.', fx: { global: { unitDmgMul: 1.15, towerDmgMul: 1.15 } },
        kids: [
          { id: 'A1', name: 'Tactics', from: 'Kingdom Rush: upgrades screen', desc: 'Units attack 30% faster.', fx: { global: { unitCdMul: 0.7 } } },
          { id: 'A2', name: 'Ballistics', from: 'Bloons TD: Long Range', desc: 'Towers +25% range.', fx: { global: { towerRangeMul: 1.25 } } },
          { id: 'A3', name: 'Fortification', from: 'Stronghold', desc: 'All buildings +50% HP.', fx: { global: { bldHpMul: 1.5 } } },
        ] },
      { id: 'B', name: 'School of Coin', from: 'Bloons TD: Monkey Knowledge (Powers)', desc: '+3 gold per morning.', fx: { income: 3 },
        kids: [
          { id: 'B1', name: 'Economics', from: 'Civilization: banking', desc: 'All income +25%.', fx: { global: { incomeMul: 1.25 } } },
          { id: 'B2', name: 'Alchemy', from: 'Bloons TD: Alchemist (Rubber to Gold)', desc: '+1 gold per tower each morning.', fx: { perTower: 1 } },
          { id: 'B3', name: 'Architecture', from: 'Thronefall: Timber Scaffolding', desc: 'All builds and upgrades cost 1 less.', fx: { global: { costReduceAdd: 1 } } },
        ] },
      { id: 'C', name: 'School of Magic', from: 'Kingdom Rush: spells', desc: 'All robots move 10% slower.', fx: { global: { enemySpdMul: 0.9 } },
        kids: [
          { id: 'C1', name: 'Time Magic', from: 'Warcraft III: Slow', desc: 'Robots move 20% slower.', fx: { global: { enemySpdMul: 0.89 } } },
          { id: 'C2', name: 'Weakness Hex', from: 'Kingdom Rush: Hex', desc: 'Robots spawn with 15% less HP.', fx: { global: { enemyHpMul: 0.85 } } },
          { id: 'C3', name: 'Arcane Shield', from: 'Dungeon Defenders: shields', desc: 'Buildings take 20% less damage.', fx: { global: { bldArmor: 0.8 } } },
        ] },
    ],
  },
};

// ---------- Windmill (Thronefall's mill improvements, reworked as a 3x3 tree) ----------
TREES.mill = {
  name: 'Windmill', icon: 'mill', cost: [3, 4, 8, 14], r: 20,
  base: { hp: 60, income: 1 }, blurb: '+1 gold, and lets you plant Catnip Farms.',
  opts: [
    { id: 'A', name: 'Improved Plow', from: 'Thronefall: Improved Plow', desc: '+1 gold for every farm around this mill.', fx: { perFarm: 1 },
      kids: [
        { id: 'A1', name: 'Golden Plow', from: 'Bloons TD: Banana Plantation', desc: '+2 gold for every farm around this mill.', fx: { perFarm: 2 } },
        { id: 'A2', name: 'Mill Bakery', from: 'Bloons TD: Banana Research', desc: '+1 per farm, +3 gold, all cats +10% HP.', fx: { perFarm: 1, income: 4, global: { unitHpMul: 1.1, followerHpMul: 1.1 } } },
        { id: 'A3', name: 'Seed Vault', from: 'PvZ: Pumpkin', desc: '+1 per farm, farms get +200 HP.', fx: { perFarm: 1, global: { farmHpAdd: 200 } } },
      ] },
    { id: 'B', name: 'Explosive Trap', from: 'Thronefall: Explosive Trap', desc: '300 HP. Explodes for 120 dmg if destroyed.', fx: { hp: 300, deathBlast: 120 },
      kids: [
        { id: 'B1', name: 'Powder Keg', from: 'Bloons TD: MOAB Mauler', desc: '250 dmg blast when destroyed.', fx: { deathBlast: 250 } },
        { id: 'B2', name: 'Blade Sails', from: 'Orcs Must Die: spinning blades', desc: 'Sails cut robots nearby for 10 dps.', fx: { auraR: 80, auraBurn: 10 } },
        { id: 'B3', name: 'Gale Mill', from: 'Warcraft III TD: wind slows', desc: 'Gusts slow robots within 150 by 40%.', fx: { auraR: 150, auraSlow: 0.4 } },
      ] },
    { id: 'C', name: 'Wind Spirits', from: 'Thronefall: Wind Spirits', desc: 'Buildings within 180 take 30% less ranged damage.', fx: { windR: 180, wind: 0.7 },
      kids: [
        { id: 'C1', name: 'Storm Spirits', from: 'Kingdom Rush: Wind spells', desc: 'Ranged damage near the mill halved.', fx: { wind: 0.5, windR: 220 } },
        { id: 'C2', name: 'Tailwind', from: 'Bloons TD: Jungle Drums', desc: 'All cats move 15% faster.', fx: { global: { unitSpdMul: 1.15, followerSpdMul: 1.15 } } },
        { id: 'C3', name: 'Scarecrow Ring', from: 'Thronefall: Scarecrows', desc: 'Every farm gets an anti-air scarecrow.', fx: { global: { farmScarecrow: 1 } } },
      ] },
  ],
};

// ---------- Level 4: two capstones per building, shared by every route ----------
const FINALS = {
  tower:   [{ id: 'F1', name: 'Veteran Crew', desc: '+40% damage, attacks 20% faster.', fx: { dmgMul: 1.4, cdMul: 0.8 } },
            { id: 'F2', name: 'Reinforced Spire', desc: '+300 HP, repairs 5 HP/s, +15% range.', fx: { hpAdd: 300, regen: 5, rangeMul: 1.15 } }],
  wall:    [{ id: 'F1', name: 'Adamant', desc: '+75% wall HP.', fx: { hpMul: 1.75 } },
            { id: 'F2', name: 'Living Wall', desc: 'Regenerates 10 HP/s, attackers take 8 dmg.', fx: { regen: 10, thorns: 8 } }],
  house:   [{ id: 'F1', name: 'Estate', desc: '+3 gold per morning.', fx: { incomeAdd: 3 } },
            { id: 'F2', name: 'Fortified Home', desc: '+300 HP, attackers take 6 dmg.', fx: { hpAdd: 300, thorns: 6 } }],
  farm:    [{ id: 'F1', name: 'Bumper Crop', desc: '+3 gold per morning.', fx: { incomeAdd: 3 } },
            { id: 'F2', name: 'Hardy Crops', desc: '+300 HP, +1 gold.', fx: { hpAdd: 300, incomeAdd: 1 } }],
  mill:    [{ id: 'F1', name: 'Master Miller', desc: '+4 gold per morning.', fx: { incomeAdd: 4 } },
            { id: 'F2', name: 'Storm Sails', desc: '+300 HP, slows robots within 150 by 30%.', fx: { hpAdd: 300, auraR: 150, auraSlow: 0.3 } }],
  mine:    [{ id: 'F1', name: 'Mother Lode', desc: '+6 gold per morning.', fx: { incomeAdd: 6 } },
            { id: 'F2', name: 'Master Smith', desc: 'All units +15% damage and HP.', fx: { global: { unitDmgMul: 1.15, unitHpMul: 1.15 } } }],
  dock:    [{ id: 'F1', name: 'Merchant Fleet', desc: '+5 gold per morning.', fx: { incomeAdd: 5 } },
            { id: 'F2', name: 'Fortified Harbour', desc: '+400 HP, +50% damage.', fx: { hpAdd: 400, dmgMul: 1.5 } }],
  melee:   [{ id: 'F1', name: 'Veterans', desc: 'Units +50% HP and damage.', fx: { unit: { hpMul: 1.5, dmgMul: 1.5 } } },
            { id: 'F2', name: 'Reinforcements', desc: '+2 more units.', fx: { unit: { countAdd: 2 } } }],
  ranged:  [{ id: 'F1', name: 'Veterans', desc: 'Units +50% damage, +15% range.', fx: { unit: { dmgMul: 1.5, rangeMul: 1.15 } } },
            { id: 'F2', name: 'Reinforcements', desc: '+2 more units.', fx: { unit: { countAdd: 2 } } }],
  clinic:  [{ id: 'F1', name: 'Head Nurse', desc: '+1 healer, heals 50% more.', fx: { unit: { countAdd: 1, healMul: 1.5 } } },
            { id: 'F2', name: 'Miracle Cure', desc: 'Heals twice as much, +50% healing range.', fx: { unit: { healMul: 2, healRangeMul: 1.5 } } }],
  castle:  [{ id: 'F1', name: 'Grand Citadel', desc: '+1500 HP, castle damage x2.', fx: { hpAdd: 1500, dmgMul: 2 } },
            { id: 'F2', name: 'Golden Age', desc: '+8 gold per morning.', fx: { incomeAdd: 8 } }],
  post:    [{ id: 'F1', name: 'Grandmaster', desc: 'Auto-attack +50% damage.', fx: { auto: { dmgMul: 1.5 } } },
            { id: 'F2', name: 'Quick Paws', desc: 'Auto-attack 30% faster.', fx: { auto: { cdMul: 0.7 } } }],
  gym:     [{ id: 'F1', name: 'Endless Energy', desc: 'Dash cooldown -1s.', fx: { dash: { cdAdd: -1 } } },
            { id: 'F2', name: 'Mighty Leap', desc: 'Dash damage +60%, bigger impact.', fx: { dash: { dmgMul: 1.6, splashMul: 1.3, pathMul: 1.6 } } }],
  den:     [{ id: 'F1', name: 'Big Family', desc: '+2 squad cats.', fx: { squad: { countAdd: 2 } } },
            { id: 'F2', name: 'Battle Hardened', desc: 'Squad +50% HP, +30% damage.', fx: { squad: { hpMul: 1.5, dmgMul: 1.3 } } }],
  library: [{ id: 'F1', name: 'Grand Archive', desc: '+3 gold, towers +10% damage.', fx: { incomeAdd: 3, global: { towerDmgMul: 1.1 } } },
            { id: 'F2', name: 'Royal Academy', desc: 'All units +15% damage and HP.', fx: { global: { unitDmgMul: 1.15, unitHpMul: 1.15 } } }],
};
const COST4 = { tower: 20, wall: 10, house: 9, farm: 6, mill: 14, mine: 16, dock: 16, melee: 16, ranged: 16, clinic: 16, castle: 30, post: 16, gym: 16, den: 16, library: 20 };
// most first upgrades need Castle Lv2; these cheap economy/defence ones don't
const EARLY_UPGRADE = { house: true, farm: true, wall: true, mill: true };
for (const k in TREES) { TREES[k].final = FINALS[k]; TREES[k].cost[3] = COST4[k]; }

// ---------- merging helpers ----------
function mergeFx(dst, fx) {
  for (const k in fx) {
    const v = fx[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) { dst[k] = dst[k] || {}; mergeFx(dst[k], v); }
    else if (k.endsWith('Mul')) dst[k] = (dst[k] == null ? 1 : dst[k]) * v;
    else if (k.endsWith('Add')) dst[k] = (dst[k] || 0) + v;
    else dst[k] = v;
  }
  return dst;
}
function treeNodes(type, path) {
  const T = TREES[type], out = [];
  if (!path || !path.length) return out;
  const b = T.opts.find(o => o.id === path[0]); out.push(b);
  if (path[1]) out.push(b.kids.find(o => o.id === path[1]));
  if (path[2]) out.push(T.final.find(o => o.id === path[2]));
  return out;
}
function nodeStats(type, path) {
  const T = TREES[type];
  const s = mergeFx({}, JSON.parse(JSON.stringify(T.base)));
  for (const n of treeNodes(type, path)) mergeFx(s, n.fx);
  return s;
}
