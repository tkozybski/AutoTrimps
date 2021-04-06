var wantToScry = false;
var transitionRequired = false;

function scryingCorruption() {
    var scryZone = game.global.world >= getPageSetting('ScryerMinZone') && game.global.world < getPageSetting('ScryerMaxZone');
    var scryCorrupt = scryZone && game.global.world >= getPageSetting('ScryerMinZone') && getPageSetting('ScryerSkipCorrupteds2') != 0;
    var essenceLeft = getPageSetting('screwessence') == false || countRemainingEssenceDrops() >= 1;
    if (scryCorrupt && essenceLeft && getPageSetting('UseScryerStance') == true) return true;
}

function readyToSwitch(stance = "S") {
    //Suicide to Scry
    var die = (getPageSetting('ScryerDieZ') != -1 && game.global.world >= getPageSetting('ScryerDieZ')) ;
    var willSuicide = getPageSetting('ScryerDieZ');

    //Check if we are allowed to suicide in our current cell and zone
    if (die && willSuicide >= 0) {
        var [dieZ, dieC] = willSuicide.toString().split(".");
        if (dieC && dieC.length == 1) dieC = dieC + "0";
        die = game.global.world >= dieZ && (!dieC || (game.global.lastClearedCell + 1 >= dieC));
    }

    return die || survive(stance, 2);
}

function useScryerStance() {
    var scry = 4;
    
    if (game.global.uberNature == "Wind" && getEmpowerment() != "Wind") {
        scry = 5;
    }
    
    var AutoStance = getPageSetting('AutoStance');
    function autoStanceFunctionScryer() {
        if ((getPageSetting('AutoStance') == 3) || (getPageSetting('use3daily') == true && game.global.challengeActive == "Daily")) windStance();
        else if (AutoStance==1) autoStance();
        else if (AutoStance==2) autoStance2();
    }

    //Never
    var USS = getPageSetting('UseScryerStance'), MA = game.global.mapsActive, SC = getPageSetting('ScryerSkipCorrupteds2') == 0;
    var never_scry  = game.global.preMapsActive || game.global.gridArray.length === 0 || game.global.world <= 60 || game.global.highestLevelCleared < 180;
        never_scry |= USS &&  MA && getPageSetting('ScryerUseinMaps2') == 0 && getCurrentMapObject().location != "Void" && getCurrentMapObject().location != "Bionic" && getCurrentMapObject().level <= game.global.world;
        never_scry |= USS &&  MA && getPageSetting('ScryerUseinPMaps') == 0 && getCurrentMapObject().level > game.global.world && getCurrentMapObject().location != "Void" && getCurrentMapObject().location != "Bionic";
        never_scry |= USS &&  MA && getCurrentMapObject().location == "Void" && getPageSetting('ScryerUseinVoidMaps2') == 0;
        never_scry |= USS &&  MA && getCurrentMapObject().location == "Bionic" && getPageSetting('ScryerUseinBW') == 0;
        never_scry |= USS && !MA && (isActiveSpireAT() || disActiveSpireAT()) && getPageSetting('ScryerUseinSpire2') == 0;
        never_scry |= USS && !MA && getPageSetting('ScryerSkipBoss2') == 1 && game.global.world < getPageSetting('VoidMaps') && game.global.lastClearedCell == 98;
        never_scry |= USS && !MA && getPageSetting('ScryerSkipBoss2') == 0 && game.global.lastClearedCell == 98;
        never_scry |= USS && !MA && (getEmpowerment() == "Poison" && (getPageSetting('ScryUseinPoison') == 0 || (getPageSetting('ScryUseinPoison') > 0 && game.global.world >= getPageSetting('ScryUseinPoison')))) || (getEmpowerment() == "Wind" && (getPageSetting('ScryUseinWind') == 0 || (getPageSetting('ScryUseinWind') > 0 && game.global.world >= getPageSetting('ScryUseinWind')))) || (getEmpowerment() == "Ice" && (getPageSetting('ScryUseinIce') == 0 || (getPageSetting('ScryUseinIce') > 0 && game.global.world >= getPageSetting('ScryUseinIce'))));

    //Check Corrupted Never
    var isCorrupt = getCurrentEnemy(1) && getCurrentEnemy(1).mutation == "Corruption";
    var nextIsCorrupt = getCurrentEnemy(2) && getCurrentEnemy(2).mutation == "Corruption";
    var scryNext = !nextIsCorrupt && (transitionRequired || oneShootPower(undefined, false, 0, true));
    if (USS && !MA && SC && isCorrupt) {
        transitionRequired = scryNext;
        never_scry |= !scryNext;
    }
    else transitionRequired = false;
    
    //check Healthy never -- TODO
    var curEnemyHealth = getCurrentEnemy(1);
    var isHealthy = curEnemyHealth && curEnemyHealth.mutation == "Healthy";
    if (never_scry || getPageSetting('UseScryerStance') == true && !game.global.mapsActive && (isHealthy && getPageSetting('ScryerSkipHealthy') == 0)) {
        autoStanceFunctionScryer();
        wantToScry = false;
        return;
    }

    //Force
    var use_scryer  = getPageSetting('UseScryerStance') == true && game.global.mapsActive && getPageSetting('ScryerUseinMaps2') == 1;
        use_scryer |= game.global.mapsActive && getCurrentMapObject().location == "Void" && ((getPageSetting('ScryerUseinVoidMaps2') == 1) || (getPageSetting('scryvoidmaps') == true && game.global.challengeActive != "Daily") || (getPageSetting('dscryvoidmaps')== true && game.global.challengeActive == "Daily"));
        use_scryer |= game.global.mapsActive && getCurrentMapObject().location == "Bionic" && getPageSetting('ScryerUseinBW') == 1;
        use_scryer |= game.global.mapsActive && getCurrentMapObject().level > game.global.world && getPageSetting('ScryerUseinPMaps') == 1 && getCurrentMapObject().location != "Bionic";
        use_scryer |= !game.global.mapsActive && getPageSetting('UseScryerStance') == true && (isActiveSpireAT() || disActiveSpireAT()) && getPageSetting('ScryerUseinSpire2') == 1;
        use_scryer |= !game.global.mapsActive && getPageSetting('UseScryerStance') == true && ((getEmpowerment() == "Poison" && getPageSetting('ScryUseinPoison') > 0 && game.global.world < getPageSetting('ScryUseinPoison')) || (getEmpowerment() == "Wind" && getPageSetting('ScryUseinWind') > 0 && game.global.world < getPageSetting('ScryUseinWind')) || (getEmpowerment() == "Ice" && getPageSetting('ScryUseinIce') > 0 && game.global.world < getPageSetting('ScryUseinIce')));

    //Farm easy maps on scryer
    if (game.global.mapsActive) {
        var farmScry = (shouldFarm || shouldFarmDamage || !enoughHealth || preSpireFarming);
        var mapRatio = calcHDRatio(getCurrentMapObject().level, "map") / (game.unlocks.imps.Titimp ? 2 : 1) <= 2.7; //2.7 is here because created maps are usually shorter and easier
        use_scryer |= getCurrentMapObject().location != "Void" && farmScry && mapRatio; //Farm maps on scryer
    }

    //check Corrupted Force
    if ((isCorrupt && getPageSetting('ScryerSkipCorrupteds2') == 1 && getPageSetting('UseScryerStance') == true) || (use_scryer)) {
        setFormation(scry);
        wantToScry = true;
        return;
    }
    //check healthy force
    if ((isHealthy && getPageSetting('ScryerSkipHealthy') == 1 && getPageSetting('UseScryerStance') == true) || (use_scryer)) {
        setFormation(scry);
        wantToScry = true;
        return;
    }

    //Calc Damage
    if (AutoStance>=1) calcBaseDamageinX2();

    //Checks if Overkill is allowed
    var useOverkill = getPageSetting('UseScryerStance') == true && getPageSetting('ScryerUseWhenOverkill');
        useOverkill &= !(getPageSetting('ScryerUseinSpire2') == 0 && !game.global.mapsActive && (isActiveSpireAT() || disActiveSpireAT()));

    //Overkill
    if (useOverkill && getCurrentEnemy()) {
        //Switches to S if it has enough damage to secure an overkill
        var HS = oneShootPower("S");
        var HSD = oneShootPower("D", false, 0, true);
        var HS_next = oneShootPower("S", false, 1);
        var HSD_next = oneShootPower("D", false, 1, true);
        if (readyToSwitch && HS > 0 && HS >= HSD && (HS > 1 || HS_next > 0 && HS_next >= HSD_next)) {
            setFormation(4);
            return;
        }
    }
    
    //No Essence
    if (USS && !MA && getPageSetting('screwessence') == true && countRemainingEssenceDrops() < 1) {
        autoStanceFunctionScryer();
        wantToScry = false;
        return;
    }
    
    //Default
    var min_zone = getPageSetting('ScryerMinZone');
    var max_zone = getPageSetting('ScryerMaxZone');
    var valid_min = game.global.world >= min_zone && game.global.world > 60;
    var valid_max = max_zone <= 0 || game.global.world < max_zone;
    
    if (USS && valid_min && valid_max && !(MA && getPageSetting('onlyminmaxworld') == true)) {
        //Smooth transition to S before killing the target
        if (transitionRequired) {
            for (var cp=2; cp >= -2; cp--) {
                if      (survive("D",  cp) && (!oneShootPower("D", false, 0, true)))                     {setFormation( 2 ); return;}
                else if (survive("XB", cp) && (!oneShootPower("X", false, 0, true)))                     {setFormation("0"); return;}
                else if (survive("B",  cp) && (!oneShootPower("B", false, 0, true) || !readyToSwitch())) {setFormation( 3 ); return;}
                else if (survive("X",  cp) && (!oneShootPower("X", false, 0, true) || !readyToSwitch())) {setFormation("0"); return;}
                else if (survive("H",  cp) && (!oneShootPower("H", false, 0, true) || !readyToSwitch())) {setFormation( 1 ); return;}
            }
        }

        //Set to scry if it won't kill us or we are willing to die for it
        if (readyToSwitch() || transitionRequired) {
            setFormation(scry);
            wantToScry = true;
            return;
        }
    }

    //No reason to Scry
    autoStanceFunctionScryer();
    wantToScry = false;
}
