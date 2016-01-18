/*
	2D plane that the user moves mouse around on in order to build maps. Provides a working plane to navigate, and a visual aid for tile placement.

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
define('EditorPlane', function() {

	function EditorPlane(scene, grid, mouse) {
		this.nexus = require('nexus');
		this.tower = require('tower');

		this.geometry = null;
		this.mesh = null;
		this.material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			side: THREE.DoubleSide
		});

		this.scene = scene;
		this.grid = grid;

		this.hoverMesh = this.grid.generateTilePoly(new THREE.MeshBasicMaterial({
			color: 0x1aaeff,
			side: THREE.DoubleSide
		}));

		this.mouse = mouse;

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

		generatePlane: function(width, height) {
			if (this.mesh && this.mesh.parent) {
				this.mesh.parent.remove(this.mesh);
			}
			this.geometry = new THREE.PlaneBufferGeometry(width, width, 1, 1);
			this.mesh = new THREE.Mesh(this.geometry, this.material);
			this.mesh.rotation.x = 90 * vg.DEG_TO_RAD;
			this.mesh.position.y -= 0.1;
			this.scene.add(this.mesh);
		},

		//http://stackoverflow.com/questions/20734438/algorithm-to-generate-a-hexagonal-grid-with-coordinate-system
		// http://www.redblobgames.com/grids/hexagons/implementation.html
		/*generateHexGrid: function(Graphics g, Point origin, int size, int radius, int padding) {
			double ang30 = Math.toRadians(30);
			double xOff = Math.cos(ang30) * (radius + padding);
			double yOff = Math.sin(ang30) * (radius + padding);
			int half = size / 2;

			for (int row = 0; row < size; row++) {
				int cols = size - java.lang.Math.abs(row - half);

				for (int col = 0; col < cols; col++) {
					int xLbl = row < half ? col - row : col - half;
					int yLbl = row - half;
					int x = (int) (origin.x + xOff * (col * 2 + 1 - cols));
					int y = (int) (origin.y + yOff * (row - half) * 3);

					drawHex(g, xLbl, yLbl, x, y, radius);
				}
			}
		},*/

		addHoverMeshToGroup: function(group) {
			if (this.hoverMesh.parent) {
				this.hoverMesh.parent.remove(this.hoverMesh);
			}
			group.add(this.hoverMesh);
		},

		update: function() {
			if (this.mouse.allHits.length && !this.mouse.pickedObject) {
				this.grid.setPositionToCell(this.hoverMesh.position, this.grid.pixelToCell(this.nexus.input.editorWorldPos));
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
