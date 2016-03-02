/*
	Interface to the grid. Holds data about the visual representation of the cells (tiles).

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
vg.Board = function(grid, finderConfig) {
	if (!grid) throw new Error('You must pass in a grid system for the board to use.');

	this.tileHeightStep = 3;
	this.tiles = [];
	this.grid = null;
	this.overlay = null;
	this.finder = new vg.AStarFinder(finderConfig);
	this.group = new THREE.Object3D(); // can hold all entities, also holds tileGroup, never trashed
	this.tileGroup = null; // only for tiles

	this.setGrid(grid);
};

vg.Board.prototype = {
	constructor: vg.Board,

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

		this.snapTileToGrid(tile);
		tile.position.y = tile.cell.h * this.tileHeightStep;

		this.tileGroup.add(tile.mesh);
		this.grid.add(tile.cell);

		tile.cell.tile = tile;
	},

	removeTile: function(tile) {
		if (!tile) return; // was already removed somewhere
		var i = this.tiles.indexOf(tile);
		this.grid.remove(tile.cell);

		if (i !== -1) this.tiles.splice(i, 1);
		this.tileGroup.remove(tile.mesh);

		tile.dispose();
	},

	removeAllTiles: function() {
		if (!this.tileGroup) return;
		var tiles = this.tileGroup.children;
		for (var i = 0; i < tiles.length; i++) {
			this.tileGroup.remove(tiles[i]);
		}
	},

	getTileAtCell: function(cell) {
		var h = this.grid.cellToHash(cell);
		return cell.tile || (typeof this.grid.cells[h] !== 'undefined' ? this.grid.cells[h].tile : null);
	},

	snapToGrid: function(pos) {
		var cell = this.grid.pixelToCell(pos);
		pos.copy(this.grid.cellToPixel(cell));
	},

	snapTileToGrid: function(tile) {
		if (tile.cell) {
			tile.position.copy(this.grid.cellToPixel(tile.cell));
		}
		else {
			var cell = this.grid.pixelToCell(tile.position);
			tile.position.copy(this.grid.cellToPixel(cell));
		}
		return tile;
	},

	getRandomTile: function() {
		if (this.tiles.length === 0) return null;
		var i = vg.Tools.randomInt(0, this.tiles.length-1);
		return this.tiles[i];
	},

	findPath: function(startTile, endTile, heuristic) {
		return this.finder.findPath(startTile.cell, endTile.cell, heuristic, this.grid);
	},

	setGrid: function(newGrid) {
		this.group.remove(this.tileGroup);
		if (this.grid && newGrid !== this.grid) {
			this.removeAllTiles();
			this.tiles.forEach(function(t) {
				this.grid.remove(t.cell);
				t.dispose();
			}.bind(this));
			this.grid.dispose();
		}
		this.grid = newGrid;
		this.tiles = [];
		this.tileGroup = new THREE.Object3D();
		this.group.add(this.tileGroup);
	},

	// DEPRECATED
	/*generateOverlay: function(size) {
		var mat = new THREE.LineBasicMaterial({
			color: 0x000000,
			opacity: 0.3
		});

		if (this.overlay) {
			this.group.remove(this.overlay);
		}

		this.overlay = new THREE.Object3D();

		this.grid.generateOverlay(this.overlay, mat, size);

		this.group.add(this.overlay);
	},*/

	// DEPRECATED
	/*generateTilemap: function(config) {
		this.reset();

		var tiles = this.grid.generateTiles(config);
		this.tiles = tiles;

		this.tileGroup = new THREE.Object3D();
		for (var i = 0; i < tiles.length; i++) {
			this.tileGroup.add(tiles[i].mesh);
		}

		this.group.add(this.tileGroup);
	},*/

	/*
		Make all the geometry and objects necessary to give 3D form to the current grid.
		It uses ExtrudeGeometry with a slight bevel and creates a few unique materials for variation.

		tileHeight 	[int] 	How tall the tile geometry is
	*/
	makeTiles: function(tileHeight) {
		this.reset();
		this.makeGenerator();

		var i, c, geo, t;
		geo = this.geoGen.makeTileGeo({
			height: tileHeight || 1
		});

		var mats = [];
		for (i = 0; i < 10; i++) {
			mats.push(new THREE.MeshPhongMaterial({
				color: vg.Tools.randomizeRGB('30, 30, 30', 13)
			}));
		}

		for (i in this.grid.cells) {
			c = this.grid.cells[i];
			t = new vg.Tile({
				cell: c,
				geometry: geo,
				material: mats[vg.Tools.randomInt(0, 9)],
				scale: 0.95
			});

			t.position.copy(this.grid.cellToPixel(c));
			t.position.y = c.h * this.tileHeightStep;

			this.tiles.push(t);
			this.tileGroup.add(t.mesh);
		}
	},

	makeOverlay: function(size) {
		var mat = new THREE.LineBasicMaterial({
			color: 0x000000,
			opacity: 0.3
		});
		this.makeGenerator();

		if (this.overlay) {
			this.group.remove(this.overlay);
		}

		this.overlay = new THREE.Object3D();

		this.geoGen.makeOverlay(this.overlay, size, mat);

		this.group.add(this.overlay);
	},

	makeGenerator: function() {
		if (!this.geoGen) {
			switch (this.grid.type) {
				case vg.HEX:
					this.geoGen = new vg.HexGeoGenerator();
					break;
			}
		}
		this.geoGen.init(this.grid.cellSize);
	},

	reset: function() {
		// removes all tiles from the scene, but leaves the grid intact
		this.removeAllTiles();
		if (this.tileGroup) this.group.remove(this.tileGroup);
		this.tileGroup = new THREE.Object3D();
		this.group.add(this.tileGroup);
	}
};
