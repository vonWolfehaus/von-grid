!function(){function e(e){if(n.hasOwnProperty(e))return n[e]
throw'[require-shim] Cannot find module "'+e+'"'}function i(i,o,r){var d=null,t=r&&void 0!==r
if(t){if(r.hasOwnProperty(i))throw"[define-shim] Module "+i+" already exists"}else if(n.hasOwnProperty(i))throw"[define-shim] Module "+i+" already exists"
d="function"==typeof o?o(e):o,t?r[i]=d:n[i]=d}var n={}
window.define=i,window.define.amd=!1,window.require=e}()

window.addEventListener('load', function(evt) {
	var data = require('data');
	var tower = require('tower');
	var nexus = require('nexus');
	var keyboard = require('keyboard');
	var motor = require('motor');

	var Input = require('Input');
	var EditorPlane = require('EditorPlane');

	data.load();
	var map = data.get('map');

	var timeTilAutoSave = 200; // timer runs per frame, 60fps
	var saveTimer = 10;
	var dirtyMap = false;
	var shiftDown = false;
	var paintMode = false;
	var deleteMode = false;
	var addMode = false;

	var saveBtn = document.getElementById('save-btn');
	saveBtn.onmouseup = function(evt) {
		saveMap();
		return false;
	};

	var loadBtn = document.getElementById('load-btn');
	loadBtn.addEventListener('click', function() {
		fileInput.click();
	}, false);

	var fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.addEventListener('change', function(evt) {
		var file = fileInput.files[0];
		if (!file) {
			return;
		}

		var reader = new FileReader();
		reader.onload = function(e) {
			var json = null;
			try {
				json = JSON.parse(e.target.result);
			}
			catch(err) {
				console.warn('File is not json format');
				return;
			}
			loadMap(json);
		};

		reader.readAsText(file);

		return false;
	});

	keyboard.on();
	motor.on();

	// setup the thing
	var canvas = document.getElementById('view');
	var scene = new vg.Scene({
		element: canvas,
		cameraPosition: {x:0, y:300, z:120}
	}, true);

	// listen to the orbit controls to disable the raycaster while user adjusts the view
	scene.controls.addEventListener('wheel', onControlWheel);

	var grid = new vg.HexGrid({
		rings: 1,
		cellSize: 10,
		cellDepth: 5,
		cellScale: 0.95
	});
	var board = new vg.Board(grid);
	var mouse = new vg.MouseCaster(board.group, scene.camera, canvas);

	var input = new Input(board.group, mouse);
	var plane = new EditorPlane(board.group, grid, mouse);

	nexus.input = input;
	nexus.plane = plane;
	nexus.board = board;
	nexus.grid = grid;
	nexus.scene = scene;
	nexus.mouse = mouse;

	plane.addHoverMeshToGroup(scene.container);

	tower.tileAction.add(onMapChange, this);

	scene.add(board.group);
	scene.focusOn(board.group);

	if (map) {
		loadMap(map);
	}
	else {
		var mapCells = [];
		var cell, mat;
		for (var c in grid.cells) {
			cell = grid.cells[c];
			mapCells.push({
				x: cell.x,
				y: cell.y,
				z: cell.z,
				depth: cell.w.depth,
				matCacheId: 0,
				customData: cell.w.userData.mapData
			});
		}
		var mapMats = [];
		for (var i = 0; i < grid._matCache.length; i++) {
			mat = grid._matCache[i];
			/*mapMats.push({
				cache_id: i,
				type: mat.type,
				// color, ambient, emissive, reflectivity, refractionRatio, wrapAround,
				imgURL: // get this value from the ui
			});*/
		}
		map = {
			cells: mapCells,
			materials: mapMats
		};
		data.set('map', map);
		console.log('Created a new map');
	}

	function update() {
		if (wheelTimer < 10) {
			wheelTimer++;
			if (wheelTimer === 10) {
				mouse.active = true;
			}
		}
		if (dirtyMap) {
			saveTimer--;
			if (saveTimer === 0) {
				dirtyMap = false;
				data.save();
			}
		}
		mouse.update();
		input.update();
		plane.update();
		scene.render();
	};
	motor.add(update);

	var wheelTimer = 10;
	function onControlWheel() {
		mouse.active = false;
		wheelTimer = 0;
	}

	function onMapChange() {
		dirtyMap = true;
		saveTimer = timeTilAutoSave;
		map.cells = grid.toJSON();
	}

	function loadMap(json) {
		board.group.remove(grid.group);
		grid.load(json);
		board.setGrid(grid);
		scene.add(board.group);
		console.log('Map load complete');
	}

	function saveMap() {
		var output = null;

		map.cells = grid.toJSON();

		try {
			output = JSON.stringify(map, null, '\t');
			output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
		} catch (e) {
			output = JSON.stringify(map);
		}

		exportString(output, 'hex-map.json');
	}

	// taken from https://github.com/mrdoob/three.js/blob/master/editor/js/Menubar.File.js
	var link = document.createElement('a');
	link.style.display = 'none';
	document.body.appendChild(link);

	function exportString(output, filename) {
		var blob = new Blob([output], {type: 'text/plain'});
		var objectURL = URL.createObjectURL(blob);

		link.href = objectURL;
		link.download = filename || 'data.json';
		link.target = '_blank';

		var evt = document.createEvent('MouseEvents');
		evt.initMouseEvent(
			'click', true, false, window, 0, 0, 0, 0, 0,
			false, false, false, false, 0, null
		);
		link.dispatchEvent(evt);
	}
});
define('keyboard', function() {

	function onDown(evt) {
		switch (evt.keyCode) {
			case 16:
				k.shift = true;
				break;
			case 17:
				k.ctrl = true;
				break;
		}
		k.signal.dispatch(k.eventType.DOWN, evt.keyCode);
	}

	function onUp(evt) {
		switch (evt.keyCode) {
			case 16:
				k.shift = false;
				break;
			case 17:
				k.ctrl = false;
				break;
		}
		k.signal.dispatch(k.eventType.UP, evt.keyCode);
	}

	var k = {
		shift: false,
		ctrl: false,

		eventType: {
			DOWN: 'down',
			UP: 'up'
		},

		signal: new vg.Signal(),

		on: function() {
			document.addEventListener('keydown', onDown, false);
			document.addEventListener('keyup', onUp, false);
		},

		off: function() {
			document.removeEventListener('keydown', onDown);
			document.removeEventListener('keyup', onUp);
		},

		code: {
			A: 'A'.charCodeAt(0),
			B: 'B'.charCodeAt(0),
			C: 'C'.charCodeAt(0),
			D: 'D'.charCodeAt(0),
			E: 'E'.charCodeAt(0),
			F: 'F'.charCodeAt(0),
			G: 'G'.charCodeAt(0),
			H: 'H'.charCodeAt(0),
			I: 'I'.charCodeAt(0),
			J: 'J'.charCodeAt(0),
			K: 'K'.charCodeAt(0),
			L: 'L'.charCodeAt(0),
			M: 'M'.charCodeAt(0),
			N: 'N'.charCodeAt(0),
			O: 'O'.charCodeAt(0),
			P: 'P'.charCodeAt(0),
			Q: 'Q'.charCodeAt(0),
			R: 'R'.charCodeAt(0),
			S: 'S'.charCodeAt(0),
			T: 'T'.charCodeAt(0),
			U: 'U'.charCodeAt(0),
			V: 'V'.charCodeAt(0),
			W: 'W'.charCodeAt(0),
			X: 'X'.charCodeAt(0),
			Y: 'Y'.charCodeAt(0),
			Z: 'Z'.charCodeAt(0),
			ZERO: '0'.charCodeAt(0),
			ONE: '1'.charCodeAt(0),
			TWO: '2'.charCodeAt(0),
			THREE: '3'.charCodeAt(0),
			FOUR: '4'.charCodeAt(0),
			FIVE: '5'.charCodeAt(0),
			SIX: '6'.charCodeAt(0),
			SEVEN: '7'.charCodeAt(0),
			EIGHT: '8'.charCodeAt(0),
			NINE: '9'.charCodeAt(0),
			NUMPAD_0: 96,
			NUMPAD_1: 97,
			NUMPAD_2: 98,
			NUMPAD_3: 99,
			NUMPAD_4: 100,
			NUMPAD_5: 101,
			NUMPAD_6: 102,
			NUMPAD_7: 103,
			NUMPAD_8: 104,
			NUMPAD_9: 105,
			NUMPAD_MULTIPLY: 106,
			NUMPAD_ADD: 107,
			NUMPAD_ENTER: 108,
			NUMPAD_SUBTRACT: 109,
			NUMPAD_DECIMAL: 110,
			NUMPAD_DIVIDE: 111,
			F1: 112,
			F2: 113,
			F3: 114,
			F4: 115,
			F5: 116,
			F6: 117,
			F7: 118,
			F8: 119,
			F9: 120,
			F10: 121,
			F11: 122,
			F12: 123,
			F13: 124,
			F14: 125,
			F15: 126,
			COLON: 186,
			EQUALS: 187,
			UNDERSCORE: 189,
			QUESTION_MARK: 191,
			TILDE: 192,
			OPEN_BRACKET: 219,
			BACKWARD_SLASH: 220,
			CLOSED_BRACKET: 221,
			QUOTES: 222,
			BACKSPACE: 8,
			TAB: 9,
			CLEAR: 12,
			ENTER: 13,
			SHIFT: 16,
			CTRL: 17,
			ALT: 18,
			CAPS_LOCK: 20,
			ESC: 27,
			SPACEBAR: 32,
			PAGE_UP: 33,
			PAGE_DOWN: 34,
			END: 35,
			HOME: 36,
			LEFT: 37,
			UP: 38,
			RIGHT: 39,
			DOWN: 40,
			INSERT: 45,
			DELETE: 46,
			HELP: 47,
			NUM_LOCK: 144
		}
	};

	return k;
});

define('nexus', {
	grid: null,
	board: null,
	mouse: null,
	scene: null,
	input: null,
	plane: null,
});
define('tower', {
	tileAction: new vg.Signal(),
	objAction: new vg.Signal(),
	userAction: new vg.Signal(),

	saveMap: new vg.Signal(),
	loadMap: new vg.Signal(),

	CELL_CHANGE_HEIGHT: 'cell.change.height',
	CELL_ADD: 'cell.add',
	CELL_REMOVE: 'cell.remove',
});
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

		this.overCell = null;

		this._travel = 0;

		keyboard.signal.add(function(type, code) {
			if (type === keyboard.eventType.DOWN) {
				if (code === keyboard.code.SHIFT) nexus.scene.controls.enabled = false;
			}
			else {
				if (code === keyboard.code.SHIFT) nexus.scene.controls.enabled = true;
			}
		}, this);
	};

	Input.prototype = {
		update: function() {
			var hit = this.mouse.allHits[0];
			if (hit) {
				// flip things around a little to fit to our rotated grid
				this.editorWorldPos.x = hit.point.x;
				this.editorWorldPos.y = -hit.point.z;
				this.editorWorldPos.z = hit.point.y;
			}
			var dx = this.mouseDelta.x - this.mouse.screenPosition.x;
			var dy = this.mouseDelta.y - this.mouse.screenPosition.y;
			this._travel += Math.sqrt(dx * dx + dy * dy);
		},

		onMouse: function(type, obj) {
			var hit, cell;
			if (this.mouse.allHits && this.mouse.allHits[0]) {
				hit = this.mouse.allHits[0];
			}
			switch (type) {
				case vg.MouseCaster.WHEEL:
					tower.userAction.dispatch(vg.MouseCaster.WHEEL, this.overCell, obj);
					break;

				case vg.MouseCaster.OVER:
					if (obj) {
						this.overCell = obj.select();
					}
					tower.userAction.dispatch(vg.MouseCaster.OVER, this.overCell, hit);
					break;

				case vg.MouseCaster.OUT:
					if (obj) {
						obj.deselect();
						this.overCell = null;
					}
					tower.userAction.dispatch(vg.MouseCaster.OUT, this.overCell, hit);
					break;

				case vg.MouseCaster.DOWN:
					this.mouseDelta.copy(this.mouse.screenPosition);
					tower.userAction.dispatch(vg.MouseCaster.DOWN, this.overCell, hit);
					this._travel = 0;
					break;

				case vg.MouseCaster.UP:
					if (this._travel > this.mousePanMinDistance) {
						break;
					}
					tower.userAction.dispatch(vg.MouseCaster.UP, this.overCell, hit);
					break;

				case vg.MouseCaster.CLICK:
					tower.userAction.dispatch(vg.MouseCaster.CLICK, this.overCell, hit);
					break;
			}
		}
	};

	return Input;
});

/*
	2D plane that the user moves mouse around on in order to build maps. Provides a working plane to navigate, and a visual aid for tile placement.
 */
define('EditorPlane', function() {

	function EditorPlane(scene, grid, mouse) {
		this.nexus = require('nexus');
		this.tower = require('tower');

		this.geometry = null;
		this.mesh = null;
		this.material = new THREE.MeshBasicMaterial({
			color: 0xeeeeee,
			side: THREE.DoubleSide
		});

		this.scene = scene;
		this.grid = grid;

		this.generatePlane(500, 500);

		this.hoverMesh = this.grid.generateTilePoly(new THREE.MeshBasicMaterial({
			color: 0xffe419,
			// transparent: true,
			// opacity: 0.5,
			// emissive: new THREE.Color(0xffe419),
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
				this.hoverMesh.position.y++; // bring it on top so polygons don't overlap
				// this.hoverMesh.position.copy(this.grid.pixelToAxial(this.nexus.input.editorWorldPos));
				// this.hoverMesh.position.copy(this.grid.project(this.nexus.input.editorWorldPos, 1));
				// this.grid.pixelToCell(this.hoverMesh.position); // ????
				// this.hoverMesh.position.y = this.nexus.input.editorWorldPos.z;
				// this.hoverMesh.position.z = -this.nexus.input.editorWorldPos.y;

				// this.hoverMesh.position.copy(this.nexus.input.editorWorldPos);
				// this.nexus.board.placeAtCell(this.hoverMesh.position, this.grid.pixelToCell(this.nexus.input.editorWorldPos));
				// this.hoverMesh.placeAt(this.grid.pixelToCell(this.nexus.input.editorWorldPos));
				this.hoverMesh.visible = true;
			}
			else {
				this.hoverMesh.visible = false;
			}
		}
	};

	return EditorPlane;
});

/*
	This is the ONLY place in the app that has a requestAnimationFrame handler.
	All modules attach their functions to this module if they want in on the RAF.
 */
define('motor', function() {
	var _brake = false;
	var _steps = [];

	function on() {
		_brake = false;
		window.requestAnimationFrame(_update);
		window.addEventListener('focus', onFocus, false);
		window.addEventListener('blur', onBlur, false);
	}

	function off() {
		_brake = true;
		window.removeEventListener('focus', onFocus, false);
		window.removeEventListener('blur', onBlur, false);
	}

	// in order to be able to ID functions we have to hash them to generate unique-ish keys for us to find them with later
	// if we don't do this, we won't be able to remove callbacks that were bound and save us from binding callbacks multiple times all over the place
	function add(cb, scope) {
		var k = _hashStr(cb.toString());
		var h = _has(k);
		if (h === -1) {
			_steps.push({
				func: cb,
				scope: scope,
				key: k
			});
		}
	}

	function remove(cb) {
		var k = _hashStr(cb.toString());
		var i = _has(k);
		if (i !== -1) {
			_steps.splice(i, 1);
		}
	}

	function _update() {
		if (_brake) return;
		window.requestAnimationFrame(_update);

		for (var i = 0; i < _steps.length; i++) {
			var o = _steps[i];
			o.func.call(o.scope || null);
		}
	}

	// check if the handler already has iaw.motor particular callback
	function _has(k) {
		var n = -1;
		var i;
		for (i = 0; i < _steps.length; i++) {
			n = _steps[i].key;
			if (n === k) {
				return i;
			}
		}
		return -1;
	}

	function onFocus(evt) {
		_brake = false;
		_update();
	}

	function onBlur(evt) {
		_brake = true;
	}

	function _hashStr(str) {
		var hash = 0, i, chr, len;
		if (str.length === 0) return hash;
		for (i = 0, len = str.length; i < len; i++) {
			chr = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0;
		}
		return hash;
	}

	return {
		on: on,
		off: off,
		add: add,
		remove: remove,
	}
});

/*
	Manages cells and objects on the map.
*/
define('Editor', function() {
	var tower = require('tower');
	var nexus = require('nexus');
	var keyboard = require('keyboard');
	var motor = require('motor');

	// TODO: get these values from UI
	var heightStep = 5;

	// PRIVATE
	var lastHeight = 5;
	var currentGridCell = null;
	var prevGridCell = new THREE.Vector3();

	tower.userAction.add(onUserAction, this);
	motor.add(update);

	function update() {
		currentGridCell = nexus.grid.pixelToCell(nexus.input.editorWorldPos);
		if (nexus.mouse.down && keyboard.shift && nexus.mouse.allHits && nexus.mouse.allHits.length) {
			// only check if the user's mouse is over the editor plane
			if (!currentGridCell.equals(prevGridCell)) {
				addTile();
			}
			prevGridCell.copy(currentGridCell);
		}
	}

	function onUserAction(type, overCell, data) {
		var hit = nexus.mouse.allHits[0]
		var cell;
		switch (type) {
			case vg.MouseCaster.WHEEL:
				if (keyboard.shift && overCell) {
					var gridPos = overCell.gridPos;
					nexus.grid.remove(overCell);

					var dif = (nexus.input.overCell.depth / heightStep) - data;
					nexus.mouse.wheel = (overCell.depth / heightStep) + (dif > 0 ? -1 : 1);

					cell = nexus.grid.generateTile(nexus.mouse.wheel * heightStep);
					nexus.grid.add(gridPos, cell);
					lastHeight = nexus.mouse.wheel;

					overCell = cell;

					tower.tileAction.dispatch(tower.CELL_CHANGE_HEIGHT, cell, heightStep);
				}
				break;

			case vg.MouseCaster.OVER:
				if (keyboard.shift) {
					if (overCell && nexus.mouse.rightDown) {
						removeTile(overCell);
					}
					else if (!overCell && nexus.mouse.down) {
						addTile();
					}
				}
				break;

			case vg.MouseCaster.OUT:

				break;

			case vg.MouseCaster.DOWN:
				if (keyboard.shift && nexus.mouse.down && data && !overCell) {
					// if shift is down then she's painting, so add a cell immediately
					addTile();
				}
				break;

			case vg.MouseCaster.UP:
				if (nexus.mouse.down && data && !overCell) {
					// create a new cell, if one isn't already there
					addTile();
				}
				else if (nexus.mouse.rightDown && overCell) {
					// remove a cell if it's there and right mouse is down
					removeTile(overCell);
				}
				break;
		}
	}

	function addTile() {
		if (!currentGridCell || nexus.grid.getTileAtCell(currentGridCell)) return;
		nexus.mouse.wheel = lastHeight;
		var cell = nexus.grid.generateTile(nexus.mouse.wheel * heightStep);
		nexus.grid.add(currentGridCell, cell);

		tower.tileAction.dispatch(tower.CELL_ADD, cell, heightStep);
	}

	function removeTile(overCell) {
		nexus.grid.remove(overCell);

		tower.tileAction.dispatch(tower.CELL_REMOVE, overCell);
	}

	/*document.oncontextmenu = function() {
		return false;
	};*/

	return {

	}
});
/*
	Handles JSON for whatever data needs to be saved to localStorage, and provides a convenient signal for whenever that data changes.
*/
define('data', {
	_store: {},
	changed: new vg.Signal(),

	get: function(key) {
		return this._store[key] || null;
	},

	set: function(key, val) {
		// fire event first so we can retrieve old data before it's overwritten (just in case)
		this.changed.dispatch(key, this._store[key], val);
		this._store[key] = val;
	},

	save: function() {
		window.localStorage['vongrid'] = JSON.stringify(this._store);
	},

	load: function(json) {
		var data = window.localStorage['vongrid'];
		if (json || data) {
			try {
				this._store = json || JSON.parse(data);
				this.changed.dispatch('load-success');
			}
			catch (err) {
				console.warn('Error loading editor data');
				this.changed.dispatch('load-failure');
			}
		}
	}
});
//# sourceMappingURL=app.js.map
