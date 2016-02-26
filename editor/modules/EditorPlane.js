/*
	2D plane that the user moves mouse around on in order to build maps. Provides a working plane to navigate, and a visual aid for tile placement.

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
define('EditorPlane', function() {

	function EditorPlane(scene, grid, mouse) {
		this.nexus = require('nexus');
		this.tower = require('tower');

		this.mesh = null;
		this.material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			side: THREE.DoubleSide
		});

		this.scene = scene;
		this.grid = grid;
		this.mouse = mouse;
		this.board = this.nexus.board;

		this.hoverMesh = null;
		this.planeSize = grid.size;
		this._actualSize = grid.size * grid.cellSize * 2;

		/*this.mouse.signal.add(onUserAction, this);
		function onUserAction(type, overCell) {
			switch (type) {
				case vg.MouseCaster.OVER:
					if (overCell) {
						this.hoverMesh.mesh.visible = false;
					}
					break;

				case vg.MouseCaster.OUT:
					this.hoverMesh.mesh.visible = true;
					break;

				case vg.MouseCaster.DOWN:
					this.hoverMesh.mesh.visible = false;
					break;

				case vg.MouseCaster.UP:
					if (!overCell) {
						this.hoverMesh.mesh.visible = true;
					}
					else {
						this.hoverMesh.mesh.visible = false;
					}
					break;
			}
		}*/
	}

	EditorPlane.prototype = {

		updatePlane: function(color, size) {
			var newColor = parseInt(color.replace(/^#/, ''), 16);
			this.material.color.setHex(newColor);

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
				this.generatePlane();
			}
		},

		generatePlane: function() {
			var geometry;
			if (this.mesh && this.mesh.parent) {
				this.mesh.parent.remove(this.mesh);
				this.mesh.geometry.dispose();
			}

			this.board.generateOverlay(this.planeSize);

			switch (this.grid.type) {
				case vg.HEX:
					geometry = new THREE.CircleGeometry(this._actualSize, 6);
					break;
				case vg.SQR:
					geometry = new THREE.PlaneGeometry(this._actualSize, this._actualSize, 1, 1);
					break;
				default:
					console.warn('[EditorPlane.generatePlane] no grid type set');
					break;
			}

			this.mesh = new THREE.Mesh(geometry, this.material);
			this.mesh.rotation.x = 90 * vg.DEG_TO_RAD;
			// this.mesh.position.y -= 0.1;
			if (this.grid.type === vg.HEX) {
				this.mesh.rotation.z = 90 * vg.DEG_TO_RAD;
			}
			this.scene.add(this.mesh);
		},

		generateHoverMesh: function() {
			if (this.hoverMesh && this.hoverMesh.parent) {
				this.hoverMesh.parent.remove(this.hoverMesh);
			}
			this.hoverMesh = this.grid.generateTilePoly(new THREE.MeshBasicMaterial({
				color: 0x1aaeff,
				side: THREE.DoubleSide
			}));
			this.nexus.scene.container.add(this.hoverMesh);
		},

		update: function() {
			if (this.mouse.allHits.length && !this.mouse.pickedObject) {
				var cell = this.grid.pixelToCell(this.nexus.input.editorWorldPos);
				this.hoverMesh.position.copy(this.grid.cellToPixel(cell));
				this.hoverMesh.position.y += 0.1;
				this.hoverMesh.visible = true;
			}
			else {
				this.hoverMesh.visible = false;
			}
		}
	};

	return EditorPlane;
});
