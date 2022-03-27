# AutoTrimps - Zek Fork



## Discussion / Discord Channel
<a href="https://discord.gg/Ztcnfjr"><img src="https://discord.com/assets/3437c10597c1526c3dbd98c737c2bcae.svg" width=48></a>
Discord is a chat program. Come to talk about AutoTrimps, for help, or suggestions for new features : https://discord.gg/Ztcnfjr



## Current Version - Ongoing Development!
- Zek Fork. All changes made by Zek using GenBTC as base. Currently up-to-date as of 06/2020.
- U1 code heavily rewritten and changed by Psycho-Ray. Please report any bugs you may find.



## AT Script Installation

- Browser

Step 1: Install TamperMonkey

https://www.tampermonkey.net/

Step 2: 

Click this link: https://github.com/Psycho-Ray/AutoTrimps/raw/gh-pages/.user.js

If clicking the link does not work, copy the contents of user.js into a new script inside tampermonkey. 

If you are unsure how to do that, copy this:

```var script = document.createElement('script');
script.id = 'AutoTrimps-Zek';
script.src = 'https://Psycho-Ray.github.io/AutoTrimps/AutoTrimps2.js';
script.setAttribute('crossorigin',"anonymous");
document.head.appendChild(script);
```

Press F12 inside the game, this opens the console, and paste the text into it and hit enter, this will load the script. You will have to do this everytime you refresh the game though so I recommend getting tampermonkey to do it for you!

Step 3: 

Configure settings. Will NOT work as intended with default settings. 

- Steam

Step 1: 

Download <a href="https://github.com/Psycho-Ray/AutoTrimps/blob/gh-pages/modules/mods.js">mods.js</a> from this directory (right click raw and save link as...), or copy it and make your own mods.js in a text file.

Step 2: 

Navigate to Steam\steamapps\common\Trimps\mods and place mods.js into the folder. If you have other mods installed then just copy the text in AT's mods.js and place it somewhere in the mods.js file.

Step 3: 

Configure your settings. AT will not work properly if they are not configured!



## Graphs only Script Installation

- Browser

Step 1: Install TamperMonkey

https://www.tampermonkey.net/

Step 2: 

Click this link: https://github.com/Psycho-Ray/AutoTrimps/blob/gh-pages/GraphsOnly.user.js

If clicking the link does not work, copy the contents of GraphsOnly.user.js into a new script inside tampermonkey. 

If you are unsure how to do that, copy this:

```var script = document.createElement('script');
script.id = 'AutoTrimps-Graphs';
script.src = 'https://Psycho-Ray.github.io/AutoTrimps/GraphsOnly.js';
script.setAttribute('crossorigin',"anonymous");
document.head.appendChild(script);
```

Press F12 inside the game, this opens the console, and paste the text into it and hit enter, this will load the script. You will have to do this everytime you refresh the game though so I recommend getting tampermonkey to do it for you!

Step 3: 

Enjoy your Graphs!

- Steam

Step 1: 

Download <a href="https://github.com/Psycho-Ray/AutoTrimps/blob/gh-pages/modsGRAPH.js">modsGRAPH.js</a> from this directory (right click raw and save link as...), or copy it and make your own modsGRAPH.js in a text file.

Step 2: 

Rename the file to just mods.js (Right click the file, rename, then remove GRAPH). Sorry but I can't have 2 mods.js named the same so Graphs Only users have to deal with it :(

Step 3: 

Navigate to Steam\steamapps\common\Trimps\mods and place mods.js into the folder. If you have other mods installed then just copy the text in AT's mods.js and place it somewhere in the mods.js file.

Step 4: 

Enjoy your Graphs!



## Equipment && Upgrade's colour explaination:
Updated Explanation on Discord: <a href="https://discord.com/channels/371177798305447938/962199816270651564">AT FAQ</a>

## Troubleshooting

**Combat won't start** - Make sure you have enabled the Better Auto Fight/Vanilla setting in Combat & Stance Settings. If you're not on dark theme, you may see a tiny thin black bar in combat, click it to show this setting.