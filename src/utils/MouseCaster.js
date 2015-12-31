/*
	Translates mouse interactivity into 3D positions, so we can easily pick objects in the scene.

	Like everything else in ThreeJS, ray casting creates a ton of new objects each time it's used. This contributes to frequent garbage collections (causing frame hitches), so if you're limited to low-end hardware like mobile, it would be better to only update it when the user clicks, instead of every frame (so no hover effects, but on mobile those don't work anyway). You'll want to create a version that handles touch anyway.

	group - any Object3D (Scene, Group, Mesh, Sprite, etc) that the mouse will cast against
	camera - the camera to cast from
	[element] - optional element to attach mouse event to
 */
hg.MouseCaster = function(group, camera, element) {
	this.down = false;
	// the object that was just clicked on
	this.pickedObject = null;
	// the object currently being "held"
	this.selectedObject = null;
	// store the results of the last cast
	this.allHits = null;
	// disable the caster easily to temporarily prevent user input
	this.active = true;

	this.shift = false;
	this.ctrl = false;
	this.wheel = 0;

	// you can track exactly where the mouse is in the 3D scene by using the z component
	this.position = new THREE.Vector3();
	this.screenPosition = new THREE.Vector2();
	this.signal = new hg.Signal();
	this.group = group;

	// behind-the-scenes stuff you shouldn't worry about
	this._camera = camera;
	this._raycaster = new THREE.Raycaster();
	this._preventDefault = false;

	element = element || document;

	element.addEventListener('mousemove', this._onDocumentMouseMove.bind(this), false);
	element.addEventListener('mousedown', this._onDocumentMouseDown.bind(this), false);
	element.addEventListener('mouseup', this._onDocumentMouseUp.bind(this), false);
	element.addEventListener('mousewheel', this._onMouseWheel.bind(this), false);
	element.addEventListener('DOMMouseScroll', this._onMouseWheel.bind(this), false); // firefox
};

// statics to describe the events we dispatch
hg.MouseCaster.OVER = 'over';
hg.MouseCaster.OUT = 'out';
hg.MouseCaster.DOWN = 'down';
hg.MouseCaster.UP = 'up';
hg.MouseCaster.CLICK = 'click'; // only fires if the user clicked down and up while on the same object
hg.MouseCaster.WHEEL = 'wheel';

hg.MouseCaster.prototype = {
	update: function() {
		if (!this.active) {
			return;
		}

		this._raycaster.setFromCamera(this.screenPosition, this._camera);

		var intersects = this._raycaster.intersectObject(this.group, true);
		var hit, obj;

		if (intersects.length > 0) {
			// get the first object under the mouse
			hit = intersects[0];
			obj = hit.object.userData.structure;
			if (this.pickedObject != obj) {
				// the first object changed, meaning there's a different one, or none at all
				if (this.pickedObject) {
					// it's a new object, notify the old object is going away
					this.signal.dispatch(hg.MouseCaster.OUT, this.pickedObject);
				}
				/*else {
					// hit a new object when nothing was there previously
				}*/
				this.pickedObject = obj;
				this.selectedObject = null; // cancel click, otherwise it'll confuse the user

				this.signal.dispatch(hg.MouseCaster.OVER, this.pickedObject);
			}
			this.position.copy(hit.point);
			this.screenPosition.z = hit.distance;
		}
		else {
			// there isn't anything under the mouse
			if (this.pickedObject) {
				// there was though, we just moved out
				this.signal.dispatch(hg.MouseCaster.OUT, this.pickedObject);
			}
			this.pickedObject = null;
			this.selectedObject = null;
		}

		this.allHits = intersects;
	},

	preventDefault: function() {
		this._preventDefault = true;
	},

	_onDocumentMouseDown: function(evt) {
		evt.preventDefault();
		if (this._preventDefault) {
			this._preventDefault = false;
			return false;
		}
		if (this.pickedObject) {
			this.selectedObject = this.pickedObject;
		}
		this.shift = evt.shiftKey;
		this.ctrl = evt.ctrlKey;
		this.down = true;
		this.signal.dispatch(hg.MouseCaster.DOWN, this.pickedObject);
	},

	_onDocumentMouseUp: function(evt) {
		evt.preventDefault();
		if (this._preventDefault) {
			this._preventDefault = false;
			return false;
		}
		this.shift = evt.shiftKey;
		this.ctrl = evt.ctrlKey;
		this.down = false;
		this.signal.dispatch(hg.MouseCaster.UP, this.pickedObject);
		// console.log('up');
		if (this.selectedObject && this.pickedObject && this.selectedObject.uniqueID === this.pickedObject.uniqueID) {
			// console.log('click');
			this.signal.dispatch(hg.MouseCaster.CLICK, this.pickedObject);
		}
	},

	_onDocumentMouseMove: function(evt) {
		evt.preventDefault();
		this.screenPosition.x = (evt.clientX / window.innerWidth) * 2 - 1;
		this.screenPosition.y = -(evt.clientY / window.innerHeight) * 2 + 1;
	},

	_onMouseWheel: function(evt) {
		if (!this.active) {
			return;
		}
		evt.preventDefault();
		evt.stopPropagation();

		var delta = 0;
		if (evt.wheelDelta !== undefined) { // WebKit / Opera / Explorer 9
			delta = evt.wheelDelta;
		}
		else if (evt.detail !== undefined) { // Firefox
			delta = -evt.detail;
		}
		if (delta > 0) {
			this.wheel++;
		}
		else {
			this.wheel--;
		}
		// console.log(this.wheel);
		this.signal.dispatch(hg.MouseCaster.WHEEL, this.wheel);
	}
};
