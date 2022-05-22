var baseMinDamage = 0;
var baseMaxDamage = 0;

function calcBaseDamageInX() {
    baseMinDamage = calcOurDmg("min", "X", true, game.global.mapsActive) * (game.global.titimpLeft > 0 ? 2 : 1);
    baseMaxDamage = calcOurDmg("max", "X", true, game.global.mapsActive) * (game.global.titimpLeft > 0 ? 2 : 1);
    baseDamage = calcOurDmg("avg", "X", true, game.global.mapsActive) * (game.global.titimpLeft > 0 ? 2 : 1);
    baseHealth = calcOurHealth(false, false, true);
    baseBlock = calcOurBlock(false, true);
}

function autoStanceNew() {
    if (game.global.gridArray.length === 0) return;
    if (game.global.soldierHealth <= 0) return;
    if (!game.upgrades.Formations.done) return;

    if (game.global.formation == 2 && game.global.soldierHealth <= game.global.soldierHealthMax * 0.25) setFormation('0');
    else if (game.global.formation == 0 && game.global.soldierHealth <= game.global.soldierHealthMax * 0.25) setFormation('1')
    else if (game.global.formation == 1 && game.global.soldierHealth == game.global.soldierHealthMax) setFormation('2');
}

function debugStance(maxPower, ignoreArmy) {
    //Returns what stance we should be using right now, or false if none grants survival
    for (var critPower = 2; critPower >= -2; critPower--) {
        if (survive("D", critPower, ignoreArmy)) { return "D" + critPower }
        else if (survive("XB", critPower, ignoreArmy)) { return "XB" + critPower }
        else if (survive("B", critPower, ignoreArmy)) { return "B" + critPower }
        else if (survive("X", critPower, ignoreArmy)) { return "X" + critPower }
        else if (survive("H", critPower, ignoreArmy)) { return "H" + critPower }
        else if (maxPower) break;
    }

    return false;
}

function maxOneShotPower(considerEdges) {
    var power = 2;

    //No enemy to kill
    if (considerEdges && !getCurrentEnemy()) return 0;

    //No overkill perk
    if (game.portal.Overkill.level == 0) return 1;

    //Mastery
    if (game.talents.overkill.purchased) power++;

    //Ice
    if (game.global.uberNature == "Poison") power += 2;
    if (getEmpowerment() == "Ice" && game.empowerments.Ice.getLevel() >= 50) power++;
    if (getEmpowerment() == "Ice" && game.empowerments.Ice.getLevel() >= 100) power++;

    //No enemy to attack
    if (considerEdges) for (var i = power; i > 1 && !getCurrentEnemy(i); i--);

    return power;
}

function oneShotZone(zone, type, specificStance, maxOrMin) {
    //Calculates our minimum damage
    var baseDamage = calcOurDmg(maxOrMin ? "max" : "min", specificStance, true, type != "world");
    var damageLeft = baseDamage + addPoison(false, (type == "world") ? zone : game.global.world);

    //Calculates how many enemies we can one shot + overkill
    for (var power = 1; power <= maxOneShotPower(); power++) {
        //Enemy Health: A C99 Dragimp (worstCase)
        damageLeft -= calcEnemyHealth(type, zone, 99 - maxOneShotPower() + power, "Dragimp");

        //Check if we can one-shot the next enemy
        if (damageLeft < 0) return power - 1;

        //Calculates our minimum "left over" damage, which will be used by the Overkill
        damageLeft *= 0.005 * game.portal.Overkill.level;
    }

    return power - 1;
}

function oneShotPower(specificStance, offset = 0, maxOrMin) {
    //Calculates our minimum damage
    var baseDamage = calcOurDmg(maxOrMin ? "max" : "min", specificStance, true, game.global.mapsActive);
    var damageLeft = baseDamage + addPoison(true);

    //Calculates how many enemies we can one shot + overkill
    for (var power = 1; power <= maxOneShotPower(); power++) {
        //No enemy to overkill (usually this happens at the last cell)
        if (!getCurrentEnemy(power + offset)) return power + offset - 1;

        //Enemy Health: current enemy or his neighbours
        if (power + offset > 1) damageLeft -= calcSpecificEnemyHealth(undefined, undefined, getCurrentEnemy(power + offset).level);
        else damageLeft -= getCurrentEnemy().health;

        //Check if we can one shot the next enemy
        if (damageLeft < 0) return power - 1;

        //Calculates our minimum "left over" damage, which will be used by the Overkill
        damageLeft *= 0.005 * game.portal.Overkill.level;
    }

    return power - 1;
}

function challengeDamage(maxHealth, minDamage, maxDamage, missingHealth, block, pierce, critPower = 2) {
    //Pre-Init
    if (!maxHealth) maxHealth = calcOurHealth(true, false, true);
    if (!minDamage) minDamage = calcOurDmg("min", false, true, game.global.mapsActive) * (game.global.titimpLeft > 0 ? 2 : 1) + addPoison(true);
    if (!maxDamage) maxDamage = calcOurDmg("max", false, true, game.global.mapsActive) * (game.global.titimpLeft > 0 ? 2 : 1) + addPoison(true);
    if (!missingHealth) missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    if (!pierce) pierce = (game.global.brokenPlanet && !game.global.mapsActive) ? getPierceAmt() : 0;
    if (!block) block = calcOurBlock(true, true);

    //Enemy
    var enemy = getCurrentEnemy();
    var enemyHealth = enemy.health;
    var enemyDamage = calcSpecificEnemyAttack(critPower);

    //Active Challenges
    var leadChallenge = game.global.challengeActive == "Lead";
    var electricityChallenge = game.global.challengeActive == "Electricity" || game.global.challengeActive == "Mapocalypse";
    var dailyPlague = game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.plague !== "undefined";
    var dailyBogged = game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.bogged !== "undefined";
    var dailyExplosive = game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.explosive !== "undefined";
    var dailyMirrored = game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.mirrored !== "undefined";
    var drainChallenge = game.global.challengeActive == "Nom" || game.global.challengeActive == "Toxicity" || dailyPlague || dailyBogged;
    var challengeDamage = 0, harm = 0;

    //Electricity Lead - Tox/Nom
    if (electricityChallenge) challengeDamage = game.challenges.Electricity.stacks * 0.1;
    else if (drainChallenge) challengeDamage = 0.05;

    //Plague & Bogged (Daily)
    if (dailyPlague) challengeDamage = dailyModifiers.plague.getMult(game.global.dailyChallenge.plague.strength, 1 + game.global.dailyChallenge.plague.stacks);
    if (dailyBogged) challengeDamage = dailyModifiers.bogged.getMult(game.global.dailyChallenge.bogged.strength);

    //Lead - Only takes damage if the enemy doesn't die
    if (leadChallenge && minDamage < enemyHealth) harm += maxHealth * game.challenges.Lead.stacks * 0.0003;

    //Adds Drain Damage -- % of max health
    harm += maxHealth * challengeDamage;

    //Adds Bleed Damage -- % of current health
    if (game.global.voidBuff == "bleed" || (enemy.corrupted == 'corruptBleed') || enemy.corrupted == 'healthyBleed') {
        challengeDamage = (enemy.corrupted == 'healthyBleed') ? 0.30 : 0.20;
        harm += (maxHealth - missingHealth) * challengeDamage;
    }

    //Explosive Daily
    if (dailyExplosive && critPower >= 0) {
        var explosionDmg = enemyDamage * dailyModifiers.explosive.getMult(game.global.dailyChallenge.explosive.strength);
        if (maxDamage >= enemyHealth && maxHealth > block) harm += Math.max(explosionDmg - block, explosionDmg * pierce);
    }

    //Mirrored (Daily) -- Unblockable, unpredictable
    if (dailyMirrored && critPower >= -1)
        harm += Math.min(maxDamage - addPoison(true), enemyHealth) * dailyModifiers.mirrored.getMult(game.global.dailyChallenge.mirrored.strength);

    return harm;
}

function directDamage(block, pierce, currentHealth, minDamage, critPower = 2) {
    //Pre Init
    if (!block) block = calcOurBlock(true, true);
    if (!pierce) pierce = (game.global.brokenPlanet && !game.global.mapsActive) ? getPierceAmt() : 0;
    if (!currentHealth) currentHealth = calcOurHealth(true, false, true) - (game.global.soldierHealthMax - game.global.soldierHealth);
    if (!minDamage) minDamage = calcOurDmg("min", true, true, game.global.mapsActive) * (game.global.titimpLeft > 0 ? 2 : 1) + addPoison(true);

    //Enemy
    var enemy = getCurrentEnemy();
    var enemyHealth = enemy.health;
    var enemyDamage = calcSpecificEnemyAttack(critPower, block, currentHealth);

    //Applies pierce
    var harm = Math.max(enemyDamage - block, pierce * enemyDamage, 0);

    //Fast Enemies
    var isDoubleAttack = game.global.voidBuff == "doubleAttack" || (enemy.corrupted == "corruptDbl") || enemy.corrupted == "healthyDbl";
    var enemyFast = isDoubleAttack || game.global.challengeActive == "Slow" || ((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Coordinate" && game.global.challengeActive != "Nom");

    //Dodge Dailies
    if (game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.slippery !== "undefined") {
        var slipStr = game.global.dailyChallenge.slippery.strength;
        var dodgeDaily = (slipStr > 15 && game.global.world % 2 == 0) || (slipStr <= 15 && game.global.world % 2 == 1);
    }

    //Double Attack and One Shot situations
    if (isDoubleAttack && minDamage < enemyHealth) harm *= 2;
    if (!enemyFast && !dodgeDaily && minDamage > enemyHealth) harm = 0;

    return harm;
}

function survive(formation = "S", critPower = 2, ignoreArmy) {
    //Check if the formation is valid
    if (formation == "D" && !game.upgrades.Dominance.done) return false;
    if (formation == "XB" && !game.upgrades.Barrier.done) return false;
    if (formation == "B" && !game.upgrades.Barrier.done) return false;
    if (formation == "H" && !game.upgrades.Formations.done) return false;
    if (formation == "S" && (game.global.world < 60 || game.global.highestLevelCleared < 180)) return false;

    //Base stats
    var health = baseHealth;
    var block = baseBlock;
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;

    //More stats
    var minDamage = baseMinDamage;
    var maxDamage = baseMaxDamage;
    var newSquadRdy = !ignoreArmy && game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;

    //Applies the formation modifiers
    if (formation == "XB") { health /= 2; }
    else if (formation == "D") { minDamage *= 4; maxDamage *= 4; health /= 2; block /= 2; }
    else if (formation == "B") { minDamage /= 2; maxDamage /= 2; health /= 2; block *= 4; }
    else if (formation == "H") { minDamage /= 2; maxDamage /= 2; health *= 4; block /= 2; }
    else if (formation == "S") { minDamage /= 2; maxDamage /= 2; health /= 2; block /= 2; }

    //Max health for XB formation
    var maxHealth = health * (formation == "XB" ? 2 : 1);

    //Empowerments - Poison
    minDamage += addPoison(true)
    maxDamage += addPoison(true)

    //Pierce
    var pierce = (game.global.brokenPlanet && !game.global.mapsActive) ? getPierceAmt() : 0;
    if (formation != "B" && game.global.formation == 3) pierce *= 2;

    //Decides if the trimps can survive in this formation
    var notSpire = game.global.mapsActive || !game.global.spireActive;
    var harm = directDamage(block, pierce, health - missingHealth, minDamage, critPower) + challengeDamage(maxHealth, minDamage, maxDamage, missingHealth, block, pierce, critPower);

    //Updated Genes and Block
    var blockier = calcOurBlock(false, false);
    var healthier = health * Math.pow(1.01, game.jobs.Geneticist.owned - game.global.lastLowGen);
    var maxHealthier = maxHealth * Math.pow(1.01, game.jobs.Geneticist.owned - game.global.lastLowGen);
    var harm2 = directDamage(blockier, pierce, healthier, minDamage, critPower) + challengeDamage(maxHealthier, minDamage, maxDamage, 0, blockier, pierce, critPower);

    return (newSquadRdy && notSpire && healthier > harm2) || (health - missingHealth > harm);
}

function autoStance() {
    calcBaseDamageInX();

    //Invalid Map - Dead Soldiers - Auto Stance Disabled - Formations Unavailable - No Enemy
    if (game.global.soldierHealth <= 0) return;
    if (game.global.gridArray.length === 0) return true;
    if (!getPageSetting('AutoStance')) return true;
    if (!game.upgrades.Formations.done) return true;
    if (typeof getCurrentEnemy() === 'undefined') return true;

    //Keep on D vs the Domination bosses
    if (game.global.challengeActive == "Domination" && (game.global.lastClearedCell == 98 || getCurrentEnemy() && getCurrentEnemy().name == "Cthulimp")) {
        autoStance2();
        return;
    }

    //Stance Selector
    if (!game.global.preMapsActive && game.global.soldierHealth > 0) {
        //If no formation can survive a mega crit, it ignores it, and recalculates for a regular crit, then no crit
        //If even that is not enough, then it ignore Explosive Daily, and finally it ignores Reflect Daily
        var critPower;
        for (critPower = 2; critPower >= -2; critPower--) {
            if (survive("D", critPower)) { setFormation(2); break; }
            else if (survive("XB", critPower)) { setFormation("0"); break; }
            else if (survive("B", critPower)) { setFormation(3); break; }
            else if (survive("X", critPower)) { setFormation("0"); break; }
            else if (survive("H", critPower)) { setFormation(1); break; }
        }

        //If it cannot survive the worst case scenario on any formation, attempt it's luck on H, if available, or X
        if (critPower < -2) {
            if (game.upgrades.Formations.done) setFormation(1);
            else setFormation("0");
        }
    }

    return true;
}

function autoStance2() {
    if (game.global.gridArray.length === 0) return;
    if (game.global.soldierHealth <= 0) return;
    if (getPageSetting('AutoStance') == 0) return;
    if (!game.upgrades.Formations.done) return;
    if (game.global.world <= 70) return;
    if (game.global.formation != 2)
        setFormation(2);
}

function windStance(hdStats) {
    //Fail safes
    if (game.global.gridArray.length === 0) return;
    if (game.global.soldierHealth <= 0) return;
    if (!game.upgrades.Formations.done) return;
    if (game.global.world <= 70) return;
    var stancey = 2;
    const currentStance = calcCurrentStance(hdStats);
    if (game.global.challengeActive !== "Daily") {
        if (currentStance === 5) {
            stancey = 5;
            lowHeirloom();
        }
        if (currentStance === 2) {
            stancey = 2;
            lowHeirloom();
        }
        if (currentStance === 0) {
            stancey = 0;
            lowHeirloom();
        }
        if (currentStance === 1) {
            stancey = 1;
            lowHeirloom();
        }
        if (currentStance === 15) {
            stancey = 5;
            highHeirloom();
        }
        if (currentStance === 12) {
            stancey = 2;
            highHeirloom();
        }
        if (currentStance === 10) {
            stancey = 0;
            highHeirloom();
        }
        if (currentStance === 11) {
            stancey = 1;
            highHeirloom();
        }
    }
    if (game.global.challengeActive === "Daily") {
        if (currentStance === 5) {
            stancey = 5;
            dlowHeirloom();
        }
        if (currentStance === 2) {
            stancey = 2;
            dlowHeirloom();
        }
        if (currentStance === 0) {
            stancey = 0;
            dlowHeirloom();
        }
        if (currentStance === 1) {
            stancey = 1;
            dlowHeirloom();
        }
        if (currentStance === 15) {
            stancey = 5;
            dhighHeirloom();
        }
        if (currentStance === 12) {
            stancey = 2;
            dhighHeirloom();
        }
        if (currentStance === 10) {
            stancey = 0;
            dhighHeirloom();
        }
        if (currentStance === 11) {
            stancey = 1;
            dhighHeirloom();
        }
    }
    setFormation(stancey);
}
