/*
	Interface to the grid. Holds data about what's occupying cells, and a general interface from entities to cells.
 */

define(['utils/Loader', 'pathing/AStarFinder'], function(Loader, AStarFinder) {

var Board = function(grid, finderConfig) {
	if (!grid) throw new Error('You must pass in a grid system for the board to use.');
	
	// this.pieces = []; // haven't found a use for this yet
	this.group = new THREE.Group();
	this.grid = null;
	this.finder = new AStarFinder(finderConfig);
	// need to keep a resource cache around, so this Loader does that, use it instead of THREE.ImageUtils
	Loader.init();
	
	this.setGrid(grid);
};

// useful enums for type checking. change to whatever fits your game. these are just examples
Board.Cell = 'cell';
Board.Entity = 'entity'; // dynamic things
Board.Structure = 'structure'; // static things

Board.prototype = {
	
	// smoothly animate a piece from its current position to the cell
	moveEntityToCell: function(entity, cell) {
		
	},
	
	// immediately snap a piece to a cell; doesn't have to be a member of the board, merely copies position
	placeEntityAtCell: function(entity, cell) {
		this.grid.cellToPixel(cell, entity.position);
		entity.position.y += entity.offsetY;
		// remove entity from old cell
		if (entity.cell) {
			entity.cell.entity = null;
		}
		// set new situation
		entity.cell = cell;
		cell.entity = entity;
	},
	
	findPath: function(startCell, endCell) {
		return this.finder.findPath(startCell, endCell, this.grid);
	},
	
	getRandomCell: function() {
		return this.grid.getRandomCell();
	},
	
	// rotate the board either left (-1, default) or right (1)
	rotate: function(direction, animate) {
		animate = animate || false;
		if (animate) {
			// todo?
		}
		else {
			this.group.rotation.y += (this.grid.rotationIncrement * (direction || -1)) * 2;
		}
	},
	
	// i think it's better to grab cells from the grid, then check the entities on them instead
	/*addPieceAt: function(entity, cell) {
		this.pieces.push(entity);
		
		entity.disable();
		entity.container = this.group;
		entity.placeEntityAtCell(entity, cell);
	},
	
	removePiece: function(entity) {
		var i = this.pieces.indexOf(entity);
		this.pieces.splice(i, 1);
		
		entity.disable();
	},
	
	clear: function() {
		this.pieces.length = 0;
		// does not dig into children of children because they'll be removed when their parent is removed anyway
		this.group.children.length = 0;
	},*/
	
	setGrid: function(newGrid) {
		if (this.grid) {
			this.group.remove(this.grid.group);
		}
		this.grid = newGrid;
		this.group.add(newGrid.group);
	}
};

return Board;

});