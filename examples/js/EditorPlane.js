/*
	Graph of hexagons. Handles grid cell management (placement math for eg pathfinding, range, etc) and grid conversion math.
	[Cube and axial coordinate systems](http://www.redblobgames.com/grids/hexagons/).
	@author Corey Birnbaum
 */

define(['utils/Loader', 'utils/Tools', 'utils/MouseCaster'], function(Loader, Tools, MouseCaster) {

function EditorPlane(scene, grid, mouse) {
	this.geometry = null;
	this.mesh = null;
	this.material = new THREE.MeshBasicMaterial({
		color: 0xeeeeee,
		side: THREE.DoubleSide
	});
	
	this.scene = scene;
	this.grid = grid;
	
	this.mousePanMinDistance = 0.03;
	this.generatePlane(200, 200);
	
	this.hoverMesh = this.grid.generateCellView(2, new THREE.MeshBasicMaterial({
		color: 0xffe419,
		transparent: true,
		opacity: 0.5,
		side: THREE.DoubleSide
	}));
	this.scene.add(this.hoverMesh.mesh);
	
	this.geoCache = [];
	
	
	this.mouse = mouse;
	// this.mouse.signal.add(this.onMouse, this);
	this.mouseDelta = new THREE.Vector3();
	
	this._vec3 = new THREE.Vector3();
	this._overCell = false;
}

EditorPlane.prototype = {
	
	generatePlane: function(width, height) {
		if (this.mesh) {
			this.scene.remove(this.mesh);
		}
		this.geometry = new THREE.PlaneBufferGeometry(width, width, 1, 1);
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.rotation.x = 90 * Tools.DEG_TO_RAD;
		this.scene.add(this.mesh);
	},
	
	generateCellGeo: function(height) {
		
	},
	
	update: function() {
		if (this.mouse.down) {
			return;
		}
		if (this.mouse.allHits && this.mouse.allHits[0]) {
			var hit = this.mouse.allHits[0]; // get the plane (MouseCaster returns grid cells like Hex)
			if (hit) {
				// flip things around a little to fit to our rotated grid
				this._vec3.x = hit.point.x;
				this._vec3.y = -hit.point.z;
				this._vec3.z = hit.point.y;
				this.hoverMesh.placeAt(this.grid.pixelToCell(this._vec3));
			}
		}
	},
	
	onMouse: function(type, obj) {
		if (this.mouse.allHits && this.mouse.allHits[0]) {
			var hit = this.mouse.allHits[0]; // get the plane (MouseCaster returns grid cells like Hex)
		}
		switch (type) {
			case MouseCaster.OVER:
				this.hoverMesh.visible = false;
				obj.select();
				break;
			case MouseCaster.OUT:
				this.hoverMesh.visible = true;
				obj.deselect();
				break;
			case MouseCaster.DOWN:
				this.mouseDelta.copy(this.mouse.screenPosition);
				break;
				
			case MouseCaster.UP:
				var dx = this.mouseDelta.x - this.mouse.screenPosition.x;
				var dy = this.mouseDelta.y - this.mouse.screenPosition.y;
				if (Math.sqrt(dx * dx + dy * dy) > this.mousePanMinDistance) {
					break;
				}
				if (hit) {
					// place a cell
				}
				break;
		}
	}
};

return EditorPlane;

});