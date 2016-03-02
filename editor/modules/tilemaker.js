/*
	Creates and manages a default tileset.
*/
define('tilemaker', function() {
	var nexus = require('nexus');
	var data = require('data');

	var materials = [];
	var tilePool = []; // unused tiles for recycling

	function init() {
		// geo = new THREE.ExtrudeGeometry(nexus.grid.cellShape, extrudeSettings);
		// create a default tileset with these materials
		materials.push(new THREE.MeshPhongMaterial({
			color: 'rgb(0, 0, 0)'
		}));
		materials.push(new THREE.MeshPhongMaterial({
			color: 'rgb(10, 64, 16)'
		}));
		materials.push(new THREE.MeshPhongMaterial({
			color: 'rgb(64, 51, 10)'
		}));
		materials.push(new THREE.MeshPhongMaterial({
			color: 'rgb(200, 200, 200)'
		}));

		// create all the tiles and meshes for the grid
		/*var cells = nexus.grid.cells;
		var i, t;
		for (i in cells) {
			t = cells[i];
			// t = getTile(0);
			// t.position.copy(nexus.grid.cellToPixel(c));
			// t.position.y = 0;
			tiles.push(t);
		}*/
	}

	// make sure all tiles are under new height, or rebuild geo if height is taller
	function resetHeightStep(newHeightStep) {
		// var i, t;
		// var step = newHeightStep || nexus.board.tileHeightStep;
		/*for (i = 0; t = nexus.board.tiles[i]; i++) { // board is undefined on map load!
			t.position.y = t.cell.h * step;
		}*/
	}

	function getTile(cell, matid) { // eslint-disable-line no-unused-vars
		var mat = materials[matid];
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
				geometry: nexus.board.geoGen.tileGeo,
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
			newHeightStep = newData.tileHeightStep;
		}
		else if (key === 'load-success') {
			newHeightStep = oldData.settings.tileHeightStep;
		}

		if (newHeightStep) resetHeightStep(newHeightStep);
	}

	data.changed.add(dataChanged, this);

	return {
		init: init,
		getTile: getTile
	}
});