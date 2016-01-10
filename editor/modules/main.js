window.addEventListener('load', function(evt) {
	var data = require('data');
	var tower = require('tower');
	var nexus = require('nexus');
	var Input = require('Input');
	var keyboard = require('keyboard');
	var motor = require('motor');
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