vg.HexGeoGenerator = function() {
	this.tileGeo = null;
	this.tileShape = null;
	this.flatGeo = null;
	this.shapeGeo = null;
	this.vertices = null;

	this._cel = new vg.Cell(); // used as scratch object in various operations
	this._vec3 = new THREE.Vector3();
	this._tileSize = -1;
	this._cellWidth = 0;
	this._cellLength = 0;
};

vg.HexGeoGenerator.prototype = {
	/*
		Make all the required geometry for constructing tiles.
		size 	[int]	Cell size as a radius, in threejs world space.
	*/
	init: function(size) {
		if (this.flatGeo) this.flatGeo.dispose();
		if (this.shapeGeo) this.shapeGeo.dispose();
		if (size === this._tileSize) return; // already generated necessary geo
		this._tileSize = size || 10;
		this._cellWidth = this._tileSize * 2;
		this._cellLength = (vg.SQRT3 * 0.5) * this._cellWidth;

		// create base shape used for building geometry
		var i, verts = [];
		var angle, vec;

		// create the skeleton of the hex
		for (i = 0; i < 6; i++) {
			angle = (vg.TAU / 6) * i;
			vec = new THREE.Vector3(this._tileSize * Math.cos(angle), 0, this._tileSize * Math.sin(angle));
			verts.push(vec);
		}
		this.vertices = verts;

		// copy the verts into a shape for the geometry to use
		this.tileShape = new THREE.Shape();
		this.tileShape.moveTo(verts[0].x, verts[0].z);
		for (i = 1; i < 6; i++) {
			this.tileShape.lineTo(verts[i].x, verts[i].z);
		}
		this.tileShape.lineTo(verts[0].x, verts[0].z);

		this.shapeGeo = new THREE.ShapeGeometry(this.tileShape);
		this.shapeGeo.rotateX(90 * vg.DEG_TO_RAD);
		this.shapeGeo.verticesNeedUpdate = true;

		this.flatGeo = new THREE.Geometry();
		this.flatGeo.vertices = verts;
		// this.flatGeo.rotateX(90 * vg.DEG_TO_RAD);
		this.flatGeo.verticesNeedUpdate = true;
	},

	makeTileGeo: function(config) {
		config = config || {};
		var settings = {
			amount: 1,
			bevelEnabled: true,
			bevelSegments: 1,
			steps: 1,
			bevelSize: 0.5,
			bevelThickness: 0.5
		};
		vg.util.overwrite(settings, config);
		settings.amount = config.height || settings.amount;

		if (this.tileGeo) this.tileGeo.dispose();
		this.tileGeo = new THREE.ExtrudeGeometry(this.tileShape, settings);
		// this.tileGeo.translate(0, -settings.amount, 0); // adjust verts so top poly is at y:0

		return this.tileGeo;
	},

	makeTilePoly: function(material) {
		if (!material) {
			material = new THREE.MeshBasicMaterial({color: 0x24b4ff});
		}
		var mesh = new THREE.Mesh(this.shapeGeo, material);
		// this._vec3.set(1, 0, 0);
		// mesh.rotateOnAxis(this._vec3, vg.PI/2);
		return mesh;
	},

	makeTileHighlight: function(material) {
		var grid = require('nexus').grid;
		if (!material) {
			material = new THREE.MeshBasicMaterial({color: 0x24b4ff});
		}

		var geo = new THREE.TorusGeometry(grid.cellSize, 2, 3, 6);
		var mesh = new THREE.Mesh(geo, material);

		mesh.rotateX(vg.PI/2);
		mesh.scale.x = 0.8;
		mesh.scale.y = 0.8;

		return mesh;
	},

	/*
		Make an outlined grid that shows the shape and placement of all its cells.
		containerObj	[Object3D]	Container to add the tile outlines to
		size 			[int]		Number of cells to generate, as a radius (of the hex-shaped grid)
		material 		[Material]	threejs material to use for the Lines
	*/
	makeOverlay: function(containerObj, size, material) {
		var x, y, z;
		for (x = -size; x < size+1; x++) {
			for (y = -size; y < size+1; y++) {
				z = -x-y;
				if (Math.abs(x) <= size && Math.abs(y) <= size && Math.abs(z) <= size) {
					this._cel.set(x, y, z); // define the cell
					var line = new THREE.Line(this.flatGeo, material);
					line.position.copy(this._cellToPixel(this._cel));
					line.position.y = 0.5;
					// line.rotation.x = 90 * vg.DEG_TO_RAD;
					containerObj.add(line);
				}
			}
		}
	},

	_cellToPixel: function(cell) {
		this._vec3.x = cell.q * this._cellWidth * 0.75;
		this._vec3.y = cell.h;
		this._vec3.z = -((cell.s - cell.r) * this._cellLength * 0.5);
		return this._vec3;
	},
};
