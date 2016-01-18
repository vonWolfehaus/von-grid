/*
	Example tile class that constructs its geometry for rendering and holds some gameplay properties.

	@author Corey Birnbaum https://github.com/vonWolfehaus/
*/
vg.HexTile = function(config) {
	config = config || {};
	var settings = {
		size: 10,
		height: 1, // vertical/y extent of tile
		scale: 1, // helpful for offsetting extrusion
		cell: null, // required vg.Cell
		geometry: null, // required threejs geometry
		material: null // not required but it would improve performance significantly
	};
	vg.Tools.merge(true, settings, config);

	if (!settings.cell || !settings.geometry) {
		throw new Error('Missing vg.HexTile configuration');
	}

	this.cell = settings.cell;
	if (this.cell.tile && this.cell.tile !== this) this.cell.tile.dispose(); // remove whatever was there
	this.cell.tile = this;

	this.uniqueID = vg.Tools.generateID();

	this.geometry = settings.geometry;
	this.material = settings.material;
	if (!this.material) {
		this.material = new THREE.MeshPhongMaterial({
			color: vg.Tools.randomizeRGB('30, 30, 30', 13)
		});
	}

	this.objectType = vg.TILE;
	this.entity = null;
	this.userData = {};

	this.selected = false;
	this.highlight = '0x0084cc';

	this.mesh = new THREE.Mesh(this.geometry, this.material);
	this.mesh.userData.structure = this;

	// create references so we can control orientation through this (Hex), instead of drilling down
	this.position = this.mesh.position;
	this.rotation = this.mesh.rotation;

	// rotate it to face "up" (the threejs coordinate space is Y+)
	this.rotation.x = -90 * vg.DEG_TO_RAD;
	this.mesh.scale.set(settings.scale, settings.scale, 1);

	if (this.material.emissive) {
		this._emissive = this.material.emissive.getHex();
	}
	else {
		this._emissive = null;
	}
};

vg.HexTile.prototype = {
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
	/*placeAt: function(cell) {
		this.position.x = cell.q * this.width * 0.75;
		this.position.y = 0;
		this.position.z = (cell.s - cell.r) * this.height * 0.5;
	},*/

	dispose: function() {
		if (this.cell && this.cell.tile) this.cell.tile = null;
		this.cell = null;
		this.position = null;
		this.rotation = null;
		if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
		this.mesh.userData.structure = null;
		this.mesh = null;
		this.material = null;
		this.userData = null;
		this.entity = null;
		this.geometry = null;
		this._emissive = null;
	}
};