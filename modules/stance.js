function calcBaseDamageinX() {
    baseDamage = calcOurDmg("avg",!1,!0);
    baseBlock = game.global.soldierCurrentBlock;
    baseHealth = game.global.soldierHealthMax;
}

function calcBaseDamageinX2() {
    baseDamage = calcOurDmg("avg", false, true);
    baseHealth = calcOurHealth();
    baseBlock  = calcOurBlock();
}

function autoStanceNew() {
    if (game.global.gridArray.length === 0) return;
    if (game.global.soldierHealth <= 0) return;
    if (!game.upgrades.Formations.done) return;
	
    if (game.global.formation == 2 && game.global.soldierHealth <= game.global.soldierHealthMax * 0.25)     setFormation('0');
    else if(game.global.formation == 0 && game.global.soldierHealth <= game.global.soldierHealthMax * 0.25) setFormation('1')
    else if(game.global.formation == 1 && game.global.soldierHealth == game.global.soldierHealthMax)        setFormation('2');
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

    //Our Trimps Status
    var xHealth = baseHealth;
    var dHealth = baseHealth/2;
    var bHealth = baseHealth/2;
    var hHealth = baseHealth*4;
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;

    //Enemy
    var enemy = getCurrentEnemy();
    var enemyHealth = enemy.health;
    var enemyDamage = calcBadGuyDmg(enemy,null,true,true);

    //Enemy Crits
    var corrupt = game.global.world >= mutations.Corruption.start();
    var critMulti = 1;
    const ignoreCrits = getPageSetting('IgnoreCrits');
    var isCrushed = false;
    var isCritVoidMap = false;
    var isCritDaily = false;
    if (ignoreCrits != 2) {
        (isCrushed = (game.global.challengeActive == "Crushed") && game.global.soldierHealth > game.global.soldierCurrentBlock)
            && (critMulti *= 5);
        (isCritVoidMap = (!ignoreCrits && game.global.voidBuff == 'getCrit') || (enemy.corrupted == 'corruptCrit') || (enemy.corrupted == 'healthyCrit'))
            && (critMulti *= (enemy.corrupted == 'healthyCrit' ? 7 : 5));
        (isCritDaily = (game.global.challengeActive == "Daily") && (typeof game.global.dailyChallenge.crits !== 'undefined'))
            && (critMulti *= dailyModifiers.crits.getMult(game.global.dailyChallenge.crits.strength));
        enemyDamage *= critMulti;
    }

    //Fast Enemies
    var isDoubleAttack = game.global.voidBuff == 'doubleAttack' || (enemy.corrupted == 'corruptDbl') || enemy.corrupted == 'healthyDbl';
    var enemyFast = (game.global.challengeActive == "Slow" || ((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Coordinate" && game.global.challengeActive != "Nom")) || isDoubleAttack;

    //Corrupted and Healthy Enemies
    if (enemy.corrupted == 'corruptStrong') enemyDamage *= 2;
    if (enemy.corrupted == 'corruptTough') enemyHealth *= 5;
    if (enemy.corrupted == 'healthyStrong') enemyDamage *= 2.5;
    if (enemy.corrupted == 'healthyTough') enemyHealth *= 7.5;

    //Block Pierce
    var pierce = (game.global.brokenPlanet && !game.global.mapsActive) ? getPierceAmt() : 0;
    if (game.global.formation == 3) pierce *= 2; //Cancels the influence of the Barrier Formation

    //Pierce Damage
    var pierceDmg = pierce * enemyDamage;
    var pierceDmgNoCrit = pierce * (enemyDamage/critMulti);

    //Formation Damage
    var xDamage = Math.max(enemyDamage - baseBlock,   pierceDmg);
    var dDamage = Math.max(enemyDamage - baseBlock/2, pierceDmg);
    var bDamage = Math.max(enemyDamage - baseBlock*4, pierceDmg/2);
    var xDamageNoCrit = Math.max(enemyDamage/critMulti - baseBlock,   pierceDmgNoCrit);
    var dDamageNoCrit = Math.max(enemyDamage/critMulti - baseBlock/2, pierceDmgNoCrit);
    var bDamageNoCrit = Math.max(enemyDamage/critMulti - baseBlock*4, pierceDmgNoCrit/2);

    //Enemy Damage according to our formation
    xDamage = Math.max(xDamage, 0);
    dDamage = Math.max(dDamage, 0);
    bDamage = Math.max(bDamage, 0);
    dDamageNoCrit = Math.max(dDamageNoCrit, 0);
    xDamageNoCrit = Math.max(xDamageNoCrit, 0);
    bDamageNoCrit = Math.max(bDamageNoCrit, 0);

    //Enemy Damage on Double Attack
    if (isDoubleAttack) {
        xDamage *= 2;
        dDamage *= 2;
        bDamage *= 2;
        xDamageNoCrit *= 2;
        dDamageNoCrit *= 2;
        bDamageNoCrit *= 2;
    }

    //Introduces H Formation
    var hDamage = dDamage;
    var hDamageNoCrit = dDamage;

    //Oneshoting non-fast enemies
    if (!enemyFast && calcOurDmg("min", false, true)   > enemyHealth) {xDamage = 0; xDamageNoCrit=0;}
    if (!enemyFast && calcOurDmg("min", false, true)*4 > enemyHealth) {dDamage = 0; dDamageNoCrit=0;}
    if (!enemyFast && calcOurDmg("min", false, true)/2 > enemyHealth) {hDamage = 0; hDamageNoCrit=0;}
    if (!enemyFast && calcOurDmg("min", false, true)/2 > enemyHealth) {bDamage = 0; bDamageNoCrit=0;}
    
    //Active Challenges
    var leadChallenge = game.global.challengeActive == 'Lead';
    var electricityChallenge = game.global.challengeActive == "Electricity";
    var dailyPlague = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.plague !== 'undefined');
    var dailyBogged = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.bogged !== 'undefined');
    var dailyMirrored = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.mirrored !== 'undefined');
    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity" || dailyPlague || dailyBogged;
    var challengeDamage = 0;

    //Electricity Lead - Tox/Nom
    if (electricityChallenge) challengeDamage = game.challenges.Electricity.stacks * 0.1;
    else if (drainChallenge) challengeDamage = 0.20;

    //Plague & Bogged (Daily)
    if (dailyPlague) challengeDamage = dailyModifiers.plague.getMult(game.global.dailyChallenge.plague.strength, 1 + game.global.dailyChallenge.plague.stacks);
    if (dailyBogged) challengeDamage = dailyModifiers.bogged.getMult(game.global.dailyChallenge.bogged.strength);

    //Adds challenge damage
    xDamage += xHealth * challengeDamage;
    dDamage += dHealth * challengeDamage;
    hDamage += hHealth * challengeDamage;
    bDamage += bHealth * challengeDamage;
    xDamageNoCrit += xHealth * challengeDamage;
    dDamageNoCrit += dHealth * challengeDamage;
    hDamageNoCrit += hHealth * challengeDamage;
    bDamageNoCrit += bHealth * challengeDamage;

    //Lead - Only takes damage if the enemy doesn't die
    if (leadChallenge) {
        var leadDmg = game.challenges.Lead.stacks * 0.0003;
        if (calcOurDmg("min", false, true)   < enemyHealth) {xDamage += xHealth * leadDmg; xDamageNoCrit += xHealth * leadDmg;}
        if (calcOurDmg("min", false, true)*4 < enemyHealth) {dDamage += dHealth * leadDmg; dDamageNoCrit += dHealth * leadDmg;}
        if (calcOurDmg("min", false, true)/2 < enemyHealth) {hDamage += hHealth * leadDmg; hDamageNoCrit += hHealth * leadDmg;}
        if (calcOurDmg("min", false, true)/2 < enemyHealth) {bDamage += bHealth * leadDmg; bDamageNoCrit += bHealth * leadDmg;}
    }

    //Bleed (from Void or Corruption) -- % of current life, not max
    if (game.global.voidBuff == "bleed" || (enemy.corrupted == 'corruptBleed') || enemy.corrupted == 'healthyBleed') {
        challengeDamage = (enemy.corrupted == 'healthyBleed') ? 0.30 : 0.20;
        xDamage += (xHealth - missingHealth) * challengeDamage;
        dDamage += (dHealth - missingHealth) * challengeDamage;
        hDamage += (hHealth - missingHealth) * challengeDamage;
        bDamage += (bHealth - missingHealth) * challengeDamage;
        xDamageNoCrit += (xHealth - missingHealth) * challengeDamage;
        dDamageNoCrit += (dHealth - missingHealth) * challengeDamage;
        hDamageNoCrit += (hHealth - missingHealth) * challengeDamage;
        bDamageNoCrit += (bHealth - missingHealth) * challengeDamage;
    }

    //Mirrored (Daily) -- Unblockable
    if (dailyMirrored) {
        var mirrorDamage = 0.1 * calcOurDmg("max", false, true);
        xDamage += mirrorDamage;
        dDamage += mirrorDamage * 4;
        hDamage += mirrorDamage / 2;
        bDamage += mirrorDamage / 2;
        xDamageNoCrit += mirrorDamage;
        dDamageNoCrit += mirrorDamage * 4;
        hDamageNoCrit += mirrorDamage / 2;
        bDamageNoCrit += mirrorDamage / 2;
    }

    //Explosive Daily (or Magma Omnipotrimp --TODO) -- Blockable
    if (typeof game.global.dailyChallenge['explosive'] !== 'undefined') {
        var explosionDmg = calcBadGuyDmg(enemy,null,true,true) * (1 + game.global.dailyChallenge['explosive'].strength);
        var explosionDmgNoCrit = explosionDmg / critMulti;

        //The Explosion can actually be blocked
        if (calcOurDmg("max", false, true)   > enemyHealth) xDamage += Math.max(explosionDmg - baseBlock,   explosionDmg * pierce);
        if (calcOurDmg("max", false, true)*4 > enemyHealth) dDamage += Math.max(explosionDmg - baseBlock/2, explosionDmg * pierce);
        if (calcOurDmg("max", false, true)/2 > enemyHealth) hDamage += Math.max(explosionDmg - baseBlock/2, explosionDmg * pierce);
        if (calcOurDmg("max", false, true)/2 > enemyHealth) bDamage += Math.max(explosionDmg - baseBlock*4, explosionDmg * pierce/2);
        if (calcOurDmg("max", false, true)   > enemyHealth) xDamageNoCrit += Math.max(explosionDmgNoCrit - baseBlock,   explosionDmgNoCrit * pierce);
        if (calcOurDmg("max", false, true)*4 > enemyHealth) dDamageNoCrit += Math.max(explosionDmgNoCrit - baseBlock/2, explosionDmgNoCrit * pierce);
        if (calcOurDmg("max", false, true)/2 > enemyHealth) hDamageNoCrit += Math.max(explosionDmgNoCrit - baseBlock/2, explosionDmgNoCrit * pierce);
        if (calcOurDmg("max", false, true)/2 > enemyHealth) bDamageNoCrit += Math.max(explosionDmgNoCrit - baseBlock*4, explosionDmgNoCrit * pierce/2);
    }

    //Flags that tell on which situations your trimps can survive
    var surviveD  = (newSquadRdy && dHealth > dDamage) || (dHealth - missingHealth > dDamage);
    var surviveX1 = (newSquadRdy && bHealth > xDamage) || (bHealth - missingHealth > xDamage);
    var surviveX2 = (newSquadRdy && xHealth > xDamage) || (xHealth - missingHealth > xDamage);
    var surviveH  = (newSquadRdy && hHealth > hDamage) || (hHealth - missingHealth > hDamage);
    var surviveB  = (newSquadRdy && bHealth > bDamage) || (bHealth - missingHealth > bDamage);
    var surviveNoCritD  = (newSquadRdy && dHealth > dDamageNoCrit) || (dHealth - missingHealth > dDamageNoCrit);
    var surviveNoCritX1 = (newSquadRdy && bHealth > xDamageNoCrit) || (bHealth - missingHealth > xDamageNoCrit);
    var surviveNoCritX1 = (newSquadRdy && xHealth > xDamageNoCrit) || (xHealth - missingHealth > xDamageNoCrit);
    var surviveNoCritH  = (newSquadRdy && hHealth > hDamageNoCrit) || (hHealth - missingHealth > hDamageNoCrit);
    var surviveNoCritB  = (newSquadRdy && bHealth > bDamageNoCrit) || (bHealth - missingHealth > bDamageNoCrit);

    //Check formation availability
    surviveD &= game.upgrades.Dominance.done;
    surviveH &= game.upgrades.Formations.done;
    surviveB &= game.upgrades.Barrier.done;

    //Stance Selector
    if (!game.global.preMapsActive && game.global.soldierHealth > 0) {
        //Chooses the formation that allows it to survive even against crits (if there is any)
        if (surviveD) setFormation(2);
        else if (surviveX1) setFormation("0");
        else if (surviveB) setFormation(3);
        else if (surviveX2) setFormation("0");
        else if (surviveH) setFormation(1);

        //If there is no hope of surviving a crit, chooses the best formation to attempt it's luck
        else if (surviveD) setFormation(2);
        else if (surviveX1) setFormation("0");
        else if (surviveB) setFormation(3);
        else if (surviveX2) setFormation("0");
        else if (surviveH) setFormation(1);
        
        //If it cannot survive the worst case scenario on any formatio, attempt it's luck on H, if available, or X
        else if (game.upgrades.Formations.done) setFormation(1);
        else setFormation("0");
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
