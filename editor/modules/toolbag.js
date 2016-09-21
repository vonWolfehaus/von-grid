/*
	Manages cells and objects on the map.
*/
define('toolbag', function() {
	var tower = require('tower');
	var nexus = require('nexus');
	var keyboard = require('keyboard');
	var motor = require('motor');

	var addTile = require('addTile');
	var removeTile = require('removeTile');
	var walkableTile = require('walkableTile');

	var tool = addTile; // should be the first tool in the bag as determined by tool-menu.tag

	var lastHeight = 1;
	var currentGridCell = null;
	var prevGridCell = new THREE.Vector3();
	// var _cel = new vg.Cell();

	tower.userAction.add(onUserAction, this);
	ui.on(ui.Events.TOOL_CHANGE, toolChange);

	motor.add(update);

	function update() {
		currentGridCell = nexus.grid.pixelToCell(nexus.input.editorWorldPos);
		if (!keyboard.ctrl && nexus.mouse.down && ui.activeTool.name === 'ADD_TILE' && nexus.mouse.allHits && nexus.mouse.allHits.length) {
			// special case since the over event doesn't fire if there's no tile
			if (!currentGridCell.equals(prevGridCell)) {
				addTile.action(currentGridCell, null);
			}
			prevGridCell.copy(currentGridCell);
		}
	}

	function toolChange(evt) {
		switch (evt) {
			case ui.Tools.ADD_TILE:
				tool = addTile;
				break;
			case ui.Tools.REMOVE_TILE:
				tool = removeTile;
				break;
			case ui.Tools.WALK_TILE:
				tool = walkableTile;
				break;
			default:
				tool = null;
				break;
		}
		// console.log('Tool selected: '+evt);
	}

	function onUserAction(type, overTile, data) {
		if (keyboard.ctrl || data === null || nexus.mouse.rightDown || !tool) {
			// there's no picked object, which means the user isn't hovering over any mesh in the scene
			// also ignore right-mouse clicks
			return;
		}
		var heightStep = nexus.board.tileHeightStep;

		switch (type) {
			case vg.MouseCaster.WHEEL:
				if (overTile) {
					var dif = lastHeight - data;
					overTile.cell.h += dif > 0 ? -1 : +1;
					if (overTile.cell.h < 1) overTile.cell.h = 0;

					nexus.mouse.wheel = Math.round((overTile.cell.h / heightStep) + (dif > 0 ? -1 : 1));
					lastHeight = nexus.mouse.wheel;

					overTile.position.y = overTile.cell.h * heightStep;

					tower.tileAction.dispatch(tower.TILE_CHANGE_HEIGHT, overTile);
				}
				break;

			case vg.MouseCaster.OVER:
				tool.onOver(currentGridCell, overTile, data);
				break;

			case vg.MouseCaster.OUT:

				break;

			case vg.MouseCaster.DOWN:
				tool.onDown(currentGridCell, overTile, data);
				break;

			case vg.MouseCaster.UP:
				tool.onUp(currentGridCell, overTile, data);
				break;
		}
	}

	return {

	}
});