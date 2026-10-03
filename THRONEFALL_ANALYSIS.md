# Thronefall: Design Analysis for *Cat Tower*

Sources: game.wiki/thronefall (stats pulled from game files), throne-fall.github.io wiki, Steam store page, Wikipedia. Numbers are the game's internal units (speed ≈ world units/sec, damage per hit).

---

## 1. What Thronefall is

Thronefall is a minimalist strategy/tower-defense hybrid by Grizzly Games (Jonas Tyroller & Paul Schnepf, makers of *Islanders*). It entered Early Access in August 2023 and hit 1.0 in October 2024. The design goal was to strip a classic RTS down to its bones and add some direct hack-and-slash. There are 10 campaign maps: Neuland, Nordfels, Durststein, Frostsee, Uferwind, Sturmklamm, Wildbach, Moorweg, Freifort and Totend.

**What makes it work:**

1. **One button does everything.** The King rides around, and holding Space on a build spot spends gold. There's no menu, cursor or drag-select. Building is about *where your body is*.
2. **Pre-set build plots.** Every building goes on a hand-placed spot. The level designer, not the player, decides where houses, towers and walls *can* go. Your strategy is choosing *which* plots to fill and *in what order*.
3. **Day/night loop.**
   - **Day** has no time pressure. You spend gold and choose upgrades. Then you trigger night yourself.
   - **Night** is real-time defense. Enemies come from known spawn points along known paths. The King fights alongside towers and units.
   - **Dawn:** destroyed buildings are rebuilt for free. Every *surviving* economy building pays out, so protecting income matters.
4. **Wave preview.** Before each night, banners or icons at each spawn point show what's coming and from where. That lets you plan your defense.
5. **Win/lose.** Survive the last night to win. Lose if the **Castle Center** dies. The King can die but respawns at the castle after a timer, and can still move slowly while dead.

---

## 2. The King (player avatar)

| Stat | Value |
|---|---|
| HP | 100 (regenerates after a short delay without damage) |
| Move speed | 14 (sprint 23, dead 8) |
| Auto-attack cooldown | 1 s |

Each weapon has a **passive auto-attack** (fires at nearby enemies on its own) and an **active ability** on a cooldown. The 9 weapons are Bow & Dagger, Spear, Heavy Sword, Falchion & Traps, Battle Ax, Lightning Staff, Shadow Codex, Potion Vials and Blood Wand. The King can also **command units**: a rally call makes your squads follow you, and releasing them leaves them where you are.

---

## 3. Buildings & upgrade trees

### Castle Center: the heart
| Lvl | Cost | HP | Effect |
|---|---|---|---|
| 1 | 3 | 100 | Starts the kingdom |
| 2 | 7 | 300 | More build options + pick 1 of 4: Royal Training / Builder's Guild / Magic Armor / Assassin's Training |
| 3 | 20 | 700 | More build options + pick 1 of 4: Royal Mastery / Commander / Castle-Up / Godly Curse |

Castle level **gates** which other plots appear. That's how the map "unfolds" over the run.

### Towers: the core of this project
| Lvl | Cost | Effect |
|---|---|---|
| 1 | 3 | Basic arrow tower: 100 HP, 8 dmg/shot, **×2 vs flying, ×0.6 vs siege** |
| 2 | 5 | Choose a specialization (below) |
| 3 | 15 | Choose a spire (below) |

**Level 2 options:**
- **Castle Tower** (+150 HP): faster attacks, the standard all-rounder.
- **Sniper Tower** (+0 HP): higher damage, longer range, slower fire.
- **Armored Tower** (+350 HP): heavy armor, gains a shield when hit.
- **Bunker Tower** (+75 HP): short range, unique attack pattern.

**Level 3 options:**
- **Archer's Spire** (+350 HP): faster attacks plus an extra arrow.
- **Ballistic Spire** (+0 HP): 80 dmg bolts that slow, the best single-target damage.
- **Fire Spire** (+250 HP): splash damage that leaves burning oil pools.
- **Healing Spire** (+750 HP): heals allies (-15 per pulse, range 40) instead of attacking.

### Other buildings
| Building | Cost (L1/L2/L3) | Role |
|---|---|---|
| Wall / Gate | 3 / 2 | 240 → 640 HP. Blocks pathing; enemies must chew through it. |
| Barricade | 4 | Doesn't block. Damages and slows fast enemies. |
| House | 2 / 2 | +1 / +2 gold per night, 20 HP. Usually clustered by the castle. |
| Mill + Fields | 3/4/6 + 1 each | Mill unlocks fields (+1 each, 10 HP, fragile). Mill L3 = +6. |
| Gold Mine | 5 | +6 the first night, then −1 each night. |
| Fishing Harbour | 3 / 7 | Builds 1 boat per morning (max 5), +1 each. |
| Bridge | 2 | +1 gold and opens a new area *and a new enemy route*. |
| Barracks | 4 / 8 / 16 | Melee squad: Knights / Spearmen / Flails / Berserks. +4 units per level. |
| Archery Range | 4 / 8 / 16 | Ranged squad: Longbow / Crossbow / Hunters / Fire Archers. |
| Hero's Quarters | – | One hero: Golem / Firewing / Lizard Rider / Support Mage. |
| Shrine | 3 | 777 HP. Shoots enemies and pays gold if collected in the morning. |
| Blacksmith / Royal Forge / Temple | 4–25 | Multi-night research: army buffs, King buffs, risky buffs. |
| Summoning Circle | 1 | 10 HP. Spawns converted enemies to fight for you. |

**Pattern:** every building's first upgrade is a **branching choice** and later upgrades scale that choice. That's how Thronefall packs depth into a one-button interface.

---

## 4. Enemy roster (complete)

Enemies come in four families. That affects targeting rules and damage multipliers: towers deal ×2 to flyers and ×0.6 to siege; Berserks and Fire Archers deal bonus damage to siege.

### Human (10)
| Enemy | HP | Dmg | Spd | Behavior |
|---|---|---|---|---|
| Weakling / Peasant | 8.7 | 1 | 4 | Fodder, comes in swarms |
| Swordsman | 25 | 2.5 | 5 | Basic melee; charges buildings and units |
| Archer | 20 | 2.5 | 5 | Ranged, hangs behind melee. 2 s cooldown |
| Pikes | 25 | 3.5 | 5 | Anti-cavalry: slows the King and hurts him more if he rides in |
| Flail | 55 | 2.2 | 5 | Melee splash around itself |
| Elite Crossbowman | 40 | **15** | 4 | Heavy ranged sniper |
| Barrel Knight | 100 | 3.5 | 8 | Wooden "enchanted" warrior. **Counts as siege**, armored vs ranged, fast |
| Dark Warrior | 135 | 10 | 7 | Anti-melee: deals half damage to melee units |
| Ogre | 200 | 20 | 4 | Tank, half damage vs units. The tutorial's final boss wave |
| Flying Mage* | 45 | 2 | 7 | **Flying**, splash magic, *prefers your units* |

### Monster (22)
| Enemy | HP | Dmg | Spd | Behavior |
|---|---|---|---|---|
| Racer | 35 | 2.5 | 10 | Rolling ball that **rushes the Castle Center**, ignoring everything else. Armored vs the King |
| Hunterling | 30 | 5 (+10 vs King) | 10 | **Hunts the King** |
| Monster Rider | 40 | 3 | 11 | Fast cavalry, comes in floods |
| Wasp | 25 | 2.5 | 8 | **Flying**, ignores walls, **targets economy buildings** |
| Bloodwing | 50 | 3 | 12 | Faster, tougher flyer |
| Fury | 75 | 30 | 3 | Big **flyer** with slow, dodgeable artillery shots at **defenses** |
| Exploder | 65 | **90 AoE** | 9 | Suicide bomber that detonates on buildings or on death |
| Fire Snail | 45 | 1.2 | 3 | Very slow, explodes on death |
| Slime | 12.5 | 1.2 | 5 | Tiny, swarms |
| Spiky Slime | 50 | 3.6 | 5 | Bigger slime |
| Giraffe Slime | 30 | 1.5 | 5 | Ranged slime |
| Strong Giraffe Slime | 100 | 3.5 | 7 | Bulky ranged slime |
| Small / Medium / Big Spider | 12.5 / 50 / 800 | 2.4 / 6 / 12 | 15 / 14 / 10 | Very fast melee. Big Spider is mini-boss tier |
| Moleman | 60 | 5 | 5 | **Burrows** underground to its target, popping up past walls |
| Moleman Archer | 50 | 3.75 | 5 | Burrowing ranged unit, ×1.4 vs units |
| Ghost | 100 | 6.5 | 3.3 | **Anti-tower**: ×1.55 damage vs towers |
| Flogre | 275 | 9 | 4 | Splash-hitting brute |
| Quicksling | 55 | 9.8 | 3 | Rapid-fire ranged that shoots randomly at everything in range |
| Thing | 1100 | 2.2 | 4 | Giant HP sponge with fast splash |

### Siege (5, plus Barrel Knight)
| Enemy | HP | Dmg | Spd | Behavior |
|---|---|---|---|---|
| Catapult | 45 | **150** | 2 | Long-range artillery, **only hits buildings**. Fragile, so dive it |
| Ram | 250 | 15 | 2.25 | Armored vs ranged, beelines to walls and buildings |
| Wheel | 180 | 3.5 | 15 | Fastest ground unit. Rolls through, splashing everything |
| Iron Tower | 200 | 3.5 | 5 | Mobile siege tower that shoots defenders while advancing |
| Windboat | 300 | 15 | 3 | Waterborne ranged siege |

### Bosses (one per late map)
Shadow in the Water (Frostsee), Strange Statue ×4 (Sturmklamm), Elara the Vile (Moorweg, 15,000 HP fire-AoE caster), Iron Castle (Freifort), Corrupt King (Totend, 80 dmg melee, multi-phase), Eldermole (10,000 HP).

**Elites** have ×4 HP and ×3 damage, with a gold outline.

### What the roster is *for*
Each enemy tests one thing:

- **Fodder** (Weakling, Slime, Small Spider) tests area damage.
- **Tanks** (Ogre, Thing, Flogre) test single-target damage.
- **Runners** (Racer, Monster Rider, Wheel) test whether your defense actually blocks the path to the castle.
- **King-hunters** (Hunterling, Pikes) punish a reckless King.
- **Flyers** (Wasp, Bloodwing, Fury, Flying Mage) skip walls, so you need tower coverage over economy buildings.
- **Ranged** (Archer, Crossbow, Quicksling, Giraffe Slime) out-range melee units.
- **Siege** (Catapult, Ram, Iron Tower) out-range or out-tank towers, so the King or Berserks have to dive them.
- **Specialists** (Ghost vs towers, Dark Warrior vs melee, Moleman vs walls, Exploder vs clusters) each counter one specific defense.

---

## 5. Wave pacing (Neuland tutorial and Nordfels as models)

**Neuland** (8 nights, 0 starting gold, one east spawn):
| Night | Wave | Gold reward |
|---|---|---|
| 1 | 5 Weaklings | 6 |
| 2 | 6 Weaklings | 3 |
| 3 | 15 Weaklings | 4 |
| 4 | 25 Weaklings | 6 |
| 5 | 25 Weaklings | 6 |
| 6 | 7 Archers + 15 Weaklings | 8 |
| 7 | 10 Archers + 20 Weaklings | 8 |
| 8 | **4 Ogres** (finale) | 0 |

**Nordfels** (13 nights, 5 spawns): each night introduces one new threat, then the next night combines it with old ones. Nights 1–3 bring Swordsmen and Hunterlings. Night 4 is Archers *from all directions*. Night 5 is Racers rushing the castle. Night 7 is Wasps from the west. Night 9 is Ogres plus Wasps. The finale (night 13) has every type at once, 203 enemies including 16 Catapults. Night 12 is deliberately quiet ("light scouting wave"), a breather before the finale.

**Pacing rules:**

1. Introduce one new enemy per night, alone or with fodder.
2. Change the *spawn direction* to force rebuilding and repositioning.
3. Spike, then breathe.
4. The final night is a "greatest hits" combination at 3–5× normal size.
5. Wave gold falls toward 0 at the end. The economy has to be built early.

---

## 6. Map layout analysis

From the map write-ups (building counts, spawn descriptions, tactical tips) and the visual style:

**Shape and boundaries**
- Each map is a **closed, hand-sculpted diorama**. Its edges are cliffs, mountains, sea, dense forest or a river. You never see a "map edge" as such.
- The **Castle Center sits roughly in the middle**, usually a bit toward the *safest* side (Wildbach: "the castle area is the only side without enemy spawns").
- **Terrain is the main design tool.** Rivers (Nordfels's U-shaped river, Wildbach's bridges), mountain corridors (Sturmklamm), lakes (Frostsee) and swamps (Moorweg) carve the map into **lanes**.

**Lanes and spawns**
- **1–5 ground spawn points** sit at the map edges. Each feeds one road or lane that winds toward the castle, with switchbacks and bends to give towers time to shoot.
- **Flyers get their own directions** (Nordfels: west, south, northeast), often over terrain ground units can't cross, such as sea or mountains.
- Lanes **converge** near the castle, so the inner ring is the final kill zone.

**Plot placement follows strict rings**
| Ring | Contents | Design intent |
|---|---|---|
| Inner (around castle) | Houses, 1–2 towers, barracks | Safe income; the last line |
| Middle | Towers in pairs flanking each lane, walls across lanes, shrines | The kill zones |
| Outer / far side | Mills + fields (fragile), gold mines, harbours on shore | High reward, exposed, and it tempts you to overextend |
| Lane mouths | Wall + 2 tower plots at each **chokepoint** (bridge exits, cliff gaps) | Players funnel enemies here |

- **Walls are placed across lanes** at narrow points. Tower plots are almost always **paired just behind the wall, one on each side of the lane**, so the wall holds enemies inside tower range.
- Economy is often placed **opposite** the main spawn, but there's always some valuable stuff on the exposed side to create tension.
- **Unlocking:** some plots appear only after Castle Lv2/3 or after building a bridge, so the map grows outward.
- **Numbers** (towers / walls / houses): Neuland 3 / 1 / 7, Nordfels 10 / 16 / 11, Wildbach 17 / 14 / 10, Freifort 31 / 21 / 13. A short single-level game should sit near Neuland/Nordfels scale: **6–9 tower plots, 3–4 walls, 6–8 houses, 2–3 spawn lanes**.

**Visual language**
- Low-poly, flat-shaded, top-down at a slight angle, with strongly saturated pastel palettes per biome.
- Unbuilt plots are faint outlines with a gold-cost badge. The cost shows as coins above the plot when the King is near.
- At night the palette shifts to deep blue and lamps glow. Enemy spawn arrows and banners mark the lanes.
- The UI is tiny: a gold counter, a night counter, wave-preview icons at spawns, and HP bars only when damaged.

---

## 7. Translating to *Cat Tower*

| Thronefall | Cat Tower |
|---|---|
| King on horse | **King Whiskers**, a crowned cat with a royal banner, leading a squad of cats |
| Hold Space on plot to build | **Walk onto the plot and stay there** to build or upgrade. A ring fills while you stand still; walk away and it slowly drains |
| Tower upgrade branches | **Replaced** by a 3×3 tree for every building (see section 8). Each tree's options appear in a side panel, and you stand on numbered points to buy them |
| Archers in towers | **Cats perched in the tower tops**, with different cats per specialization |
| Houses / castle center | Cat homes. Their residents talk in **speech bubbles** |
| Human / Monster / Siege enemies | **Robots**, each with a distinct silhouette and color per type |

### Robot equivalents (all Thronefall enemy types)
| Thronefall | Robot | Visual cue |
|---|---|---|
| Weakling / Peasant | **Scrap Bot** | Tiny rusty can on legs |
| Swordsman | **Blade Bot** | Grey humanoid with a saw-blade arm |
| Archer | **Laser Bot** | Thin bot with a red emitter eye |
| Pikes | **Prong Bot** | Long electric fork. Slows and zaps the cat leader |
| Flail | **Spin Bot** | Spinning ball-and-chain arms |
| Elite Crossbowman | **Railgun Bot** | Heavy shoulder cannon, blue charge glow |
| Barrel Knight | **Barrel Bot** (siege) | Oil-drum body, plated |
| Dark Warrior | **Shadow Bot** | Black and purple, anti-melee |
| Ogre | **Brute Bot** | Huge hulking tank, yellow hazard stripes |
| Racer | **Roller Bot** | Ball-bot that beelines for the Cat Castle |
| Hunterling | **Hound Bot** | Quadruped that hunts the leader |
| Monster Rider | **Bike Bot** | Monowheel bike |
| Wasp | **Drone** | Quadcopter that targets houses |
| Bloodwing | **Jet Drone** | Fast red delta-wing |
| Fury | **Bomber Blimp** | Slow flying artillery |
| Flying Mage | **Tesla Drone** | Floating coil that shoots arcs at cats |
| Exploder / Fire Snail | **Boom Bot** / **Fuse Snail** | Bomb with a lit fuse / slow tracked bomb |
| Slime / Spiky / Giraffe | **Nano Blob / Spike Blob / Turret Blob** | Grey goo blobs |
| Spiders (S/M/L) | **Spider Bots** | Tiny, medium and giant |
| Moleman (+Archer) | **Drill Bot** (+Drill Gunner) | Burrows under walls |
| Ghost | **Glitch Bot** | Translucent flickering hologram, anti-tower |
| Flogre / Thing | **Smash Mech / The Monolith** | Splash brutes |
| Quicksling | **Minigun Bot** | Sprays randomly |
| Catapult | **Mortar Bot** | Lobs shells at buildings only |
| Ram | **Battering Bot** | Piston-ram truck |
| Wheel | **Saw Wheel** | Giant rolling buzzsaw |
| Iron Tower | **Siege Walker** | Walking gun tower |
| Windboat | **Hover Barge** | Floats over water |
| Bosses | **MEGA-VAC 9000** | Giant robot vacuum, the final boss |

A single level can't feature all of these as main threats. The plan is to **introduce them across 10 nights in lanes**, the way Nordfels does, and to use the finale as the "greatest hits" wave.

---

## 8. Upgrade design: where Cat Tower departs from Thronefall

Thronefall gives a building a level-2 pick and a level-3 pick, and the two are **independent**: any spire can follow any specialization. Cat Tower uses a **dependent 3×3 tree** for *every* building. You choose 1 of 3 branches, and that branch decides which 3 finishers you can pick from. This is closer to how towers upgrade in other TD games:

| Idea | Borrowed from |
|---|---|
| A base tower that turns into one of three tower *families*, then specializes | Kingdom Rush (Archer / Mage / Artillery, then level-4 specializations) |
| Economy and support paths on non-combat buildings (farms, banks, villages, markets) | Bloons TD 6 (Banana Farm, Monkey Village, Monkey Bank) |
| Detection, debuffs, slows and armour-piercing as path identities | Bloons TD 6 camo detection / Glue / Ice; Warcraft III TD frost towers |
| Trap walls, tar moats, spike and fire trenches | Orcs Must Die, Stronghold |
| Dash styles (leap, blink, trail, double dash) | Hades, Diablo, Dota |

New building types added for Cat Tower:

- a Melee Hall and a Ranged Hall for **each** road;
- a Cat Clinic, which trains healer cats;
- a Gold Mine, which upgrades toward either money or unit power;
- a Fishing Dock, which upgrades toward either defense or money;
- a Scratching Post, which changes the King's auto-attack;
- a Pounce Gym, which changes the King's dash;
- a Squad Den, which changes the cats that follow the King;
- a Grand Library, which gives kingdom-wide upgrades.

The full tree for every building is in `UPGRADES.md`.
