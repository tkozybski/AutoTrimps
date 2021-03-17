MODULES["buildings"] = {};
MODULES["buildings"].storageMainCutoff = 0.85;
MODULES["buildings"].storageLowlvlCutoff1 = 0.7;
MODULES["buildings"].storageLowlvlCutoff2 = 0.5;

//Psycho-Ray
MODULES["buildings"].gatewayWall = 100;
MODULES["buildings"].gatewayWall = 100;
MODULES["buildings"].nurseryWall = 10;
MODULES["buildings"].nurserySpireWall = 10;
MODULES["buildings"].gemEfficiencyIgnoresLimit = true;
MODULES["buildings"].advancedNurseries = game.stats.highestLevel.valueTotal() >= 220 && true; //Use on Magma. HIGHLY EXPERIMENTAL

//Helium

var housingList = ['Hut', 'House', 'Mansion', 'Hotel', 'Resort', 'Gateway', 'Collector', 'Warpstation'];

function safeBuyBuilding(building) {
    if (isBuildingInQueue(building))
        return false;
    if (game.buildings[building].locked)
        return false;
    var oldBuy = preBuy2();

  if (game.talents.deciBuild.purchased) {
        game.global.buyAmt = 10;
    if (!canAffordBuilding(building)) {
        game.global.buyAmt = 2;
	if (!canAffordBuilding(building))
            game.global.buyAmt = 1;
     }
  }
  else if (bwRewardUnlocked("DoubleBuild")) {
        game.global.buyAmt = 2;
  	if (!canAffordBuilding(building)) 
        game.global.buyAmt = 1;
  }        
  else game.global.buyAmt = 1;

  if (!canAffordBuilding(building)) {
      postBuy2(oldBuy);
      return false;
  }

    game.global.firing = false;
	
    if (building == 'Gym' && getPageSetting('GymWall')) {
        game.global.buyAmt = 1;
    }
    if (building == 'Warpstation' && !game.buildings[building].locked && canAffordBuilding(building)) {
        if (game.buildings.Warpstation.owned < 2) {
            game.global.buyAmt = 'Max';
            game.global.maxSplit = 1;
        } else {
            game.global.buyAmt = 1;
        }
        buyBuilding(building, true, true);
        debug('Building ' + game.global.buyAmt + ' ' + building + 's', "buildings", '*rocket');
        postBuy2(oldBuy);
        return;
    }
    debug('Building ' + building, "buildings", '*hammer2');
    if (!game.buildings[building].locked && canAffordBuilding(building)) {
	buyBuilding(building, true, true);
    }
    postBuy2(oldBuy);
    return true;
}

function advancedNurseries() {
    //Only build nurseries if: A) Lacking Health & B) Not lacking Damage & C&D) Has Max Map stacks E) Not farming Spire or advN is off
    //Also, it requires less health during spire
    var a = calcHealthRatio(false, preVoidCheck, true) < getMapHealthCutOff();
    var b = calcHDratio() < getPageSetting("DisableFarm");
    var c = game.global.mapBonus >= getPageSetting('MaxMapBonushealth');
    var d = game.global.mapBonus >= getPageSetting('MaxMapBonuslimit') || calcHDratio() < getPageSetting("mapcuntoff");
    var e = !preSpireFarming || !MODULES.buildings.advancedNurseries;
    var f = !MODULES["buildings"].advancedNurseries;
    return f || (a && b && c && d && e);
}

function buyFoodEfficientHousing() {
    var foodHousing = ["Hut", "House", "Mansion", "Hotel", "Resort"];
    var unlockedHousing = [];
    for (var house in foodHousing) {
        if (game.buildings[foodHousing[house]].locked === 0) {
            unlockedHousing.push(foodHousing[house]);
        }
    }
    var buildorder = [];
    for (var house in unlockedHousing) {
        var building = game.buildings[unlockedHousing[house]];
        var cost = getBuildingItemPrice(building, "food", false, 1);
        var ratio = cost / building.increase.by;
        buildorder.push({
            'name': unlockedHousing[house],
            'ratio': ratio
        });
        document.getElementById(unlockedHousing[house]).style.border = "1px solid #FFFFFF";
    }
    buildorder.sort(function (a, b) {
        return a.ratio - b.ratio;
    });
    var bestfoodBuilding = null;
    var bb = buildorder[0];
    var max = getPageSetting('Max' + bb.name);
    if (game.buildings[bb.name].owned < max || max == -1) {
        bestfoodBuilding = bb.name;
    }
    if (bestfoodBuilding) {
        document.getElementById(bestfoodBuilding).style.border = "1px solid #00CC01";
        safeBuyBuilding(bestfoodBuilding);
    }
}

function buyGemEfficientHousing() {
    var gemHousing = ["Hotel", "Resort", "Gateway", "Collector", "Warpstation"];
    var unlockedHousing = [];
    for (var house in gemHousing) {
        if (game.buildings[gemHousing[house]].locked === 0) {
            unlockedHousing.push(gemHousing[house]);
        }
    }
    var obj = {};
    for (var house in unlockedHousing) {
        var building = game.buildings[unlockedHousing[house]];
        var cost = getBuildingItemPrice(building, "gems", false, 1);
        var ratio = cost / building.increase.by;
	//if (unlockedHousing[house] == "Gateway" && !canAffordBuilding('Gateway')) continue;
        obj[unlockedHousing[house]] = ratio;
        document.getElementById(unlockedHousing[house]).style.border = "1px solid #FFFFFF";
    }
    var keysSorted = Object.keys(obj).sort(function (a, b) {
            return obj[a] - obj[b];
        });
    bestBuilding = null;
    for (var best in keysSorted) {
        var max = getPageSetting('Max' + keysSorted[best]);
        if (max === false) max = -1;
        if (game.buildings[keysSorted[best]].owned < max || max == -1 || (MODULES["buildings"].gemEfficiencyIgnoresLimit && keysSorted[best] != "Gateway")) {
            bestBuilding = keysSorted[best];
            document.getElementById(bestBuilding).style.border = "1px solid #00CC00";
            
            //Gateway Wall
            if (bestBuilding == "Gateway" && MODULES["buildings"].gatewayWall > 1) {
                if (getBuildingItemPrice(game.buildings.Gateway, "fragments", false, 1) > (game.resources.fragments.owned / MODULES["buildings"].gatewayWall)) {
                    document.getElementById(bestBuilding).style.border = "1px solid orange";
	            bestBuilding = null;
                    continue;
                }
	    }

            var skipWarp = false;
            if (getPageSetting('WarpstationCap') && bestBuilding == "Warpstation") {
                if (game.buildings.Warpstation.owned >= (Math.floor(game.upgrades.Gigastation.done * getPageSetting('DeltaGigastation')) + getPageSetting('FirstGigastation')))
                    skipWarp = true;
            }
            var warpwallpct = getPageSetting('WarpstationWall3');
            if (warpwallpct > 1 && bestBuilding == "Warpstation") {
                if (getBuildingItemPrice(game.buildings.Warpstation, "metal", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level) > (game.resources.metal.owned / warpwallpct))
                    skipWarp = true;
            }
            if (skipWarp)
                bestBuilding = null;
            var getcoord = getPageSetting('WarpstationCoordBuy');
            if (getcoord && skipWarp) {
                var toTip = game.buildings.Warpstation;
                if (canAffordBuilding("Warpstation")) {
                    var howMany = calculateMaxAfford(game.buildings["Warpstation"], true);
                    var needCoord = game.upgrades.Coordination.allowed - game.upgrades.Coordination.done > 0;
                    var coordReplace = (game.portal.Coordinated.level) ? (25 * Math.pow(game.portal.Coordinated.modifier, game.portal.Coordinated.level)).toFixed(3) : 25;
                    if (!canAffordCoordinationTrimps()){
                        var nextCount = (game.portal.Coordinated.level) ? game.portal.Coordinated.currentSend : game.resources.trimps.maxSoldiers;
                        var amtToGo = ((nextCount * 3) - game.resources.trimps.realMax());
                        var increase = toTip.increase.by;
                        if (game.portal.Carpentry.level && toTip.increase.what == "trimps.max") increase *= Math.pow(1.1, game.portal.Carpentry.level);
                        if (game.portal.Carpentry_II.level && toTip.increase.what == "trimps.max") increase *= (1 + (game.portal.Carpentry_II.modifier * game.portal.Carpentry_II.level));
                        if (amtToGo < increase*howMany)
                            bestBuilding = "Warpstation";
                    }
                }
            }
            break;
        }
    }
    if (bestBuilding) {
        safeBuyBuilding(bestBuilding);
    }
}

function buyBuildings() {
    if ((game.jobs.Miner.locked && game.global.challengeActive != 'Metal') || (game.jobs.Scientist.locked && game.global.challengeActive != "Scientist")) return;
    var customVars = MODULES["buildings"];
    var oldBuy = preBuy2();
    var hidebuild = (getPageSetting('BuyBuildingsNew')===0 && getPageSetting('hidebuildings')==true);
    game.global.buyAmt = 1;
    if (!hidebuild) {
    buyFoodEfficientHousing();
    buyGemEfficientHousing();
  	}
    if (!hidebuild && getPageSetting('MaxWormhole') > 0 && game.buildings.Wormhole.owned < getPageSetting('MaxWormhole') && !game.buildings.Wormhole.locked) {
        safeBuyBuilding('Wormhole');
    }

    //Gyms:
    if (!game.buildings.Gym.locked && (getPageSetting('MaxGym') > game.buildings.Gym.owned || getPageSetting('MaxGym') == -1)) {
        var skipGym = false;
	
	//Dynamic Gyms
        if (getPageSetting('DynamicGyms')) {
	    var nextGym = game.upgrades.Gymystic.modifier;
            var currentEnemyDamageOK = (calcOurBlock(true) > nextGym * calcBadGuyDmg(getCurrentEnemy(), null, true,true));
            var zoneDamage = calcBadGuyDmg(null, getEnemyMaxAttack(game.global.world, 99, 'Snimp', 1.0), true, true);
            var zoneEnemyDamageOK = !game.global.mapsActive && (calcOurBlock(true) > nextGym * zoneDamage);
            
            //Stop buying Gyms if we already have enough block for our current enemy, and are not lacking in health to progress
            //Or if we are on world and have enough block to defeat an C99 Snimp
            if (!game.global.preMapsActive && !game.global.spireActive && enoughHealth && currentEnemyDamageOK && zoneEnemyDamageOK) skipGym = true;
	}
	
	//Gym Wall
        var gymwallpct = getPageSetting('GymWall');
        if (gymwallpct > 1) {
            if (getBuildingItemPrice(game.buildings.Gym, "wood", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level)
                > (game.resources.wood.owned / gymwallpct))
                    skipGym = true;
	}

        //ShieldBlock cost Effectiveness:
        if (game.equipment['Shield'].blockNow) {
            var gymEff = evaluateEquipmentEfficiency('Gym');
            var shieldEff = evaluateEquipmentEfficiency('Shield');
            if ((gymEff.Wall) || (gymEff.Factor <= shieldEff.Factor && !gymEff.Wall))
                skipGym = true;
        }
	
	//Buy Gym
        if (!needGymystic && !skipGym) safeBuyBuilding('Gym');
       	needGymystic = false;
    }
    
    //Tributes:
    if (!game.buildings.Tribute.locked && !hidebuild && (getPageSetting('MaxTribute') > game.buildings.Tribute.owned || getPageSetting('MaxTribute') == -1))
        safeBuyBuilding('Tribute');
    
    //Nurseries
    if (game.buildings.Nursery.locked == 0 && advancedNurseries() && (!hidebuild && (game.global.world >= getPageSetting('NoNurseriesUntil') || getPageSetting('NoNurseriesUntil') < 1) && (getPageSetting('MaxNursery') > game.buildings.Nursery.owned || getPageSetting('MaxNursery') == -1)) || (game.global.challengeActive != "Daily" && getPageSetting('PreSpireNurseries') > game.buildings.Nursery.owned && isActiveSpireAT()) || (game.global.challengeActive == "Daily" && getPageSetting('dPreSpireNurseries') > game.buildings.Nursery.owned && disActiveSpireAT())) {
        //Nursery Wall
        var nurseryWallpct = MODULES["buildings"].nurseryWall;
        if (nurseryWallpct <= 1 || getBuildingItemPrice(game.buildings.Nursery, "gems", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level) < (game.resources.gems.owned / nurseryWallpct))
            safeBuyBuilding('Nursery');
    }

    postBuy2(oldBuy);
}

function buyStorage() {
    var customVars = MODULES["buildings"];
    var packMod = 1 + game.portal.Packrat.level * game.portal.Packrat.modifier;
    var Bs = {
        'Barn': 'food',
        'Shed': 'wood',
        'Forge': 'metal'
    };
    for (var B in Bs) {
        var jest = 0;
        var owned = game.resources[Bs[B]].owned;
        var max = game.resources[Bs[B]].max * packMod;
        max = calcHeirloomBonus("Shield", "storageSize", max);
        if (game.global.mapsActive && game.unlocks.imps.Jestimp) {
            jest = simpleSeconds(Bs[B], 45);
            jest = scaleToCurrentMap(jest);
        }
        if ((game.global.world == 1 && owned > max * customVars.storageLowlvlCutoff1) ||
            (game.global.world >= 2 && game.global.world < 10 && owned > max * customVars.storageLowlvlCutoff2) ||
            (owned + jest > max * customVars.storageMainCutoff)) {
            if (canAffordBuilding(B) && game.triggers[B].done) {
                safeBuyBuilding(B);
            }
        }
    }
}

//Radon

var RhousingList = ['Hut', 'House', 'Mansion', 'Hotel', 'Resort', 'Gateway', 'Collector'];

function RsafeBuyBuilding(building) {
    if (isBuildingInQueue(building))
        return false;
    if (game.buildings[building].locked)
        return false;
    var oldBuy = preBuy2();

  if (game.talents.deciBuild.purchased) {
        game.global.buyAmt = 10;
    if (!canAffordBuilding(building)) {
        game.global.buyAmt = 2;
	if (!canAffordBuilding(building))
            game.global.buyAmt = 1;
     }
  }
  else if (bwRewardUnlocked("DoubleBuild")) {
        game.global.buyAmt = 2;
  	if (!canAffordBuilding(building)) 
        game.global.buyAmt = 1;
  }        
  else game.global.buyAmt = 1;

  if (!canAffordBuilding(building)) {
      postBuy2(oldBuy);
      return false;
  }

    game.global.firing = false;
	
    debug('Building ' + building, "buildings", '*hammer2');
    if (!game.buildings[building].locked && canAffordBuilding(building)) {
	    buyBuilding(building, true, true);
    }
    postBuy2(oldBuy);
    return true;
}

function RbuyFoodEfficientHousing() {
    var foodHousing = ["Hut", "House", "Mansion", "Hotel", "Resort"];
    var unlockedHousing = [];
    for (var house in foodHousing) {
        if (game.buildings[foodHousing[house]].locked === 0) {
            unlockedHousing.push(foodHousing[house]);
        }
    }
    var buildorder = [];
    if (unlockedHousing.length > 0) {
    for (var house in unlockedHousing) {
        var building = game.buildings[unlockedHousing[house]];
        var cost = getBuildingItemPrice(building, "food", false, 1);
        var ratio = cost / building.increase.by;
        buildorder.push({
            'name': unlockedHousing[house],
            'ratio': ratio
        });
        document.getElementById(unlockedHousing[house]).style.border = "1px solid #FFFFFF";
    }
    buildorder.sort(function (a, b) {
        return a.ratio - b.ratio;
    });
    var bestfoodBuilding = null;
    var bb = buildorder[0];
    var max = getPageSetting('RMax' + bb.name);
    if (game.buildings[bb.name].owned < max || max == -1) {
        bestfoodBuilding = bb.name;
    }
    if (smithylogic(bestfoodBuilding, 'wood', false) && bestfoodBuilding) {
        document.getElementById(bestfoodBuilding).style.border = "1px solid #00CC01";
        RsafeBuyBuilding(bestfoodBuilding);
    }
    }
}

function RbuyGemEfficientHousing() {
    var gemHousing = ["Mansion", "Hotel", "Resort", "Gateway", "Collector"];
    var unlockedHousing = [];
    for (var house in gemHousing) {
        if (game.buildings[gemHousing[house]].locked === 0) {
            unlockedHousing.push(gemHousing[house]);
        }
    }
    var obj = {};
    for (var house in unlockedHousing) {
        var building = game.buildings[unlockedHousing[house]];
        var cost = getBuildingItemPrice(building, "gems", false, 1);
        var ratio = cost / building.increase.by;
        obj[unlockedHousing[house]] = ratio;
        document.getElementById(unlockedHousing[house]).style.border = "1px solid #FFFFFF";
    }
    var keysSorted = Object.keys(obj).sort(function (a, b) {
            return obj[a] - obj[b];
        });
    bestBuilding = null;
    for (var best in keysSorted) {
        var max = getPageSetting('RMax' + keysSorted[best]);
        if (max === false) max = -1;
        if (game.buildings[keysSorted[best]].owned < max || max == -1) {
            bestBuilding = keysSorted[best];
            document.getElementById(bestBuilding).style.border = "1px solid #00CC00";
            break;
        }
    }
    if (smithylogic(bestBuilding, 'gems', false) && bestBuilding) {
        RsafeBuyBuilding(bestBuilding);
    }
}

var smithybought = 0;

function RbuyBuildings() {

    var oldBuy = preBuy2();
    game.global.buyAmt = 1;
	
    //Smithy
    if (!game.buildings.Smithy.locked && canAffordBuilding('Smithy') && game.global.challengeActive != "Quest") {
        RsafeBuyBuilding('Smithy');
    }
    if (smithybought <= 0 && !game.buildings.Smithy.locked && canAffordBuilding('Smithy') && game.global.challengeActive == "Quest" && ((questcheck() == 7) || (RcalcHDratio() * 10 >= getPageSetting('Rmapcuntoff')))) {
	buyBuilding("Smithy", true, true, 1);
	smithybought = game.global.world;
    }
    if (smithybought > 0 && game.global.world > smithybought && game.global.challengeActive == "Quest") {
	smithybought = 0;
    }
	
    //Micro
    if (!game.buildings.Microchip.locked && canAffordBuilding('Microchip')) {
        RsafeBuyBuilding('Microchip');
    }

    //Housing
    RbuyFoodEfficientHousing();
    RbuyGemEfficientHousing();

    //Tributes
    if (!game.buildings.Tribute.locked &&(getPageSetting('RMaxTribute') > game.buildings.Tribute.owned || getPageSetting('RMaxTribute') == -1)) {
        RsafeBuyBuilding('Tribute');
    }

    postBuy2(oldBuy);
}

function RbuyStorage() {
    var customVars = MODULES["buildings"];
    var packMod = 1 + game.portal.Packrat.level * game.portal.Packrat.modifier;
    var Bs = {
        'Barn': 'food',
        'Shed': 'wood',
        'Forge': 'metal'
    };
    for (var B in Bs) {
        var jest = 0;
        var owned = game.resources[Bs[B]].owned;
        var max = game.resources[Bs[B]].max * packMod;
        max = calcHeirloomBonus("Shield", "storageSize", max);
        if (game.global.mapsActive && game.unlocks.imps.Jestimp) {
            jest = simpleSeconds(Bs[B], 45);
            jest = scaleToCurrentMap(jest);
        }
        if ((game.global.world == 1 && owned > max * customVars.storageLowlvlCutoff1) ||
            (game.global.world >= 2 && game.global.world < 10 && owned > max * customVars.storageLowlvlCutoff2) ||
            (owned + jest > max * customVars.storageMainCutoff)) {
            if (canAffordBuilding(B) && game.triggers[B].done) {
                RsafeBuyBuilding(B);
            }
        }
    }
}
