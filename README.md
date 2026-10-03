# Kitty Kingdom: And the Robot Menace

A Thronefall-style tower defense game that runs in a single 960×640 page. You play King Whiskers, defending a cat kingdom from robots over **100 nights**. A **MEGA-VAC 9000** boss arrives every 10th night.

## How a run starts
- **Day 1:** your Castle is rubble, you have 4 gold and no squad. Only the Night Bell stands.
- **Night 1:** fight a handful of Scrap Bots yourself. Walk close and the King attacks on his own; Space dashes. If the King falls before the Castle is rebuilt, the run is over.
- **Day 2:** the scrap pays for the Castle (5 gold), which is Castle level 1 and unlocks the first building spots. Build the **Squad Den** to get the 4 cats that follow the King.
- **Nights 2 to 10** are handcrafted, one new robot idea per night. Nights 11 to 100 are generated from a fixed seed, so they are the same every run, and they grow stronger each night.
- **Late game:** once the Grand Library is fully upgraded it offers **Kingdom Research**, a repeatable boost that keeps late-game gold useful.

**Play:** open `index.html` in a browser.

## Controls (movement only)
| Key | Action |
|---|---|
| WASD / Arrows | Move the King; his squad follows. Moving also starts the game and restarts it after a win or loss |
| Shift (hold) | Run at double speed. The King stops attacking and his squad breaks off to run to him |
| Stand still on a glowing spot | Build there; coins fly in while you wait |
| Stand still on a numbered point (1/2/3) | Buy that upgrade for the nearest building |
| Space | Dash attack. Every dash style always moves the King |
| Stand on the bell | Start the night |
| M | Mute music and sound |

## Music
The soundtrack is `Paw Patrol Protocol.mp3`, which must stay in the same folder as `index.html`. It plays at a gentle volume, loops and starts on your first key press, because browsers block audio until then. `python3 tools/build.py --embed` also embeds it in `cattower_standalone.html`.

## Saving
- The game saves at the start of every day, in memory and in the browser's local storage.
- On the game-over screen, moving restarts that same day from its beginning, before anything you built or spent that day.
- **Erase everything:** stand for 3 seconds on the red **RESET GAME** spot in the far bottom-right corner of the map, past the south bridge. This deletes all saved data and restarts from Day 1.
- Reloading the page offers to continue from the saved day. Hold Space for 2 seconds on the title screen to start a new kingdom instead.

## Enemy movement
- Robots only move forward along their road. They only target things level with them or further ahead.
- After a fight they carry on from where they are, instead of walking back to their last waypoint.

## Buildings
Every building has four levels. At level 2 you choose 1 of 3 branches, at level 3 you choose 1 of 3 finishers within that branch, and at level 4 you choose 1 of 2 capstones. Higher levels are gated by Castle level: level 2 needs Castle level 2 (except houses, farms, walls and the windmill), level 3 needs Castle level 3, and level 4 needs Castle level 4. Ranged Halls, the Clinic, Post, Gym, Den and Library can only be built once the Castle reaches level 2. The full list, with the tower-defense game that inspired each choice, is in **`UPGRADES.md`**.

| Building | Role | Branches |
|---|---|---|
| Cat Castle | Heart of the kingdom; shoots arrows | Royal Keep / Royal Treasury / Throne Room |
| Cat Tower (×21: 10 near the castle, 5 back-line spots covering the air routes, 6 forward spots near the spawns that unlock at Castle level 2 or 3) | Main defense | Archer Loft / Mystic Spire / Catapult Roost |
| Wall (×3) | Blocks a road | Stone Wall / Trap Line / Gatehouse |
| Cat House (×8) | Gold | Cottage / Watch House / Cat Café |
| Windmill | Gold; required before any farm can be planted | Improved Plow / Explosive Trap / Wind Spirits |
| Catnip Farm (×5) | Gold, fragile | Catnip Field / Scarecrow Field / Feed Farm |
| Gold Mine (×2) | Gold, or upgrades for your units | Gold Vein / Forge Tunnels / Crystal Cavern |
| Fishing Dock (×2) | A little defense plus gold | Fishing Wharf / Harbour Battery / Lighthouse |
| Melee Hall (one per road) | Melee cats | Guardians / Duelists / Lancers |
| Ranged Hall (one per road, Castle Lv2) | Ranged cats | Marksmen / Apprentice Mages / Skirmishers |
| Cat Clinic | Healer cats | Field Medics / Menders / Herbalists |
| Scratching Post | The King's auto-attack | Claw Training / Yarn Slinger / Hairball Magic |
| Pounce Gym | The King's dash | Power Pounce / Zoomies / Tail Swipe |
| Squad Den (level-1 building) | Gives the King his 4-cat squad, then upgrades it | Warband / Archer Kittens / Elite Guard |
| Grand Library | Kingdom-wide upgrades, then repeatable Kingdom Research | School of War / School of Coin / School of Magic |

## Interface
- Walk toward a red spawn banner during the day and a sidebar lists tonight's robots on that route: what each one does, how many are coming, and which are Elite, flying or siege.
- Building spots stay hidden until the Castle reaches their level. Locked upgrades (and farm spots waiting for a Windmill) show a **padlock**. Their sidebar explains exactly why they're locked and what to do, for example "Needs Castle level 2 (yours is level 1). Walk to the Castle and buy its next upgrade (8 gold)."
- During the day, the nearest building shows a side panel with only what you can buy there right now: the building itself, or its current upgrade choices. Locked upgrades show which Castle level they need.
- Cost coins float above each spot: up to 5 coins, or a single coin with a count such as "x6" for anything above 5.
- The panel sits on the side of the screen opposite the building. A building on the right gets its panel on the left, and the other way round. A dashed line links the panel to the building.
- Only that building's numbered upgrade points are shown, so the map stays readable.
- Speech bubbles from cats in buildings are hidden whenever they would cover a robot, the King or the panel.
- The King wears a large glowing gold crown, carries a royal blue banner and stands on a gold ring.
- The world is 1440×960 and the camera follows the King. Red arrows at the screen edge point to robots that are off screen.

## AI sprites (image generation + background removal)
Until you generate sprites, the game draws everything procedurally. To replace that art:

```bash
pip3 install pillow
python3 tools/gen_sprites.py          # uses OPENAI_API_KEY + REPLICATE_API_KEY from .env.local
```

- **What gets made:** 134 sprites, including a base and per-branch art for every building, all 12 tower forms and their tower-top cats, unit cats for each branch, and the King and robots.
- **How:** images come from gpt-image-1 and their backgrounds are removed through Replicate. If Replicate fails, the script falls back to a local cut-out.
- **Fallback chain:** if a leaf sprite such as `b_tower_B1` is missing, the game uses the branch sprite (`b_tower_B`), then the base sprite (`b_tower`), then procedural art.
- **Useful flags:**
  - `--only key1,key2 --force` regenerates specific sprites.
  - `--quality high` asks for higher-quality images.
  - `--bg openai` uses OpenAI's native transparency instead of Replicate.
  - `--rebg` reruns background removal only.
  - `--embed` also writes `cattower_standalone.html` with every PNG inlined.

## Project layout
```
index.html                 built game (open this)
src/data.js                map, lanes, plots, robots, 10 nights, dialogue
src/trees.js               all upgrade trees (stats + inspirations)
src/render.js              sprite loader + procedural cats, robots, buildings, terrain
src/game.js                simulation: stat engine, pads/panel, AI, combat, King, units
src/draw.js                camera, scene, side panel, bubbles, HUD, input, loop
tools/build.py             bundles src/ -> index.html   (python3 tools/build.py [--embed])
tools/gen_sprites.py       AI sprite pipeline;  tools/sprites.json = prompts + sizes
tools/gen_upgrades_doc.js  regenerates UPGRADES.md from src/trees.js
tools/check_spacing.js     checks that spots and upgrade points never overlap (--fix nudges them apart)
```
After editing `src/`, run `python3 tools/build.py`.
