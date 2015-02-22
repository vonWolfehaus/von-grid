/*
	Handles grid cell management (placement math for eg pathfinding, range-finding, etc), exposes generalized interface.
 */

define(['Square', 'utils/Tools'], function(Square, Tools) {

var SquareGrid = function(config) {
	var x, z, c;
	if (!config) config = {};
	var gridSettings = {
		width: 5,
		height: 5,
		type: Square.FLAT,
		cellSize: 10,
		cellScale: 0.95,
		extrudeSettings: {
			amount: 1,
			bevelEnabled: true,
			bevelSegments: 1,
			steps: 1,
			bevelSize: 0.5,
			bevelThickness: 0.5
		}
	};
	
	Tools.merge(true, gridSettings, config);
	
	this.width = gridSettings.width;
	this.height = gridSettings.height;
	this.cellSize = gridSettings.cellSize;
	this.cellScale = gridSettings.cellScale;
	this.type = gridSettings.type || Square.FLAT;
	
	this.rotationIncrement = Square.POINTY;
	// holds the grid position of each cell, to which our meshes are attached to in the Board entity
	this.cells = [];
	// holds the mesh data that is displayed
	this.meshes = null;
	this.boxShape = null;
	this.boxGeo = null;
	this.boxMat = gridSettings.material;
	
	// the grid holds its own Group to manipulate and make it easy to add/remove from the scene
	this.group = new THREE.Group();
	
	// construct a box-shaped grid, centered
	var halfW = this.width / 2;
	var halfH = this.height / 2;
	for (x = -halfW; x < halfW; x++) {
		for (z = -halfH; z < halfH; z++) {
			c = new THREE.Vector3(x, 0, z + 1);
			c.w = null; // for storing which box is representing this cell
			this.cells.push(c);
		}
	}
	
	var i, box, cell;
	this.boxShape = new THREE.Shape();
	this.boxShape.moveTo(0, 0);
	this.boxShape.lineTo(0, this.cellSize);
	this.boxShape.lineTo(this.cellSize, this.cellSize);
	this.boxShape.lineTo(this.cellSize, 0);
	this.boxShape.lineTo(0, 0);
	
	// this.boxGeo = new THREE.ShapeGeometry(this.boxShape);
	this.boxGeo = new THREE.ExtrudeGeometry(this.boxShape, gridSettings.extrudeSettings);
	
	// create Square instances and place them on the grid, and add them to the group for easy management
	this.meshes = [];
	for (i = 0; i < this.cells.length; i++) {
		box = new Square(this.cellSize, this.cellScale, this.boxGeo, this.boxMat);
		cell = this.cells[i];
		cell.w = box;
		box.depth = gridSettings.extrudeSettings.amount;
		
		box.placeAt(cell);
		
		this.meshes.push(box);
		this.group.add(box.view);
	}
	// rotate the group depending on the shape the grid is in
	this.group.rotation.y = this.type;
};

SquareGrid.prototype = {
	/*
		High-level functions that the Board interfaces with (all grids implement).
	 */
	
	// grid cell (Hex in this case) to position in pixels/world
	cellToPixel: function(c, pos) {
		pos.x = c.position.x + (this.cellSize/2);
		pos.y = c.depth;
		pos.z = c.position.z - (this.cellSize/2);
	},
	
	/*
		Square-specific conversion math.
	 */
};

return SquareGrid;

});