;(function(M) {
	M["fightinfo"] = {};
	M["fightinfo"].$worldGrid = document.getElementById('grid');
	M["fightinfo"].$mapGrid = document.getElementById('mapGrid');

	//This changes the colour of the cell. It's usually bad, because it overrides trimps and looks bad against corruption, among other reasons
	M["fightinfo"].changeCellColor = false;

	//This option reverts to AT's old way of giving an unique icon for each of the ten exotic imps
	M["fightinfo"].allExoticIcons = true;

	M["fightinfo"].imp = {
		skel     : {icon: '"glyphicon glyphicon-italic"',      shadow: "0px 0px 10px #ffffff", color: '#ffffff'},
		exotic   : {icon: '"glyphicon glyphicon-sunglasses"',  shadow: "0px 0px 10px #fb753f", color: '#ff0000'},
		powerful : {icon: '"glyphicon glyphicon-hazard"',      shadow: "0px 0px 10px #8c0000", color: '#0000ff'},
		fast     : {icon: '"glyphicon glyphicon-forward"',     shadow: "0px 0px 10px #ffffff", color: '#666666'},
		poison   : {icon: '"glyphicon glyphicon-flask"',       shadow: "0px 0px 10px #ffffff", color: '#00ff00'},
		wind     : {icon: '"icomoon icon-air"',                shadow: "0px 0px 10px #ffffff", color: '#99ffff'},
		ice      : {icon: '"glyphicon glyphicon-certificate"', shadow: "0px 0px 10px #ffffff", color: '#00ffff'}
	};

	//Powerful imps
	M["fightinfo"].powerful = [
		"Improbability",
		"Omnipotrimp",
		"Mutimp",
		"Hulking_Mutimp"
	];

	//Exotic imps
	M["fightinfo"].exotics = {
		chronoimp : {name: "Chronoimp", icon: '"glyphicon glyphicon-hourglass"'   },
		feyimp    : {name: "Feyimp",    icon: '"icomoon icon-diamond"'            },
		flutimp   : {name: "Flutimp",   icon: '"glyphicon glyphicon-globe"'       },
		goblimp   : {name: "Goblimp",   icon: '"icomoon icon-evil"'               },
		jestimp   : {name: "Jestimp",   icon: '"icomoon icon-mask"'               },
		magnimp   : {name: "Magnimp",   icon: '"glyphicon glyphicon-magnet"'      },
		tauntimp  : {name: "Tauntimp",  icon: '"glyphicon glyphicon-tent"'        },
		titimp    : {name: "Titimp",    icon: '"icomoon icon-hammer"'             },
		venimp    : {name: "Venimp",    icon: '"glyphicon glyphicon-baby-formula"'},
		whipimp   : {name: "Whipimp",   icon: '"icomoon icon-area-graph"'         },
	};

	//Fast imps
	M["fightinfo"].fast = [
		"Snimp",
    	"Kittimp",
    	"Gorillimp",
    	"Squimp",
    	"Shrimp",
    	"Chickimp",
    	"Frimp",
    	"Slagimp",
    	"Lavimp",
    	"Kangarimp",
    	"Entimp",
    	"Carbimp",
	];

	//Last processed
	M["fightinfo"].lastProcessedWorld = null;
	M["fightinfo"].lastProcessedMap = null;

	function identifyCell(cell) {//TODO What was this for anyway? I forgot. I think it was needed to fix nature icons?
		//Init
		var tags = [];
		var name = cell.name.toLowerCase();

		//Skeletimp
		if (name.includes("skeletimp"))   tags.push("skeletimp");

		//Exotics
		if (name in M.fightinfo.exotics) tags.push("exotic")

		//Nature
		if (name.startsWith("poison")) tags.push("poison");
		if (name.startsWith("wind"))   tags.push("wind");
		if (name.startsWith("ice"))    tags.push("ice");
	}

	function updateCell($cell, cell, pallet, customIcon, overrideSpecial) {
		//Cell Title
		$cell.title = cell.name;

		//Cell Color
		if (M.fightinfo.changeCellColor) $cell.style.color = pallet.color;
		$cell.style.textShadow = pallet.shadow;

		//Glyph Icon
		if (overrideSpecial || cell.special.length == 0) $cell.innerHTML = (customIcon) ? customIcon : pallet.icon;
	}

	function Update() {
		//Check if we should update world or map info
		var $cells = [];
		var cells = (game.global.mapsActive) ? game.global.mapGridArray : game.global.gridArray;
		var rowSource = (game.global.mapsActive) ? M["fightinfo"].$mapGrid.children : M["fightinfo"].$worldGrid.children;
		var $rows = Array.prototype.slice.call(rowSource).reverse();

		//Check if current the world is already info-ed
		if (!game.global.mapsActive && M["fightinfo"].lastProcessedWorld == game.global.world)
			return;

		//Set this world as info-ed
		else if (!game.global.mapsActive) M["fightinfo"].lastProcessedWorld = game.global.world;

		//Loop through DOM rows and concat each row's cell-element into $cells
		$rows.forEach(function(row) {
			$cells = $cells.concat(Array.prototype.slice.call(row.children));
		});

		//Process all cells
		for(var i=0; i < $cells.length; i++) {
			//Init
			var $cell = $cells[i];
			var cell = cells[i];

			//Skeletimp
			if (cell.name.toLowerCase().indexOf('skele') > -1) {
				updateCell($cell, cell, M.fightinfo.imp.skel);
			}

			//Exotic cell
			else if (cell.name.toLowerCase() in M["fightinfo"].exotics) {
				var icon = M.fightinfo.allExoticIcons ? M.fightinfo.exotics[cell.name.toLowerCase()].icon : undefined;
				updateCell($cell, cell, M.fightinfo.imp.exotic, icon);
			}

			//Powerful Imp
			else if (M["fightinfo"].powerful.indexOf(cell.name) > -1) {
				updateCell($cell, cell, M.fightinfo.imp.powerful);
			}

			//Fast Imp
			else if(M["fightinfo"].fast.indexOf(cell.name) > -1 && (!cell.corrupted || !cell.corrupted.startsWith("corrupt"))) {
				updateCell($cell, cell, M.fightinfo.imp.fast);
			}

			//This shit doesn't work and I don't know why (What is the cell.title??? is it the name of the nature? Imps are labelled Toxic/Gusty/Frozen but that didn't work either)
			else if (cell.name.toLowerCase().indexOf('poison') > -1) {
				updateCell($cell, cell, M.fightinfo.imp.poison);
			}

			//Wind Token
			else if (cell.name.toLowerCase().indexOf('wind') > -1) {
				updateCell($cell, cell, M.fightinfo.imp.wind);
			}

			//Ice Token
			else if (cell.name.toLowerCase().indexOf('ice') > -1) {
				updateCell($cell, cell, M.fightinfo.imp.ice);
			}
		}
	}

	M["fightinfo"].Update = Update;
})(MODULES);