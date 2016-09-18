/*
	Instantiates all tiles for a grid of .obj-loaded tiles. Loads the obj and textures

	@author Corey Birnbaum https://github.com/vonWolfehaus/
*/
vg.TileObjLoader = function(board) {
	this.board = board;
	this.manager = new THREE.LoadingManager();
	this.imgLoader = new THREE.TextureLoader(this.manager);
	this.geoLoader = new THREE.BufferGeometryLoader(this.manager);

	this.obj = null;
	/*{
		map: null,
		normalMap: null,
		emissiveMap: null,
		specularMap: null,
		alphaMap: null
	}*/
	this.objMaps = [];
};

vg.TileObjLoader.prototype = {
	/*
		Make all the geometry and objects necessary to give 3D form to the current grid.
		It uses ExtrudeGeometry with a slight bevel and creates a few unique materials for variation.

		tileHeight 	[int] 	How tall the tile geometry is
	*/
	makeTiles: function(resources) {
		this.board.reset();
		var grid = this.board.grid;

		var i, c, t;

		for (i = 0; i < resources.maps.length; i++) {

			this.imgLoader.load(resources.maps[i], function (texture) {
				if (!this.objMaps[i]) this.objMaps[i] = {};
				this.objMaps[i].map = texture;
			}.bind(this));
		}

		var mats = [];
		for (i = 0; i < resources.maps.length; i++) {
			mats.push(new THREE.MeshPhongMaterial({
				map: resources.maps[i],
				normalMap: resources.normalMaps[i],
				emissiveMap: resources.emissiveMaps[i],
				specularMap: resources.specularMaps[i],
				alphaMap: resources.alphaMaps[i],
				shininess: resources.shininess || 0,
				specular: resources.specular,
			}));
		}

		// load the geometry and build all the Tiles
		this.geoLoader.load(resources.obj, function(geo) {
			for (i in grid.cells) {
				c = grid.cells[i];
				t = new vg.Tile({
					cell: c,
					geometry: geo,
					material: mats[c.materialId]
				});

				t.position.copy(grid.cellToPixel(c));
				t.position.y = c.h * this.board.tileHeightStep;

				this.board.tiles.push(t);
				this.board.tileGroup.add(t.mesh);
			}
		}.bind(this), this.onProgress, this.onError);
	},

	onProgress: function(xhr) {
		if (xhr.lengthComputable) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log( Math.round(percentComplete, 2) + '% downloaded' );
		}
	},

	onError: function(xhr) {
		console.warn('[TileObjLoader] ' + xhr.statusText);
	}
};
