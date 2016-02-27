define('addTile', function() {
	var tower = require('tower');
	var nexus = require('nexus');
	var data = require('data');

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

	function dataChanged(key, oldData, newData) {
		if (key === 'settings') {
			heightStep = newData.heightStep;
		}
		if (key === 'load-success') {
			heightStep = oldData.settings.heightStep;
		}
	}

	data.changed.add(dataChanged, this);

	return {
		onOver: over,
		onDown: down,
		onUp: up,
		action: addTile
	}
});