/*
	Grid cell that constructs its geometry for rendering and holds gameplay properties.
*/
// 'utils/Tools'
vg.Hex = function(size, scale, geometry, material) {
	this.material = material;
	this.geo = geometry;

	this.size = size;
	this.width = this.size * 2;
	this.height = Math.sqrt(3)/2 * this.width;
	this.depth = size;
	this.uniqueID = vg.Tools.generateID();
	this.objectType = vg.CEL;
	this.gridPos = null; // reference to cube coordinate (a Vec3) in grid that this view represents
	this.entity = null;
	this.userData = {};

	this.selected = false;
	this.highlight = '0x222266';

	// path options
	this.walkable = true;
	// used by pathfinder, overwritten at runtime, don't touch
	this.calcCost = 0;
	this.priority = 0;
	this.visited = false;
	this.parent = null;

	var color = vg.Tools.randomizeRGB('30, 30, 30', 10);

	if (!this.material) {
		this.material = new THREE.MeshPhongMaterial({ // shiny!
			color: color,
			// ambient: color
		});
	}

	this.mesh = new THREE.Mesh(geometry, this.material);
	/*this.mesh = new THREE.Line(this.shape.createPointsGeometry(), new THREE.LineBasicMaterial({
		color: this.color,
		linewidth: 3 // this doesn't work on windows because ANGLE doesn't implement it (the WebGL->DirectX translator)
	}));*/

	this.mesh.userData.structure = this;

	// create references so we can control orientation through this (Hex), instead of drilling down
	this.position = this.mesh.position;
	this.rotation = this.mesh.rotation;
	// rotate it to face "up" (Y+)
	this.rotation.x = -90 * vg.DEG_TO_RAD;
	this.mesh.scale.set(scale, scale, scale);

	if (this.material.emissive) {
		this._emissive = this.material.emissive.getHex();
	}
	else {
		this._emissive = null;
	}
};

vg.Hex.FLAT = 0;
vg.Hex.POINTY = 30 * vg.DEG_TO_RAD;

vg.Hex.prototype = {
	select: function() {
		if (this.material.emissive) {
			this.material.emissive.setHex(this.highlight);
		}
		this.selected = true;
		return this;
	},

	deselect: function() {
		if (this._emissive !== null && this.material.emissive) {
			this.material.emissive.setHex(this._emissive);
		}
		this.selected = false;
		return this;
	},

	// Hexagon cells are in cube coordinates; this is a modified HexGrid.hexToPixel
	placeAt: function(cell) {
		this.position.x = cell.x * this.width * 0.75;
		this.position.y = 0;
		this.position.z = (cell.z - cell.y) * this.height * 0.5;
		this.gridPos = cell;
		cell.w = this;
	},

	dispose: function() {
		// TODO
	}
};