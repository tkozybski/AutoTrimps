MODULES["equipment"] = {};
MODULES["equipment"].capDivisor = 10;
MODULES["equipment"].alwaysLvl2 = getPageSetting('always2');
MODULES["equipment"].autoGearLimit = getPageSetting('autoGearLimit');
MODULES["equipment"].waitTill60 = true;
MODULES["equipment"].equipHealthDebugMessage = false;

//Psycho
MODULES["equipment"].numHitsMult = 2; //This will multiply your maps.numHits, so beware
MODULES["equipment"].mirroredDailyCap = false; //NOT needed since 5.5.0. By the way, I had JUST finished this feature =(

var equipmentList = {
    'Dagger': {
        Upgrade: 'Dagadder',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Mace': {
        Upgrade: 'Megamace',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Polearm': {
        Upgrade: 'Polierarm',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Battleaxe': {
        Upgrade: 'Axeidic',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Greatsword': {
        Upgrade: 'Greatersword',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Boots': {
        Upgrade: 'Bootboost',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Helmet': {
        Upgrade: 'Hellishmet',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Pants': {
        Upgrade: 'Pantastic',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Shoulderguards': {
        Upgrade: 'Smoldershoulder',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Breastplate': {
        Upgrade: 'Bestplate',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Arbalest': {
        Upgrade: 'Harmbalest',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Gambeson': {
        Upgrade: 'GambesOP',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Shield': {
        Upgrade: 'Supershield',
        Stat: 'health',
        Resource: 'wood',
        Equip: true
    },
    'Gym': {
        Upgrade: 'Gymystic',
        Stat: 'block',
        Resource: 'wood',
        Equip: false
    }
};
var mapresourcetojob = { "food": "Farmer", "wood": "Lumberjack", "metal": "Miner", "science": "Scientist" };
function PrestigeValue(a) { var b = game.upgrades[a].prestiges, c = game.equipment[b], d; d = c.blockNow ? "block" : "undefined" == typeof c.health ? "attack" : "health"; var e = Math.round(c[d] * Math.pow(1.19, c.prestige * game.global.prestige[d] + 1)); return e }

function equipEffect(equip, equipInfo, levelsToBuy = 1) {
    if (equipInfo.Equip) return equip[equipInfo.Stat + 'Calculated'] * levelsToBuy;
    var c = equip.increase.by * equip.owned,
        d = game.upgrades.Gymystic.done ? game.upgrades.Gymystic.modifier + 0.01 * (game.upgrades.Gymystic.done - 1) : 1,
        e = equip.increase.by * (equip.owned + 1) * d;
    return e - c
}

function equipCost(a, b, levelsToBuy = 1) {
    var c = parseFloat(getBuildingItemPrice(a, b.Resource, b.Equip, levelsToBuy));
    return c = b.Equip ? Math.ceil(c * Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.level)) : Math.ceil(c * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level)), c
}

function autoEquipCap(hdStats, vmStatus) {
    if (!getPageSetting('autoGearLimit')) {
        return getPageSetting('CapEquip2');
    }

    var currentZone = game.global.world;
    var maxZone = game.global.highestLevelCleared;
    if (maxZone < 30) return 9;


    var numUnbought = 0;
    for (const p of weaponPrestigeList) {
        if (game.upgrades[p].done > 0 && (game.upgrades[p].allowed - game.upgrades[p].done > 0))
            numUnbought++;
    }

    if (numUnbought >= 2) return 1;

    //We must level up, otherwise we'll get stuck farming
    if (numUnbought === 0 && countPrestigesInMap() === 0 && (!enoughDamage || hdStats.hdRatio >= getFarmCutOff(vmStatus))) {
        var equipmentList = ["Dagger", "Mace", "Polearm", "Battleaxe", "Greatsword", "Arbalest"];

        //For each equipment
        var maxLevel = 0;
        for (var i = 0; i < equipmentList.length; i++) {
            //Check if it's unlocked
            var equip = game.equipment[equipmentList[i]];
            if (equip.locked !== 0) continue;

            //Get the bonus
            if (equip.level > maxLevel)
                maxLevel = equip.level;
        }

        return maxLevel + 1;

    }

    var formation = (game.global.world < 60 || game.global.highestLevelCleared < 181) ? "X" : "S";
    var oneShot = oneShotZone(game.global.world, hdStats.targetZoneType, formation);

    if (game.portal.Overkill.level > 0 && numUnbought == 0) {
        const oneShotPower = maxOneShotPower();
        if (oneShot >= oneShotPower) {
            return 1;
        }

        return 150;
    }

    if (enoughDamage && oneShot >= 1) {
        return 1;
    }

    //When we current are at the max zone, we don't plan to prestige further
    //It's better to max out levels then(?)
    //Probably need different calculations at zones higher than I am at now.
    //var powDiv = (currentZone >= 60) ? 4 : 2;
    var delta = getPageSetting('autoGearLimitDelta');
    var calc = Math.sqrt(maxZone);//maxZone / powDiv
    var pow = (maxZone - (currentZone * delta)) / maxZone;
    var calculated = Math.pow(calc, pow);

    //Min 1, max 150
    return Math.floor(Math.min(150, Math.max(1, calculated)));
}

function autoArmCap(hdStats, vmStatus) {
    if (!getPageSetting('autoGearLimit')) {
        return getPageSetting('CapEquiparm');
    }

    var currentZone = game.global.world;
    var maxZone = game.global.highestLevelCleared;
    if (maxZone < 30) {
        return 10;
    }

    //Can survive two times more than cutoff
    var enoughHealthE = (hdStats.hitsSurvived / 2) > getMapHealthCutOff(vmStatus) * MODULES.equipment.numHitsMult;
    if (enoughHealthE) {
        return 1;
    }

    var numUnbought = 0;
    for (const p of armorPrestigeList) {
        if (game.upgrades[p].done > 0 && (game.upgrades[p].allowed - game.upgrades[p].done > 0))
            numUnbought++;
    }

    if (numUnbought >= 2) return 1;

    //We must level up, otherwise we'll get stuck farming
    if (!enoughHealth && getPageSetting('FarmOnLowHealth') && numUnbought === 0 && countPrestigesInMap() === 0) {
        var equipmentList = ["Shield", "Boots", "Helmet", "Pants", "Shoulderguards", "Breastplate", "Gambeson"];
        //For each equipment
        var maxLevel = 0;
        for (var i = 0; i < equipmentList.length; i++) {
            //Check if it's unlocked
            var equip = game.equipment[equipmentList[i]];
            if (equip.locked !== 0) continue;

            //Get the bonus
            if (equip.level > maxLevel)
                maxLevel = equip.level;
        }

        return maxLevel + 1;

    }

    //Probably need different calculations at zones higher than I am at now.
    var delta = getPageSetting('autoGearLimitDelta');
    var calc = Math.sqrt(maxZone);//maxZone / powDiv
    var pow = (maxZone - (currentZone * delta)) / maxZone;
    var calculated = Math.pow(calc, pow);


    const dailyExplosive = game.global.challengeActive === "Daily" && typeof game.global.dailyChallenge.explosive !== "undefined";
    const crushed = game.global.challengeActive === "Crushed";
    if (dailyExplosive | crushed) {
        calculated = Math.min(10, calculated * 1.3);
    }

    //Min 1, max 150
    return Math.floor(Math.min(150, Math.max(1, calculated)));
}

function evaluateEquipmentEfficiency(equipName, hdStats, vmStatus) {
    var equip = equipmentList[equipName];
    var gameResource = equip.Equip ? game.equipment[equipName] : game.buildings[equipName];
    if (equipName == 'Shield') {
        if (gameResource.blockNow) {
            equip.Stat = 'block';
        } else {
            equip.Stat = 'health';
        }
    }
    var Effect = equipEffect(gameResource, equip, getPageSetting('gearamounttobuy'));
    var Cost = equipCost(gameResource, equip, getPageSetting('gearamounttobuy'));
    var Factor = Effect / Cost;
    var StatusBorder = 'white';
    var Wall = false;

    var BuyWeaponUpgrades = ((getPageSetting('BuyWeaponsNew') == 1) || (getPageSetting('BuyWeaponsNew') == 2));
    var BuyArmorUpgrades = ((getPageSetting('BuyArmorNew') == 1) || (getPageSetting('BuyArmorNew') == 2));
    if (!game.upgrades[equip.Upgrade].locked) {
        var CanAfford = canAffordTwoLevel(game.upgrades[equip.Upgrade]);
        if (equip.Equip) {
            var NextEffect = PrestigeValue(equip.Upgrade);
            if ((game.global.challengeActive == "Scientist" && getScientistLevel() > 2) || (!BuyWeaponUpgrades && !BuyArmorUpgrades))
                var NextCost = Infinity;
            else
                var NextCost = Math.ceil(getNextPrestigeCost(equip.Upgrade) * Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.level));
            Wall = (NextEffect / NextCost > Factor);
        }


        if (!CanAfford) {
            StatusBorder = 'yellow';
        }
        else {
            if (!equip.Equip) {

                StatusBorder = 'red';
            } else {
                var CurrEffect = gameResource.level * Effect / getPageSetting('gearamounttobuy');
                var NeedLevel = ceilToNearestMultipleOf(CurrEffect / NextEffect, getPageSetting('gearamounttobuy'), 1)
                var Ratio = gameResource.cost[equip.Resource][1];
                var NeedResource = NextCost * (Math.pow(Ratio, NeedLevel) - 1) / (Ratio - 1);
                if (game.resources[equip.Resource].owned > NeedResource) {
                    StatusBorder = 'red';
                } else {
                    StatusBorder = 'orange';
                }
            }
        }
    }
    if (game.jobs[mapresourcetojob[equip.Resource]].locked && (game.global.challengeActive != 'Metal')) {

        Factor = 0;
        Wall = true;
    }

    var isLiquified = (game.options.menu.liquification.enabled && game.talents.liquification.purchased && !game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp");
    var cap = 100;
    if (equipmentList[equipName].Stat == 'health') cap = autoArmCap(hdStats, vmStatus); //getPageSetting('CapEquiparm');
    if (equipmentList[equipName].Stat == 'attack') cap = autoEquipCap(hdStats, vmStatus); //getPageSetting('CapEquip2');
    if ((isLiquified) && cap > 0 && gameResource.level >= (cap / MODULES["equipment"].capDivisor)) {
        Factor = 0;
        Wall = true;
    } else if (cap > 0 && gameResource.level >= cap) {
        Factor = 0;
        Wall = true;
    }
    if (equipName != 'Gym' && game.global.world < 60 && game.global.world >= 58 && MODULES["equipment"].waitTill60) {
        Wall = true;
    }
    if (gameResource.level < 2 && getPageSetting('always2') == true) {
        Factor = 999 - gameResource.prestige;
    }
    if (equipName == 'Shield' && gameResource.blockNow && needGymystic()) {
        Factor = 0;
        Wall = true;
        StatusBorder = 'orange';
    }
    return {
        Stat: equip.Stat,
        Factor: Factor,
        StatusBorder: StatusBorder,
        Wall: Wall,
        Cost: Cost
    };
}

var resourcesNeeded;
var Best;

function orangewindstack() { (9 < game.equipment.Dagger.level && 0 == game.upgrades.Dagadder.locked && buyUpgrade('Dagadder', !0, !0), 9 < game.equipment.Mace.level && 0 == game.upgrades.Megamace.locked && buyUpgrade('Megamace', !0, !0), 9 < game.equipment.Polearm.level && 0 == game.upgrades.Polierarm.locked && buyUpgrade('Polierarm', !0, !0), 9 < game.equipment.Battleaxe.level && 0 == game.upgrades.Axeidic.locked && buyUpgrade('Axeidic', !0, !0), 9 < game.equipment.Greatsword.level && 0 == game.upgrades.Greatersword.locked && buyUpgrade('Greatersword', !0, !0), 9 < game.equipment.Arbalest.level && 0 == game.upgrades.Harmbalest.locked && buyUpgrade('Harmbalest', !0, !0), 0 == game.upgrades.Bootboost.locked && buyUpgrade('Bootboost', !0, !0), 0 == game.upgrades.Hellishmet.locked && buyUpgrade('Hellishmet', !0, !0), 0 == game.upgrades.Pantastic.locked && buyUpgrade('Pantastic', !0, !0), 0 == game.upgrades.Smoldershoulder.locked && buyUpgrade('Smoldershoulder', !0, !0), 0 == game.upgrades.Bestplate.locked && buyUpgrade('Bestplate', !0, !0), 0 == game.upgrades.GambesOP.locked && buyUpgrade('GambesOP', !0, !0), 0 == game.upgrades.Supershield.locked && buyUpgrade('Supershield', !0, !0)) }
function dorangewindstack() { (9 < game.equipment.Dagger.level && 0 == game.upgrades.Dagadder.locked && buyUpgrade('Dagadder', !0, !0), 9 < game.equipment.Mace.level && 0 == game.upgrades.Megamace.locked && buyUpgrade('Megamace', !0, !0), 9 < game.equipment.Polearm.level && 0 == game.upgrades.Polierarm.locked && buyUpgrade('Polierarm', !0, !0), 9 < game.equipment.Battleaxe.level && 0 == game.upgrades.Axeidic.locked && buyUpgrade('Axeidic', !0, !0), 9 < game.equipment.Greatsword.level && 0 == game.upgrades.Greatersword.locked && buyUpgrade('Greatersword', !0, !0), 9 < game.equipment.Arbalest.level && 0 == game.upgrades.Harmbalest.locked && buyUpgrade('Harmbalest', !0, !0), 0 == game.upgrades.Bootboost.locked && buyUpgrade('Bootboost', !0, !0), 0 == game.upgrades.Hellishmet.locked && buyUpgrade('Hellishmet', !0, !0), 0 == game.upgrades.Pantastic.locked && buyUpgrade('Pantastic', !0, !0), 0 == game.upgrades.Smoldershoulder.locked && buyUpgrade('Smoldershoulder', !0, !0), 0 == game.upgrades.Bestplate.locked && buyUpgrade('Bestplate', !0, !0), 0 == game.upgrades.GambesOP.locked && buyUpgrade('GambesOP', !0, !0), 0 == game.upgrades.Supershield.locked && buyUpgrade('Supershield', !0, !0)) }

function windstackingprestige(hdStats) {
    if (
        (game.global.challengeActive != "Daily" && getEmpowerment() == "Wind" && getPageSetting('WindStackingMin') > 0 && game.global.world >= getPageSetting('WindStackingMin') && hdStats.hdRatio < 5) ||
        (game.global.challengeActive == "Daily" && getEmpowerment() == "Wind" && getPageSetting('dWindStackingMin') > 0 && game.global.world >= getPageSetting('dWindStackingMin') && hdStats.hdRatio < 5) ||
        (game.global.challengeActive != "Daily" && getPageSetting('wsmax') > 0 && getPageSetting('wsmaxhd') > 0 && game.global.world >= getPageSetting('wsmax') && hdStats.hdRatio < getPageSetting('wsmaxhd')) ||
        (game.global.challengeActive == "Daily" && getPageSetting('dwsmax') > 0 && getPageSetting('dwsmaxhd') > 0 && game.global.world >= getPageSetting('dwsmax') && hdStats.hdRatio < getPageSetting('dwsmaxhd'))
    ) {
        if (game.global.challengeActive != "Daily") orangewindstack();
        if (game.global.challengeActive == "Daily") dorangewindstack();
        return false;
    }
    else return true;
}

var preBuyAmt2 = 1;
var preBuyFiring2 = 1;
var preBuyTooltip2 = false;
var preBuymaxSplit2 = 1;
var preBuyCustomFirst2 = 1;
var preBuyCustomLast2 = 1;

function preBuy3() {
    preBuyAmt2 = game.global.buyAmt;
    preBuyFiring2 = game.global.firing;
    preBuyTooltip2 = game.global.lockTooltip;
    preBuymaxSplit2 = game.global.maxSplit;
    preBuyCustomFirst2 = game.global.firstCustomAmt;
    preBuyCustomLast2 = game.global.lastCustomAmt;
}

function postBuy3() {
    game.global.buyAmt = preBuyAmt2;
    game.global.firing = preBuyFiring2;
    game.global.lockTooltip = preBuyTooltip2;
    game.global.maxSplit = preBuymaxSplit2;
    game.global.firstCustomAmt = preBuyCustomFirst2;
    game.global.lastCustomAmt = preBuyCustomLast2;
}

function countPrestigesInMap() {
    const map = (game.global.mapsActive ? getCurrentMapObject() : lastMapWeWereIn);
    return (map ? addSpecials(true, true, map) : 0);
}

function armorCapped(hdStats, vmStatus) {
    var capped = areWeHealthLevelCapped(hdStats, vmStatus);

    const prestigeList = ['Bootboost', 'Hellishmet', 'Pantastic', 'Smoldershoulder', 'Greatersword', 'GamesOP'];
    var numUnbought = 0;
    for (var i = 0, len = prestigeList.length; i < len; i++) {
        var p = prestigeList[i];
        if (game.upgrades[p].allowed - game.upgrades[p].done > 0)
            numUnbought++;
    }
    return capped && countPrestigesInMap() === 0 && numUnbought === 0;
}

function weaponCapped(hdStats, vmStatus) {
    var capped = areWeAttackLevelCapped(hdStats, vmStatus);

    const prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest'];
    var numUnbought = 0;
    for (var i = 0, len = prestigeList.length; i < len; i++) {
        var p = prestigeList[i];
        if (game.upgrades[p].allowed - game.upgrades[p].done > 0)
            numUnbought++;
    }
    return capped && countPrestigesInMap() === 0 && numUnbought === 0;
}

function autoLevelEquipment(hdStats, vmStatus) {
    var gearamounttobuy = (getPageSetting('gearamounttobuy') > 0) ? getPageSetting('gearamounttobuy') : 1;

    //WS
    var enoughDamageCutoff = getPageSetting("dmgcuntoff");
    if (getEmpowerment() == 'Wind' && game.global.challengeActive != "Daily" && !game.global.runningChallengeSquared && getPageSetting("AutoStance") == 3 && getPageSetting("WindStackingMin") > 0 && game.global.world >= getPageSetting("WindStackingMin") && getPageSetting("windcutoff") > 0)
        enoughDamageCutoff = getPageSetting("windcutoff");
    if (getEmpowerment() == 'Wind' && game.global.challengeActive == "Daily" && !game.global.runningChallengeSquared && (getPageSetting("AutoStance") == 3 || getPageSetting("use3daily") == true) && getPageSetting("dWindStackingMin") > 0 && game.global.world >= getPageSetting("dWindStackingMin") && getPageSetting("dwindcutoff") > 0)
        enoughDamageCutoff = getPageSetting("dwindcutoff");

    if (calcOurDmg() <= 0) return;
    resourcesNeeded = {
        "food": 0,
        "wood": 0,
        "metal": 0,
        "science": 0,
        "gems": 0
    };
    Best = {};
    var keys = ['healthwood', 'healthmetal', 'attackmetal', 'blockwood'];
    for (var i = 0; i < keys.length; i++) {
        Best[keys[i]] = {
            Factor: 0,
            Name: '',
            Wall: false,
            StatusBorder: 'white',
            Cost: 0
        };
    }

    //Check for H & D
    var formation = (game.global.world < 60 || game.global.highestLevelCleared < 181) ? "X" : "S";
    var enoughDamageE = enoughDamage && oneShotZone(game.global.world, hdStats.targetZoneType, formation) >= 1;
    var enoughHealthE = hdStats.hitsSurvived > getMapHealthCutOff(vmStatus) * MODULES.equipment.numHitsMult;

    //Check mirror dailies
    var mirroredDaily = game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.mirrored !== "undefined";
    var mirroredDailyOk = !MODULES.equipment.mirroredDailyCap || !mirroredDaily || oneShotPower() < maxOneShotPower(true) || !enoughDamage;

    //For each equipment...
    for (var equipName in equipmentList) {
        var equip = equipmentList[equipName];
        var gameResource = equip.Equip ? game.equipment[equipName] : game.buildings[equipName];
        if (!gameResource.locked) {
            var $equipName = document.getElementById(equipName);
            $equipName.style.color = 'white';
            var evaluation = evaluateEquipmentEfficiency(equipName, hdStats, vmStatus);
            var BKey = equip.Stat + equip.Resource;

            if (Best[BKey].Factor === 0 || Best[BKey].Factor < evaluation.Factor) {
                Best[BKey].Factor = evaluation.Factor;
                Best[BKey].Name = equipName;
                Best[BKey].Wall = evaluation.Wall;
                Best[BKey].StatusBorder = evaluation.StatusBorder;
            }
            Best[BKey].Cost = evaluation.Cost;
            resourcesNeeded[equip.Resource] += Best[BKey].Cost;

            if (evaluation.Wall)
                $equipName.style.color = 'yellow';
            $equipName.style.border = '1px solid ' + evaluation.StatusBorder;

            var $equipUpgrade = document.getElementById(equip.Upgrade);
            if (evaluation.StatusBorder != 'white' && evaluation.StatusBorder != 'yellow' && $equipUpgrade)
                $equipUpgrade.style.color = evaluation.StatusBorder;
            if (evaluation.StatusBorder == 'yellow' && $equipUpgrade)
                $equipUpgrade.style.color = 'white';
            if (equipName == 'Gym' && needGymystic()) {
                $equipName.style.color = 'white';
                $equipName.style.border = '1px solid white';
                if ($equipUpgrade) {
                    $equipUpgrade.style.color = 'red';
                    $equipUpgrade.style.border = '2px solid red';
                }
            }

            if (evaluation.StatusBorder == 'red' && windstackingprestige(hdStats) && !(game.global.world < 60 && game.global.world >= 58 && MODULES["equipment"].waitTill60)) {
                var BuyWeaponUpgrades = ((getPageSetting('BuyWeaponsNew') == 1) || (getPageSetting('BuyWeaponsNew') == 2));
                var BuyArmorUpgrades = ((getPageSetting('BuyArmorNew') == 1) || (getPageSetting('BuyArmorNew') == 2));
                var DelayArmorWhenNeeded = getPageSetting('DelayArmorWhenNeeded');
                var equipStat = equipmentList[equipName].Stat;

                //Delay Weapon Prestiges on Mirrored Dailies
                BuyWeaponUpgrades &= mirroredDailyOk;

                //Delays Armor Prestiges if lacking damage to advance, but not health. Never delays shield prestiges tho.
                BuyArmorUpgrades &= !DelayArmorWhenNeeded || !enoughHealth || enoughDamage || equipmentList[equipName].Resource == "wood";

                //Buy Prestiges
                if (BuyWeaponUpgrades && equipStat == "attack" || BuyArmorUpgrades && (equipStat == "health" || equipStat == "block")) {
                    var upgrade = equipmentList[equipName].Upgrade;
                    if (upgrade != "Gymystic")
                        debug('Upgrading ' + upgrade + " - Prestige " + game.equipment[equipName].prestige, "equips", '*upload');
                    else
                        debug('Upgrading ' + upgrade + " # " + game.upgrades[upgrade].allowed, "equips", '*upload');
                    buyUpgrade(upgrade, true, true);
                } else {
                    $equipName.style.color = 'orange';
                    $equipName.style.border = '2px solid orange';
                }
            }
        }
    }

    var BuyWeaponLevels = ((getPageSetting('BuyWeaponsNew') == 1) || (getPageSetting('BuyWeaponsNew') == 3));
    var BuyArmorLevels = ((getPageSetting('BuyArmorNew') == 1) || (getPageSetting('BuyArmorNew') == 3));
    preBuy3();
    for (var stat in Best) {
        var eqName = Best[stat].Name;
        if (eqName !== '') {
            var $eqName = document.getElementById(eqName);
            var DaThing = equipmentList[eqName];
            if (eqName == 'Gym' && needGymystic()) {
                $eqName.style.color = 'white';
                $eqName.style.border = '1px solid white';
                continue;
            } else {
                $eqName.style.color = Best[stat].Wall ? 'orange' : 'red';
                $eqName.style.border = '2px solid red';
            }
            var maxmap = getPageSetting('MaxMapBonusAfterZone') && doMaxMapBonus;
            if (BuyArmorLevels && (DaThing.Stat == 'health' || DaThing.Stat == 'block') && (!enoughHealth || !enoughHealthE && enoughDamage || maxmap)) {
                game.global.buyAmt = gearamounttobuy;
                if (DaThing.Equip && !Best[stat].Wall && canAffordBuilding(eqName, null, null, true)) {
                    debug('Leveling equipment ' + eqName, "equips", '*upload3');
                    buyEquipment(eqName, null, true);
                }
            }
            var aalvl2 = getPageSetting('always2');
            if (BuyArmorLevels && (DaThing.Stat == 'health') && aalvl2 && game.equipment[eqName].level < 2) {
                game.global.buyAmt = 1;
                if (DaThing.Equip && !Best[stat].Wall && canAffordBuilding(eqName, null, null, true)) {
                    debug('Leveling equipment ' + eqName + " (AlwaysLvl2)", "equips", '*upload3');
                    buyEquipment(eqName, null, true);
                }
            }
            if (windstackingprestige(hdStats) && BuyWeaponLevels && DaThing.Stat == 'attack' && mirroredDailyOk && (!enoughDamageE || enoughHealthE || maxmap)) {
                game.global.buyAmt = gearamounttobuy;
                if (DaThing.Equip && !Best[stat].Wall && canAffordBuilding(eqName, null, null, true)) {
                    debug('Leveling equipment ' + eqName, "equips", '*upload3');
                    buyEquipment(eqName, null, true);
                }
            }
        }
    }
    postBuy3();
}
function areWeAttackLevelCapped(hdStats, vmStatus) { var a = []; for (var b in equipmentList) { var c = equipmentList[b], d = c.Equip ? game.equipment[b] : game.buildings[b]; if (!d.locked) { var e = evaluateEquipmentEfficiency(b, hdStats, vmStatus); "attack" == e.Stat && a.push(e) } } return a.every(f => 0 == f.Factor && !0 == f.Wall) }
function areWeHealthLevelCapped(hdStats, vmStatus) { var a = []; for (var b in equipmentList) { var c = equipmentList[b], d = c.Equip ? game.equipment[b] : game.buildings[b]; if (!d.locked) { var e = evaluateEquipmentEfficiency(b, hdStats, vmStatus); "health" == e.Stat && "metal" == c.Resource && a.push(e) } } return a.every(f => 0 == f.Factor && !0 == f.Wall) }

//Radon

MODULES["equipment"].RnumHitsSurvived = 10;
MODULES["equipment"].RnumHitsSurvivedScry = 80;
MODULES["equipment"].RcapDivisor = 10;
MODULES["equipment"].RequipHealthDebugMessage = false;
var RequipmentList = {
    'Dagger': {
        Upgrade: 'Dagadder',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Mace': {
        Upgrade: 'Megamace',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Polearm': {
        Upgrade: 'Polierarm',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Battleaxe': {
        Upgrade: 'Axeidic',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Greatsword': {
        Upgrade: 'Greatersword',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Boots': {
        Upgrade: 'Bootboost',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Helmet': {
        Upgrade: 'Hellishmet',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Pants': {
        Upgrade: 'Pantastic',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Shoulderguards': {
        Upgrade: 'Smoldershoulder',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Breastplate': {
        Upgrade: 'Bestplate',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Arbalest': {
        Upgrade: 'Harmbalest',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Gambeson': {
        Upgrade: 'GambesOP',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Shield': {
        Upgrade: 'Supershield',
        Stat: 'health',
        Resource: 'wood',
        Equip: true
    }
};

var Rmapresourcetojob = { "food": "Farmer", "wood": "Lumberjack", "metal": "Miner", "science": "Scientist" };

function RequipEffect(gameResource, equip) {
    if (equip.Equip) {
        return gameResource[equip.Stat + 'Calculated'];
    }
}

function RequipCost(gameResource, equip) {
    var price = parseFloat(getBuildingItemPrice(gameResource, equip.Resource, equip.Equip, 1));
    if (equip.Equip)
        price = Math.ceil(price * (Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.radLevel)));
    /*else
        price = Math.ceil(price * (Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.radLevel)));*/
    return price;
}

function RPrestigeValue(what) {
    var name = game.upgrades[what].prestiges;
    var equipment = game.equipment[name];
    var stat;
    stat = (typeof equipment.health !== 'undefined') ? "health" : "attack";
    var toReturn = Math.round(equipment[stat] * Math.pow(1.19, ((equipment.prestige) * game.global.prestige[stat]) + 1));
    return toReturn;
}

function RevaluateEquipmentEfficiency(equipName) {
    var equip = RequipmentList[equipName];
    var gameResource = equip.Equip ? game.equipment[equipName] : game.buildings[equipName];
    var Effect = equipEffect(gameResource, equip);
    var Cost = equipCost(gameResource, equip);
    var Factor = Effect / Cost;
    var StatusBorder = 'white';
    var Wall = false;

    var BuyWeaponUpgrades = ((getPageSetting('RBuyWeaponsNew') == 1) || (getPageSetting('RBuyWeaponsNew') == 2));
    var BuyArmorUpgrades = ((getPageSetting('RBuyArmorNew') == 1) || (getPageSetting('RBuyArmorNew') == 2));
    if (!game.upgrades[equip.Upgrade].locked) {
        var CanAfford = canAffordTwoLevel(game.upgrades[equip.Upgrade]);
        if (equip.Equip) {
            var NextEffect = PrestigeValue(equip.Upgrade);
            var NextCost = Math.ceil(getNextPrestigeCost(equip.Upgrade) * Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.radLevel));
            Wall = (NextEffect / NextCost > Factor);
        }

        if (!CanAfford) {
            StatusBorder = 'yellow';
        } else {
            if (!equip.Equip) {

                StatusBorder = 'red';
            } else {
                var CurrEffect = gameResource.level * Effect;
                var NeedLevel = Math.ceil(CurrEffect / NextEffect);
                var Ratio = gameResource.cost[equip.Resource][1];
                var NeedResource = NextCost * (Math.pow(Ratio, NeedLevel) - 1) / (Ratio - 1);
                if (game.resources[equip.Resource].owned > NeedResource) {
                    StatusBorder = 'red';
                } else {
                    StatusBorder = 'orange';
                }
            }
        }
    }
    if (game.jobs[Rmapresourcetojob[equip.Resource]].locked && (game.global.challengeActive != 'Transmute')) {
        Factor = 0;
        Wall = true;
    }

    var isLiquified = (game.options.menu.liquification.enabled && game.talents.liquification.purchased && !game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp");
    var cap = 100;
    if (RequipmentList[equipName].Stat == 'health') cap = getPageSetting('RCapEquiparm');
    if (RequipmentList[equipName].Stat == 'attack') cap = getPageSetting('RCapEquip2');
    if ((isLiquified) && cap > 0 && gameResource.level >= (cap / MODULES["equipment"].RcapDivisor)) {
        Factor = 0;
        Wall = true;
    } else if (cap > 0 && gameResource.level >= cap) {
        Factor = 0;
        Wall = true;
    }
    if (gameResource.level < 2 && getPageSetting('Ralways2')) {
        Factor = 999 - gameResource.prestige;
    }
    return {
        Stat: equip.Stat,
        Factor: Factor,
        StatusBorder: StatusBorder,
        Wall: Wall,
        Cost: Cost
    };
}

var RresourcesNeeded;
var RBest;
var RpreBuyAmt2 = 1;
var RpreBuyFiring2 = 1;
var RpreBuyTooltip2 = false;
var RpreBuymaxSplit2 = 1;
var RpreBuyCustomFirst2 = 1;
var RpreBuyCustomLast2 = 1;

function RpreBuy3() {
    RpreBuyAmt2 = game.global.buyAmt;
    RpreBuyFiring2 = game.global.firing;
    RpreBuyTooltip2 = game.global.lockTooltip;
    RpreBuymaxSplit2 = game.global.maxSplit;
    RpreBuyCustomFirst2 = game.global.firstCustomAmt;
    RpreBuyCustomLast2 = game.global.lastCustomAmt;
}

function RpostBuy3() {
    game.global.buyAmt = RpreBuyAmt2;
    game.global.firing = RpreBuyFiring2;
    game.global.lockTooltip = RpreBuyTooltip2;
    game.global.maxSplit = RpreBuymaxSplit2;
    game.global.firstCustomAmt = RpreBuyCustomFirst2;
    game.global.lastCustomAmt = RpreBuyCustomLast2;
}

function RautoLevelEquipment() {
    var Rgearamounttobuy = (getPageSetting('Rgearamounttobuy') > 0) ? getPageSetting('Rgearamounttobuy') : 1;

    if (RcalcOurDmg("avg", false, true) <= 0) return;
    RresourcesNeeded = {
        "food": 0,
        "wood": 0,
        "metal": 0,
        "science": 0,
        "gems": 0
    };
    RBest = {};
    var keys = ['healthwood', 'healthmetal', 'attackmetal'];
    for (var i = 0; i < keys.length; i++) {
        RBest[keys[i]] = {
            Factor: 0,
            Name: '',
            Wall: false,
            StatusBorder: 'white',
            Cost: 0
        };
    }
    var enemyDamage = RcalcBadGuyDmg(null, RgetEnemyMaxAttack(game.global.world, 50, 'Snimp', 1.0));
    var enoughDamageCutoff = getPageSetting("Rdmgcuntoff");
    var numHits = getPageSetting('Rhitssurvived');
    var enoughHealthE = (RcalcOurHealth(true) > numHits * enemyDamage);
    var enoughDamageE = (RcalcHDratio() <= enoughDamageCutoff);

    for (var equipName in RequipmentList) {
        var equip = RequipmentList[equipName];
        var gameResource = game.equipment[equipName];
        if (!gameResource.locked) {
            var $equipName = document.getElementById(equipName);
            $equipName.style.color = 'white';
            var evaluation = RevaluateEquipmentEfficiency(equipName);
            var BKey = equip.Stat + equip.Resource;

            if (RBest[BKey].Factor === 0 || RBest[BKey].Factor < evaluation.Factor) {
                RBest[BKey].Factor = evaluation.Factor;
                RBest[BKey].Name = equipName;
                RBest[BKey].Wall = evaluation.Wall;
                RBest[BKey].StatusBorder = evaluation.StatusBorder;
            }
            RBest[BKey].Cost = evaluation.Cost;
            RresourcesNeeded[equip.Resource] += RBest[BKey].Cost;

            if (evaluation.Wall)
                $equipName.style.color = 'yellow';
            $equipName.style.border = '1px solid ' + evaluation.StatusBorder;

            var $equipUpgrade = document.getElementById(equip.Upgrade);
            if (evaluation.StatusBorder != 'white' && evaluation.StatusBorder != 'yellow' && $equipUpgrade)
                $equipUpgrade.style.color = evaluation.StatusBorder;
            if (evaluation.StatusBorder == 'yellow' && $equipUpgrade)
                $equipUpgrade.style.color = 'white';
            if (evaluation.StatusBorder == 'red') {
                var BuyWeaponUpgrades = ((getPageSetting('RBuyWeaponsNew') == 1) || (getPageSetting('RBuyWeaponsNew') == 2));
                var BuyArmorUpgrades = ((getPageSetting('RBuyArmorNew') == 1) || (getPageSetting('RBuyArmorNew') == 2));
                var DelayArmorWhenNeeded = getPageSetting('RDelayArmorWhenNeeded');

                if (
                    (BuyWeaponUpgrades && RequipmentList[equipName].Stat == 'attack') ||
                    (BuyArmorUpgrades && RequipmentList[equipName].Stat == 'health' &&
                        (
                            (DelayArmorWhenNeeded && !shouldFarm) ||
                            (DelayArmorWhenNeeded && enoughDamageE) ||
                            (DelayArmorWhenNeeded && !enoughDamageE && !enoughHealthE) ||
                            (DelayArmorWhenNeeded && RequipmentList[equipName].Resource == 'wood') ||
                            (!DelayArmorWhenNeeded)
                        )
                    )
                ) {
                    var upgrade = RequipmentList[equipName].Upgrade;
                    debug('Upgrading ' + upgrade + " - Prestige " + game.equipment[equipName].prestige, "equips", '*upload');
                    buyUpgrade(upgrade, true, true);
                } else {
                    $equipName.style.color = 'orange';
                    $equipName.style.border = '2px solid orange';
                }
            }
        }
    }

    var BuyWeaponLevels = ((getPageSetting('RBuyWeaponsNew') == 1) || (getPageSetting('RBuyWeaponsNew') == 3));
    var BuyArmorLevels = ((getPageSetting('RBuyArmorNew') == 1) || (getPageSetting('RBuyArmorNew') == 3));
    RpreBuy3();
    for (var stat in RBest) {
        var eqName = RBest[stat].Name;
        if (eqName !== '') {
            var $eqName = document.getElementById(eqName);
            var DaThing = RequipmentList[eqName];
            $eqName.style.color = RBest[stat].Wall ? 'orange' : 'red';
            $eqName.style.border = '2px solid red';
            var maxmap = getPageSetting('RMaxMapBonusAfterZone') && RdoMaxMapBonus;
            if (BuyArmorLevels && DaThing.Stat == 'health' && (!enoughHealthE || maxmap)) {
                game.global.buyAmt = Rgearamounttobuy
                if (smithylogic(eqName, 'metal', true) && DaThing.Equip && !RBest[stat].Wall && canAffordBuilding(eqName, null, null, true)) {
                    debug('Leveling equipment ' + eqName, "equips", '*upload3');
                    buyEquipment(eqName, null, true);
                }
            }
            var aalvl2 = getPageSetting('Ralways2');
            if (BuyArmorLevels && (DaThing.Stat == 'health') && aalvl2 && game.equipment[eqName].level < 2) {
                game.global.buyAmt = 1;
                if (smithylogic(eqName, 'metal', true) && DaThing.Equip && !RBest[stat].Wall && canAffordBuilding(eqName, null, null, true)) {
                    debug('Leveling equipment ' + eqName + " (AlwaysLvl2)", "equips", '*upload3');
                    buyEquipment(eqName, null, true);
                }
            }
            if (BuyWeaponLevels && DaThing.Stat == 'attack' && (!enoughDamageE || enoughHealthE || maxmap)) {
                game.global.buyAmt = Rgearamounttobuy
                if (smithylogic(eqName, 'metal', true) && DaThing.Equip && !RBest[stat].Wall && canAffordBuilding(eqName, null, null, true)) {
                    debug('Leveling equipment ' + eqName, "equips", '*upload3');
                    buyEquipment(eqName, null, true);
                }
            }
        }
    }
    RpostBuy3();
}

function RareWeAttackLevelCapped() { var a = []; for (var b in RequipmentList) { var c = RequipmentList[b], d = c.Equip ? game.equipment[b] : game.buildings[b]; if (!d.locked) { var e = RevaluateEquipmentEfficiency(b); "attack" == e.Stat && a.push(e) } } return a.every(f => 0 == f.Factor && !0 == f.Wall) }

function Rgetequips(map, special) { //(level, p b or false)
    var specialCount = 0;
    var unlocksObj;
    var world;
    var prestigeArray = [];
    var hasPrestigious = false;
    unlocksObj = game.mapUnlocks;
    if (special == 'p' || (special == 'b' && game.talents.bionic2.purchased)) {
        hasPrestigious = true;
    }
    var Rlocation;
    if (special == 'p' || special == false) {
        Rlocation = "Plentiful";
    }
    if (special == 'b') {
        Rlocation = "Bionic";
    }
    world = map;
    var canLast = 1;
    var prestigeItemsAvailable = [];
    for (var item in unlocksObj) {
        var special = unlocksObj[item];
        if (!special.prestige) continue;
        if (special.locked) continue;
        if (game.global.universe == 2 && special.blockU2) continue;
        if (game.global.universe == 1 && special.blockU1) continue;
        if (special.brokenPlanet && ((special.brokenPlanet == 1 && !game.global.brokenPlanet) || special.brokenPlanet == -1 && game.global.brokenPlanet)) continue;
        if (special.startAt < 0) continue;
        if (special.lastAt < game.global.world) continue;
        if ((special.filterUpgrade)) {
            var mapConfigLoc = game.mapConfig.locations[Rlocation];
            if (typeof mapConfigLoc.upgrade === 'object') {
                var usable = false;
                for (var x = 0; x < mapConfigLoc.upgrade.length; x++) {
                    if (mapConfigLoc.upgrade[x] != item) continue;
                    usable = true;
                    break;
                }
                if (!usable) continue;
            } else if (mapConfigLoc.upgrade != item) continue;
        }
        if ((special.level == "last" && canLast > 0 && special.world <= world && (special.canRunOnce || special.canRunWhenever))) {
            if (canLast == 2 && !special.prestige) continue;
            if (typeof special.specialFilter !== 'undefined') {
                if (!special.specialFilter(world)) continue;
            }
            if (special.startAt > world) continue;
            specialCount++;
            continue;
            if (hasPrestigious && canLast == 1 && item == "roboTrimp")
                canLast = 3;
            else
                canLast = 0;
            continue;
        }

        if (special.world != world && special.world > 0) continue;
        if ((special.world == -2) && ((world % 2) !== 0)) continue;
        if ((special.world == -3) && ((world % 2) != 1)) continue;
        if ((special.world == -5) && ((world % 5) !== 0)) continue;
        if ((special.world == -33) && ((world % 3) !== 0)) continue;
        if ((special.world == -10) && ((world % 10) !== 0)) continue;
        if ((special.world == -20) && ((world % 20) !== 0)) continue;
        if ((special.world == -25) && ((world % 25) !== 0)) continue;
        if (typeof special.specialFilter !== 'undefined') {
            if (!special.specialFilter(world)) continue;
        }
        if ((typeof special.startAt !== 'undefined') && (special.startAt > world)) continue;
        if (typeof special.canRunOnce === 'undefined' && (special.level == "last") && canLast > 0 && (special.last <= (world - 5))) {
            specialCount += Math.floor((world - special.last) / 5);
            continue;
        }
        if (special.level == "last") continue;
        if (special.canRunOnce === true) {
            specialCount++;
            continue;
        } else if (special.addToCount) specialCount++;
    }
    return specialCount;
}

//barakatx2
const prestigeZones = [["Supershield", "Dagadder", "Bootboost"], ["Megamace", "Hellishmet"], ["Polierarm", "Pantastic"], ["Axeidic", "Smoldershoulder"], ["Greatersword", "Harmbalest", "Bestplate", "GambesOP"]]
function attainablePrestiges(zone) {
    const baseExpectedPrestigesAvailable = Math.floor(zone / 10) * 2 - 1
    const prestigeZoneOffset = Math.floor(Math.min(zone % 10, 5))
    var attainablePrestiges = 0
    for (var i = 1; i <= prestigeZoneOffset; i++) {
        prestigeZones[i - 1].forEach(prestige => {
            attainablePrestiges += baseExpectedPrestigesAvailable + 2 - game.upgrades[prestige].allowed
        })
    }
    return attainablePrestiges / 2
}

//Shol Territory

function mostEfficientEquipment(fakeLevels = {}) {

    for (var i in RequipmentList) {
        if (typeof fakeLevels[i] === 'undefined') {
            fakeLevels[i] = 0;
        }
    }

    var mostEfficient = [
        {
            name: "",
            statPerResource: -Infinity,
        },
        {
            name: "",
            statPerResource: -Infinity,
        }
    ];

    var artBoost = Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.radLevel);

    for (var i in RequipmentList) {
        var nextLevelCost = game.equipment[i].cost[RequipmentList[i].Resource][0] * Math.pow(game.equipment[i].cost[RequipmentList[i].Resource][1], game.equipment[i].level + fakeLevels[i]) * artBoost;

        var nextLevelValue = game.equipment[i][RequipmentList[i].Stat + "Calculated"];

        var isAttack = (RequipmentList[i].Stat === 'attack' ? 0 : 1);

        var safeRatio = Math.log(nextLevelValue + 1) / Math.log(nextLevelCost + 1);
        if (safeRatio > mostEfficient[isAttack].statPerResource) {
            mostEfficient[isAttack].name = i;
            mostEfficient[isAttack].statPerResource = safeRatio;
        }

    }

    return [mostEfficient[0].name, mostEfficient[1].name];

}

function Requipcalc(capattack, caphealth, level2, zonego, attack, health, name, resource, stat, source, amount, percent) {

    if (canAffordBuilding(name, null, null, true, false, amount) && smithylogic(name, resource, true) &&
        (
            (stat == 'a' && game.equipment[name].level < capattack) ||
            (stat == 'h' && game.equipment[name].level < caphealth)
        ) &&
        (
            (level2 && game.equipment[name].level == 1) ||
            (zonego) ||
            (Rgetequipcost(name, resource, amount) <= (percent * source)) ||
            ((stat == 'a' && !attack) || (stat == 'h' && !health))
        )
    ) {
        RpreBuy3();

        if (level2 && game.equipment[name].level == 1) {
            buyEquipment(name, null, true, 1);
        }

        var mostEfficientStuff = mostEfficientEquipment();

        if (mostEfficientStuff != undefined) {
            buyEquipment(mostEfficientStuff[0], null, true, amount);
            buyEquipment(mostEfficientStuff[1], null, true, amount);
        }

        RpostBuy3();
    }
}

function getMaxAffordable(baseCost, totalResource, costScaling, isCompounding) {

    if (!isCompounding) {
        return Math.floor(
            (costScaling - (2 * baseCost) + Math.sqrt(Math.pow(2 * baseCost - costScaling, 2) + (8 * costScaling * totalResource))) / 2
        );
    } else {
        return Math.floor(Math.log(1 - (1 - costScaling) * totalResource / baseCost) / Math.log(costScaling));
    }
}

function buyPrestigeMaybe(equipName) {

    var equipment = game.equipment[equipName];
    var resource = (equipName == "Shield") ? 'wood' : 'metal'
    var equipStat = (typeof equipment.attack !== 'undefined') ? 'attack' : 'health';

    var artBoost = Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.radLevel);

    var prestigeUpgradeName = "";
    var allUpgradeNames = Object.getOwnPropertyNames(game.upgrades);
    for (var upgrade of allUpgradeNames) {
        if (game.upgrades[upgrade].prestiges === equipName) {
            prestigeUpgradeName = upgrade;
            break;
        }
    }

    if (game.upgrades[prestigeUpgradeName].locked) return false;;

    if (game.upgrades[prestigeUpgradeName].cost.resources.science[0] *
        Math.pow(game.upgrades[prestigeUpgradeName].cost.resources.science[1], game.equipment[equipName].prestige - 1)
        > game.resources.science.owned) {
        return false;
    }

    if (game.upgrades[prestigeUpgradeName].cost.resources.gems[0] *
        Math.pow(game.upgrades[prestigeUpgradeName].cost.resources.gems[1], game.equipment[equipName].prestige - 1)
        > game.resources.gems.owned) {
        return false;
    }

    var levelOnePrestige = getNextPrestigeCost(prestigeUpgradeName) * artBoost;

    if (levelOnePrestige > game.resources[resource].owned) return false;

    var newLevel = Math.floor(getMaxAffordable(levelOnePrestige * 1.2, game.resources[resource].owned, 1.2, true)) + 1;

    var newStatValue = (newLevel) * Math.round(equipment[equipStat] * Math.pow(1.19, ((equipment.prestige + 1) * game.global.prestige[equipStat]) + 1));
    var currentStatValue = equipment.level * equipment[equipStat + 'Calculated'];

    return newStatValue > currentStatValue

}

function RautoEquip() {

    if (!getPageSetting('Requipon')) return;

    var prestigeLeft = false;
    do {
        prestigeLeft = false;
        for (var equipName in game.equipment) {
            if (buyPrestigeMaybe(equipName)) {
                if (!game.equipment[equipName].locked) {
                    buyUpgrade(RequipmentList[equipName].Upgrade, true, true);
                    prestigeLeft = true;
                }
            }
        }
    } while (prestigeLeft)

    // Gather settings
    var alwaysLvl2 = getPageSetting('Requip2');
    var attackEquipCap = ((getPageSetting('Requipcapattack') <= 0) ? Infinity : getPageSetting('Requipcapattack'));
    var healthEquipCap = ((getPageSetting('Requipcaphealth') <= 0) ? Infinity : getPageSetting('Requipcaphealth'));
    var zoneGo = game.global.world >= getPageSetting('Requipzone');
    var resourceMaxPercent = getPageSetting('Requippercent') / 100;

    // Always 2
    if (alwaysLvl2) {
        for (var equip in game.equipment) {
            if (game.equipment[equip].level < 2) {
                buyEquipment(equip, null, true, 1);
            }
        }
    }

    // Loop through actually getting equips
    var keepBuying = false;
    do {
        keepBuying = false;
        var bestBuys = mostEfficientEquipment();

        // Set up for attack
        var equipName = bestBuys[0];
        var resourceUsed = resourceUsed = (equipName == 'Shield') ? 'wood' : 'metal';
        var equipCap = attackEquipCap;
        var underStats = RcalcHDratio() >= getPageSetting('Rdmgcuntoff');

        for (var i = 0; i < 2; i++) {
            if (canAffordBuilding(equipName, null, null, true, false, 1)) {
                if (smithylogic(equipName, resourceUsed, true)) {
                    if (game.equipment[equipName].level < equipCap) {
                        // Check any of the overrides
                        if (
                            zoneGo ||
                            underStats ||
                            Rgetequipcost(equipName, resourceUsed, 1) <= resourceMaxPercent * game.resources[resourceUsed].owned
                        ) {
                            if (!game.equipment[equipName].locked) {
                                buyEquipment(equipName, null, true, 1);
                                keepBuying = true;
                            }
                        }
                    }
                }
            }

            // Set up for Health
            equipName = bestBuys[1];
            resourceUsed = (equipName == 'Shield') ? 'wood' : 'metal';
            equipCap = healthEquipCap;
            underStats = RcalcOurHealth(true) < getPageSetting('Rhitssurvived') * RcalcBadGuyDmg(null, RgetEnemyMaxAttack(game.global.world, 50, 'Snimp', 1.0));

        }

    } while (keepBuying)

}

function getTotalMultiCost(baseCost, multiBuyCount, costScaling, isCompounding) {
    if (!isCompounding) {
        return multiBuyCount * (multiBuyCount * costScaling - costScaling + 2 * baseCost) / 2;
    } else {
        return baseCost * ((1 - Math.pow(costScaling, multiBuyCount)) / (1 - costScaling));
    }
}

function equipfarmdynamicHD() {
    var equipfarmzone = 0;
    var equipfarmHD = 0;
    var equipfarmmult = 0;
    var equipfarmHDzone = 0;
    var equipfarmHDmult = RcalcHDratio() - 1;
    if (getPageSetting('Requipfarmon') == true && game.global.world > 5 && game.global.world >= (getPageSetting('Requipfarmzone') && getPageSetting('RequipfarmHD') > 0 && getPageSetting('Requipfarmmult') > 0)) {
        equipfarmzone = getPageSetting('Requipfarmzone');
        equipfarmHD = getPageSetting('RequipfarmHD');
        equipfarmmult = getPageSetting('Requipfarmmult');
        equipfarmHDzone = (game.global.world - equipfarmzone);
        equipfarmHDmult = (equipfarmHDzone == 0) ? equipfarmHD : Math.pow(equipfarmmult, equipfarmHDzone) * equipfarmHD;
    }
    return equipfarmHDmult;
}

function estimateEquipsForZone() {
    var artBoost = Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.radLevel);
    var MAX_EQUIP_DELTA = 700;

    // calculate stats needed pass zone
    var enemyDamageBeforeEquality = RcalcBadGuyDmg(null, RgetEnemyMaxAttack(game.global.world, 100, 'Improbability'), true); //game.global.getEnemyAttack(100, 'Snimp', true);
    var ourHealth = RcalcOurHealth();
    var hits = (getPageSetting("Rhitssurvived") > 0) ? getPageSetting("Rhitssurvived") : 1;

    var healthNeededMulti = (enemyDamageBeforeEquality * hits) / ourHealth; // The multiplier we need to apply to our health to survive

    // Get a fake ratio pretending that we don't have any equality in.
    var fakeHDRatio = RgetEnemyMaxHealth(game.global.world, 100) / (RcalcOurDmg('avg', true)); // game.global.getEnemyHealth(100, 'Snimp', true)
    var attackNeededMulti = fakeHDRatio / (game.global.mapBonus < 10 ? (equipfarmdynamicHD() * 5) : equipfarmdynamicHD());

    //console.log("Health needed no equality: " + healthNeededMulti);
    //console.log("Attack Needed no equality: " + attackNeededMulti);

    // Something something figure out equality vs health farming
    var tempEqualityUse = 0;
    while (
        (healthNeededMulti > 1 || attackNeededMulti > 1)  // If it's below 1 we don't actually need more
        &&
        (healthNeededMulti * game.portal.Equality.modifier > attackNeededMulti / game.portal.Equality.modifier) // Need more health proportionally
        &&
        tempEqualityUse < game.portal.Equality.radLevel
    ) {
        tempEqualityUse++;
        healthNeededMulti *= game.portal.Equality.modifier;
        attackNeededMulti /= game.portal.Equality.modifier;
    }

    if (healthNeededMulti < 1 && attackNeededMulti < 1) { return [0, {}] };

    var ourAttack = 6;
    for (var i in RequipmentList) {
        if (game.equipment[i].locked !== 0) continue;
        var attackBonus = game.equipment[i].attackCalculated;
        var level = game.equipment[i].level;
        ourAttack += (attackBonus !== undefined ? attackBonus : 0) * level;
    }

    // Amount of stats needed directly from equipment
    var attackNeeded = ourAttack * attackNeededMulti;
    var healthNeeded = ourHealth * healthNeededMulti / (getTotalHealthMod() * game.resources.trimps.maxSoldiers);

    var bonusLevels = {}; // How many levels you'll be getting in each shield-gambeson armor slots

    while (healthNeeded > 0) {
        var bestArmor = mostEfficientEquipment(bonusLevels)[1];
        healthNeeded -= game.equipment[bestArmor][RequipmentList[bestArmor].Stat + "Calculated"];
        if (typeof bonusLevels[bestArmor] === 'undefined') {
            bonusLevels[bestArmor] = 0;
        }
        if (bonusLevels[bestArmor]++ > MAX_EQUIP_DELTA) {
            return [Infinity, bonusLevels];
        }
    }
    while (attackNeeded > 0) {
        var bestWeapon = mostEfficientEquipment(bonusLevels)[0];
        attackNeeded -= game.equipment[bestWeapon][RequipmentList[bestWeapon].Stat + "Calculated"];
        if (typeof bonusLevels[bestWeapon] === 'undefined') {
            bonusLevels[bestWeapon] = 0;
        }
        if (bonusLevels[bestWeapon]++ >= MAX_EQUIP_DELTA) {
            return [Infinity, bonusLevels];
        }
    }

    var totalCost = 0;
    for (var equip in bonusLevels) {
        var equipCost = game.equipment[equip].cost[RequipmentList[equip].Resource];
        totalCost += getTotalMultiCost(equipCost[0], bonusLevels[equip], equipCost[1], true) * artBoost;
    }

    return [totalCost, bonusLevels, tempEqualityUse];

}
