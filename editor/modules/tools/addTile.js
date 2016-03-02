define('addTile', function() {
	var tower = require('tower');
	var nexus = require('nexus');
	var tilemaker = require('tilemaker');

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
		newCell.h = Math.abs(nexus.mouse.wheel * nexus.board.tileHeightStep);

		var newTile = tilemaker.getTile(newCell, 1);

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