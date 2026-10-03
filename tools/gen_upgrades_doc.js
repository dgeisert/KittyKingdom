// node tools/gen_upgrades_doc.js  -> regenerates UPGRADES.md from src/trees.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const T = new Function(fs.readFileSync(path.join(root, 'src/trees.js'), 'utf8').replace("'use strict';", '') + '; return TREES;')();
let o = '# Kitty Kingdom: Upgrade Trees\n\n';
o += 'Every building in Kitty Kingdom has four levels. Level 1 is the building itself. Level 2 is a choice of 3 branches, and level 3 is a choice of 3 finishers that depend on the branch. Level 4 is a choice of 2 capstones, which are the same for every route on that building. Choices are permanent for the run.\n\n';
o += '**Castle gates:**\n\n- Level 2 needs Castle level 2, except for Houses, Farms, Walls and the Windmill.\n- Level 3 needs Castle level 3.\n- Level 4 needs Castle level 4.\n- Ranged Halls, the Clinic, Scratching Post, Pounce Gym, Squad Den and Grand Library can only be built once the Castle is level 2.\n\n';
o += "In game, the nearest building's choices appear in a panel on the side of the screen opposite the building. Walk the King onto the matching numbered point (1, 2 or 3) and stand still to buy it. The panel only shows what you can buy right now.\n\n";
o += '## How this differs from Thronefall\n\n';
o += "- **Thronefall:** a tower's level-2 and level-3 picks are independent. Any spire can follow any specialization, and only a few buildings have choices at all.\n";
o += '- **Kitty Kingdom:** every pick commits you to a branch, and each branch has its own three finishers. Every building type works this way, including houses, walls, farms, docks and mines.\n\n';
o += 'Once the Grand Library is fully upgraded it offers **Kingdom Research** every day. Each research gives all towers, cats, buildings and the King +6% damage and HP, starting at 25 gold and costing 15 more each time.\n\n';
o += 'Ideas are borrowed from other tower-defense and strategy games:\n\n';
o += '- **Kingdom Rush:** the base tower turns into Archer, Mage or Artillery, then specializes, the way Kingdom Rush towers branch at level 4.\n';
o += '- **Bloons TD 6:** money, support and detection paths, such as farms, villages, camo detection and banks.\n';
o += '- **Orcs Must Die and Stronghold:** traps and walls.\n';
o += '- **Warcraft III TD and Plants vs Zombies:** auras, slows and economy plants.\n';
o += '- **Hades and Diablo:** the dash styles.\n\n';
o += 'Each option below names the game that inspired it.\n\n';
for (const k in T) {
  const t = T[k];
  o += '## ' + t.name + '\n\n' + t.blurb + ' Costs: build ' + t.cost[0] + ', level 2 ' + t.cost[1] + ', level 3 ' + t.cost[2] + ', level 4 ' + t.cost[3] + ' gold.\n\n| Branch | Finisher | Effect | Inspired by |\n|---|---|---|---|\n';
  for (const b of t.opts) { o += '| **' + b.id + '. ' + b.name + '** | | ' + b.desc + ' | ' + b.from + ' |\n'; for (const c of b.kids) o += '| | ' + c.id + '. ' + c.name + ' | ' + c.desc + ' | ' + c.from + ' |\n'; }
  o += '| **Level 4** | ' + t.final.map(f => f.name + ': ' + f.desc).join('<br>') + ' | any route | cost ' + t.cost[3] + ' |\n\n';
}
fs.writeFileSync(path.join(root, 'UPGRADES.md'), o);
console.log('wrote UPGRADES.md');
