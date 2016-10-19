/*
	Graph of squares. Handles grid cell management (placement math for eg pathfinding, range, etc) and grid conversion math.
	Interface:
		type
		size - number of cells (in radius); only used if the map is generated
		cellSize - size of cells in Threejs space
		cells - a hash so we can have sparse maps
		numCells

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
vg.SqrGrid = function(config) {
	config = config || {};
	/*  ______________________________________________
		GRID INTERFACE:
	*/
	this.type = vg.SQR;
	this.size = typeof config.size === 'undefined' ? 5 : config.size; // only used for generated maps
	this.cellSize = typeof config.cellSize === 'undefined' ? 10 : config.cellSize;
	this.cells = {};
	this.numCells = 0;

	/*  ______________________________________________
		PRIVATE
	*/

	this._hashDelimeter = '.';
	// pre-computed permutations
	this._directions = [new vg.Cell(+1, 0, 0), new vg.Cell(0, -1, 0),
						new vg.Cell(-1, 0, 0), new vg.Cell(0, +1, 0)];
	this._diagonals = [new vg.Cell(-1, -1, 0), new vg.Cell(-1, +1, 0),
					   new vg.Cell(+1, +1, 0), new vg.Cell(+1, -1, 0)];
	// cached objects
	this._list = [];
	this._vec3 = new THREE.Vector3();
	this._cel = new vg.Cell();
};

vg.SqrGrid.prototype = {
	constructor: vg.SqrGrid,
	/*
		________________________________________________________________________
		High-level functions that the Board interfaces with (all grids implement)
	 */

	cellToPixel: function(cell) {
		this._vec3.x = cell.q * this.cellSize;
		this._vec3.y = cell.h;
		this._vec3.z = cell.r * this.cellSize;
		return this._vec3;
	},

	pixelToCell: function(pos) {
		var q = Math.round(pos.x / this.cellSize);
		var r = Math.round(pos.z / this.cellSize);
		return this._cel.set(q, r, 0);
	},

	getCellAt: function(pos) {
		var q = Math.round(pos.x / this.cellSize);
		var r = Math.round(pos.z / this.cellSize);
		this._cel.set(q, r);
		return this.cells[this.cellToHash(this._cel)];
	},

	getNeighbors: function(cell, diagonal, filter) {
		// always returns an array
		var i, n, l = this._directions.length;
		this._list.length = 0;
		for (i = 0; i < l; i++) {
			this._cel.copy(cell);
			this._cel.add(this._directions[i]);
			n = this.cells[this.cellToHash(this._cel)];
			if (!n || (filter && !filter(cell, n))) {
				continue;
			}
			this._list.push(n);
		}
		if (diagonal) {
			for (i = 0; i < l; i++) {
				this._cel.copy(cell);
				this._cel.add(this._diagonals[i]);
				n = this.cells[this.cellToHash(this._cel)];
				if (!n || (filter && !filter(cell, n))) {
					continue;
				}
				this._list.push(n);
			}
		}
		return this._list;
	},

	getRandomCell: function() {
		var c, i = 0, x = vg.util.randomInt(0, this.numCells);
		for (c in this.cells) {
			if (i === x) {
				return this.cells[c];
			}
			i++;
		}
		return this.cells[c];
	},

	cellToHash: function(cell) {
		return cell.q+this._hashDelimeter+cell.r; // s is not used in a square grid
	},

	distance: function(cellA, cellB) {
		var d = Math.max(Math.abs(cellA.q - cellB.q), Math.abs(cellA.r - cellB.r));
		d += cellB.h - cellA.h; // include vertical size
		return d;
	},

	updateCellSize: function(newSize) {
		this.cellSize = newSize;
	},

	clearPath: function() {
		var i, c;
		for (i in this.cells) {
			c = this.cells[i];
			c._calcCost = 0;
			c._priority = 0;
			c._parent = null;
			c._visited = false;
		}
	},

	traverse: function(cb) {
		var i;
		for (i in this.cells) {
			cb(this.cells[i]);
		}
	},

	// create a flat, hexagon-shaped grid
	generate: function(config) {
		config = config || {};
		this.size = typeof config.size === 'undefined' ? this.size : config.size;
		if (config.overwrite) {
			this.removeAll();
		}
		if (config.cellSize) {
			this.updateCellSize(config.cellSize);
		}

		var x, y, c;
		for (x = -this.size; x < this.size+1; x++) {
			for (y = -this.size; y < this.size+1; y++) {
				if (Math.abs(x) <= this.size && Math.abs(y) <= this.size) {
					if (this.cells[x+this._hashDelimeter+y]) {
						// don't overwrite cells already there
						continue;
					}
					c = new vg.Cell(x, y, 0);
					this.add(c);
				}
			}
		}
	},

	add: function(cell) {
		var h = this.cellToHash(cell);
		if (this.cells[h]) {
			// console.warn('A cell already exists there');
			return this.cells[h];
		}
		this.cells[h] = cell;
		this.numCells++;

		return cell;
	},

	remove: function(cell) {
		var h = this.cellToHash(cell);
		if (this.cells[h]) {
			delete this.cells[h];
			this.numCells--;
		}
	},

	removeAll: function() {
		var c, o;
		for (c in this.cells) {
			if (this.cells.hasOwnProperty(c)) {
				o = this.cells[c];
				o.userData = null;
				o.tile = null;
				o._parent = null;
				delete this.cells[c];
			}
		}
		this.numCells = 0;
		this.cells = {};
	},

	dispose: function() {
		this.cells = null;
		this.numCells = 0;
		this._list = null;
		this._vec3 = null;
	},

	/*
		Load a grid from a parsed json object.
		json = {
			size,
			cellSize,
			heightStep,
			type,
			cells: [
				{
					"q": -2,
					"r": -2,
					"s": 4,
					"h": 1,
					"walkable": true,
					"materialId": 0,
					"userData": {}
				},
				...
			],
			materials: [
				{
					id: 0,
					map: 'path/to/diffuse.jpg',
					...
				}
			]
		}
	*/
	load: function(url, callback, scope) {
		vg.util.getJSON({
			url: url,
			callback: function(json) {
				this.fromJSON(json);
				callback.call(scope || null, json);
			},
			cache: false,
			scope: this
		});
	},

	fromJSON: function(json) {
		var i, c;
		var cells = json.cells;

		this.cells = {};
		this.numCells = 0;

		this.size = json.size;
		this.cellSize = json.cellSize;

		for (i = 0; i < cells.length; i++) {
			c = new vg.Cell();
			c.copy(cells[i]);
			this.add(c);
		}
	},

	toJSON: function() {
		var json = {
			size: this.size,
			type: this.type,
			cellSize: this.cellSize,
			materials: [ // add at least one tile type
				{
					id: 0
				}
			]
		};
		var cells = [];
		var c, k;

		for (k in this.cells) {
			c = this.cells[k];
			cells.push({
				q: c.q,
				r: c.r,
				s: c.s,
				h: c.h,
				walkable: c.walkable,
				materialId: c.materialId,
				userData: c.userData
			});
		}
		json.cells = cells;

		return json;
	}
};

vg.SqrGrid.prototype.constructor = vg.SqrGrid;
