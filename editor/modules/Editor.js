/*
	Manages cells and objects on the map.
*/
define('Editor', function() {
	var tower = require('tower');
	var nexus = require('nexus');
	var keyboard = require('keyboard');
	var motor = require('motor');

	// TODO: get these values from UI
	var heightStep = 5;

	// PRIVATE
	var lastHeight = 5;
	var currentGridCell = null;
	var prevGridCell = new THREE.Vector3();

	tower.userAction.add(onUserAction, this);
	motor.add(update);

	function update() {
		currentGridCell = nexus.grid.pixelToCell(nexus.input.editorWorldPos);
		if (nexus.mouse.down && keyboard.shift && nexus.mouse.allHits && nexus.mouse.allHits.length) {
			// only check if the user's mouse is over the editor plane
			if (!currentGridCell.equals(prevGridCell)) {
				addTile();
			}
			prevGridCell.copy(currentGridCell);
		}
	}

	function onUserAction(type, overCell, data) {
		var hit = nexus.mouse.allHits[0]
		var cell;
		switch (type) {
			case vg.MouseCaster.WHEEL:
				if (keyboard.shift && overCell) {
					var gridPos = overCell.gridPos;
					nexus.grid.remove(overCell);

					var dif = lastHeight - data;
					nexus.mouse.wheel = (overCell.depth / heightStep) + (dif > 0 ? -1 : 1);

					cell = nexus.grid.generateTile(nexus.mouse.wheel * heightStep);
					nexus.grid.add(gridPos, cell);
					lastHeight = nexus.mouse.wheel;

					overCell = cell;

					tower.tileAction.dispatch(tower.CELL_CHANGE_HEIGHT, cell, heightStep);
				}
				break;

			case vg.MouseCaster.OVER:
				if (keyboard.shift) {
					if (overCell && nexus.mouse.rightDown) {
						removeTile(overCell);
					}
					else if (!overCell && nexus.mouse.down) {
						addTile();
					}
				}
				break;

			case vg.MouseCaster.OUT:

				break;

			case vg.MouseCaster.DOWN:
				if (keyboard.shift && nexus.mouse.down && data && !overCell) {
					// if shift is down then she's painting, so add a cell immediately
					addTile();
				}
				break;

			case vg.MouseCaster.UP:
				if (nexus.mouse.down && data && !overCell) {
					// create a new cell, if one isn't already there
					addTile();
				}
				else if (nexus.mouse.rightDown && overCell) {
					// remove a cell if it's there and right mouse is down
					removeTile(overCell);
				}
				break;
		}
	}

	function addTile() {
		if (!currentGridCell || nexus.grid.getTileAtCell(currentGridCell)) return;
		nexus.mouse.wheel = lastHeight;
		var cell = nexus.grid.generateTile(nexus.mouse.wheel * heightStep);
		nexus.grid.add(currentGridCell, cell);

		tower.tileAction.dispatch(tower.CELL_ADD, cell, heightStep);
	}

	function removeTile(overCell) {
		nexus.grid.remove(overCell);

		tower.tileAction.dispatch(tower.CELL_REMOVE, overCell);
	}

	/*document.oncontextmenu = function() {
		return false;
	};*/

	return {

	}
});