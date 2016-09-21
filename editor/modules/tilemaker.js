/*
	Creates and manages a default tileset.
*/
define('tilemaker', function() {
	var nexus = require('nexus');
	var data = require('data');

	// var tileset = new vg.TilesetManager(nexus.board);

	var materials = [];
	var tilePool = []; // unused tiles for recycling

	function init() {
		var map = data.get('map');
		var mats = map.materials;
		if (map.mesh) {
			// TODO
			// tileset.load(map, onMatLoad);
		}
		else {
			// generate a placeholder tileset with the materials saved in the map data
			var c = [
				'rgb(10, 64, 16)',
				'rgb(10, 51, 64)',
				'rgb(70, 70, 0)',
				'rgb(0, 200, 200)',
				'rgb(255, 100, 200)',
			];
			for (var i = 0; i < mats.length; i++) {
				materials[mats[i].id] = new THREE.MeshPhongMaterial({
					color: c[i] || vg.util.randomizeRGB(0, 100)
				});
			}
		}
	}

	// make sure all tiles are under new height, or rebuild geo if height is taller
	function resetHeightStep(newHeightStep) {
		if (!nexus.board) return;
		var i, t;
		var step = newHeightStep || nexus.board.tileHeightStep;
		for (i = 0; t = nexus.board.tiles[i]; i++) {
			t.position.y = t.cell.h * step;
		}
	}

	function getTile(cell, matid) { // eslint-disable-line no-unused-vars
		var mat = materials[matid];
		var map = data.get('map');
		if (cell.tile) {
			// don't rebuild, just update
			cell.tile.material = mat;
			cell.tile.mesh.material = mat;
			return cell.tile;
		}
		var t = tilePool.pop();
		if (t) {
			t.material = mat;
			t.mesh.material = mat;
			t.cell = cell;
			cell.tile = t;
			t.position.copy(nexus.grid.cellToPixel(cell));
			t.position.y = t.cell.h * nexus.board.tileHeightStep;
		}
		else {
			t = new vg.Tile({
				cell: cell,
				geometry: map.mesh || nexus.gen.geoGen.tileGeo,
				material: materials[matid]
			});
		}

		nexus.board.addTile(t);

		return t;
	}

	/*function recycleTile(tile) {
		if (tile.mesh.parent) tile.mesh.parent.remove(tile.mesh);
		tilePool.push(tile);
	}*/

	function dataChanged(key, oldData, newData) {
		var newHeightStep;

		if (key === 'settings') {
			newHeightStep = newData.heightStep;
		}
		else if (key === 'load-success') {
			newHeightStep = oldData.settings.heightStep;
		}

		if (newHeightStep) resetHeightStep(newHeightStep);
	}

	data.changed.add(dataChanged, this);

	return {
		init: init,
		getTile: getTile
	}
});