define('addTile', function() {
	var tower = require('tower');
	var nexus = require('nexus');
	// var keyboard = require('keyboard');
	// var motor = require('motor');

	// TODO: get these values from UI
	var heightStep = 3;

	function over(cell, tile, mesh) {
		if (!tile && nexus.mouse.down) {
			addTile(cell);
		}
	}

	function down(cell, tile, mesh) {
		if (!tile) {
			addTile(cell);
		}
	}

	function up(cell, tile, mesh) {

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

	return {
		onOver: over,
		onDown: down,
		onUp: up,
		action: addTile
	}
});