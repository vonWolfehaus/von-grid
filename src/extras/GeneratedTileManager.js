/*
	Instantiates all tiles for a generated grid.

	@author Corey Birnbaum https://github.com/vonWolfehaus/
*/
vg.GeneratedTileManager = function(board) {
	this.board = board;
	this.geoGen = null;
	this.overlay = null;
};

vg.GeneratedTileManager.prototype = {
	/*
		Make all the geometry and objects necessary to give 3D form to the current grid.
		It uses ExtrudeGeometry with a slight bevel and creates a few unique materials for variation.

		tileHeight 	[int] 	How tall the tile geometry is
	*/
	makeTiles: function(tileHeight, mats) {
		this.board.reset();
		this.makeGenerator();

		var i, c, geo, t;
		geo = this.geoGen.makeTileGeo({
			height: tileHeight || 50
		});

		if (!mats) {
			mats = [];
			for (i = 0; i < 10; i++) {
				mats.push(new THREE.MeshPhongMaterial({
					color: vg.util.randomizeRGB('30, 30, 30', 13)
				}));
			}
		}

		for (i in this.board.grid.cells) {
			c = this.board.grid.cells[i];
			t = new vg.Tile({
				cell: c,
				geometry: geo,
				material: mats[c.materialId],
				scale: 1
			});

			t.position.copy(this.board.grid.cellToPixel(c));
			t.position.y = c.h * this.board.tileHeightStep;

			this.board.tiles.push(t);
			this.board.tileGroup.add(t.mesh);
		}
	},

	makeGenerator: function() {
		if (!this.geoGen) {
			switch (this.board.grid.type) {
				case vg.HEX:
					this.geoGen = new vg.HexGeoGenerator();
					break;
			}
		}
		this.geoGen.init(this.board.grid.cellSize);
	},

	makeOverlay: function(size, color) {
		color = color || 0x000000;
		var mat = new THREE.LineBasicMaterial({
			color: color,
			opacity: 0.3
		});
		this.makeGenerator();

		if (this.overlay) {
			this.board.group.remove(this.overlay);
		}

		this.overlay = new THREE.Object3D();

		this.geoGen.makeOverlay(this.overlay, size, mat);

		this.board.group.add(this.overlay);
	}
};
