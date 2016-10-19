/*
	2D plane that the user moves mouse around on in order to build maps. Provides a working plane to navigate, and a visual aid for tile placement.

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
define('EditorPlane', function() {

	function EditorPlane(scene, grid, mouse) {
		this.nexus = require('nexus');
		this.tower = require('tower');

		this.mesh = null;
		this.planeMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			side: THREE.DoubleSide
		});

		this.hoverMaterial = new THREE.MeshBasicMaterial({
			color: 0x1aaeff,
			side: THREE.DoubleSide
		});

		this.scene = scene;
		this.mouse = mouse;
		this.board = this.nexus.board;

		this.hoverMesh = null; // mesh that hovers over empty cells
		this.tileHoverMesh = null; // mesh that hovers over tiles

		this.setGrid(grid);

		this.tower.userAction.add(function onUserAction(type, overTile, data) {
			switch (type) {
				case vg.MouseCaster.OVER:
					if (overTile && !mouse.down) {
						this.tileHoverMesh.visible = true;
						this.tileHoverMesh.position.copy(overTile.position);
						this.tileHoverMesh.position.y += 1;
					}
					break;

				case vg.MouseCaster.OUT:
					this.tileHoverMesh.visible = false;
					break;
			}
		}, this);

		this.tower.tileAction.add(function onUserAction(type, overTile) {
			if (type === this.tower.TILE_CHANGE_HEIGHT) {
				// console.log(overTile.position)
				this.tileHoverMesh.position.copy(overTile.position);
				this.tileHoverMesh.position.y += 1;
			}
		}, this);
	}

	EditorPlane.prototype = {
		updatePlane: function(color, size) {
			var newColor = parseInt(color.replace(/^#/, ''), 16);
			this.planeMaterial.color.setHex(newColor);

			if (this.planeSize !== size) {
				this.planeSize = size;
				switch (this.grid.type) {
					case vg.HEX:
						this._actualSize = size * (vg.SQRT3 * 0.5) * this.grid._cellWidth + this.grid.cellSize;
						break;
					case vg.SQR:
						this._actualSize = size * this.grid.cellSize * 2;
						break;
				}
				this.generate();
			}
		},

		generate: function() {
			var geometry;
			if (this.mesh && this.mesh.parent) {
				this.mesh.parent.remove(this.mesh);
				this.mesh.geometry.dispose();
			}

			this.nexus.gen.makeOverlay(this.planeSize);

			switch (this.grid.type) {
				case vg.HEX:
					geometry = new THREE.CircleGeometry(this._actualSize, 6);
					break;
				case vg.SQR:
					geometry = new THREE.PlaneGeometry(this._actualSize, this._actualSize, 1, 1);
					break;
				default:
					console.warn('[EditorPlane.generate] no grid type set');
					break;
			}

			this.mesh = new THREE.Mesh(geometry, this.planeMaterial);
			this.mesh.rotation.x = 90 * vg.DEG_TO_RAD;
			this.mesh.position.y = -0.5;
			if (this.grid.type === vg.HEX) {
				this.mesh.rotation.z = 90 * vg.DEG_TO_RAD;
			}
			this.scene.add(this.mesh);

			// make hover mesh
			if (this.hoverMesh && this.hoverMesh.parent) {
				this.hoverMesh.parent.remove(this.hoverMesh);
			}
			this.hoverMesh = this.nexus.gen.geoGen.makeTilePoly(this.hoverMaterial);
			this.nexus.scene.container.add(this.hoverMesh);

			if (this.tileHoverMesh && this.tileHoverMesh.parent) {
				this.tileHoverMesh.parent.remove(this.tileHoverMesh);
			}
			this.tileHoverMesh = this.nexus.gen.geoGen.makeTileHighlight(this.hoverMaterial);
			this.nexus.scene.container.add(this.tileHoverMesh);
			this.tileHoverMesh.visible = false;
		},

		update: function() {
			if (this.mouse.allHits.length && !this.mouse.pickedObject) {
				var cell = this.grid.pixelToCell(this.nexus.input.editorWorldPos);
				this.hoverMesh.position.copy(this.grid.cellToPixel(cell));
				this.hoverMesh.position.y += 0.05;
				this.hoverMesh.visible = true;
			}
			else {
				this.hoverMesh.visible = false;
			}
		},

		setGrid: function(grid) {
			this.grid = grid;
			this.planeSize = grid.size + 5;
			if (grid.type === vg.HEX) {
				this._actualSize = this.planeSize * (vg.SQRT3 * 0.5) * this.grid._cellWidth + this.grid.cellSize;
			}
			else {
				this._actualSize = this.planeSize * this.grid.cellSize + this.grid.cellSize;
			}
		}
	};

	return EditorPlane;
});
