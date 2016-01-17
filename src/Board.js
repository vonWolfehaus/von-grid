/*
	Interface to the grid. Holds data about the visual representation of the cells (tiles).

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
vg.Board = function(grid, finderConfig) {
	if (!grid) throw new Error('You must pass in a grid system for the board to use.');

	this.tiles = [];
	this.tileGroup = new THREE.Object3D();

	this.group = new THREE.Object3D();
	this.grid = null;
	this.overlay = null;
	this.finder = new vg.AStarFinder(finderConfig);
	// need to keep a resource cache around, so this Loader does that, use it instead of THREE.ImageUtils
	vg.Loader.init();

	this.setGrid(grid);
};

vg.Board.prototype = {
	setEntityOnTile: function(entity, tile) {
		// snap an entity's position to a tile; merely copies position
		var pos = this.grid.cellToPixel(tile.cell);
		entity.position.copy(pos);
		// adjust for any offset after the entity was set directly onto the tile
		entity.position.y += entity.heightOffset || 0;
		// remove entity from old tile
		if (entity.tile) {
			entity.tile.entity = null;
		}
		// set new situation
		entity.tile = tile;
		tile.entity = entity;
	},

	getRandomTile: function() {
		var i = vg.Tools.randomInt(0, this.tiles.length);
		return this.tiles[i];
	},

	// DEPRECATED
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

	// DEPRECATED
	getRandomCell: function() {
		return this.grid.getRandomCell();
	},

	findPath: function(startTile, endTile, heuristic) {
		return this.finder.findPath(startTile.cell, endTile.cell, heuristic, this.grid);
	},

	setGrid: function(newGrid) {
		if (this.grid) {
			this.group.remove(this.grid.group);
			this.grid.dispose();
		}
		this.grid = newGrid;
		this.group.add(newGrid.group);
	},

	generateOverlay: function(size) {
		var mat = new THREE.LineBasicMaterial({
			color: 0x000000,
			opacity: 0.3
		});

		if (this.overlay) {
			this.group.remove(this.overlay);
		}

		this.overlay = new THREE.Object3D();

		this.grid.generateOverlay(size, this.overlay, mat);

		this.group.add(this.overlay);
	},

	generateTilemap: function(config) {
		var tiles = this.grid.generateTiles(config);
		for (var i = 0; i < tiles.length; i++) {
			this.tiles.push(tiles[i]);
			this.tileGroup.add(tiles[i].mesh)
		}
		this.group.add(this.tileGroup);
	},

	reset: function() {
		// TODO
	}
};
