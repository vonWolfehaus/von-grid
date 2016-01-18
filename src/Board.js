/*
	Interface to the grid. Holds data about the visual representation of the cells (tiles).

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
vg.Board = function(grid, finderConfig) {
	if (!grid) throw new Error('You must pass in a grid system for the board to use.');

	this.tiles = [];
	this.tileGroup = null; // only for tiles

	this.group = new THREE.Object3D(); // can hold all entities, also holds tileGroup, never trashed

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

	addTile: function(tile) {
		var i = this.tiles.indexOf(tile);
		if (i === -1) this.tiles.push(tile);
		else return;

		this.grid.setPositionToCell(tile.position, tile.cell);

		this.tileGroup.add(tile.mesh);
		this.grid.add(tile.cell);

		tile.cell.tile = tile;
	},

	removeTile: function(tile) {
		if (!tile) return; // was already removed somewhere
		var i = this.tiles.indexOf(tile);
		this.grid.remove(tile.cell);

		if (i !== -1) this.tiles.splice(i, 1);
		// this.tileGroup.remove(tile.mesh);

		tile.dispose();
	},

	getTileAtCell: function(cell) {
		var h = this.grid.cellToHash(cell);
		return cell.tile || (typeof this.grid.cells[h] !== 'undefined' ? this.grid.cells[h].tile : null);
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
			this.group.remove(this.tileGroup);
			this.grid.dispose();

			this.tiles.forEach(function(t) {
				t.dispose();
			});
		}
		this.grid = newGrid;
		this.tiles = [];
		this.tileGroup = new THREE.Object3D();
		this.group.add(this.tileGroup);
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
		this.tiles.forEach(function(t) {
			t.dispose();
		});

		var tiles = this.grid.generateTiles(config);
		this.tiles = tiles;

		if (this.tileGroup) this.group.remove(this.tileGroup);
		this.tileGroup = new THREE.Object3D();
		for (var i = 0; i < tiles.length; i++) {
			this.tileGroup.add(tiles[i].mesh)
		}

		this.group.add(this.tileGroup);
	},

	reset: function() {
		// TODO
		if (this.tileGroup) this.group.remove(this.tileGroup);
	}
};
