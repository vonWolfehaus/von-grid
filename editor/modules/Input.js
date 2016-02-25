/*
	Translates the MouseCaster's events into more relevant data that the editor uses.
*/
define('Input', function() {
	var tower = require('tower');
	var nexus = require('nexus');
	var keyboard = require('keyboard');

	var Input = function(scene, mouse) {
		this.mouse = mouse;
		this.mouse.signal.add(this.onMouse, this);

		this.mouseDelta = new THREE.Vector3();
		this.mousePanMinDistance = 0.1;
		this.heightStep = 5;
		this.editorWorldPos = new THREE.Vector3(); // current grid position of mouse

		this.overTile = null;

		this._travel = 0;

		keyboard.signal.add(function(type, code) {
			if (type === keyboard.eventType.DOWN) {
				if (code === keyboard.code.SHIFT) nexus.scene.controls.enabled = false;
				/*else if (code === keyboard.code.A) {
					nexus.scene.focusOn(nexus.board.tileGroup); // doesn't work??
				}*/
			}
			else {
				if (code === keyboard.code.SHIFT) nexus.scene.controls.enabled = true;
			}
		}, this);
	};

	Input.prototype = {
		update: function() {
			var hit = this.mouse.allHits[0];
			if (hit) { // fun fact, 3 references are faster than 1 function call
				this.editorWorldPos.x = hit.point.x;
				this.editorWorldPos.y = hit.point.y;
				this.editorWorldPos.z = hit.point.z;
			}
			var dx = this.mouseDelta.x - this.mouse.screenPosition.x;
			var dy = this.mouseDelta.y - this.mouse.screenPosition.y;
			this._travel += Math.sqrt(dx * dx + dy * dy); // fun fact, sqrt is on of the most expensive math ops
		},

		onMouse: function(type, obj) {
			var hit;
			if (this.mouse.allHits && this.mouse.allHits[0]) {
				hit = this.mouse.allHits[0];
			}
			switch (type) {
				case vg.MouseCaster.WHEEL:
					tower.userAction.dispatch(vg.MouseCaster.WHEEL, this.overTile, obj);
					break;

				case vg.MouseCaster.OVER:
					if (obj) {
						this.overTile = obj.select();
					}
					tower.userAction.dispatch(vg.MouseCaster.OVER, this.overTile, hit);
					break;

				case vg.MouseCaster.OUT:
					if (obj) {
						obj.deselect();
						this.overTile = null;
					}
					tower.userAction.dispatch(vg.MouseCaster.OUT, this.overTile, hit);
					break;

				case vg.MouseCaster.DOWN:
					this.mouseDelta.copy(this.mouse.screenPosition);
					tower.userAction.dispatch(vg.MouseCaster.DOWN, this.overTile, hit);
					this._travel = 0;
					break;

				case vg.MouseCaster.UP:
					if (this._travel > this.mousePanMinDistance) {
						break;
					}
					tower.userAction.dispatch(vg.MouseCaster.UP, this.overTile, hit);
					break;

				case vg.MouseCaster.CLICK:
					tower.userAction.dispatch(vg.MouseCaster.CLICK, this.overTile, hit);
					break;
			}
		}
	};

	return Input;
});
