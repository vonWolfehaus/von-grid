/*
	Handles grid cell management (placement math for eg pathfinding, range-finding, etc), exposes generalized interface.
	
	http://www.redblobgames.com/grids/hexagons/
	Cube and axial coordinate systems
 */

define(['Hex'], function(Hex) {

var HexGrid = function(config) {
	var x, y, z, c;
	if (!config) config = {};
	
	// number of cells (in radius)
	this.size = config.size || 3;
	this.cellSize = config.cellSize || 50;
	this.cellScale = config.cellScale || 1;
	this.type = config.type || Hex.FLAT;
	this.rotationIncrement = Hex.POINTY;
	// holds the grid position of each cell, to which our meshes are attached to in the Board entity
	this.cells = [];
	// holds the mesh data that is displayed
	this.meshes = null;
	// the grid holds its own Group to manipulate and make it easy to add/remove from the scene
	this.group = new THREE.Group();
	
	this.hexShape = null;
	this.hexGeo = null;
	// this.hexMat = null;
	
	// construct a hex-shaped grid
	for (x = -this.size; x < this.size+1; x++) {
		for (y = -this.size; y < this.size+1; y++) {
			z = -x-y;
			if (Math.abs(x) <= this.size && Math.abs(y) <= this.size && Math.abs(z) <= this.size) {
				c = new THREE.Vector3(x, y, z);
				c.w = null; // for storing which hex is representing this cell
				this.cells.push(c);
			}
		}
	}
	
	this.buildMesh(this.cellSize, config.color);
};

HexGrid.prototype = {
	
	/*
		Create the geometry to be displayed, and set their positions to the grid.
		You must add this.group to the scene to actually display it after this.
	 */
	buildMesh: function(cellSize, color) {
		var i, hex, cell;
		var verts = [];
		// create the skeleton of the hex
		for (i = 0; i < 6; i++) {
			verts.push(Hex.createVert(Hex.FLAT, cellSize, i));
		}
		// copy the verts into a shape for the geometry to use
		this.hexShape = new THREE.Shape();
		this.hexShape.moveTo(verts[0].x, verts[0].y);
		for (i = 1; i < 6; i++) {
			this.hexShape.lineTo(verts[i].x, verts[i].y);
		}
		this.hexShape.lineTo(verts[0].x, verts[0].y);
		
		// this.hexGeo = new THREE.ShapeGeometry(this.hexShape);
		this.hexGeo = new THREE.ExtrudeGeometry(this.hexShape, {
			amount: 10,
			bevelEnabled: true,
			bevelSegments: 1,
			steps: 3,
			bevelSize: 3,
			bevelThickness: 2
		});
		
		// create Hex instances and place them on the grid, and add them to the group for easy management
		this.meshes = [];
		for (i = 0; i < this.cells.length; i++) {
			hex = new Hex(cellSize, this.cellScale, this.hexGeo, color || this.randomizeRGB('100, 100, 100', 200));
			cell = this.cells[i];
			cell.w = hex;
			
			hex.placeAt(cell);
			
			this.meshes.push(hex);
			this.group.add(hex.mesh);
		}
		// rotate the group depending on the shape the grid is in
		this.group.rotation.y = this.type - (30 * 0.0174532925);
		
		return this.meshes;
	},
	
	randomizeRGB: function(base, range) {
		var rgb = base.split(',');
		var color = 'rgb(';
		var i, c;
		range = this.randomInt(range);
		for (i = 0; i < 3; i++ ) {
			c = parseInt(rgb[i]) + range;
			if (c < 0) c = 0;
			else if (c > 255) c = 255;
			color += c + ',';
		}
		color = color.substring(0, color.length-1);
		color += ')';
		return color;
	},
	
	randomInt: function(min, max) {
		if (arguments.length === 1) {
			return (Math.random() * min) - (min * 0.5) | 0;
		}
		return (Math.random() * (max - min + 1) + min) | 0;
	}
};

return HexGrid;

});