/*
	Graph of hexagons. Handles grid cell management (placement math for eg pathfinding, range, etc) and grid conversion math.
	[Cube/axial coordinate system](http://www.redblobgames.com/grids/hexagons/), "flat top" version only. Since this is 3D, just rotate your camera for pointy top maps.
	Interface:
		type
		size - number of cells (in radius); only used if the map is generated
		cellSize - size of cells in Threejs space
		cells - a hash so we can have sparse maps
		numCells

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
// 'utils/Loader', 'graphs/Hex', 'utils/Tools'
vg.HexGrid = function(config) {
	config = config || {};
	/*  ______________________________________________
		GRID INTERFACE
	*/
	this.type = vg.HEX;
	this.size = 5; // only used for generated maps
	this.cellSize = typeof config.cellSize === 'undefined' ? 10 : config.cellSize;
	this.cells = {};
	this.numCells = 0;

	/*  ______________________________________________
		PRIVATE
	*/

	this.updateCellSize();

	// pre-computed permutations
	this._directions = [new vg.Cell(+1, -1, 0), new vg.Cell(+1, 0, -1), new vg.Cell(0, +1, -1),
						new vg.Cell(-1, +1, 0), new vg.Cell(-1, 0, +1), new vg.Cell(0, -1, +1)];
	this._diagonals = [new vg.Cell(+2, -1, -1), new vg.Cell(+1, +1, -2), new vg.Cell(-1, +2, -1),
					   new vg.Cell(-2, +1, +1), new vg.Cell(-1, -1, +2), new vg.Cell(+1, -2, +1)];
	// cached objects
	this._hashDelimeter = '.';
	this._list = [];
	this._vec3 = new THREE.Vector3();
	this._cel = new vg.Cell();
	this._conversionVec = new THREE.Vector3();
};

vg.HexGrid.TWO_THIRDS = 2 / 3;

vg.HexGrid.prototype = {
	constructor: vg.HexGrid,
	/*  ________________________________________________________________________
		High-level functions that the Board interfaces with (all grids implement)
	 */

	// grid cell (Hex in cube coordinate space) to position in pixels/world
	cellToPixel: function(cell) {
		this._vec3.x = cell.q * this._cellWidth * 0.75;
		this._vec3.y = cell.h;
		this._vec3.z = -((cell.s - cell.r) * this._cellLength * 0.5);
		return this._vec3;
	},

	pixelToCell: function(pos) {
		// convert a position in world space ("pixels") to cell coordinates
		var q = pos.x * (vg.HexGrid.TWO_THIRDS / this.cellSize);
		var r = ((-pos.x / 3) + (vg.SQRT3/3) * pos.z) / this.cellSize;
		this._cel.set(q, r, -q-r);
		return this._cubeRound(this._cel);
	},

	getCellAt: function(pos) {
		// get the Cell (if any) at the passed world position
		var q = pos.x * (vg.HexGrid.TWO_THIRDS / this.cellSize);
		var r = ((-pos.x / 3) + (vg.SQRT3/3) * pos.z) / this.cellSize;
		this._cel.set(q, r, -q-r);
		this._cubeRound(this._cel);
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
		return cell.q+this._hashDelimeter+cell.r+this._hashDelimeter+cell.s;
	},

	distance: function(cellA, cellB) {
		var d = Math.max(Math.abs(cellA.q - cellB.q), Math.abs(cellA.r - cellB.r), Math.abs(cellA.s - cellB.s));
		d += cellB.h - cellA.h; // include vertical height
		return d;
	},

	updateCellSize: function(newSize) {
		if (this.cellSize === newSize) return;
		newSize = newSize || this.cellSize;
		this.cellSize = newSize;
		this._cellWidth = this.cellSize * 2;
		this._cellLength = (vg.SQRT3 * 0.5) * this._cellWidth;
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

		var x, y, z, c;
		for (x = -this.size; x < this.size+1; x++) {
			for (y = -this.size; y < this.size+1; y++) {
				z = -x-y;
				if (Math.abs(x) <= this.size && Math.abs(y) <= this.size && Math.abs(z) <= this.size) {
					if (this.cells[x+this._hashDelimeter+y+this._hashDelimeter+z]) {
						// don't overwrite cells already there
						continue;
					}
					c = new vg.Cell(x, y, z);
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
		this._conversionVec = null;
	},

	/*
		Load a grid from a parsed json object.
		json = {
			size,
			cellSize,
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
					id: 0
				}
			]
		}
	*/
	load: function(url, cb, scope) {
		var self = this;
		vg.util.getJSON({
			url: url,
			callback: function(json) {
				self.fromJSON(json);
				cb.call(scope || null, json);
			},
			cache: false,
			scope: self
		});
	},

	fromJSON: function(json) {
		var i, c;
		var cells = json.cells;

		this.cells = {};
		this.numCells = 0;

		this.size = json.size;
		this.updateCellSize(json.cellSize);

		for (i = 0; i < cells.length; i++) {
			c = new vg.Cell();
			c.copy(cells[i]);
			this.add(c);
		}
	},

	toJSON: function() {
		var json = {
			size: this.size,
			cellSize: this.cellSize,
			type: this.type,
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
	},

	/*  ________________________________________________________________________
		Hexagon-specific conversion math
		Mostly commented out because they're inlined whenever possible to increase performance.
		They're still here for reference.
	 */

	/*_pixelToAxial: function(pos) {
		var q, r; // = x, y
		q = pos.x * ((2/3) / this.cellSize);
		r = ((-pos.x / 3) + (vg.SQRT3/3) * pos.y) / this.cellSize;
		this._cel.set(q, r, -q-r);
		return this._cubeRound(this._cel);
	},*/

	/*_axialToCube: function(h) {
		return {
			q: h.q,
			r: h.r,
			s: -h.q - h.r
		};
	},*/

	/*_cubeToAxial: function(cell) {
		return cell; // yep
	},*/

	/*_axialToPixel: function(cell) {
		var x, y; // = q, r
		x = cell.q * this._cellWidth * 0.75;
		y = (cell.s - cell.r) * this._cellLength * 0.5;
		return {x: x, y: -y};
	},*/

	/*_hexToPixel: function(h) {
		var x, y; // = q, r
		x = this.cellSize * 1.5 * h.x;
		y = this.cellSize * vg.SQRT3 * (h.y + (h.x * 0.5));
		return {x: x, y: y};
	},*/

	/*_axialRound: function(h) {
		return this._cubeRound(this.axialToCube(h));
	},*/

	_cubeRound: function(h) {
		var rx = Math.round(h.q);
		var ry = Math.round(h.r);
		var rz = Math.round(h.s);

		var xDiff = Math.abs(rx - h.q);
		var yDiff = Math.abs(ry - h.r);
		var zDiff = Math.abs(rz - h.s);

		if (xDiff > yDiff && xDiff > zDiff) {
			rx = -ry-rz;
		}
		else if (yDiff > zDiff) {
			ry = -rx-rz;
		}
		else {
			rz = -rx-ry;
		}

		return this._cel.set(rx, ry, rz);
	},

	/*_cubeDistance: function(a, b) {
		return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
	}*/
};
