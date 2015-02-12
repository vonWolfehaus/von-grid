/*
	
 */

define(function() {

var MouseCaster = function(scene, camera) {
	
	this.scene = scene;
	this.camera = camera;
	this.raycaster = new THREE.Raycaster();
	this.mouse = new THREE.Vector2();
	this.signal = new Signal();
	
	this.pickedObject = null;
	this.selectedObject = null;
	
	document.addEventListener('mousemove', this._onDocumentMouseMove.bind(this), false);
	document.addEventListener('mousedown', this._onDocumentMouseDown.bind(this), false);
	document.addEventListener('mouseup', this._onDocumentMouseUp.bind(this), false);
};

MouseCaster.OVER = 'over';
MouseCaster.OUT = 'out';
MouseCaster.DOWN = 'down';
MouseCaster.UP = 'up';
MouseCaster.CLICK = 'click'; // only fires if the user clicked down and up while on the same object

MouseCaster.prototype.update = function() {
	this.raycaster.setFromCamera(this.mouse, this.camera);
	
	var intersects = this.raycaster.intersectObject(this.scene, true);
	
	if (intersects.length > 0) {
		// go through all the objects under the mouse
		if (this.pickedObject != intersects[0].object) {
			// the first object changed, meaning there's a different one, or none at all
			if (this.pickedObject) {
				// it's a new object
				this.signal.dispatch(MouseCaster.OUT, this.pickedObject);
			}
			/*else {
				// hit a new object when nothing was there previously
			}*/
			this.pickedObject = intersects[0].object;
			this.selectedObject = null; // cancel click, otherwise it'll confuse the user
			
			this.signal.dispatch(MouseCaster.OVER, this.pickedObject);
		}
	}
	else {
		// there isn't anything under the mouse
		/*if (this.pickedObject) {
			// there was though, we just moved out
		}*/
		this.pickedObject = null;
		this.selectedObject = null;
	}
};

MouseCaster.prototype._onDocumentMouseDown = function(evt) {
		// console.log(this.pickedObject);
		if (this.pickedObject) {
			this.selectedObject = this.pickedObject;
		}
		this.signal.dispatch(MouseCaster.DOWN, this.pickedObject);
};
	
MouseCaster.prototype._onDocumentMouseUp = function(evt) {
		// console.log(this.pickedObject);
		this.signal.dispatch(MouseCaster.UP, this.pickedObject);
		
		if (this.selectedObject && this.pickedObject && this.selectedObject === this.pickedObject) {
			this.signal.dispatch(MouseCaster.CLICK, this.pickedObject);
		}
};
	
MouseCaster.prototype._onDocumentMouseMove = function(evt) {
		evt.preventDefault();
		this.mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;
};

return MouseCaster;

});