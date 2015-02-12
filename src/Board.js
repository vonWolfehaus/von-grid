/*
	Interface to the grid.
 */

define(function() {

var Board = function(grid, mouse) {
	if (!grid) throw new Error('You must pass in a grid for the board to use.');
	
	this.grid = grid;
	this.pieces = []; // change to LinkedList when integrated into engine
	this.group = new THREE.Group();
	this.group.add(this.grid.group);
	
	this.activePiece = null; // any piece sitting on the active cell, or just the selected piece (whichever suits the game)
	this.activeCell = null; // our custom structure that holds the cell geo
	
	this.mouse = mouse;
	
	var self = this;
	this.mouse.signal.add(this.onMouse, this);
};

Board.prototype = {
	
	// smoothly animate a piece from its current position to the cell
	movePieceTo: function(entity, cell) {
		
	},
	
	// immediately a piece to a cell; doesn't have to be a member of the board
	placePieceAt: function(entity, cell) {
		
	},
	
	// rotate the board either left (-1, default) or right (1)
	rotate: function(direction) {
		this.grid.group.rotation.y += (this.grid.rotationIncrement * (direction || -1)) * 2;
		// todo: animate it
	},
	
	addPieceAt: function(entity, cell) {
		this.pieces.push(entity);
		this.group.add(entity.view.mesh);
	},
	
	removePiece: function(entity) {
		var i = this.pieces.indexOf(entity);
		this.pieces.splice(i, 1);
		this.group.remove(entity.view.mesh);
	},
	
	clear: function() {
		this.pieces.length = 0;
		// does not dig into children of children because they'll be removed when their parent is removed anyway
		this.group.children.length = 0;
	},
	
	swapGrid: function(newGrid) {
		this.group.remove(this.grid);
		this.grid = newGrid;
		this.group.add(newGrid.group);
	},
	
	onMouse: function(type, mesh) {
		if (type !== 'click') return;
		if (mesh) {
			this.activeCell = mesh.userData.structure;
			// console.log(this.activeCell);
			// this.pickedObject.currentHex = this.pickedObject.material.emissive.getHex();
			// this.pickedObject.material.emissive.setHex(0xff0000);
		}
		else {
			// obj.material.emissive.setHex(this.pickedObject.currentHex);
		}
	}
};

return Board;

});