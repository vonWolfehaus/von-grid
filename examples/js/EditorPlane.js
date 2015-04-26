/*
	Graph of hexagons. Handles grid cell management (placement math for eg pathfinding, range, etc) and grid conversion math.
	[Cube and axial coordinate systems](http://www.redblobgames.com/grids/hexagons/).
	@author Corey Birnbaum
 */

define(['utils/Loader', 'utils/Tools', 'utils/MouseCaster', 'lib/Signal'], function(Loader, Tools, MouseCaster, Signal) {

function EditorPlane(scene, grid, mouse, board) {
	this.geometry = null;
	this.mesh = null;
	this.material = new THREE.MeshBasicMaterial({
		color: 0xeeeeee,
		side: THREE.DoubleSide
	});
	
	this.scene = scene;
	this.grid = grid;
	this.board = board;
	
	this.mousePanMinDistance = 0.03;
	this.heightStep = 5;
	
	this.generatePlane(500, 500);
	
	this.hoverMesh = this.grid.generateCellView(2, new THREE.MeshBasicMaterial({
		color: 0xffe419,
		transparent: true,
		opacity: 0.5,
		side: THREE.DoubleSide
	}));
	
	this.mouse = mouse;
	this.mouse.signal.add(this.onMouse, this);
	this.mouseDelta = new THREE.Vector3();
	
	this.mapChanged = new Signal();
	
	this._vec3 = new THREE.Vector3();
	this._overCell = null;
	this._lastHeight = 1;
}

EditorPlane.prototype = {
	
	generatePlane: function(width, height) {
		if (this.mesh && this.mesh.parent) {
			this.mesh.parent.remove(this.mesh);
		}
		this.geometry = new THREE.PlaneBufferGeometry(width, width, 1, 1);
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.rotation.x = 90 * Tools.DEG_TO_RAD;
		this.scene.add(this.mesh);
	},
	
	addHoverMeshToGroup: function(group) {
		if (this.hoverMesh.mesh.parent) {
			this.hoverMesh.mesh.parent.remove(this.hoverMesh.mesh);
		}
		group.add(this.hoverMesh.mesh);
	},
	
	update: function() {
		if (this.mouse.down) {
			// ignore interactions while panning or editing
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
		var hit, cell;
		if (this.mouse.allHits && this.mouse.allHits[0]) {
			hit = this.mouse.allHits[0]; // get the plane (MouseCaster returns grid cells like Hex)
		}
		switch (type) {
			case MouseCaster.WHEEL:
				// console.log(this.mouse.wheel);
				if (this._overCell) {
					this.hoverMesh.mesh.visible = false;
					var gridPos = this._overCell.gridPos;
					this.grid.remove(this._overCell);
					
					var dif = (this._overCell.depth / this.heightStep) - obj;
					this.mouse.wheel = (this._overCell.depth / this.heightStep) + (dif > 0 ? -1 : 1);
					
					cell = this.grid.generateCellView(this.mouse.wheel * this.heightStep);
					this.grid.add(gridPos, cell);
					this._lastHeight = this.mouse.wheel;
					
					this.mapChanged.dispatch();
				}
				break;
				
			case MouseCaster.OVER:
				if (obj) {
					this.hoverMesh.mesh.visible = false;
					this._overCell = obj.select();
				}
				// console.log(obj);
				break;
				
			case MouseCaster.OUT:
				if (obj) {
					this.hoverMesh.mesh.visible = true;
					obj.deselect();
					this._overCell = null;
				}
				break;
				
			case MouseCaster.DOWN:
				this.mouseDelta.copy(this.mouse.screenPosition);
				this.hoverMesh.mesh.visible = false;
				break;
				
			case MouseCaster.UP:
				this.hoverMesh.mesh.visible = true;
				// don't create new cells if user is trying to orbit camera
				var dx = this.mouseDelta.x - this.mouse.screenPosition.x;
				var dy = this.mouseDelta.y - this.mouse.screenPosition.y;
				if (Math.sqrt(dx * dx + dy * dy) > this.mousePanMinDistance) {
					break;
				}
				// else create a new cell, if one isn't already there
				if (hit && !obj) {
					this.hoverMesh.mesh.visible = false;
					this.mouse.wheel = this._lastHeight;
					cell = this.grid.generateCellView(this.mouse.wheel * this.heightStep);
					this.grid.add(this.grid.pixelToCell(this._vec3), cell);
					
					this.mapChanged.dispatch();
				}
				break;
				
			case MouseCaster.CLICK:
				// remove cells already there
				if (obj) {
					this.grid.remove(obj);
					
					this.mapChanged.dispatch();
					break;
				}
				break;
		}
	}
};

return EditorPlane;

});