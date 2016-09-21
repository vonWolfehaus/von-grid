/*


	@author Corey Birnbaum https://github.com/vonWolfehaus/
*/
vg.TilesetManager = function(board) {
	this.board = board;
	this.manager = new THREE.LoadingManager(this._loaderComplete.bind(this), this._loaderProgress, this._loaderError);
	this.imgLoader = new THREE.TextureLoader(this.manager);
	this.geoLoader = new THREE.BufferGeometryLoader(this.manager);

	this.tileGeo = null;
	this.tilesetBasePath = null;
	this.tilesetMaterials = null;
	this.tilesetTextures = null;
	this.onComplete = null;
	this.onCompleteScope = null;
};

vg.TilesetManager.prototype = {
	/*
		Loads and creates materials, geometry, and vg.Tiles to give 3D form to the current grid.

		map = {
			tileGeoPath: [String] // full path eg 'path/to/geo/hexTile.json'
			tilesetBasePath: [String] // eg 'path/to/materials/'
			materials: [
				{
					id: 0, // array index
					map: [String] // required; all maps are filenames
					normalMap
					emissiveMap
					specularMap
					alphaMap
					shininess: [Number], // default is 0
					specular: [Hex or String], // default is 0x111111
				},
				{
					id: 1, ...
				},
				...
			]
		}
	*/
	load: function(map, hollaback, hollascope) {
		this.onComplete = hollaback;
		this.onCompleteScope = hollascope;
		this.tilesetBasePath = map.tilesetBasePath;
		// load in new geo and materials, then manager.onComplete will fire to build new ones
		this.loadMaterials(map.materials);
		// start loading the BufferGeometry json
		this.geoLoader.load(map.tileGeoPath, function(geo) {
			this.tileGeo = geo;
		}.bind(this));
	},

	/*
		Load all of the textures in the array of materials (one material == one tile type)
	*/
	loadMaterials: function(matSources) {
		var m, i;
		this.tilesetTextures = [];

		for (i = 0; i < matSources.length; i++) {
			m = matSources[i];
			this.tilesetTextures[m.id] = {};
			this._loadTextures(m);
		}
	},

	makeTiles: function() {
		var grid = this.board.grid;
		var i, c, t;

		for (i in grid.cells) {
			c = grid.cells[i];
			t = new vg.Tile({
				cell: c,
				geometry: this.tileGeo,
				material: this.tilesetMaterials[c.materialId]
			});

			t.position.copy(grid.cellToPixel(c));
			t.position.y = c.h * this.board.tileHeightStep;

			this.board.tiles.push(t);
			this.board.tileGroup.add(t.mesh);
		}
	},

	/*
		Essentially clear cache so we can load in a different tileset.
		Does NOT remove/dispose the meshes, materials, or geometry - use board.reset() for that
	*/
	reset: function() {
		this.tileGeo = null;
		this.tilesetMaterials = null;
		this.tilesetTextures = null;
	},

	_loaderComplete: function() {
		var i, textures;

		this.tilesetMaterials = [];

		for (i = 0; i < this.tilesetTextures.length; i++) {
			textures = this.tilesetTextures[i];
			this.tilesetMaterials[i] = new THREE.MeshPhongMaterial({
				map: textures.map,
				normalMap: textures.normalMap || null,
				emissiveMap: textures.emissiveMap || null,
				specularMap: textures.specularMap || null,
				alphaMap: textures.alphaMap || null,
				shininess: textures.shininess || 0,
				specular: textures.specular ? new THREE.Color(textures.specular) : null,
			});
		}

		if (this.onComplete) this.onComplete.call(this.onCompleteScope || null);
	},

	_loaderProgress: function(xhr) {
		if (xhr.lengthComputable) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log(Math.round(percentComplete, 2) + '% downloaded');
		}
	},

	_loaderError: function(xhr) {
		console.warn('[TilesetManager] ' + xhr.statusText);
	},

	_loadTextures: function(m) {
		var self = this;
		this.imgLoader.load(this.tilesetBasePath+m.map, function(texture) {
			self.tilesetTextures[m.id].map = texture;
		});

		if (m.normalMap) {
			this.imgLoader.load(this.tilesetBasePath+m.normalMap, function(texture) {
				self.tilesetTextures[m.id].normalMap = texture;
			});
		}
		if (m.emissiveMap) {
			this.imgLoader.load(this.tilesetBasePath+m.emissiveMap, function(texture) {
				self.tilesetTextures[m.id].emissiveMap = texture;
			});
		}
		if (m.specularMap) {
			this.imgLoader.load(this.tilesetBasePath+m.specularMap, function(texture) {
				self.tilesetTextures[m.id].specularMap = texture;
			});
		}
		if (m.alphaMap) {
			this.imgLoader.load(this.tilesetBasePath+m.alphaMap, function(texture) {
				self.tilesetTextures[m.id].alphaMap = texture;
			});
		}
	}
};
