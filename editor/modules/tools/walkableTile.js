define('walkableTile', function() {
	var tower = require('tower');
	var nexus = require('nexus');

	function over(cell, tile, mesh) {
		if (tile && nexus.mouse.down) {
			walkableTile(tile);
		}
	}

	function down(cell, tile, mesh) {
		if (tile) {
			walkableTile(tile);
		}
	}

	function up(cell, tile, mesh) {

	}

	function walkableTile(tile) {
		if (!tile) return;

		tile.cell.walkable = !tile.cell.walkable;

		tower.tileAction.dispatch(tower.TILE_CHANGE_WALKABLE, tile);

		return tile;
	}

	return {
		onOver: over,
		onDown: down,
		onUp: up,
		action: walkableTile
	}
});