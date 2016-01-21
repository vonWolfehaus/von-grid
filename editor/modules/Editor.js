/*
	Manages cells and objects on the map.
*/
define('Editor', function() {
	var tower = require('tower');
	var nexus = require('nexus');
	var keyboard = require('keyboard');
	var motor = require('motor');

	// TODO: get these values from UI
	var heightStep = 3;

	// PRIVATE
	var lastHeight = 1;
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
				addTile(currentGridCell);
			}
			prevGridCell.copy(currentGridCell);
		}
	}

	function onUserAction(type, overTile, data) {
		var hit = nexus.mouse.allHits[0]
		switch (type) {
			case vg.MouseCaster.WHEEL:
				if (keyboard.shift && overTile) {
					if (!overTile.cell) {
						overTile.dispose();
						return;
					}
					_cel.copy(overTile.cell);
					_cel.tile = null;

					var dif = lastHeight - data;
					var last = _cel.h;
					_cel.h += dif > 0 ? -heightStep : heightStep;
					if (_cel.h < 1) _cel.h = 1;
					
					nexus.mouse.wheel = Math.round((_cel.h / heightStep) + (dif > 0 ? -1 : 1));
					lastHeight = nexus.mouse.wheel;

					if (last === _cel.h) return;
					removeTile(overTile);

					var cell = addTile(_cel);
					cell.tile.select();

					tower.tileAction.dispatch(tower.TILE_CHANGE_HEIGHT, cell.tile);
				}
				break;

			case vg.MouseCaster.OVER:
				if (keyboard.shift) {
					if (overTile && nexus.mouse.rightDown) {
						removeTile(overTile);
					}
					else if (!overTile && nexus.mouse.down) {
						addTile(currentGridCell);
					}
				}
				break;

			case vg.MouseCaster.OUT:

				break;

			case vg.MouseCaster.DOWN:
				if (keyboard.shift && nexus.mouse.down && data && !overTile) {
					// if shift is down then they're painting, so add a tile immediately
					addTile(currentGridCell);
				}
				break;

			case vg.MouseCaster.UP:
				if (nexus.mouse.down && data && !overTile) {
					// create a new tile, if one isn't already there
					addTile(currentGridCell);
				}
				else if (nexus.mouse.rightDown && overTile) {
					// remove a tile if it's there and right mouse is down
					removeTile(overTile);
				}
				break;
		}
	}

	function addTile(cell) {
		if (!cell || nexus.board.getTileAtCell(cell)) return;

		var newCell = new vg.Cell();
		newCell.copy(cell);
		newCell.h = Math.abs(nexus.mouse.wheel * heightStep);

		var newTile = nexus.grid.generateTile(newCell, 0.95);

		nexus.board.addTile(newTile);

		tower.tileAction.dispatch(tower.TILE_ADD, newTile);

		return newTile;
	}

	function removeTile(overTile) {
		nexus.board.removeTile(overTile);

		tower.tileAction.dispatch(tower.TILE_REMOVE, overTile);
	}

	return {

	}
});