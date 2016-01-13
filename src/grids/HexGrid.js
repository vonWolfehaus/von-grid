/*
	Graph of hexagons. Handles grid cell management (placement math for eg pathfinding, range, etc) and grid conversion math.
	[Cube/axial coordinate system](http://www.redblobgames.com/grids/hexagons/), "flat top" version only. Since this is 3D, just rotate your camera for pointy top maps.
	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
// 'utils/Loader', 'graphs/Hex', 'utils/Tools'
vg.HexGrid = function(config) {
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

	vg.Tools.merge(true, gridSettings, config);

	// number of cells (in radius); only used if the map is generated
	this.size = gridSettings.rings;
	this.cellSize = gridSettings.cellSize;
	this.cellScale = gridSettings.cellScale;

	this.extrudeSettings = gridSettings.extrudeSettings;
	this.extrudeSettings.amount = gridSettings.cellDepth;

	this.rotationIncrement = 30 * vg.DEG_TO_RAD;
	// holds the grid position of each cell in cube coordinates, to which our meshes are attached to in the Board entity
	this.cells = {}; // it's a hash so we can have sparse maps
	this.numCells = 0;
	// holds the Hex instances data that is displayed; still working on a decent naming convention, sorry
	this.meshes = [];

	this.hexShape = null;
	this.cellWidth = this.cellSize * 2;
	this.cellHeight = (vg.SQRT3 * 0.5) * this.cellWidth;
	this.hashDelimeter = '.';

	// the grid holds its own Object3D to manipulate and make it easy to add/remove from the scene
	this.group = new THREE.Object3D();

	// create base shape used for building geometry
	var i, verts = [];
	// create the skeleton of the hex
	for (i = 0; i < 6; i++) {
		verts.push(this.createVert(i, vg.Hex.FLAT));
	}
	// copy the verts into a shape for the geometry to use
	this.hexShape = new THREE.Shape();
	this.hexShape.moveTo(verts[0].x, verts[0].y);
	for (i = 1; i < 6; i++) {
		this.hexShape.lineTo(verts[i].x, verts[i].y);
	}
	this.hexShape.lineTo(verts[0].x, verts[0].y);

	this.hexShapeGeo = new THREE.ShapeGeometry(this.hexShape);

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
		vg.Tools.getJSON(gridSettings.url, this.load, this);
	}
	else {
		this.generate();
	}

	// var c = this.getRandomCell();
	// this.cellWidth = c.width;
	// this.cellHeight = c.height;
	this.cellWidth = this.cellSize * 2;
	this.cellHeight = Math.sqrt(3)/2 * this.cellSize;
};

vg.HexGrid.prototype = {
	/*
		________________________________________________________________________
		High-level functions that the Board interfaces with (all grids implement)
	 */

	// grid cell (Hex in this case) to position in pixels/world
	// should be TILE to pixel
	cellToPixel: function(c, pos) {
		var p = this.axialToPixel(c.gridPos);
		pos.x = p.x;
		pos.y = c.depth;
		pos.z = -p.y;
	},

	project: function(v, height) {
		// flip axis so y is up
		this._vec3.x = v.x;
		this._vec3.z = -v.y;
		this._vec3.y = height;
		return this._vec3;
	},

	getCellAt: function(pos) {
		// find the cube coordinate of the position
		var q = pos.x * ((2/3) / this.cellSize);
		var r = ((-pos.x / 3) + (vg.SQRT3/3) * pos.y) / this.cellSize;
		this._vec3.set(q, r, 0);
		// snap it to the cell's center
		this._vec3.x = this._vec3.x * this.cellWidth * 0.75;
		this._vec3.z = (this._vec3.z - this._vec3.y) * this.cellHeight * 0.5;
		this._vec3.y = 0;
		// flip it
		this._vec3.z = -this._vec3.y;
		// this._vec3.y = height;
		return this._vec3;
	},

	setPositionToCell: function(pos, cell) {
		pos.x = cell.x * this.cellWidth * 0.75;
		pos.y = 0;
		pos.z = (cell.z - cell.y) * this.cellHeight * 0.5;
	},

	getTileAtCell: function(c) {
		return this.cells[this.cubeToHash(c)];
	},

	pixelToCell: function(pos) {
		var q = pos.x * ((2/3) / this.cellSize);
		var r = ((-pos.x / 3) + (vg.SQRT3/3) * pos.y) / this.cellSize;
		this._vec3.set(q, r, 0);
		return this.axialRound(this._vec3);
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
		var c, i = 0, x = vg.Tools.randomInt(0, this.numCells);
		for (c in this.cells) {
			if (i === x) {
				return this.cells[c].w;
			}
			i++;
		}
		return this.cells[c].w;
	},

	generateTile: function(height, material) {
		height = Math.abs(height) || this.extrudeSettings.amount;
		this.extrudeSettings.amount = height;
		var geo = this._geoCache[height];
		if (!geo) {
			geo = new THREE.ExtrudeGeometry(this.hexShape, this.extrudeSettings);
			this._geoCache[height] = geo;
		}
		var hex = new vg.Hex(this.cellSize, this.cellScale, geo, material);
		hex.depth = height;
		return hex;
	},

	generateTilePoly: function(material) {
		if (!material) {
			material = new THREE.MeshBasicMaterial({color: 0x24b4ff});
		}
		var mesh = new THREE.Mesh(this.hexShapeGeo, material);
		this._vec3.set(1, 0, 0);
		mesh.rotateOnAxis(this._vec3, vg.PI/2);
		return mesh;
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

	createVert: function(i, type) {
		var angle = (vg.TAU / 6) * i;
		return new THREE.Vector3((this.cellSize * Math.cos(angle)), (this.cellSize * Math.sin(angle)), 0);
	},

	add: function(cell, tile) {
		var c = new THREE.Vector3();
		c.copy(cell);

		if (tile) {
			c.w = tile;
			tile.placeAt(c);
			this.meshes.push(tile);
			this.group.add(tile.mesh);
		}

		this.cells[this.cubeToHash(c)] = c;
		this.numCells++;
		return tile;
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
	load: function(json) {
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

			hex = new vg.Hex(this.cellSize, this.cellScale, geo, mat);
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
	},

	/*
		________________________________________________________________________
		Hexagon-specific conversion math
	 */

	cubeToHash: function(cube) {
		return cube.x+this.hashDelimeter+cube.y+this.hashDelimeter+cube.z;
	},

	pixelToAxial: function(pos) {
		var q, r; // = x, y
		q = pos.x * ((2/3) / this.cellSize);
		r = ((-pos.x / 3) + (vg.SQRT3/3) * pos.y) / this.cellSize;
		this._vec3.set(q, r, 0);
		return this.axialRound(this._vec3);
	},

	axialToCube: function(h) {
		return {x: h.x, y: h.y, z: -h.x - h.y};
		// return this._conversionVec.set(h.x, h.y, -h.x - h.y);
	},

	cubeToAxial: function(h) {
		return h;
	},

	axialToPixel: function(h) {
		var x, y; // = q, r
		x = h.x * this.cellWidth * 0.75;
		y = (h.z - h.y) * this.cellHeight * 0.5;
		return {x: x, y: -y};
		// return this._conversionVec.set(x, y, 0);
	},

	hexToPixel: function(h) {
		var x, y; // = q, r
		x = this.cellSize * 1.5 * h.x;
		y = this.cellSize * vg.SQRT3 * (h.y + (h.x * 0.5));
		return {x: x, y: y};
		// return this._conversionVec.set(x, y, 0);
	},

	axialRound: function(h) {
		return this.cubeRound(this.axialToCube(h));
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

	cubeDistance: function(a, b) {
		return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
	}
};
