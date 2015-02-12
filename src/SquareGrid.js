/*
	Handles grid cell management (placement math for eg pathfinding, range-finding, etc), exposes generalized interface.
 */

define(['Square'], function(Square) {

var SquareGrid = function(config) {
	var x, z, c;
	if (!config) config = {};
	
	// number of cells (in radius)
	this.size = config.size || 3;
	this.cellSize = config.cellSize || 50;
	this.cellScale = config.cellScale || 1;
	this.type = config.type || Square.FLAT;
	this.rotationIncrement = Square.POINTY;
	// holds the grid position of each cell, to which our meshes are attached to in the Board entity
	this.cells = [];
	// holds the mesh data that is displayed
	this.meshes = null;
	// the grid holds its own Group to manipulate and make it easy to add/remove from the scene
	this.group = new THREE.Group();
	
	this.boxShape = null;
	this.boxGeo = null;
	// this.boxMat = null;
	
	// construct a box-shaped grid, centered
	var half = this.size / 2;
	for (x = -half; x < half; x++) {
		for (z = -half; z < half; z++) {
			c = new THREE.Vector3(x, 0, z + 1);
			c.w = null; // for storing which box is representing this cell
			this.cells.push(c);
		}
	}
	
	this.buildMesh(this.cellSize, config.color);
};

SquareGrid.prototype = {
	
	/*
		Create the geometry to be displayed, and set their positions to the grid.
		You must add this.group to the scene to actually display it after this.
	 */
	buildMesh: function(cellSize, color) {
		var i, box, cell;
		
		this.boxShape = new THREE.Shape();
		this.boxShape.moveTo(0, 0);
		this.boxShape.lineTo(0, cellSize);
		this.boxShape.lineTo(cellSize, cellSize);
		this.boxShape.lineTo(cellSize, 0);
		this.boxShape.lineTo(0, 0);
		
		// this.boxGeo = new THREE.ShapeGeometry(this.boxShape);
		this.boxGeo = new THREE.ExtrudeGeometry(this.boxShape, {
			amount: 10,
			bevelEnabled: true,
			bevelSegments: 1,
			steps: 3,
			bevelSize: 3,
			bevelThickness: 2
		});
		
		// create Square instances and place them on the grid, and add them to the group for easy management
		this.meshes = [];
		for (i = 0; i < this.cells.length; i++) {
			box = new Square(cellSize, this.cellScale, this.boxGeo, color || this.randomizeRGB('100, 100, 100', 20));
			cell = this.cells[i];
			cell.w = box;
			
			box.placeAt(cell);
			
			this.meshes.push(box);
			this.group.add(box.mesh);
		}
		// rotate the group depending on the shape the grid is in
		this.group.rotation.y = this.type;
		
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

return SquareGrid;

});