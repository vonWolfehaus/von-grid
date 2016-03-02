define('walkableTile', function() {
	var tower = require('tower');
	var nexus = require('nexus');

	/*var material = new THREE.MeshBasicMaterial({
		texture:
	});
	var verts = this.vertices.slice(0);
	verts.push(verts[0].clone());
	var curve = new THREE.CatmullRomCurve3(verts);
	var geo = new THREE.TubeGeometry(curve, 6, 1, 2, true);
	var mesh = new THREE.Mesh(geo, material);
	mesh.scale.x = 0.9;
	mesh.scale.z = 0.9;*/

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