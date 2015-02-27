/*
	Graph of hexagons. Handles grid cell management (placement math for eg pathfinding, range, etc) and grid conversion math.
	[Cube and axial coordinate systems](http://www.redblobgames.com/grids/hexagons/).
	@author Corey Birnbaum
 */

define(['graphs/Hex', 'utils/Tools'], function(Hex, Tools) {

var HexGrid = function(config) {
	if (!config) config = {};
	var gridSettings = {
		rings: 5,
		url: null,
		type: Hex.FLAT,
		// depthStep: 2,
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
	
	// number of cells (in radius); only used if the map is generated
	this.size = gridSettings.rings;
	this.cellSize = gridSettings.cellSize;
	this.cellScale = gridSettings.cellScale;
	this.type = gridSettings.type;
	this.extrudeSettings = gridSettings.extrudeSettings;
	
	this.rotationIncrement = Hex.POINTY;
	// holds the grid position of each cell in cube coordinates, to which our meshes are attached to in the Board entity
	this.cells = {}; // it's a hash so we can have sparse maps
	this.numCells = 0;
	// holds the mesh data that is displayed
	this.meshes = [];
	this.hexShape = null;
	this.hexGeo = null;
	this.hexMat = gridSettings.material;
	this.hexWidth = 0;
	this.hexHeight = 0;
	this.hashDelimeter = '.';
	
	// the grid holds its own Group to manipulate and make it easy to add/remove from the scene
	this.group = new THREE.Group();
	
	// create base shape used for building geometry
	var i, verts = [];
	// create the skeleton of the hex
	for (i = 0; i < 6; i++) {
		verts.push(this.createVert(Hex.FLAT, i));
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
	this._geoCache = [];
	this._matCache = [];
	
	// build the grid depending on what was passed in
	if (gridSettings.url) {
		Tools.getJSON(gridSettings.url, this.onLoad, this);
	}
	else {
		this.generate();
	}
};

HexGrid.SQRT3 = Math.sqrt(3); // used often in conversions

HexGrid.prototype = {
	/*
		High-level functions that the Board interfaces with (all grids implement)
	 */
	
	
	// create a flat, hexagon-shaped grid.
	generate: function() {
		var x, y, z, c, i, hex;
		
		// this.hexGeo = new THREE.ShapeGeometry(this.hexShape);
		this.hexGeo = new THREE.ExtrudeGeometry(this.hexShape, this.extrudeSettings);
		this.meshes = [];
		
		for (x = -this.size; x < this.size+1; x++) {
			for (y = -this.size; y < this.size+1; y++) {
				z = -x-y;
				if (Math.abs(x) <= this.size && Math.abs(y) <= this.size && Math.abs(z) <= this.size) {
					c = new THREE.Vector3(x, y, z);
					// create Hex instances and place them on the grid, and add them to the group for easy management
					hex = new Hex(this.cellSize, this.cellScale, this.hexGeo, this.hexMat);
					c.w = hex; // for storing which hex is representing this cell
					hex.depth = this.extrudeSettings.amount;
					hex.placeAt(c);
					
					this.cells[this.cubeToHash(c)] = c;
					
					this.meshes.push(hex);
					this.group.add(hex.view);
					
					this.numCells++;
				}
			}
		}
		
		// rotate the group depending on the shape the grid is in
		this.group.rotation.y = this.type - (30 * Tools.DEG_TO_RAD);
		this.hexWidth = hex.width;
		this.hexHeight = hex.height;
	},
	
	// load a grid from a parsed json object.
	/*
		xyz are hex cube coordinates
		json = {
			cells: [
				{x, y, z, depth, matConfig: {
					cacheid: 0,
					type: 'MeshLambertMaterial',
					color, ambient, emissive, reflectivity, refractionRatio, wrapAround,
					texture: url
				}}
				...
			]
		}
	*/
	onLoad: function(json) {
		console.log(json);
		var i, c, v, hex, geo, mat;
		var cells = json.cells;
		
		this.meshes = [];
		// create Hex instances and place them on the grid, and add them to the group for easy management
		for (i = 0; i < cells.length; i++) {
			c = cells[i];
			v = new THREE.Vector3(c.x, c.y, c.z);
			this.cells[this.cubeToHash(v)] = v;
			
			geo = this._geoCache[c.depth];
			if (!geo) {
				this.extrudeSettings.amount = c.depth;
				geo = new THREE.ExtrudeGeometry(this.hexShape, this.extrudeSettings);
				this._geoCache[c.depth] = geo;
			}
			
			mat = this._matCache[c.matConfig.cacheid];
			if (!mat) { // MaterialLoader? we currently only support basic stuff though. maybe later
				mat.map = THREE.ImageUtils.loadTexture(c.matConfig.texture);
				delete c.matConfig.texture;
				mat = new THREE[c.matConfig.type](c.matConfig);
				this._matCache[c.matConfig.cacheid] = mat;
			}
			
			hex = new Hex(this.cellSize, this.cellScale, geo, mat);
			hex.depth = this.extrudeSettings.amount;
			v.w = hex;
			hex.placeAt(v);
			
			this.meshes.push(hex);
			this.group.add(hex.view);
		}
		
		// rotate the group depending on the shape the grid is in
		this.group.rotation.y = this.type - (30 * Tools.DEG_TO_RAD);
		this.hexWidth = hex.width;
		this.hexHeight = hex.height;
	},
	
	// grid cell (Hex in this case) to position in pixels/world
	cellToPixel: function(c, pos) {
		var p = this.hexToPixel(c.gridPos);
		pos.x = p.x;
		pos.y = c.depth + (c.depth/2);
		pos.z = -p.y; // having to negate this is a bug... i think
	},
	
	// always returns an array
	getNeighbors: function(hex, diagonal, filter) {
		var i, c, l = this._directions.length;
		this._list.length = 0;
		for (i = 0; i < l; i++) {
			this._vec3.copy(hex.gridPos);
			this._vec3.add(this._directions[i]);
			c = this.cells[this.cubeToHash(this._vec3)];
			if (!c || (filter && filter(c.w))) {
				continue;
			}
			this._list.push(c.w);
		}
		if (diagonal) {
			for (i = 0; i < l; i++) {
				this._vec3.copy(hex.gridPos);
				this._vec3.add(this._diagonals[i]);
				c = this.cells[this.cubeToHash(this._vec3)];
				if (!c || (filter && filter(c.w))) {
					continue;
				}
				this._list.push(c.w);
			}
		}
		return this._list;
	},
	
	distance: function(cellA, cellB) {
		// console.log('distance: '+this.cubeDistance(cellA.gridPos, cellB.gridPos));
		return this.cubeDistance(cellA.gridPos, cellB.gridPos);
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
		var c, i = 0, x = Tools.randomInt(0, this.numCells);
		for (c in this.cells) {
			if (i === x) {
				return this.cells[c].w;
			}
			i++;
		}
		return this.cells[c].w;
	},
	
	dispose: function() {
		// TODO
	},
	
	/*
		Hexagon-specific conversion math
	 */
	
	cubeToHash: function(cube) {
		return cube.x+this.hashDelimeter+cube.y+this.hashDelimeter+cube.z;
	},
	
	pixelToAxial: function(x, y) {
		var q = (x * (HexGrid.SQRT3 / 3) - (y / 3)) / this.cellSize;
		var r = y * (2 / 3) / this.cellSize;
		var axial = this.hexRound({x: q, y: r});
		return this.hexToCube(axial);
	},

	hexToCube: function(h) {
		var x = h.x;
		var y = h.y;
		var z = -x - y;
		return {x: x, y: y, z: z};
	},

	hexToPixel: function(h) {
		x = this.cellSize * HexGrid.SQRT3 * (h.x + (h.y / 2));
		y = this.cellSize * (3 / 2) * h.y;
		return {x: x, y: y};
	},
	
	cubeToHex: function(h) {
		return h; // {x: h.x, y: h.y};
	},

	axialToPixel: function(cube) {
		var xOffset = cube.z * (this.hexWidth / 2);
		var xCoord = (cube.x * this.hexWidth) + xOffset;
		var zCoord = cube.z * this.hexHeight * 0.75;
		return {x: xCoord, z: zCoord};
	},


	hexRound: function(h) {
		return this.cubeToHex(this.cubeRound(this.hexToCube(h)));
	},

	cubeRound: function(h) {
		var rx = Math.round(h.x);
		var ry = Math.round(h.y);
		var rz = Math.round(h.z);

		var x_diff = Math.abs(rx - h.x);
		var y_diff = Math.abs(ry - h.y);
		var z_diff = Math.abs(rz - h.z);

		if (x_diff > y_diff && x_diff > z_diff) {
			rx = -ry-rz;
		}
		else if (y_diff > z_diff) {
			ry = -rx-rz;
		}
		else {
			rz = -rx-ry;
		}

		return {x: rx, y: ry, z: rz};
	 },

	
	hexDistance: function(a, b) {
		var ac = hexToCube(a);
		var bc = hexToCube(b);
		return this.cubeDistance(ac, bc);
	},

	cubeDistance: function(a, b) {
		return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
	},
	
	createVert: function(type, i) {
		var angle = ((2 * Math.PI) / 6) * i;
		angle += type; // 0 if flat-topped, or 30deg if pointy
		return new THREE.Vector3((this.cellSize * Math.cos(angle)), (this.cellSize * Math.sin(angle)), 0);
	}

};

return HexGrid;

});