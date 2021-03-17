//Helium
var upgradeList = ['Miners', 'Scientists', 'Coordination', 'Speedminer', 'Speedlumber', 'Speedfarming', 'Speedscience', 'Speedexplorer', 'Megaminer', 'Megalumber', 'Megafarming', 'Megascience', 'Efficiency', 'TrainTacular', 'Trainers', 'Explorers', 'Blockmaster', 'Battle', 'Bloodlust', 'Bounty', 'Egg', 'Anger', 'Formations', 'Dominance', 'Barrier', 'UberHut', 'UberHouse', 'UberMansion', 'UberHotel', 'UberResort', 'Trapstorm', 'Gigastation', 'Shieldblock', 'Potency', 'Magmamancers'];

//Psycho Ray
MODULES["upgrades"] = {};
MODULES["upgrades"].autoGigas = true;

function gigaTargetZone() {
    //Init
    var targetZone = 60;
    var daily = game.global.challengeActive == 'Daily';
    var runningC2 = game.global.runningChallengeSquared;
    var challengeActive = game.global.challengeActive;
    
    //Check Void Zone
    var voidZone = (daily) ? getPageSetting('DailyVoidMod') : getPageSetting('VoidMaps');
    if (!runningC2 && voidZone) targetZone = Math.max(targetZone, voidZone-5);
    
    //Check Helium Challenge Zone
    var challengeZone = (challengeActive) ? game.challenges[challengeActive].heliumThrough : false;
    if (!runningC2 && challengeZone) targetZone = Math.max(targetZone, challengeZone-5);
    
    //Check Portal Settings Zone
    var portalZone = 0;
    if (autoTrimpSettings.AutoPortal.selected == "Helium Per Hour") portalZone = (daily) ? getPageSetting('dHeHrDontPortalBefore') : getPageSetting('HeHrDontPortalBefore');
    else if (autoTrimpSettings.AutoPortal.selected == "Custom") portalZone = (daily) ? getPageSetting('dCustomAutoPortal') : getPageSetting('CustomAutoPortal');
    if (!runningC2 && portalZone) targetZone = Math.max(targetZone, portalZone-6);
    
    //C2 Zone
    //TODO

    return targetZone;
}

function autoGiga(targetZone, metalRatio, slowDown, customBase) {
    //Pre Init
    if (!targetZone) targetZone = gigaTargetZone();
    if (!metalRatio) metalRatio = 0.5;
    if (!slowDown) slowDown = 2;
    
    //Init
    var base = (customBase) ? customBase : getPageSetting('FirstGigastation');
    var baseZone = game.global.world;
    var rawPop = game.resources.trimps.max - game.unlocks.impCount.TauntimpAdded;
    var gemsPS = getPerSecBeforeManual("Dragimp");
    var metalPS = getPerSecBeforeManual("Miner");
    var megabook = (game.global.frugalDone) ? 1.6 : 1.5;
    
    
    //Calculus
    var nGigas = Math.min(Math.floor(targetZone-60), Math.floor(targetZone/2 - 25), Math.floor(targetZone/3 - 12), Math.floor(targetZone/5), Math.floor(targetZone/10 + 17), 39);
    var metalDiff = Math.max((0.1 * gemsPS) / (metalPS * metalRatio), 1);

    var delta = 3;
    for (var i=0; i<10; i++) {
        //Population guess
        var pop = 6 * Math.pow(1.2, nGigas)*10000;
        pop *= base * (1 - Math.pow(5/6, nGigas+1)) + delta*(nGigas+1 - 5*(1 - Math.pow(5/6, nGigas+1)));
        pop += rawPop - base*10000;
        pop /= rawPop;
        
        //Delta
        delta = Math.pow(megabook, targetZone - baseZone);
        delta *= metalDiff * slowDown * pop;
        delta /= Math.pow(1.75, nGigas);
        delta = Math.log(delta);
        delta /= Math.log(1.4);
        delta /= nGigas;
    }
    
    return delta;
}

function firstGiga(forced) {
    //If it's not the first giga, or we have less than two warpstations, or we can afford all of our coordinations, skip it
    if (!forced && (game.upgrades.Gigastation.done > 0 || game.buildings.Warpstation.owned < 2 || canAffordCoordinationTrimps())) return false;
    
    setPageSetting('FirstGigastation', game.buildings.Warpstation.owned);
    setPageSetting('DeltaGigastation', autoGiga());
    
    return true;
}

function buyUpgrades() {
    //For every upgrade available...
    for (var upgrade in upgradeList) {
        upgrade = upgradeList[upgrade];
        var gameUpgrade = game.upgrades[upgrade];
        var available = (gameUpgrade.allowed > gameUpgrade.done && canAffordTwoLevel(gameUpgrade));
        var fuckbuildinggiga = (bwRewardUnlocked("AutoStructure") == true && game.talents.deciBuild.purchased && getPageSetting('hidebuildings')==true && getPageSetting('BuyBuildingsNew')==0);
        
        //Can't buy it, ignore it
        if (!available) continue;
        
        //Coord & Amals
        if (upgrade == 'Coordination' && (getPageSetting('BuyUpgradesNew') == 2 || !canAffordCoordinationTrimps())) continue;
        if (upgrade == 'Coordination' && getPageSetting('amalcoord')==true && getPageSetting('amalcoordhd') > 0 && calcHDratio() < getPageSetting('amalcoordhd') && ((getPageSetting('amalcoordt') < 0 && (game.global.world < getPageSetting('amalcoordz') || getPageSetting('amalcoordz') < 0)) || (getPageSetting('amalcoordt') > 0 && getPageSetting('amalcoordt') > game.jobs.Amalgamator.owned && (game.resources.trimps.realMax() / game.resources.trimps.getCurrentSend()) > 2000))) continue;
        
        //WS
        if (upgrade == 'Coordination' && getEmpowerment() == "Wind" && 
            ((getPageSetting('AutoStance') == 3 && game.global.challengeActive != "Daily" && getPageSetting('WindStackingMin') > 0 && game.global.world >= getPageSetting('WindStackingMin') && calcHDratio() < 5) || 
                (getPageSetting('use3daily') == true && game.global.challengeActive == "Daily" && getPageSetting('dWindStackingMin') > 0 && game.global.world >= getPageSetting('dWindStackingMin') && calcHDratio() < 5)))
                    continue;
        
        if (upgrade == 'Coordination' && 
            ((getPageSetting('AutoStance') == 3 && game.global.challengeActive != "Daily" && getPageSetting('wsmax') > 0 && getPageSetting('wsmaxhd') > 0 && game.global.world >= getPageSetting('wsmax') && calcHDratio() < getPageSetting('wsmaxhd')) || 
                (getPageSetting('use3daily') == true && game.global.challengeActive == "Daily" && getPageSetting('dwsmax') > 0 && getPageSetting('dwsmaxhd') > 0 && game.global.world >= getPageSetting('dwsmax') && calcHDratio() < getPageSetting('dwsmaxhd'))))
                    continue;
        
        //Gigastations
        if (upgrade == 'Gigastation' && !fuckbuildinggiga) {
            if (MODULES.upgrades.autoGigas && !firstGiga()) continue;
            else if (game.buildings.Warpstation.owned < (Math.floor(game.upgrades.Gigastation.done * getPageSetting('DeltaGigastation')) + getPageSetting('FirstGigastation'))) continue;
        }
          
        //Other
        if (upgrade == 'Shieldblock' && !getPageSetting('BuyShieldblock')) continue;
        if (upgrade == 'Bloodlust' && game.global.challengeActive == 'Scientist' && getPageSetting('BetterAutoFight')) continue;
        
        if (game.upgrades.Scientists.done < game.upgrades.Scientists.allowed && upgrade != 'Scientists') continue;
        buyUpgrade(upgrade, true, true);
        debug('Upgraded ' + upgrade, "upgrades", "*upload2");
    }
}

//Radon

var RupgradeList = ['Miners', 'Scientists', 'Coordination', 'Speedminer', 'Speedlumber', 'Speedfarming', 'Speedscience', 'Speedexplorer', 'Megaminer', 'Megalumber', 'Megafarming', 'Megascience', 'Efficiency', 'Explorers', 'Battle', 'Bloodlust', 'Bounty', 'Egg', 'Rage', 'Prismatic', 'Prismalicious', 'Formations', 'Dominance', 'UberHut', 'UberHouse', 'UberMansion', 'UberHotel', 'UberResort', 'Trapstorm', 'Potency'];

function RbuyUpgrades() {

    for (var upgrade in RupgradeList) {
        upgrade = RupgradeList[upgrade];
        var gameUpgrade = game.upgrades[upgrade];
        var available = (gameUpgrade.allowed > gameUpgrade.done && canAffordTwoLevel(gameUpgrade));
			
        //Coord
	if (upgrade == 'Coordination' && (getPageSetting('RBuyUpgradesNew') == 2 || !canAffordCoordinationTrimps())) continue;

        //Other
        if (!available) continue;
        if (game.upgrades.Scientists.done < game.upgrades.Scientists.allowed && upgrade != 'Scientists') continue;
            buyUpgrade(upgrade, true, true);
            debug('Upgraded ' + upgrade, "upgrades", "*upload2");
        }
}
