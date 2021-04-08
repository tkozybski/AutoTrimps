var critCC = 1;
var critDD = 1;
var trimpAA = 1;

//Helium

function debugCalc() {
    //Pre-Init
    var type = (!game.global.mapsActive) ? "world" : (getCurrentMapObject().location == "Void" ? "void" : "map");
    var zone = (type == "world" || !game.global.mapsActive) ? game.global.world : getCurrentMapObject().level;
    var cell = (type == "world" || !game.global.mapsActive) ? getCurrentWorldCell().level : (getCurrentMapCell() ? getCurrentMapCell().level : 1);
    var name = getCurrentEnemy() ? getCurrentEnemy().name : "Chimp";

    //Init
    var displayedMin = calcOurDmg("min", true, true, "never", type != "world", true);
    var displayedMax = calcOurDmg("max", true, true, "never", type != "world", true);

    //Trimp Stats
    debug("Our Stats");
    debug("Our attack: " + displayedMin.toExponential(1) + "-" + displayedMax.toExponential(2));
    debug("Our crit: " + (getPlayerCritChance()*100) + "% for " + getPlayerCritDamageMult().toFixed(1) + "x Damage. Average of " + getCritMulti(false, "maybe").toFixed(2) + "x");
    debug("Our block: " + calcOurBlock(true, true).toExponential(2));
    debug("Our Health: " + calcOurHealth(true, false, true).toExponential(2));

    //Enemy stats
    debug("Enemy Stats");
    debug("Enemy Attack: " + calcEnemyAttack(type, zone, cell, name, true).toExponential(2) + "-" + calcEnemyAttack(type, zone, cell, name).toExponential(2));
    debug("Enemy Health: " + calcEnemyHealth(type, zone, cell, name).toExponential(2));
    debug("Specific Enemy Attack: " + calcSpecificEnemyAttack().toExponential(2));
    debug("Specific Enemy Health: " + calcSpecificEnemyHealth().toExponential(2));
}

function calcEquipment(type = "attack") {
    //Init
    var bonus = 0;
    var equipmentList;

    //Equipment names
    if (type == "attack") equipmentList = ["Dagger", "Mace", "Polearm", "Battleaxe", "Greatsword", "Arbalest"];
    else equipmentList = ["Shield", "Boots", "Helmet", "Pants", "Shoulderguards", "Breastplate", "Gambeson"];

    //For each equipment
    for(var i = 0; i < equipmentList.length; i++) {
        //Check if it's unlocked
        var equip = game.equipment[equipmentList[i]];
        if (equip.locked !== 0) continue;

        //Get the bonus
        bonus += equip.level * (type == "attack" ? equip.attackCalculated : equip.healthCalculated);
    }

    return bonus;
}

function getTrimpAttack(realDamage) {
    //This is actual damage of the army in combat ATM, without considering items bought, but not yet in use
    if (realDamage) return game.global.soldierCurrentAttack;

    //Damage from equipments and Coordinations
    var dmg = (6 + calcEquipment("attack")) * game.resources.trimps.maxSoldiers;
    
    //Magma
    if (mutations.Magma.active()) dmg *= mutations.Magma.getTrimpDecay();
    
    //Power I
    if (game.portal.Power.level > 0) dmg += (dmg * game.portal.Power.level * game.portal.Power.modifier);
    
    //Power II
    if (game.portal.Power_II.level > 0) dmg *= (1 + (game.portal.Power_II.modifier * game.portal.Power_II.level));
    
    //Formation
    if (game.global.formation != 0) dmg *= (game.global.formation == 2) ? 4 : 0.5;
    
    return dmg;
}

function getTrimpHealth(realHealth) {
    //This is the actual health of the army ATM, without considering items bought, but not yet in use
    if (realHealth) return game.global.soldierHealthMax;

    //Health from equipments and coordination
    var health = (50 + calcEquipment("health")) * game.resources.trimps.maxSoldiers;

    //Toughness
    if (game.portal.Toughness.level > 0)
        health *= ((game.portal.Toughness.level * game.portal.Toughness.modifier) + 1);
    
    //Toughness II
    if (game.portal.Toughness_II.level > 0)
        health *= ((game.portal.Toughness_II.level * game.portal.Toughness_II.modifier) + 1);
    
    //Resilience
    if (game.portal.Resilience.level > 0)
        health *= (Math.pow(game.portal.Resilience.modifier + 1, game.portal.Resilience.level));
    
    //Geneticists
    var geneticist = game.jobs.Geneticist;
    if (geneticist.owned > 0) health *= (Math.pow(1.01, game.global.lastLowGen));
    
    //Formation
    if (game.global.formation !== 0) health *= (game.global.formation == 1) ? 4 : 0.5;
    
    //Golden Battle
    if (game.goldenUpgrades.Battle.currentBonus > 0) health *= game.goldenUpgrades.Battle.currentBonus + 1;
    
    //Heirloom
    var heirloomBonus = calcHeirloomBonus("Shield", "trimpHealth", 0, true);
    if (heirloomBonus > 0) health *= ((heirloomBonus / 100) + 1);
    
    //C2
    if (game.global.totalSquaredReward > 0) health *= (1 + (game.global.totalSquaredReward / 100));
    
    return health;
}

function calcOurBlock(stance, realBlock) {
    var block = 0;

    //Ignores block gyms/shield that have been brought, but not yet deployed
    if (realBlock) {
        block = game.global.soldierCurrentBlock;
        if (stance || game.global.formation == 0) return block;
        if (game.global.formation == 3) return block/4;
        return block * 2;
    }
    
    //Gyms
    var gym = game.buildings.Gym;
    if (gym.owned > 0) block += gym.owned * gym.increase.by;
    
    //Shield Block
    var shield = game.equipment.Shield;
    if (shield.blockNow && shield.level > 0) block += shield.level * shield.blockCalculated;
    
    //Trainers
    var trainer = game.jobs.Trainer;
    if (trainer.owned > 0) {
        var trainerStrength = trainer.owned * (trainer.modifier / 100);
        block *= 1 + calcHeirloomBonus("Shield", "trainerEfficiency", trainerStrength);
    }
    
    //Coordination
    block *= game.resources.trimps.maxSoldiers;

    //Stances
    if (stance && game.global.formation != 0) block *= game.global.formation == 3 ? 4 : 0.5;
    
    //Heirloom
    var heirloomBonus = calcHeirloomBonus("Shield", "trimpBlock", 0, true);
    if (heirloomBonus > 0) block *= ((heirloomBonus / 100) + 1);
    
    //Radio Stacks
    //if (game.global.radioStacks > 0) block *= (1 - (game.global.radioStacks * 0.1));
    
    return block;
}

function calcOurHealth(stance, fullGeneticist, realHealth) {
    var health = getTrimpHealth(realHealth);
    
    //Formation
    if (!stance && game.global.formation != 0) health /= (game.global.formation == 1) ? 4 : 0.5;
    
    //Geneticists
    var geneticist = game.jobs.Geneticist;
    if (fullGeneticist && geneticist.owned > 0) health *= (Math.pow(1.01, geneticist.owned - game.global.lastLowGen));
    
    //Challenges
    if (game.global.challengeActive == "Life") health *= game.challenges.Life.getHealthMult();
    else if (game.global.challengeActive == "Balance") health *= game.challenges.Balance.getHealthMult();
    else if (typeof game.global.dailyChallenge.pressure !== 'undefined')
        health *= (dailyModifiers.pressure.getMult(game.global.dailyChallenge.pressure.strength, game.global.dailyChallenge.pressure.stacks));
    
    //Magma
    if (mutations.Magma.active()) {
        var mult = mutations.Magma.getTrimpDecay();
        //var zoneDiff = game.global.world - mutations.Magma.start() + 1; DEBUG
        health *= mult;
    }
    
    //Radio
    //if (game.global.radioStacks > 0) health *= (1 - (game.global.radioStacks * 0.1));
    
    //Amalgamator
    if (game.jobs.Amalgamator.owned > 0) health *= game.jobs.Amalgamator.getHealthMult();
    
    //Void Power
    if (game.talents.voidPower.purchased && game.global.voidBuff) {
        var amt = (game.talents.voidPower2.purchased) ? ((game.talents.voidPower3.purchased) ? 65 : 35) : 15;
        health *= (1 + (amt / 100));
    }
    
    return health;
}

function calcHealthRatio(stance, fullGeneticist, type, targetZone) {
    //Pre Init
    if (!type) type = preVoidCheck ? "void" : "world";
    if (!targetZone) targetZone = game.global.world;

    //Init
    var voidDamage = 0;
    const formationMod = (game.upgrades.Dominance.done && !stance) ? 2 : 1;

    //Our Health and Block
    var health = calcOurHealth(stance, fullGeneticist) / formationMod;
    var block = calcOurBlock(stance) / formationMod;

    //Lead farms one zone ahead
    if (game.global.challengeActive == "Lead" && type == "world" && game.global.world%2 == 1) targetZone++;

    //Enemy Damage
    var worldDamage = calcEnemyAttack("world", targetZone);
    
    //Enemy Damage on Void Maps
    if (type == "void") voidDamage = calcEnemyAttack("void", targetZone);

    //Pierce & Voids
    var pierce = (game.global.brokenPlanet) ? getPierceAmt() : 0;
    if (!stance && game.global.formation == 3) pierce *= 2; //Cancels the influence of the Barrier Formation

    //The Resulting Ratio
    var finalDmg = Math.max(worldDamage - block, voidDamage - block, worldDamage * pierce, 0);
    return health / finalDmg;
}

function highDamageShield() {
    if (game.global.challengeActive != "Daily" && game.global.ShieldEquipped.name == getPageSetting("highdmg")) {
        critCC = getPlayerCritChance();
        critDD = getPlayerCritDamageMult();
        trimpAA = (calcHeirloomBonus("Shield", "trimpAttack", 1, true)/100);
    }
    if (game.global.challengeActive == "Daily" && game.global.ShieldEquipped.name == getPageSetting("dhighdmg")) {
        critCC = getPlayerCritChance();
        critDD = getPlayerCritDamageMult();
        trimpAA = (calcHeirloomBonus("Shield", "trimpAttack", 1, true)/100);
    }
}

function getCritMulti(high, crit) {
    var critChance = getPlayerCritChance();
    var critD = getPlayerCritDamageMult();
	var critDHModifier;

    if (crit == "never") critChance = Math.floor(critChance);
    else if (crit == "force") critChance = Math.ceil(critChance);

    if (high && (getPageSetting('AutoStance') == 3 && getPageSetting('highdmg') != undefined && game.global.challengeActive != "Daily") || 
        (getPageSetting('use3daily') == true && getPageSetting('dhighdmg') != undefined && game.global.challengeActive == "Daily")) {
            highDamageShield();
            critChance = critCC;
        critD = critDD;
    }

    if      (critChance < 0) critDHModifier = (1+critChance - critChance/5);
    else if (critChance < 1) critDHModifier = (1-critChance + critChance * critD);
    else if (critChance < 2) critDHModifier = ((critChance-1) * getMegaCritDamageMult(2) * critD + (2-critChance) * critD);
    else                     critDHModifier = ((critChance-2) * Math.pow(getMegaCritDamageMult(2),2) * critD + (3-critChance) * getMegaCritDamageMult(2) * critD);

    return critDHModifier;
}

function getAnticipationBonus(stacks) {
    //Pre-Init
    if (stacks == undefined) stacks = game.global.antiStacks;

    //Init
    var perkMult = game.portal.Anticipation.level * game.portal.Anticipation.modifier;
    var stacks45 = getPageSetting('45stacks') != false && getPageSetting('45stacks') != "false";

    //Regular anticipation
    if (!stacks45) return 1 + stacks * perkMult;

    //45 stacks (??)
    return 1 + 45 * perkMult;
}

function calcOurDmg(minMaxAvg, incStance, incFlucts, critMode, ignoreMapBonus, realDamage) {
    //Init
    var number = getTrimpAttack(realDamage);
    var minFluct = 0.8;
    var maxFluct = 1.2;

    //Amalgamator
    if (game.jobs.Amalgamator.owned > 0) {
        number *= game.jobs.Amalgamator.getDamageMult();
    }
	
    //Map Bonus
    if (game.global.mapBonus > 0 && !ignoreMapBonus) {
        var mapBonus = game.global.mapBonus;
        if (game.talents.mapBattery.purchased && mapBonus == 10) mapBonus *= 2;
        number *= ((mapBonus * .2) + 1);
    }
    
    //Range
    if (game.portal.Range.level > 0) minFluct += 0.02 * game.portal.Range.level;

    //Achievements
    if (game.global.achievementBonus > 0) number *= (1 + (game.global.achievementBonus / 100));

    //Anticipation
    if (game.global.antiStacks > 0) number *= getAnticipationBonus();

    //Formation
    if (!incStance && game.global.formation != 0) number /= (game.global.formation == 2) ? 4 : 0.5;

    //Robo Trimp
    if (game.global.roboTrimpLevel > 0) number *= ((0.2 * game.global.roboTrimpLevel) + 1);

    //Heirlooms
    number = calcHeirloomBonus("Shield", "trimpAttack", number);

    //Fluffy
    if (Fluffy.isActive()) number *= Fluffy.getDamageModifier();

    //Gamma Burst
    if (getHeirloomBonus("Shield", "gammaBurst") > 0 && calcOurHealth() / calcEnemyAttack() >= 5)
        number *= ((getHeirloomBonus("Shield", "gammaBurst") / 100) + 1) / 5;
    
    //Challenges
    if (game.global.challengeActive == "Life") number *= game.challenges.Life.getHealthMult();
    if (game.global.challengeActive == "Lead" && (game.global.world % 2) == 1) number *= 1.5;
    if (game.challenges.Electricity.stacks > 0) number *= 1 - (game.challenges.Electricity.stacks * 0.1);
	
    //Decay
    if (game.global.challengeActive == "Decay") {
        number *= 5;
        number *= Math.pow(0.995, game.challenges.Decay.stacks);
    }
    
    //Discipline
    if (game.global.challengeActive == "Discipline") {
        minFluct = 0.005;
        maxFluct = 1.995;
    }

    //Daily
    if (game.global.challengeActive == "Daily") {
        //Range Dailies
        if (typeof game.global.dailyChallenge.minDamage !== 'undefined') minFluct = dailyModifiers.minDamage.getMult(game.global.dailyChallenge.minDamage.strength);
        if (typeof game.global.dailyChallenge.maxDamage !== 'undefined') maxFluct = dailyModifiers.maxDamage.getMult(game.global.dailyChallenge.maxDamage.strength);
        
	    //Even-Odd Dailies
        if (typeof game.global.dailyChallenge.oddTrimpNerf !== 'undefined' && ((game.global.world % 2) == 1))
            number *= dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength);
        if (typeof game.global.dailyChallenge.evenTrimpBuff !== 'undefined' && ((game.global.world % 2) == 0))
            number *= dailyModifiers.evenTrimpBuff.getMult(game.global.dailyChallenge.evenTrimpBuff.strength);
        
        //Rampage Dailies
        if (typeof game.global.dailyChallenge.rampage !== 'undefined')
            number *= dailyModifiers.rampage.getMult(game.global.dailyChallenge.rampage.strength, game.global.dailyChallenge.rampage.stacks);
    }
	
    //Battle Goldens
    if (game.goldenUpgrades.Battle.currentBonus > 0) number *= game.goldenUpgrades.Battle.currentBonus + 1;

    //Empowerments
    if (getPageSetting("fullice") == true && getEmpowerment() == "Ice") number *= (Fluffy.isRewardActive('naturesWrath') ? 3 : 2);
    if (getPageSetting('fullice') == false && getEmpowerment() == "Ice") number *= (game.empowerments.Ice.getDamageModifier()+1);
    if (getEmpowerment() == "Poison" && getPageSetting('addpoison') == true) {
        number *= (1 + game.empowerments.Poison.getModifier());
        number *= 4;
    }

    //Masteries - Herbalist, Legs for Days, Magmamancer, Still Rowing II, Void Mastery, Health Strength, Sugar Rush
    if (game.talents.herbalist.purchased) number *= game.talents.herbalist.getBonus();
    if (game.global.challengeActive == "Daily" && game.talents.daily.purchased) number *= 1.5;
    if (game.talents.magmamancer.purchased) number *= game.jobs.Magmamancer.getBonusPercent();
    if (game.talents.stillRowing2.purchased) number *= ((game.global.spireRows * 0.06) + 1);
    if (game.global.voidBuff && game.talents.voidMastery.purchased) number *= 5;
    if (game.talents.healthStrength.purchased && mutations.Healthy.active()) number *= ((0.15 * mutations.Healthy.cellCount()) + 1);
    if (game.global.sugarRush > 0) number *= sugarRush.getAttackStrength();

    //Void Power
    if (game.talents.voidPower.purchased && game.global.voidBuff) {
        var vpAmt = (game.talents.voidPower2.purchased) ? ((game.talents.voidPower3.purchased) ? 65 : 35) : 15;
        number *= ((vpAmt / 100) + 1);
    }

    //Scryhard
    if (incStance && game.talents.scry.purchased && game.global.formation == 4 && (mutations.Healthy.active() || mutations.Corruption.active()))
        number *= 2;

    //Spire Strength Trap
    if (playerSpireTraps.Strength.owned) {
        var strBonus = playerSpireTraps.Strength.getWorldBonus();
        number *= (1 + (strBonus / 100));
    }

    //Fluffy + Sharp Trimps + Uber Poison + Challenge²
    if (Fluffy.isRewardActive('voidSiphon') && game.stats.totalVoidMaps.value) number *= (1 + (game.stats.totalVoidMaps.value * 0.05));
    if (game.singleRunBonuses.sharpTrimps.owned) number *= 1.5;
    if (game.global.uberNature == "Poison") number *= 3;
    if (game.global.totalSquaredReward > 0) number *= ((game.global.totalSquaredReward / 100) + 1);
    
    //Init Damage Variation (Crit)
    var min = number * getCritMulti(false, (critMode) ? critMode : "never");
    var avg = number * getCritMulti(false, (critMode) ? critMode : "maybe");
    var max = number * getCritMulti(false, (critMode) ? critMode : "force");

    //Damage Range
    if (incFlucts) {
        //Apply fluctuation
        min *= minFluct;
        max *= maxFluct;
        avg *= (maxFluct + minFluct)/2;
    }

    //Well, finally, huh?
    if (minMaxAvg == "min") return Math.floor(min);
    if (minMaxAvg == "max") return Math.ceil(max);
    
    return avg;
}

function calcDailyAttackMod(number) {
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.badStrength !== 'undefined'){
            number *= dailyModifiers.badStrength.getMult(game.global.dailyChallenge.badStrength.strength);
        }
        if (typeof game.global.dailyChallenge.badMapStrength !== 'undefined' && game.global.mapsActive){
            number *= dailyModifiers.badMapStrength.getMult(game.global.dailyChallenge.badMapStrength.strength);
        }
        if (typeof game.global.dailyChallenge.bloodthirst !== 'undefined'){
            number *= dailyModifiers.bloodthirst.getMult(game.global.dailyChallenge.bloodthirst.strength, game.global.dailyChallenge.bloodthirst.stacks);
        }
    }
    return number;
}

function calcSpire(what, cell, name) {
    //Target Cell
    if (!cell) {
        if (game.global.challengeActive != "Daily" && isActiveSpireAT() && getPageSetting('ExitSpireCell') > 0 && getPageSetting('ExitSpireCell') <= 100)
            cell = getPageSetting('ExitSpireCell');
        else if (game.global.challengeActive == "Daily" && disActiveSpireAT() && getPageSetting('dExitSpireCell') > 0 && getPageSetting('dExitSpireCell') <= 100)
            cell = getPageSetting('dExitSpireCell');
        else cell = 100;
    }

    //Enemy on the Target Cell
    var enemy = (name) ? name : game.global.gridArray[cell-1].name;
    var base = (what == "attack") ? calcEnemyBaseAttack("world", game.global.world, cell, enemy) : calcEnemyBaseHealth("world", game.global.world, cell, enemy);
    var mod = (what == "attack") ? 1.17 : 1.14;

    //Spire Num
    var spireNum = Math.floor((game.global.world-100)/100);
    if (spireNum > 1) {
        var modRaiser = 0;
        modRaiser += ((spireNum - 1) / 100);
        if (what == "attack") modRaiser *= 8;
        if (what == "health") modRaiser *= 2;
        mod += modRaiser;
    }

    //Math
    base *= Math.pow(mod, cell);
    base *= game.badGuys[enemy][what];

    //Compensations
    if (game.global.challengeActive == "Domination" && cell != 100) base /= (what == "attack") ? 10 : 75 * 4;

    return base;
}

function calcEnemyBaseAttack(type, zone, cell, name) {
    //Pre-Init
    if (!type) type = (!game.global.mapsActive) ? "world" : (getCurrentMapObject().location == "Void" ? "void" : "map");
    if (!zone) zone = (type == "world" || !game.global.mapsActive) ? game.global.world : getCurrentMapObject().level;
    if (!cell) cell = (type == "world" || !game.global.mapsActive) ? getCurrentWorldCell().level : (getCurrentMapCell() ? getCurrentMapCell().level : 1);
    if (!name) name = getCurrentEnemy() ? getCurrentEnemy().name : "Snimp";
    
    //Init
    var attack = 50 * Math.sqrt(zone) * Math.pow(3.27, zone/2) - 10;
    
    //Zone 1
    if (zone == 1) {
        attack *= 0.35;
        attack = (0.2 * attack) + (0.75 * attack * (cell / 100));
    }
    
    //Zone 2
    else if (zone == 2) {
        attack *= 0.5;
        attack = (0.32 * attack) + (0.68 * attack * (cell / 100));
    }
    
    //Before Breaking the Planet
    else if (zone < 60) {
        attack = (0.375 * attack) + (0.7 * attack * (cell / 100));
    }
    
    //Also Before Breaking the Planet
    if (zone < 60) attack *= 0.85;
    

    //After Breaking the Planet
    else {
        attack = (0.4 * attack) + (0.9 * attack * (cell / 100));
        attack *= Math.pow(1.15, zone - 59);
    }
    
    //Maps
    if (zone > 5 && type != "world") attack *= 1.1;

    //Specific Imp
    if (name) attack *= game.badGuys[name].attack;

    return Math.floor(attack);
}

function calcEnemyAttackCore(type, zone, cell, name, minOrMax, customAttack) {
    //Pre-Init
    if (!type) type = (!game.global.mapsActive) ? "world" : (getCurrentMapObject().location == "Void" ? "void" : "map");
    if (!zone) zone = (type == "world" || !game.global.mapsActive) ? game.global.world : getCurrentMapObject().level;
    if (!cell) cell = (type == "world" || !game.global.mapsActive) ? getCurrentWorldCell().level : (getCurrentMapCell() ? getCurrentMapCell().level : 1);
    if (!name) name = getCurrentEnemy() ? getCurrentEnemy().name : "Snimp";
    
    //Init
    var attack = calcEnemyBaseAttack(type, zone, cell, name);

    //Spire - Overrides the base attack number
    if (type == "world" && game.global.spireActive) attack = calcSpire("attack");

    //Map and Void Corruption
    if (type != "world") {
        //Corruption
        var corruptionScale = calcCorruptionScale(zone, 3);
        if (mutations.Magma.active()) attack *= corruptionScale / (type == "void" ? 1 : 2);
        else if (type == "void" && mutations.Corruption.active()) attack *= corruptionScale / 2;
    }
    
    //Use custom values instead
    if (customAttack) attack = customAttack;
    
    //WARNING! Check every challenge!
    //A few challenges
    if      (game.global.challengeActive == "Meditate")   attack *= 1.5;
    else if (game.global.challengeActive == 'Life')       attack *= 6;
    else if (game.global.challengeActive == "Crushed")    attack *= 3;
    else if (game.global.challengeActive == "Watch")      attack *= 1.25;
    else if (game.global.challengeActive == "Corrupted")  attack *= 3;
    else if (game.global.challengeActive == "Coordinate") attack *= getBadCoordLevel();
    else if (game.global.challengeActive == "Scientist" && getScientistLevel() == 5) attack *= 10;

    //Dailies
    if (game.global.challengeActive == "Daily") {
        if (typeof game.global.dailyChallenge.empower !== "undefined") attack *= 1 + 0.002 * game.global.dailyChallenge.empower.stacks;
    }

    //Obliterated and Eradicated
    else if (game.global.challengeActive == "Obliterated" || game.global.challengeActive == "Eradicated") {
        var oblitMult = (game.global.challengeActive == "Eradicated") ? game.challenges.Eradicated.scaleModifier : 1e12;
        var zoneModifier = Math.floor(game.global.world / game.challenges[game.global.challengeActive].zoneScaleFreq);
        oblitMult *= Math.pow(game.challenges[game.global.challengeActive].zoneScaling, zoneModifier);
        attack *= oblitMult
    }
    
    return minOrMax ? 0.8 * attack : 1.2 * attack;
}

function calcEnemyAttack(type, zone, cell = 99, name = "Snimp", minOrMax) {
    //Pre-Init
    if (!type) type = preVoidCheck ? "void" : "world";
    if (!zone) zone = game.global.world;
    
    //Init
    var attack = calcEnemyAttackCore(type, zone, cell, name, minOrMax);
    var corrupt = zone >= mutations.Corruption.start();
    var healthy = mutations.Healthy.active();
    
    //Challenges
    if      (game.global.challengeActive == "Lead")       attack *= (zone%2 == 0) ? 5.08 : (1 + 0.04 * game.challenges.Lead.stacks);
    else if (game.global.challengeActive == "Toxicity")   attack *= 5;
    else if (game.global.challengeActive == "Domination") attack *= 2.5;

    //Daily
    else attack = calcDailyAttackMod(attack);

    //Void Map Difficulty (implicit 100% difficulty on regular maps)
    if (type == "void") attack *= (zone >= 60) ? 4.5 : 2.5;

    //Average corrupt impact on World times two - this is to compensate a bit for Corrupted buffs. Improbabilities count as 5.
    if (type == "world" && corrupt && !healthy && !game.global.spireActive) {
        //It uses the average times two for damage because otherwise trimps would be full pop half of the time, but dead in the other half
        var corruptionAmount = Math.max(50, ~~((zone - mutations.Corruption.start())/3) + 7); //Integer division
        var corruptionWeight = (104 - corruptionAmount) + 2 * corruptionAmount * calcCorruptionScale(zone, 3);
        attack *= corruptionWeight/100;
    }
    
    //Healthy -- DEBUG
    else if (type == "world" && healthy && !game.global.spireActive) {
        var scales = Math.floor((zone - 150) / 6);
        attack *= 14 * Math.pow(1.05, scales);
        attack *= 1.15;
    }
    
    return minOrMax ? Math.floor(attack) : Math.ceil(attack);
}

function calcSpecificEnemyAttack(critPower=2, customBlock, customHealth) {
    //Init
    var enemy = getCurrentEnemy();
    if (!enemy) return 1;
    
    //Init
    //var corrupt = enemy.hasOwnProperty("corrupted");
    //var healthy = enemy.hasOwnProperty("healthy");
    var attack  = calcEnemyAttackCore(undefined, undefined, undefined, undefined, undefined, enemy.attack);
        attack *= badGuyCritMult(enemy, critPower, customBlock, customHealth);
    
    //Challenges - considers the actual scenario for this enemy
    if (game.global.challengeActive == "Lead") attack *= 1 + (0.04 * game.challenges.Lead.stacks);

    //Ice
    if (getEmpowerment() == "Ice") attack *= game.empowerments.Ice.getCombatModifier();

    return Math.ceil(attack);
}

function badGuyChallengeMult() {
    var number=1;

    //WARNING! Something is afoot!
    //A few challenges
    if      (game.global.challengeActive == "Meditate")   number *= 1.5;
    else if (game.global.challengeActive == "Crushed")    number *= 3;
    else if (game.global.challengeActive == "Watch")      number *= 1.25;
    else if (game.global.challengeActive == "Corrupted")  number *= 3;
    else if (game.global.challengeActive == "Domination") number *= 2.5;
    else if (game.global.challengeActive == "Coordinate") number *= getBadCoordLevel();
    else if (game.global.challengeActive == "Scientist" && getScientistLevel() == 5) number *= 10;

    //Obliterated and Eradicated
    else if (game.global.challengeActive == "Obliterated" || game.global.challengeActive == "Eradicated"){
        var oblitMult = (game.global.challengeActive == "Eradicated") ? game.challenges.Eradicated.scaleModifier : 1e12;
        var zoneModifier = Math.floor(game.global.world / game.challenges[game.global.challengeActive].zoneScaleFreq);
        oblitMult *= Math.pow(game.challenges[game.global.challengeActive].zoneScaling, zoneModifier);
        number *= oblitMult
    }

    return number;
}

function badGuyCritMult(enemy, critPower=2, block, health) {
    //Pre-Init
    if (getPageSetting('IgnoreCrits') == 2) return 1;
    if (!enemy) enemy = getCurrentEnemy();
    if (!enemy || critPower <= 0) return 1;
    if (!block) block = game.global.soldierCurrentBlock;
    if (!health) health = game.global.soldierHealth;
    
    //Init   
    var regular=1, challenge=1;

    //Non-challenge crits
    if      (enemy.corrupted == 'corruptCrit') regular = 5;
    else if (enemy.corrupted == 'healthyCrit') regular = 7;
    else if (game.global.voidBuff == 'getCrit' && getPageSetting('IgnoreCrits') != 1) regular = 5;

    //Challenge crits
    var crushed = game.global.challengeActive == "Crushed";
    var critDaily = game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.crits !== 'undefined';

    //Challenge multiplier
    if (critDaily) challenge = dailyModifiers.crits.getMult(game.global.dailyChallenge.crits.strength);
    else if (crushed && health > block) challenge = 5;

    //Result -- Yep. Crits may crit! Yey!
    if (critPower == 2) return regular * challenge;
    else return Math.max(regular, challenge);
}

function calcCorruptionScale(world, base) {
    var startPoint = (game.global.challengeActive == "Corrupted" || game.global.challengeActive == "Eradicated") ? 1 : 150;
    var scales = Math.floor((world - startPoint) / 6);
    base *= Math.pow(1.05, scales);
    return base;
}

function calcEnemyBaseHealth(type, zone, cell, name) {
    //Pre-Init
    if (!type) type = (!game.global.mapsActive) ? "world" : (getCurrentMapObject().location == "Void" ? "void" : "map");
    if (!zone) zone = (type == "world" || !game.global.mapsActive) ? game.global.world : getCurrentMapObject().level;
    if (!cell) cell = (type == "world" || !game.global.mapsActive) ? getCurrentWorldCell().level : (getCurrentMapCell() ? getCurrentMapCell().level : 1);
    if (!name) name = getCurrentEnemy() ? getCurrentEnemy().name : "Turtlimp";

    //Init
    var base = (game.global.universe == 2) ? 10e7 : 130;
    var health = base * Math.sqrt(zone) * Math.pow(3.265, zone / 2) - 110;

    //First Two Zones
    if (zone == 1 || zone == 2 && cell < 10) {
        health *= 0.6;
        health = (health * 0.25) + ((health * 0.72) * (cell / 100));
    }

    //Before Breaking the Planet
    else if (zone < 60) {
        health = (health * 0.4) + ((health * 0.4) * (cell / 110));
    }
    
    //Also before Breaking the Planet
    if (zone < 60) health *= 0.75;

    //After Breaking the Planet
    else {
        health = (health * 0.5) + ((health * 0.8) * (cell / 100));
        health *= Math.pow(1.1, zone - 59);
    }
    
    //Maps
    if (zone > 5 && type != "world") health *= 1.1;

    //Specific Imp
    if (name) health *= game.badGuys[name].health;

    return Math.floor(health);
}

function calcEnemyHealthCore(type, zone, cell, name, customHealth) {
    //Pre-Init
    if (!type) type = (!game.global.mapsActive) ? "world" : (getCurrentMapObject().location == "Void" ? "void" : "map");
    if (!zone) zone = (type == "world" || !game.global.mapsActive) ? game.global.world : getCurrentMapObject().level;
    if (!cell) cell = (type == "world" || !game.global.mapsActive) ? getCurrentWorldCell().level : (getCurrentMapCell() ? getCurrentMapCell().level : 1);
    if (!name) name = getCurrentEnemy() ? getCurrentEnemy().name : "Turtlimp";

    //Init
    var health = calcEnemyBaseHealth(type, zone, cell, name);

    //Spire - Overrides the base health number
    if (type == "world" && game.global.spireActive) health = calcSpire("health");

    //Map and Void Corruption
    if (type != "world") {
        //Corruption
        var corruptionScale = calcCorruptionScale(zone, 10);
        if (mutations.Magma.active()) health *= corruptionScale / (type == "void" ? 1 : 2);
        else if (type == "void" && mutations.Corruption.active()) health *= corruptionScale / 2;
    }

    //Use a custom value instead
    if (customHealth) health = customHealth;

    //Challenges
    if (game.global.challengeActive == "Balance")    health *= 2;
    if (game.global.challengeActive == "Meditate")   health *= 2;
    if (game.global.challengeActive == "Toxicity")   health *= 2;
    if (game.global.challengeActive == "Life")       health *= 11;
    if (game.global.challengeActive == "Coordinate") health *= getBadCoordLevel();

    //Dailies
    if (game.global.challengeActive == "Daily") {
        if (typeof game.global.dailyChallenge.empower !== "undefined") health *= 1 + 0.002 * game.global.dailyChallenge.empower.stacks;
    }

    //Obliterated + Eradicated
    if (game.global.challengeActive == "Obliterated" || game.global.challengeActive == "Eradicated") {
        var oblitMult = (game.global.challengeActive == "Eradicated") ? game.challenges.Eradicated.scaleModifier : 1e12;
        var zoneModifier = Math.floor(game.global.world / game.challenges[game.global.challengeActive].zoneScaleFreq);
        oblitMult *= Math.pow(game.challenges[game.global.challengeActive].zoneScaling, zoneModifier);
        health *= oblitMult;
    }

    return health;
}

function calcEnemyHealth(type, zone, cell = 99, name = "Turtlimp") {
    //Pre-Init
    if (!type) type = preVoidCheck ? "void" : "world";
    if (!zone) zone = game.global.world;

    //Init
    var health = calcEnemyHealthCore(type, zone, cell, name);
    var corrupt = zone >= mutations.Corruption.start();
    var healthy = mutations.Healthy.active();

    //Challenges - worst case for Lead and Domination (Improbabilities have 5x more than health than Turtlimps)
    if (game.global.challengeActive == "Domination") health *= 7.5 * (type != "map" ? 5 : 1);
    if (game.global.challengeActive == "Lead") health *= (zone%2 == 0) ? 5.08 : (1 + 0.04 * game.challenges.Lead.stacks);

    //Void Map Difficulty (implicit 100% difficulty on regular maps)
    if (type == "void") health *= (zone >= 60) ? 4.5 : 2.5;

    //Average corrupt impact on World
    else if (type == "world" && corrupt && !healthy && !game.global.spireActive) {
        //Calculates the impact of the corruption on the average health on that map. Improbabilities count as 5.
        var corruptionAmount = ~~((zone - mutations.Corruption.start())/3) + 7; //Integer division
        var corruptionWeight = (104 - corruptionAmount) + corruptionAmount * calcCorruptionScale(zone, 10);
        health *= corruptionWeight/100;
    }

    //Healthy -- DEBUG
    else if (type == "world" && healthy && !game.global.spireActive) {
        var scales = Math.floor((zone - 150) / 6);
        health *= 14 * Math.pow(1.05, scales);
        health *= 1.15;
    }

    return health;
}

function calcSpecificEnemyHealth(type, zone, cell, forcedName) {
    //Pre-Init
    if (!type) type = (!game.global.mapsActive) ? "world" : (getCurrentMapObject().location == "Void" ? "void" : "map");
    if (!zone) zone = (type == "world" || !game.global.mapsActive) ? game.global.world : getCurrentMapObject().level;
    if (!cell) cell = (type == "world" || !game.global.mapsActive) ? getCurrentWorldCell().level : (getCurrentMapCell() ? getCurrentMapCell().level : 1);

    //Select our enemy
    var enemy = (type == "world") ? game.global.gridArray[cell-1] : game.global.mapGridArray[cell-1];
    if (!enemy) return -1;
    
    //Init
    var corrupt = enemy.hasOwnProperty("corrupted");
    var healthy = enemy.hasOwnProperty("healthy");
    var name = (corrupt || healthy) ? "Chimp" : (forcedName) ? forcedName : enemy.name;
    var health = calcEnemyHealthCore(type, zone, cell, name);

    //Challenges - considers the actual scenario for this enemy
    if (game.global.challengeActive == "Lead") health *= 1 + (0.04 * game.challenges.Lead.stacks);
    if (game.global.challengeActive == 'Domination') {
        var lastCell = (type == "world") ? 100 : game.global.mapGridArray.length;
        if (cell < lastCell) health /= 10;
        else health *= 7.5;
    }

    //Map and Void Difficulty
    if (type != "world") health *= getCurrentMapObject().difficulty;

    //Corruption - May be slightly smaller than it should be, if "zone" is different than your current zone
    else if (!healthy && (corrupt || name == "Improbability")) {
        health *= calcCorruptionScale(zone, 10);
        if (enemy.corrupted == "corruptTough") health *= 5;
    }

    //Healthy -- DEBUG
    if (healthy) {
        var scales = Math.floor((zone - 150) / 6);
        health *= 14 * Math.pow(1.05, scales);
        health *= 1.15;
    }

    return health;
}

function calcHDRatio(targetZone, type) {
    //Pre-Init
    if (!targetZone) targetZone = game.global.world;
    if (!type) type = preVoidCheck ? "void" : "world";

    //Init
    var ignoreMapBonus = type != "world" || (game.global.challengeActive == "Lead" && targetZone%2 == 1);
    var ourBaseDamage = calcOurDmg("avg", false, true, "maybe", ignoreMapBonus);

    //Shield
    highDamageShield();
    if (getPageSetting('AutoStance') == 3 && getPageSetting('highdmg') != undefined && game.global.challengeActive != "Daily" && game.global.ShieldEquipped.name != getPageSetting('highdmg')) {
        ourBaseDamage /= getCritMulti(false);
        ourBaseDamage *= trimpAA;
        ourBaseDamage *= getCritMulti(true);
    }
    if (getPageSetting('use3daily') == true && getPageSetting('dhighdmg') != undefined && game.global.challengeActive == "Daily" && game.global.ShieldEquipped.name != getPageSetting('dhighdmg')) {
        ourBaseDamage /= getCritMulti(false);
        ourBaseDamage *= trimpAA;
        ourBaseDamage *= getCritMulti(true);
    }

    //Lead Challenge
    if (game.global.challengeActive == "Lead" && targetZone%2 == 1 && type != "map") {
        //Stats for void maps
        var voidDamage = ourBaseDamage;
        var voidHealth = type == "void" ? calcEnemyHealth("void", targetZone) : 0;

        //Farms on odd zones, and ignores the odd zone attack buff
        targetZone++;
        ourBaseDamage /= 1.5;

        //Custom Anticipation Stacks
        if (game.global.antiStacks > 19) {
            ourBaseDamage /= getAnticipationBonus(game.global.antiStacks);
            ourBaseDamage *= getAnticipationBonus(19);
        }

        //Return whatever gives the worst H:D ratio, an odd zone void map or farming for the next even zone
        return Math.max(voidHealth / voidDamage, calcEnemyHealth("world", targetZone) / ourBaseDamage);
    }

    //Return H:D for a regular, sane, not f-ing Lead zone (sorry, Lead just took a lot of me)
    return calcEnemyHealth(type, targetZone) / ourBaseDamage;
}

function calcCurrentStance() {
    if (game.global.uberNature == "Wind" && getEmpowerment() == "Wind" && !game.global.mapsActive &&
        (((game.global.challengeActive != "Daily" && calcHDRatio() < getPageSetting('WindStackingMinHD'))
            || (game.global.challengeActive == "Daily" && calcHDRatio() < getPageSetting('dWindStackingMinHD')))
                && ((game.global.challengeActive != "Daily" && game.global.world >= getPageSetting('WindStackingMin'))
                    || (game.global.challengeActive == "Daily" && game.global.world >= getPageSetting('dWindStackingMin'))))
                        || (game.global.uberNature == "Wind" && getEmpowerment() == "Wind" && !game.global.mapsActive && checkIfLiquidZone() && getPageSetting('liqstack') == true))
                            return 15;
    else {
        //Base Calc
        var eHealth = 1;
        if (game.global.fighting) eHealth = (getCurrentEnemy().maxHealth - getCurrentEnemy().health);
        var attackLow = calcOurDmg("max", false, true);
        var attackHigh = calcOurDmg("max", false, true);

        //Heirloom Calc
        highDamageShield();
        if (getPageSetting('AutoStance') == 3 && getPageSetting('highdmg') != undefined && game.global.challengeActive != "Daily" && game.global.ShieldEquipped.name != getPageSetting('highdmg')) {
            attackHigh *= trimpAA;
            attackHigh *= getCritMulti(true);
        }
        if (getPageSetting('use3daily') == true && getPageSetting('dhighdmg') != undefined && game.global.challengeActive == "Daily" && game.global.ShieldEquipped.name != getPageSetting('dhighdmg')) {
            attackHigh *= trimpAA;
            attackHigh *= getCritMulti(true);
        }

        //Heirloom Switch
        if (eHealth > 0) {
            var hitsLow = (eHealth / attackLow);
            var hitsHigh = (eHealth / attackHigh);
            var stacks = 190;
            var useHigh = false;
            var stacksLeft = 1;

            if (game.global.challengeActive != "Daily" && getPageSetting('WindStackingMax') > 0) stacks = getPageSetting('WindStackingMax');
            if (game.global.challengeActive == "Daily" && getPageSetting('dWindStackingMax') > 0) stacks = getPageSetting('dWindStackingMax');
            if (game.global.uberNature == "Wind") stacks += 100;
            if (getEmpowerment() == "Wind") stacksLeft = (stacks - game.empowerments.Wind.currentDebuffPower);

            //Use High
            if ((getEmpowerment() != "Wind") || (game.empowerments.Wind.currentDebuffPower >= stacks) || (hitsHigh >= stacksLeft)
                || (game.global.mapsActive) || (game.global.challengeActive != "Daily" && game.global.world < getPageSetting('WindStackingMin'))
                    || (game.global.challengeActive == "Daily" && game.global.world < getPageSetting('dWindStackingMin')))
                        useHigh = true;

            if ((getPageSetting('wsmax') > 0 && game.global.world >= getPageSetting('wsmax') && !game.global.mapsActive && getEmpowerment() == "Wind" && game.global.challengeActive != "Daily" && getPageSetting('wsmaxhd') > 0 && calcHDRatio() < getPageSetting('wsmaxhd'))
                || (getPageSetting('dwsmax') > 0 && game.global.world >= getPageSetting('dwsmax') && !game.global.mapsActive && getEmpowerment() == "Wind" && game.global.challengeActive == "Daily" && getPageSetting('dwsmaxhd') > 0 && calcHDRatio() < getPageSetting('dwsmaxhd')))
                    useHigh = false;

            //Low
            if (!useHigh) {
                if ((game.empowerments.Wind.currentDebuffPower >= stacks) || ((hitsLow * 4) > stacksLeft)) return 2;
                else if ((hitsLow) > stacksLeft) return 0;
                else return 1;
            }

            //High
            else if (useHigh) {
                if (game.global.mapsActive || getEmpowerment() != "Wind"
                    || game.empowerments.Wind.currentDebuffPower >= stacks || (hitsHigh * 4) > stacksLeft
                        || (game.global.challengeActive != "Daily" && game.global.world < getPageSetting('WindStackingMin'))
                            || (game.global.challengeActive == "Daily" && game.global.world < getPageSetting('dWindStackingMin')))
                                return 12;

                else if (hitsHigh > stacksLeft) return 10;
                else return 11;
            }
        }
    }
}

//Radon
function RgetCritMulti() {

	var critChance = getPlayerCritChance();
	var critD = getPlayerCritDamageMult();
	var critDHModifier;

	if (critChance < 0)
		critDHModifier = (1+critChance - critChance/5);
	if (critChance >= 0 && critChance < 1)
		critDHModifier = (1-critChance + critChance * critD);
	if (critChance >= 1 && critChance < 2)
		critDHModifier = ((critChance-1) * getMegaCritDamageMult(2) * critD + (2-critChance) * critD);
	if (critChance >= 2)
		critDHModifier = ((critChance-2) * Math.pow(getMegaCritDamageMult(2),2) * critD + (3-critChance) * getMegaCritDamageMult(2) * critD);

  return critDHModifier;
}

function RcalcOurDmg(minMaxAvg, incStance, incFlucts) {
	var number = 6;
	var fluctuation = .2;
	var maxFluct = -1;
	var minFluct = -1;
        var equipmentList = ["Dagger", "Mace", "Polearm", "Battleaxe", "Greatsword", "Arbalest"];
        for(var i = 0; i < equipmentList.length; i++){
            if(game.equipment[equipmentList[i]].locked !== 0) continue;
            var attackBonus = game.equipment[equipmentList[i]].attackCalculated;
            var level       = game.equipment[equipmentList[i]].level;
            number += attackBonus*level;
        }
	number *= game.resources.trimps.maxSoldiers;
  	if (game.buildings.Smithy.owned > 0) {
		number *= Math.pow(1.25, game.buildings.Smithy.owned);
	}
	if (game.global.achievementBonus > 0){
		number *= (1 + (game.global.achievementBonus / 100));
	}
	if (game.portal.Power.radLevel > 0) {
		number += (number * game.portal.Power.radLevel * game.portal.Power.modifier);
	}
	if (game.global.mapBonus > 0){
	    var mapBonus = game.global.mapBonus;
            if (game.talents.mapBattery.purchased && mapBonus == 10) mapBonus *= 2;
		number *= ((mapBonus * .2) + 1);
	}
        if (game.portal.Equality.radLevel > 0 && getPageSetting('Rcalcmaxequality') != 1) {
            number *= game.portal.Equality.getMult();
        }
        else if (game.portal.Equality.radLevel > 0 && getPageSetting('Rcalcmaxequality') == 1 && game.portal.Equality.getActiveLevels() < game.portal.Equality.radLevel) {
            number *= Math.pow(game.portal.Equality.modifier, game.portal.Equality.radLevel);
        }
	if (game.portal.Tenacity.radLevel > 0) {
		number *= game.portal.Tenacity.getMult();
	}
	if (game.portal.Range.radLevel > 0){
		minFluct = fluctuation - (.02 * game.portal.Range.radLevel);
	}
	if (game.global.roboTrimpLevel > 0){
		number *= ((0.2 * game.global.roboTrimpLevel) + 1);
	}
	
	number = calcHeirloomBonus("Shield", "trimpAttack", number);
	
	if (game.goldenUpgrades.Battle.currentBonus > 0) {
		number *= game.goldenUpgrades.Battle.currentBonus + 1;
	}
	if (game.global.totalSquaredReward > 0) {
		number *= ((game.global.totalSquaredReward / 100) + 1);
	}
	if (Fluffy.isActive()){
		number *= Fluffy.getDamageModifier();
	}
	if (playerSpireTraps.Strength.owned) {
		var strBonus = playerSpireTraps.Strength.getWorldBonus();
		number *= (1 + (strBonus / 100));
	}
	if (game.singleRunBonuses.sharpTrimps.owned){
		number *= 1.5;
	}
	if (game.global.sugarRush > 0) {
		number *= sugarRush.getAttackStrength();
	}
	if (game.talents.herbalist.purchased) {
	        number *= game.talents.herbalist.getBonus();
	}
	if (game.global.challengeActive == "Melt") {
		number *= 5;
		number *= Math.pow(0.99, game.challenges.Melt.stacks);
	}
	if (game.global.challengeActive == "Unbalance") {
		number *= game.challenges.Unbalance.getAttackMult();
	}
	if (game.global.challengeActive == "Quagmire") {
		number *= game.challenges.Quagmire.getExhaustMult()
	}
        if (game.global.challengeActive == "Quest") {
		number *= game.challenges.Quest.getAttackMult();
	}
	if (game.global.challengeActive == "Revenge" && game.challenges.Revenge.stacks > 0) {
		number *= game.challenges.Revenge.getMult();
	}
	if (game.global.challengeActive == "Archaeology") {
		number *= game.challenges.Archaeology.getStatMult("attack");
	}
	if (game.global.mayhemCompletions > 0) {
		number *= game.challenges.Mayhem.getTrimpMult();
	}
	if (getHeirloomBonus("Shield", "gammaBurst") > 0 && (RcalcOurHealth() / (RcalcBadGuyDmg(null, RgetEnemyMaxAttack(game.global.world, 50, 'Snimp', 1.0))) >= 5)) {
	    	number *= ((getHeirloomBonus("Shield", "gammaBurst") / 100) + 1) / 5;
	}
	if (game.global.challengeActive == "Daily" && game.talents.daily.purchased){
		number *= 1.5;
	}
	if (game.global.challengeActive == "Daily"){
		if (typeof game.global.dailyChallenge.minDamage !== 'undefined') {
			if (minFluct == -1) minFluct = fluctuation;
			minFluct += dailyModifiers.minDamage.getMult(game.global.dailyChallenge.minDamage.strength);
		}
		if (typeof game.global.dailyChallenge.maxDamage !== 'undefined') {
			if (maxFluct == -1) maxFluct = fluctuation;
			maxFluct += dailyModifiers.maxDamage.getMult(game.global.dailyChallenge.maxDamage.strength);
		}
		if (typeof game.global.dailyChallenge.oddTrimpNerf !== 'undefined' && ((game.global.world % 2) == 1)) {
				number *= dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength);
		}
		if (typeof game.global.dailyChallenge.evenTrimpBuff !== 'undefined' && ((game.global.world % 2) == 0)) {
				number *= dailyModifiers.evenTrimpBuff.getMult(game.global.dailyChallenge.evenTrimpBuff.strength);
		}
		if (typeof game.global.dailyChallenge.rampage !== 'undefined') {
			number *= dailyModifiers.rampage.getMult(game.global.dailyChallenge.rampage.strength, game.global.dailyChallenge.rampage.stacks);
		}
	}

  var min = number;
  var max = number;
  var avg = number;

  min *= (RgetCritMulti()*0.8);
  avg *= RgetCritMulti();
  max *= (RgetCritMulti()*1.2);
  
  if (incFlucts) {
    if (minFluct > 1) minFluct = 1;
    if (maxFluct == -1) maxFluct = fluctuation;
    if (minFluct == -1) minFluct = fluctuation;

    min *= (1 - minFluct);
    max *= (1 + maxFluct);
    avg *= 1 + (maxFluct - minFluct)/2;
  }

  if (minMaxAvg == "min") return min;
  else if (minMaxAvg == "max") return max;
  else if (minMaxAvg == "avg") return avg;
  
}

function RcalcOurHealth() {
	
    //Health
	
    var health = 50;
    if (game.resources.trimps.maxSoldiers > 0) {
        var equipmentList = ["Shield", "Boots", "Helmet", "Pants", "Shoulderguards", "Breastplate", "Gambeson"];
        for(var i = 0; i < equipmentList.length; i++){
            if(game.equipment[equipmentList[i]].locked !== 0) continue;
            var healthBonus = game.equipment[equipmentList[i]].healthCalculated;
            var level       = game.equipment[equipmentList[i]].level;
            health += healthBonus*level;
        }
    }
    health *= game.resources.trimps.maxSoldiers;
    if (game.buildings.Smithy.owned > 0) {
		health *= Math.pow(1.25, game.buildings.Smithy.owned);
    }
    if (game.portal.Toughness.radLevel > 0) {
        health *= ((game.portal.Toughness.radLevel * game.portal.Toughness.modifier) + 1);
    }
    if (game.portal.Resilience.radLevel > 0) {
        health *= (Math.pow(game.portal.Resilience.modifier + 1, game.portal.Resilience.radLevel));
    }
    if (Fluffy.isRewardActive("healthy")) {
		health *= 1.5;
    }
    health = calcHeirloomBonus("Shield", "trimpHealth", health);
    if (game.goldenUpgrades.Battle.currentBonus > 0) {
        health *= game.goldenUpgrades.Battle.currentBonus + 1;
    }
    if (game.global.totalSquaredReward > 0) {
        health *= (1 + (game.global.totalSquaredReward / 100));
    }
    if (game.global.challengeActive == "Revenge" && game.challenges.Revenge.stacks > 0) {
	health *= game.challenges.Revenge.getMult();
    }
    if (game.global.challengeActive == "Wither" && game.challenges.Wither.trimpStacks > 0) {
	health *= game.challenges.Wither.getTrimpHealthMult();
    }
    if (game.global.mayhemCompletions > 0) {
	health *= game.challenges.Mayhem.getTrimpMult();
    }
    if (typeof game.global.dailyChallenge.pressure !== 'undefined') {
        health *= (dailyModifiers.pressure.getMult(game.global.dailyChallenge.pressure.strength, game.global.dailyChallenge.pressure.stacks));
    }
	
    //Pris
	
    health *= (getEnergyShieldMult() + 1);
	
    return health;
}

function RcalcDailyAttackMod(number) {
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.badStrength !== 'undefined'){
            number *= dailyModifiers.badStrength.getMult(game.global.dailyChallenge.badStrength.strength);
        }
        if (typeof game.global.dailyChallenge.badMapStrength !== 'undefined' && game.global.mapsActive){
            number *= dailyModifiers.badMapStrength.getMult(game.global.dailyChallenge.badMapStrength.strength);
        }
        if (typeof game.global.dailyChallenge.bloodthirst !== 'undefined'){
            number *= dailyModifiers.bloodthirst.getMult(game.global.dailyChallenge.bloodthirst.strength, game.global.dailyChallenge.bloodthirst.stacks);
        }
    }
    return number;
}

function RcalcBadGuyDmg(enemy,attack) {
    var number;
    if (enemy)
        number = enemy.attack;
    else
        number = attack;
    if (game.portal.Equality.radLevel > 0 && getPageSetting('Rcalcmaxequality') == 0) {
        number *= game.portal.Equality.getMult();
    }
    else if (game.portal.Equality.radLevel > 0 && getPageSetting('Rcalcmaxequality') >= 1 && game.portal.Equality.getActiveLevels() < game.portal.Equality.radLevel) {
        number *= Math.pow(game.portal.Equality.modifier, game.portal.Equality.radLevel);
    }
    if (game.global.challengeActive == "Daily") {
        number = RcalcDailyAttackMod(number);
    }
    if (game.global.challengeActive == "Unbalance") {
	number *= 1.5;
    }
    if (game.global.challengeActive == "Wither" && game.challenges.Wither.enemyStacks > 0) {
	number *= game.challenges.Wither.getEnemyAttackMult();
    }
    if (game.global.challengeActive == "Archaeology") {
	number *= game.challenges.Archaeology.getStatMult("enemyAttack");
    }
    if (game.global.challengeActive == "Mayhem") {
	number *= game.challenges.Mayhem.getEnemyMult();
	number *= game.challenges.Mayhem.getBossMult();
    }
    if (!enemy && game.global.usingShriek) {
        number *= game.mapUnlocks.roboTrimp.getShriekValue();
    }
    return number;
}

function RcalcEnemyBaseHealth(world, level, name) {
			var amt = 0;
			var healthBase = (game.global.universe == 2) ? 10e7 : 130;
			amt += healthBase * Math.sqrt(world) * Math.pow(3.265, world / 2);
			amt -= 110;
			if (world == 1 || world == 2 && level < 10){
				amt *= 0.6;
			amt = (amt * 0.25) + ((amt * 0.72) * (level / 100));
			}
			else if (world < 60)
				amt = (amt * 0.4) + ((amt * 0.4) * (level / 110));
			else{
				amt = (amt * 0.5) + ((amt * 0.8) * (level / 100));
				amt *= Math.pow(1.1, world - 59);
			}
			if (world < 60) amt *= 0.75;
			if (world > 5 && game.global.mapsActive) amt *= 1.1;
		        amt *= game.badGuys[name].health;
			if (game.global.universe == 2) {
				var part1 = (world > 60) ? 60 : world;
				var part2 = (world - 60);
				if (part2 < 0) part2 = 0;
				amt *= Math.pow(1.4, part1);
				amt *= Math.pow(1.32, part2);
			}
			return Math.floor(amt);
}

function RcalcEnemyHealth(world) {
    if (world == false) world = game.global.world;
    var health = RcalcEnemyBaseHealth(world, 50, "Snimp");
    if (game.global.challengeActive == "Unbalance") {
	health *= 2;
    }
    if (game.global.challengeActive == "Quest"){
	health *= game.challenges.Quest.getHealthMult();
    }
    if (game.global.challengeActive == "Revenge" && game.global.world % 2 == 0) {
	health *= 10;
    }
    if (game.global.challengeActive == "Archaeology") {
	
    }
    if (game.global.challengeActive == "Mayhem") {
	health *= game.challenges.Mayhem.getEnemyMult();
	health *= game.challenges.Mayhem.getBossMult();
    }
    return health;
}

function RcalcHDratio() {
    var ratio;
    var ourBaseDamage = RcalcOurDmg("avg", false, true);

    ratio = RcalcEnemyHealth(game.global.world) / ourBaseDamage;
    return ratio;
}
