function calcBaseDamageinX() {
    baseDamage = calcOurDmg("avg", false, true);
    baseBlock = game.global.soldierCurrentBlock;
    baseHealth = game.global.soldierHealthMax;
}

function calcBaseDamageinX2() {
    baseMinDamage  = calcOurDmg("min", false, true, "never", game.global.mapsActive, true) * (game.global.titimpLeft ? 2 : 1);
    baseMaxDamage  = calcOurDmg("max", false, true, "force", game.global.mapsActive, true) * (game.global.titimpLeft ? 2 : 1);
    baseDamage = calcOurDmg("avg", false, true, "maybe", game.global.mapsActive, true) * (game.global.titimpLeft ? 2 : 1);
    baseHealth = calcOurHealth(false, false, true);
    baseBlock  = calcOurBlock(false, true);
}

function autoStanceNew() {
    if (game.global.gridArray.length === 0) return;
    if (game.global.soldierHealth <= 0) return;
    if (!game.upgrades.Formations.done) return;
	
    if (game.global.formation == 2 && game.global.soldierHealth <= game.global.soldierHealthMax * 0.25)     setFormation('0');
    else if(game.global.formation == 0 && game.global.soldierHealth <= game.global.soldierHealthMax * 0.25) setFormation('1')
    else if(game.global.formation == 1 && game.global.soldierHealth == game.global.soldierHealthMax)        setFormation('2');
}

function debugStance() {
    for (critPower=2; critPower >= -2; critPower--) {
        if      (survive("D", critPower))  {return "D" + critPower}
        else if (survive("XB", critPower)) {return "XB" + critPower}
        else if (survive("B", critPower))  {return "B" + critPower}
        else if (survive("X", critPower))  {return "X" + critPower}
        else if (survive("H", critPower))  {return "H" + critPower}
    }
}

function maxOneShootPower() {
    //No Overkill at all
    if (game.portal.Overkill.level == 0) return 1;
    
    //Regular Overkills
    return 2;
}

function oneShootPower(stance, worstCase, offset=0) {
    //Calculates our minimum damage
    var damageLeft = calcOurDmg("min", !stance, true, "never", !game.global.mapsActive, true);
    if (stance && stance != "X") damageLeft *= (stance == "D") ? 4 : 0.5;

    if (worstCase && offset) offset = 0;
    
    //Calculates how many enemies we can oneshoot + overkill
    for (var power=1; power <= maxOneShootPower(); power++) {
        //No enemy to overkill (usually this happens at the last cell)
        if (!worstCase && typeof getCurrentEnemy(power+offset) == undefined) return power+offset-1;
        
        //Enemy Health: current enemy, his neighbours, or a C99 Dragimp (worstCase)
        if (worstCase) damageLeft -= calcSpecificEnemyHealth(undefined, false, 99-maxOneShootPower()+power, preVoidCheck, "Dragimp");
        else if (power+offset > 1) damageLeft -= calcSpecificEnemyHealth(undefined, game.global.mapsActive, getCurrentEnemy(power+offset).level);
        else damageLeft -= getCurrentEnemy().health;
        
        //Check if we can oneshoot the next enemy
        if (damageLeft < 0) return power-1;
        
        //Calculates our minimum "left over" damage, which will be used by the Overkill
        damageLeft *= 0.005 * game.portal.Overkill.level;
    }
    
    return power-1;
}

function challengeDamage(maxHealth, minDamage, maxDamage, missingHealth, critPower=2) {
    //Enemy
    var enemy = getCurrentEnemy();
    var enemyHealth = enemy.health;
    var enemyDamage = calcSpecificBadGuyDmg(enemy, critPower);

    //Active Challenges
    var leadChallenge = game.global.challengeActive == 'Lead';
    var electricityChallenge = game.global.challengeActive == "Electricity" || game.global.challengeActive == "Mapocalypse";
    var dailyPlague = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.plague !== 'undefined');
    var dailyBogged = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.bogged !== 'undefined');
    var dailyMirrored = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.mirrored !== 'undefined');
    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity" || dailyPlague || dailyBogged;
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

    //Explosive Daily (or Magma Omnipotrimp --TODO) -- Blockable
    if (typeof game.global.dailyChallenge['explosive'] !== 'undefined' && critPower >= 0) {
        var explosionDmg = enemyDamage * (1 + game.global.dailyChallenge['explosive'].strength);
        if (maxDamage > enemyHealth) harm += Math.max(explosionDmg - baseBlock,   explosionDmg * pierce);
    }

    //Mirrored (Daily) -- Unblockable, unpredictable
    if (dailyMirrored && critPower >= -1) harm += 0.1 * maxDamage;

    return harm;
}

function directDamage(formation, block, currentHealth, minDamage, critPower=2) {
    //Pre Init
    if (!formation) {
        if (game.global.formation == 0) formation = "X";
        else if (game.global.formation == 1) formation = "H";
        else if (game.global.formation == 2) formation = "D";
        else if (game.global.formation == 3) formation = "B";
        else if (game.global.formation == 4) formation = "S";
    }
    if (!block) block = calcOurBlock(true, true);
    if (!currentHealth) currentHealth = calcOurHealth(true, false, true) - (game.global.soldierHealthMax - game.global.soldierHealth);
    if (!minDamage) minDamage = calcOurDmg("min", false, true, "never", game.global.mapsActive, true) * (game.global.titimpLeft ? 2 : 1);
    
    //Enemy
    var enemy = getCurrentEnemy();
    var enemyHealth = enemy.health;
    var enemyDamage = calcSpecificBadGuyDmg(enemy, critPower, false, false, block, currentHealth);

    //Calculates block and pierce
    var pierce = (game.global.brokenPlanet && !game.global.mapsActive) ? getPierceAmt() : 0;
    if (formation != "B" && game.global.formation == 3) pierce *= 2; //Cancels the influence of the Barrier Formation

    //Applies pierce
    var harm = Math.max(enemyDamage - block, pierce * enemyDamage, 0);

    //Fast Enemies
    var isDoubleAttack = game.global.voidBuff == 'doubleAttack' || (enemy.corrupted == 'corruptDbl') || enemy.corrupted == 'healthyDbl';
    var enemyFast = isDoubleAttack || game.global.challengeActive == "Slow" || ((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Coordinate" && game.global.challengeActive != "Nom");
    
    //Dodge Dailies
    if (game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.slippery !== undefined) {
        var slipStr = game.global.dailyChallenge.slippery.strength;
        var dodgeDaily = (slipStr > 15 && game.global.world % 2 == 0) || (slipStr <= 15 && game.global.world % 2 == 1);
    }

    //Double Attack and One Shot situations
    if (isDoubleAttack && minDamage < enemyHealth) harm *= 2;
    if (!enemyFast && !dodgeDaily && minDamage > enemyHealth) harm = 0;

    return harm;
}

function survive(formation = "S", critPower = 2) {
    //Check if the formation is valid
    if (formation == "D"  && !game.upgrades.Dominance.done) return false;
    if (formation == "XB" && !game.upgrades.Barrier.done) return false;
    if (formation == "B"  && !game.upgrades.Barrier.done) return false;
    if (formation == "H"  && !game.upgrades.Formations.done) return false;
    if (formation == "S"  && (game.global.world < 60 || game.global.highestLevelCleared < 180)) return false;

    //Base stats
    var damage = baseDamage;
    var health = baseHealth;
    var block  = baseBlock;
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;

    //More stats
    var minDamage = baseMinDamage;
    var maxDamage = baseMaxDamage;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;

    //Applies the formation modifiers
    if      (formation == "XB") {health /= 2;}
    else if (formation == "D") {damage *= 4; minDamage *= 4; maxDamage *= 4; health /= 2; block  /= 2;}
    else if (formation == "B") {damage /= 2; minDamage /= 2; maxDamage /= 2; health /= 2; block  *= 4;}
    else if (formation == "H") {damage /= 2; minDamage /= 2; maxDamage /= 2; health *= 4; block  /= 2;}
    else if (formation == "S") {damage /= 2; minDamage /= 2; maxDamage /= 2; health /= 2; block  /= 2;}
    
    //Max health for XB formation
    var maxHealth = health * (formation == "XB" ? 2 : 1);

    //Decides if the trimps can survive in this formation
    var harm = directDamage(formation, block, health - missingHealth, minDamage, critPower) + challengeDamage(maxHealth, minDamage, maxDamage, missingHealth, critPower);
    return (newSquadRdy && health > harm) || (health - missingHealth > harm);
}

function autoStance() {
    calcBaseDamageinX2();

    //Invalid Map - Dead Soldiers - Auto Stance Disabled - Formations Unavailable - No Enemy
    if (game.global.soldierHealth <= 0) return;
    if (game.global.gridArray.length === 0) return true;
    if (!getPageSetting('AutoStance')) return true;
    if (!game.upgrades.Formations.done) return true;
    if (typeof getCurrentEnemy() === 'undefined') return true;

    //Keep on D vs the Domination bosses
    if (game.global.challengeActive == "Domination" && game.global.lastClearedCell == 98) {
        autoStance2();
        return;
    }

    //Stance Selector
    if (!game.global.preMapsActive && game.global.soldierHealth > 0) {
        //If no formation can survive a mega crit, it ignores it, and recalculates for a regular crit, then no crit
        //If even that is not enough, then it ignore Explosive Daily, and finally it ignores Reflect Daily
        var critPower;
        for (critPower=2; critPower >= -2; critPower--) {
            if      (survive("D", critPower))  {setFormation(2);   break;}
            else if (survive("XB", critPower)) {setFormation("0"); break;}
            else if (survive("B", critPower))  {setFormation(3);   break;}
            else if (survive("X", critPower))  {setFormation("0"); break;}
            else if (survive("H", critPower))  {setFormation(1);   break;}
	}

        //If it cannot survive the worst case scenario on any formation, attempt it's luck on H, if available, or X
        if (critPower < -2) {
            if (game.upgrades.Formations.done) setFormation(1);
            else setFormation("0");
	}
    }

    return true;
}

function autoStanceCheck(enemyCrit) {
    if (game.global.gridArray.length === 0) return [true,true];
    var ourDamage = calcOurDmg("min",false,true);
    var ourBlock = game.global.soldierCurrentBlock;
    var ourHealth = game.global.soldierHealthMax;
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;

    var corrupt = game.global.world >= mutations.Corruption.start();
    var enemy = getCurrentEnemy();
    if (typeof enemy === 'undefined') return [true,true];
    var enemyHealth = enemy.health;
    var enemyDamage = calcBadGuyDmg(enemy,null,true,true,true);
    var critMulti = 1;
    const ignoreCrits = getPageSetting('IgnoreCrits');
    var isCrushed = false;
    var isCritVoidMap = false;
    var isCritDaily = false;
    if (ignoreCrits != 2) {
        (isCrushed = game.global.challengeActive == "Crushed" && game.global.soldierHealth > game.global.soldierCurrentBlock)
            && enemyCrit && (critMulti *= 5);
        (isCritVoidMap = (!ignoreCrits && game.global.voidBuff == 'getCrit') || (enemy.corrupted == 'corruptCrit') || (enemy.corrupted == 'healthyCrit'))
            && enemyCrit && (critMulti *= (enemy.corrupted == 'healthyCrit' ? 7 : 5));
        (isCritDaily = game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.crits !== 'undefined')
            && enemyCrit && (critMulti *= dailyModifiers.crits.getMult(game.global.dailyChallenge.crits.strength));
        if (enemyCrit)
            enemyDamage *= critMulti;
    }
    var isDoubleAttack = game.global.voidBuff == 'doubleAttack' || (enemy.corrupted == 'corruptDbl') || (enemy.corrupted == 'healthyDbl');
    var enemyFast = (game.global.challengeActive == "Slow" || ((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Coordinate" && game.global.challengeActive != "Nom")) || isDoubleAttack;
    if (enemy.corrupted == 'corruptStrong')
        enemyDamage *= 2;
    if (enemy.corrupted == 'corruptTough')
        enemyHealth *= 5;
    if (enemy.corrupted == 'healthyStrong')
        enemyDamage *= 2.5;
		if (enemy.corrupted == 'healthyTough')
        enemyHealth *= 7.5;
    enemyDamage -= ourBlock;
    var pierce = 0;
    if (game.global.brokenPlanet && !game.global.mapsActive) {
        pierce = getPierceAmt();
        var atkPierce = pierce * enemyDamage;
        if (enemyDamage < atkPierce) enemyDamage = atkPierce;
    }
    if (enemyDamage < 0) enemyDamage = 0;
    var isdba = isDoubleAttack ? 2 : 1;
    enemyDamage *= isdba;
    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity";
    var dailyPlague = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.plague !== 'undefined');
    var dailyBogged = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.bogged !== 'undefined');
    var leadChallenge = game.global.challengeActive == 'Lead';
    if (drainChallenge) {
        var hplost = 0.20;
        enemyDamage += ourHealth * hplost;
    } else if (dailyPlague) {
        drainChallenge = true;
        var hplost = dailyModifiers.plague.getMult(game.global.dailyChallenge.plague.strength, 1 + game.global.dailyChallenge.plague.stacks);
        enemyDamage += ourHealth * hplost;
    } else if (dailyBogged) {
        drainChallenge = true;
        var hplost = dailyModifiers.bogged.getMult(game.global.dailyChallenge.bogged.strength);
        enemyDamage += ourHealth * hplost;
    } else if (leadChallenge) {
        var leadDamage = game.challenges.Lead.stacks * 0.0003;
        enemyDamage += game.global.soldierHealthMax * leadDamage;
    }

    if (game.global.voidBuff == "bleed" || (enemy.corrupted == 'corruptBleed') || enemy.corrupted == 'healthyBleed') {
        enemyDamage += game.global.soldierHealth * (enemy.corrupted == 'healthyBleed' ? 0.30 : 0.20);
    }
    ourDamage *= (game.global.titimpLeft > 0 ? 2 : 1);
    ourDamage *= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1;

    var oneshotFast = enemyFast ? enemyHealth <= ourDamage : false;
    var survive = ((newSquadRdy && ourHealth > enemyDamage) || (ourHealth - missingHealth > enemyDamage));
    var leadAttackOK = !leadChallenge || oneshotFast || survive;
    var drainAttackOK = !drainChallenge || oneshotFast || survive;
    var isCritThing = isCritVoidMap || isCritDaily || isCrushed;
    var voidCritok = !isCritThing || oneshotFast || survive;

    if (!game.global.preMapsActive) {
        var enoughDamage2 = enemyHealth <= ourDamage;
        var enoughHealth2 = survive && leadAttackOK && drainAttackOK && voidCritok;
        ourDamage /= (game.global.titimpLeft > 0 ? 2 : 1);
        ourDamage /= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1;
        return [enoughHealth2,enoughDamage2];
    } else
        return [true,true];
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

function windStance() {
    //Fail safes
    if (game.global.gridArray.length === 0) return;
    if (game.global.soldierHealth <= 0) return;
    if (!game.upgrades.Formations.done) return;
    if (game.global.world <= 70) return;
    var stancey = 2;
    if (game.global.challengeActive != "Daily") {
	if (calcCurrentStance() == 5) {
            stancey = 5;
            lowHeirloom();
        }
        if (calcCurrentStance() == 2) {
            stancey = 2;
            lowHeirloom();
        }
        if (calcCurrentStance() == 0) {
            stancey = 0;
            lowHeirloom();
        }
        if (calcCurrentStance() == 1) {
            stancey = 1;
            lowHeirloom();
        }
        if (calcCurrentStance() == 15) {
            stancey = 5;
            highHeirloom();
        }
        if (calcCurrentStance() == 12) {
            stancey = 2;
            highHeirloom();
        }
        if (calcCurrentStance() == 10) {
            stancey = 0;
            highHeirloom();
        }
        if (calcCurrentStance() == 11) {
            stancey = 1;
            highHeirloom();
        }
    }
    if (game.global.challengeActive == "Daily") {
	if (calcCurrentStance() == 5) {
            stancey = 5;
            dlowHeirloom();
        }
        if (calcCurrentStance() == 2) {
            stancey = 2;
            dlowHeirloom();
        }
        if (calcCurrentStance() == 0) {
            stancey = 0;
            dlowHeirloom();
        }
        if (calcCurrentStance() == 1) {
            stancey = 1;
            dlowHeirloom();
        }
        if (calcCurrentStance() == 15) {
            stancey = 5;
            dhighHeirloom();
        }
        if (calcCurrentStance() == 12) {
            stancey = 2;
            dhighHeirloom();
        }
        if (calcCurrentStance() == 10) {
            stancey = 0;
            dhighHeirloom();
        }
        if (calcCurrentStance() == 11) {
            stancey = 1;
            dhighHeirloom();
        }
    }
    setFormation(stancey);
}
