/*
	Grid cell that constructs its geometry for rendering and holds gameplay properties.
 */

define(['utils/Tools'], function(Tools) {

var Hex = function(size, scale, geometry, material) {
	this.type = Hex.FLAT;
	this.material = material;
	this.geo = geometry;
	
	this.size = size;
	this.depth = size;
	this.uniqueID = Tools.generateID();
	this.objectType = 'cell'; // Board.Cell
	this.gridPos = null; // reference to cube coordinate (a Vec3) in grid that this view represents
	this.entity = null;
	
	if (this.type === Hex.FLAT) {
		this.width = this.size * 2;
		this.height = Math.sqrt(3)/2 * this.width;
	}
	else {
		this.height = this.size * 2;
		this.width = Math.sqrt(3)/2 * this.height;
	}
	
	this.selected = false;
	this.highlight = '0x222266';

	this.walkable = true; // path option
	// used by pathfinder, overwritten at runtime, don't touch
	this.calcCost = 0;
	this.priority = 0;
	this.visited = false;
	this.parent = null;
	
	var color = Tools.randomizeRGB('30, 30, 30', 10);
	
	if (!this.material) {
		this.material = new THREE.MeshPhongMaterial({ // shiny!
			color: color,
			ambient: color
		});
	}
	
	this.view = new THREE.Mesh(geometry, this.material);
	/*this.view = new THREE.Line(this.shape.createPointsGeometry(), new THREE.LineBasicMaterial({
		color: this.color,
		linewidth: 3 // this doesn't work on windows because ANGLE doesn't implement it (the WebGL->DirectX translator)
	}));*/

	this.view.userData.structure = this;
	
	// create references so we can control orientation through this (Hex), instead of drilling down
	this.position = this.view.position;
	this.rotation = this.view.rotation;
	// rotate it to face "up" (Y+)
	this.rotation.x = -90 * Tools.DEG_TO_RAD;
	this.view.scale.set(scale, scale, scale);
	
	this._emissive = this.material.emissive.getHex();
};

Hex.FLAT = 0;
Hex.POINTY = 30 * Tools.DEG_TO_RAD;

Hex.prototype = {
	select: function() {
		this.material.emissive.setHex(this.highlight);
		this.selected = true;
	},
	
	deselect: function() {
		this.material.emissive.setHex(this._emissive);
		this.selected = false;
	},
	
	// Hexagon cells are in cube coordinates
	placeAt: function(cell) {
		if (this.type === Hex.FLAT) {
			this.position.x = cell.x * this.width * 0.75;
			this.position.z = (cell.z - cell.y) * this.height * 0.5;
		}
		else {
			this.position.x = cube.x * this.width * 0.5;
			this.position.z = (cell.z - cell.y) * this.height * 0.75;
		}
		this.position.y = 0;
		this.gridPos = cell;
	}
};

return Hex;

});