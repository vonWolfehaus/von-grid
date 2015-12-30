/*
	Graph of hexagons. Handles grid cell management (placement math for eg pathfinding, range, etc) and grid conversion math.
	[Cube coordinate system](http://www.redblobgames.com/grids/hexagons/).
	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
// 'utils/Loader', 'graphs/Hex', 'utils/Tools'
hg.HexGrid = function(config) {
	if (!config) config = {};
	var gridSettings = {
		rings: 5, // creates a hexagon-shaped grid of this size
		url: null, // loads in map JSON data for arbitrary/sparse maps created with the editor
		// depthStep: 2,
		cellSize: 10,
		cellDepth: 1,
		cellScale: 0.95,
		extrudeSettings: {
			amount: 1, // this gets overwritten, use cellDepth instead
			bevelEnabled: true,
			bevelSegments: 1,
			steps: 1,
			bevelSize: 0.5,
			bevelThickness: 0.5
		}
	};

	hg.Tools.merge(true, gridSettings, config);

	// number of cells (in radius); only used if the map is generated
	this.size = gridSettings.rings;
	this.cellSize = gridSettings.cellSize;
	this.cellScale = gridSettings.cellScale;

	this.extrudeSettings = gridSettings.extrudeSettings;
	this.extrudeSettings.amount = gridSettings.cellDepth;

	this.rotationIncrement = 30 * hg.DEG_TO_RAD;
	// holds the grid position of each cell in cube coordinates, to which our meshes are attached to in the Board entity
	this.cells = {}; // it's a hash so we can have sparse maps
	this.numCells = 0;
	// holds the Hex instances data that is displayed; still working on a decent naming convention, sorry
	this.meshes = [];

	this.hexShape = null;
	this.hexWidth = 0;
	this.hexHeight = 0;
	this.hashDelimeter = '.';

	// the grid holds its own Object3D to manipulate and make it easy to add/remove from the scene
	this.group = new THREE.Object3D();

	// create base shape used for building geometry
	var i, verts = [];
	// create the skeleton of the hex
	for (i = 0; i < 6; i++) {
		verts.push(this.createVert(i, hg.Hex.FLAT));
	}
	// copy the verts into a shape for the geometry to use
	this.hexShape = new THREE.Shape();
	this.hexShape.moveTo(verts[0].x, verts[0].y);
	for (i = 1; i < 6; i++) {
		this.hexShape.lineTo(verts[i].x, verts[i].y);
	}
	this.hexShape.lineTo(verts[0].x, verts[0].y);

	// pre-computed permutations
	this._directions = [new THREE.Vector3(+1, -1, 0), new THREE.Vector3(+1, 0, -1), new THREE.Vector3(0, +1, -1),
						new THREE.Vector3(-1, +1, 0), new THREE.Vector3(-1, 0, +1), new THREE.Vector3(0, -1, +1)];
	this._diagonals = [new THREE.Vector3(+2, -1, -1), new THREE.Vector3(+1, +1, -2), new THREE.Vector3(-1, +2, -1),
						new THREE.Vector3(-2, +1, +1), new THREE.Vector3(-1, -1, +2), new THREE.Vector3(+1, -2, +1)];
	// cached objects
	this._list = [];
	this._vec3 = new THREE.Vector3();
	this._conversionVec = new THREE.Vector3();
	this._geoCache = [];
	this._matCache = [];

	// build the grid depending on what was passed in
	if (gridSettings.url) {
		hg.Tools.getJSON(gridSettings.url, this.onLoad, this);
	}
	else {
		this.generate();
	}

	var c = this.getRandomCell();
	this.hexWidth = c.width;
	this.hexHeight = c.height;
};

hg.HexGrid.SQRT3 = Math.sqrt(3); // used often in conversions

hg.HexGrid.prototype = {
	/*
		________________________________________________________________________
		High-level functions that the Board interfaces with (all grids implement)
	 */

	// grid cell (Hex in this case) to position in pixels/world
	cellToPixel: function(c, pos) {
		var p = this.hexToPixel(c.gridPos);
		pos.x = p.x;
		pos.y = c.depth;
		pos.z = -p.y;
	},

	// "flat" version only; if you want a pointy version, rotate the camera by 30 degrees
	pixelToCell: function(pos) {
		var q = pos.x * ((2/3) / this.cellSize);
		var r = ((-pos.x / 3) + (hg.HexGrid.SQRT3/3) * pos.y) / this.cellSize;
		this._vec3.set(q, r, 0);
		return this.hexRound(this._vec3);
	},

	// always returns an array
	getNeighbors: function(hex, diagonal, filter) {
		var i, c, l = this._directions.length;
		this._list.length = 0;
		for (i = 0; i < l; i++) {
			this._vec3.copy(hex.gridPos);
			this._vec3.add(this._directions[i]);
			c = this.cells[this.cubeToHash(this._vec3)];
			if (!c || (filter && !filter(hex, c.w))) {
				continue;
			}
			this._list.push(c.w);
		}
		if (diagonal) {
			for (i = 0; i < l; i++) {
				this._vec3.copy(hex.gridPos);
				this._vec3.add(this._diagonals[i]);
				c = this.cells[this.cubeToHash(this._vec3)];
				if (!c || (filter && !filter(hex, c.w))) {
					continue;
				}
				this._list.push(c.w);
			}
		}
		return this._list;
	},

	distance: function(cellA, cellB) {
		var d = this.cubeDistance(cellA.gridPos, cellB.gridPos);
		d += cellB.depth - cellA.depth;
		return d;
	},

	clearPath: function() {
		var i, c;
		for (i in this.cells) {
			c = this.cells[i].w;
			c.calcCost = 0;
			c.priority = 0;
			c.parent = null;
			c.visited = false;
		}
	},

	traverse: function(cb) {
		var i;
		for (i in this.cells) {
			cb(this.cells[i].w);
		}
	},

	getRandomCell: function() {
		var c, i = 0, x = hg.Tools.randomInt(0, this.numCells);
		for (c in this.cells) {
			if (i === x) {
				return this.cells[c].w;
			}
			i++;
		}
		return this.cells[c].w;
	},

	// handy for selection hinting
	generateCellView: function(height, material) {
		height = Math.abs(height) || this.extrudeSettings.amount;
		this.extrudeSettings.amount = height;
		var geo = this._geoCache[height];
		if (!geo) {
			geo = new THREE.ExtrudeGeometry(this.hexShape, this.extrudeSettings);
			this._geoCache[height] = geo;
		}
		var hex = new hg.Hex(this.cellSize, this.cellScale, geo, material);
		hex.depth = height;
		return hex;
	},

	// make a new cell for the hex
	add: function(gridPos, hex) {
		var c = new THREE.Vector3();
		c.copy(gridPos);
		if (!hex) {
			hex = this.generateCellView();
		}
		c.w = hex;
		hex.placeAt(c);
		this.cells[this.cubeToHash(c)] = c;

		this.meshes.push(hex);
		this.group.add(hex.mesh);

		this.numCells++;
		return hex;
	},

	remove: function(hex) {
		delete this.cells[this.cubeToHash(hex.gridPos)];
		hex.gridPos.w = null;

		var i = this.meshes.indexOf(hex);
		if (i !== -1) {
			this.meshes.splice(i, 1);
		}
		this.group.remove(hex.mesh);

		this.numCells--;
		hex.dispose();
	},

	dispose: function() {
		// TODO
	},

	/*
		________________________________________________________________________
		Hexagon-specific conversion math
	 */

	cubeToHash: function(cube) {
		return cube.x+this.hashDelimeter+cube.y+this.hashDelimeter+cube.z;
	},

	/*pixelToAxial: function(x, y) {
		var q = (x * (hg.HexGrid.SQRT3 / 3) - (y / 3)) / this.cellSize;
		var r = y * (2 / 3) / this.cellSize;
		// var axial = this.hexRound(this._conversionVec.set(q, r, 0));
		var axial = this.hexRound({x: q, y: r});
		return this.hexToCube(axial);
	},*/

	hexToCube: function(h) {
		return {x: h.x, y: h.y, z: -h.x - h.y};
		// return this._conversionVec.set(h.x, h.y, -h.x - h.y);
	},

	cubeToHex: function(h) {
		return h; // {x: h.x, y: h.y};
	},

	hexToPixel: function(h) {
		var x, y;
		x = h.x * this.hexWidth * 0.75;
		y = (h.z - h.y) * this.hexHeight * 0.5;
		return {x: x, y: -y};
		// return this._conversionVec.set(x, y, 0);
	},

	/*axialToPixel: function(cube) {
		var xOffset = cube.z * (this.hexWidth / 2);
		var xCoord = (cube.x * this.hexWidth) + xOffset;
		var zCoord = cube.z * this.hexHeight * 0.75;
		return {x: xCoord, y: 0, z: zCoord};
		// return this._conversionVec.set(xCoord, 0, zCoord);
	},*/

	hexRound: function(h) {
		return /*this.cubeToHex(*/this.cubeRound(this.hexToCube(h));
	},

	cubeRound: function(h) {
		var rx = Math.round(h.x);
		var ry = Math.round(h.y);
		var rz = Math.round(h.z);

		var xDiff = Math.abs(rx - h.x);
		var yDiff = Math.abs(ry - h.y);
		var zDiff = Math.abs(rz - h.z);

		if (xDiff > yDiff && xDiff > zDiff) {
			rx = -ry-rz;
		}
		else if (yDiff > zDiff) {
			ry = -rx-rz;
		}
		else {
			rz = -rx-ry;
		}

		// return {x: rx, y: ry, z: rz};
		return this._conversionVec.set(rx, ry, rz);
	},

	hexDistance: function(a, b) {
		var ac = this.hexToCube(a);
		var bc = this.hexToCube(b);
		return this.cubeDistance(ac, bc);
	},

	cubeDistance: function(a, b) {
		return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
	},

	createVert: function(i, type) {
		var angle = ((2 * Math.PI) / 6) * i;
		angle += type; // 0 if flat-topped, or 30deg if pointy
		return new THREE.Vector3((this.cellSize * Math.cos(angle)), (this.cellSize * Math.sin(angle)), 0);
	},

	// create a flat, hexagon-shaped grid.
	generate: function() {
		var x, y, z, c;
		c = new THREE.Vector3();

		this.meshes = [];

		for (x = -this.size; x < this.size+1; x++) {
			for (y = -this.size; y < this.size+1; y++) {
				z = -x-y;
				if (Math.abs(x) <= this.size && Math.abs(y) <= this.size && Math.abs(z) <= this.size) {
					c.set(x, y, z);
					this.add(c);
				}
			}
		}
	},

	/* load a grid from a parsed json object.
		xyz are hex cube coordinates
		json = {
			cells: [
				{x, y, z, depth, matCacheId, customData},
				...
			],
			materials: [
				{
					cache_id: 0,
					type: 'MeshLambertMaterial',
					color, ambient, emissive, reflectivity, refractionRatio, wrapAround,
					imgURL: url
				},
				{
					cacheId: 1, ...
				}
				...
			]
		}*/
	onLoad: function(json) {
		var i, c, hex, geo, mat;
		var cells = json.cells;

		this.meshes = [];
		this.group = new THREE.Object3D();
		this.cells = {};
		this.numCells = 0;

		// create Hex instances and place them on the grid, and add them to the group for easy management
		for (i = 0; i < cells.length; i++) {
			c = cells[i];

			geo = this._geoCache[c.depth];
			if (!geo) {
				this.extrudeSettings.amount = c.depth;
				geo = new THREE.ExtrudeGeometry(this.hexShape, this.extrudeSettings);
				this._geoCache[c.depth] = geo;
			}

			/*mat = this._matCache[c.matConfig.mat_cache_id];
			if (!mat) { // MaterialLoader? we currently only support basic stuff though. maybe later
				mat.map = Loader.loadTexture(c.matConfig.imgURL);
				delete c.matConfig.imgURL;
				mat = new THREE[c.matConfig.type](c.matConfig);
				this._matCache[c.matConfig.mat_cache_id] = mat;
			}*/

			hex = new hg.Hex(this.cellSize, this.cellScale, geo, mat);
			hex.depth = this.extrudeSettings.amount;
			hex.userData.mapData = c.customData;

			this.add(c, hex);
		}
	},

	toJSON: function() {
		var tiles = [];
		var c, k;
		for (k in this.cells) {
			c = this.cells[k];
			tiles.push({
				x: c.x,
				y: c.y,
				z: c.z,
				depth: c.w.depth,
				matCacheId: 0,
				customData: c.w.userData.mapData
			});
		}
		return tiles;
	}
};
