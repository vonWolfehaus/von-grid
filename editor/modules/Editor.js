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
	var _cel = new vg.Cell();

	tower.userAction.add(onUserAction, this);
	motor.add(update);

	function update() {
		currentGridCell = nexus.grid.pixelToCell(nexus.input.editorWorldPos);
		if (nexus.mouse.down && keyboard.shift && nexus.mouse.allHits && nexus.mouse.allHits.length) {
			// only check if the user's mouse is over the editor plane
			if (!currentGridCell.equals(prevGridCell)) {
				addCell(currentGridCell);
			}
			prevGridCell.copy(currentGridCell);
		}
	}

	function onUserAction(type, overTile, data) {
		var hit = nexus.mouse.allHits[0]
		switch (type) {
			case vg.MouseCaster.WHEEL:
				if (keyboard.shift && overTile) {
					_cel.copy(overTile.cell);
					_cel.tile = null;

					var dif = lastHeight - data;
					nexus.mouse.wheel = (overTile.cell.h / heightStep) + (dif > 0 ? -1 : 1);

					nexus.board.removeTile(overTile);

					var cell = addCell(_cel);
					lastHeight = nexus.mouse.wheel;

					tower.tileAction.dispatch(tower.CELL_CHANGE_HEIGHT, cell.tile, heightStep);
				}
				break;

			case vg.MouseCaster.OVER:
				if (keyboard.shift) {
					if (overTile && nexus.mouse.rightDown) {
						removeTile(overTile);
					}
					else if (!overTile && nexus.mouse.down) {
						addCell(currentGridCell);
					}
				}
				break;

			case vg.MouseCaster.OUT:

				break;

			case vg.MouseCaster.DOWN:
				if (keyboard.shift && nexus.mouse.down && data && !overTile) {
					// if shift is down then she's painting, so add a tile immediately
					addCell(currentGridCell);
				}
				break;

			case vg.MouseCaster.UP:
				if (nexus.mouse.down && data && !overTile) {
					// create a new tile, if one isn't already there
					addCell(currentGridCell);
				}
				else if (nexus.mouse.rightDown && overTile) {
					// remove a tile if it's there and right mouse is down
					removeTile(overTile);
				}
				break;
		}
	}

	function addCell(cell) {
		if (!cell || cell.tile) return;

		var newCell = new vg.Cell();
		newCell.copy(cell);
		newCell.h = nexus.mouse.wheel * heightStep;

		var newTile = nexus.grid.generateTile(newCell, 0.95);

		nexus.board.addTile(newTile);

		tower.tileAction.dispatch(tower.CELL_ADD, newTile, heightStep);

		return newCell;
	}

	function removeTile(overTile) {
		nexus.board.removeTile(overTile);

		tower.tileAction.dispatch(tower.CELL_REMOVE, overTile);
	}

	return {

	}
});