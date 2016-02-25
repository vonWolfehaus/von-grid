define('removeTile', function() {
	var tower = require('tower');
	var nexus = require('nexus');
	// var keyboard = require('keyboard');
	// var motor = require('motor');

	// var disabled = false;

	function over(cell, tile, mesh) {
		if (tile && nexus.mouse.down) {
			removeTile(tile);
		}
	}

	function down(cell, tile, mesh) {
		if (tile) {
			removeTile(tile);
		}
	}

	function up(cell, tile, mesh) {

	}

	function removeTile(tile) {
		nexus.board.removeTile(tile);
		tower.tileAction.dispatch(tower.TILE_REMOVE, tile);
	}

	return {
		onOver: over,
		onDown: down,
		onUp: up,
		action: removeTile
	}
});