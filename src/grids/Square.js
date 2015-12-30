/*
	Grid cell that constructs its geometry for rendering and holds gameplay properties.
 */
// 'utils/Tools'
hg.Square = function(size, scale, geometry, material) {
	this.type = hg.Square.FLAT;
	this.material = material;
	this.geo = geometry;

	this.size = size;
	this.depth = size;
	this.uniqueID = hg.Tools.generateID();
	this.objectType = hg.CEL;
	this.gridPos = null; // reference to cell object (a Vec3) in grid that this view represents
	this.entity = null; // reference to cell object in grid that this view represents

	this.width = size;
	this.height = size; // horizontal

	this.selected = false;
	this.highlight = '0x222266';

	this.walkable = true; // path option
	// used by pathfinder, overwritten at runtime, don't touch
	this.calcCost = 0;
	this.priority = 0;
	this.visited = false;
	this.parent = null;

	var color = hg.Tools.randomizeRGB('30, 30, 30', 10);

	if (!this.material) {
		this.material = new THREE.MeshPhongMaterial({
			color: color,
			// ambient: color
		});
	}

	this.mesh = new THREE.Mesh(geometry, this.material);
	/*this.mesh = new THREE.Line(this.shape.createPointsGeometry(), new THREE.LineBasicMaterial({
		color: this.color,
		linewidth: 3 // this doesn't work on windows because ANGLE doesn't implement it (the WebGL driver)
	}));*/

	this.mesh.userData.structure = this;

	// create references so we can control orientation through this (Square), instead of drilling down
	this.position = this.mesh.position;
	this.rotation = this.mesh.rotation;
	// rotate it to face "up" (Y+)
	this.rotation.x = -90 * 0.0174532925;
	this.mesh.scale.set(scale, scale, scale);

	this._emissive = this.material.emissive.getHex();
};

hg.Square.FLAT = 0;
hg.Square.POINTY = 45 * 0.0174532925;

hg.Square.prototype = {
	select: function() {
		this.material.emissive.setHex(this.highlight);
		this.selected = true;
	},

	deselect: function() {
		this.material.emissive.setHex(this._emissive);
		this.selected = false;
	},

	placeAt: function(cell) {
		this.position.x = cell.x * this.size/* - (this.size / 2)*/;
		this.position.y = 0;
		this.position.z = cell.z * this.size/* - (this.size / 2)*/;
		this.gridPos = cell;
	}
};
