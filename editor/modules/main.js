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

	ui.on('error', function(evt) {
		console.warn(evt);
	});

	ui.on(ui.Events.SAVE_MAP, function() {
		saveMap();
	});

	ui.on(ui.Events.LOAD_MAP, function() {
		fileInput.click();
	});

	keyboard.on();
	motor.on();

	// setup the thing
	var canvas = document.getElementById('view');
	var scene = new vg.Scene({
		element: canvas,
		cameraPosition: {x: 0, y: 300, z: 120},
		// light: new THREE.AmbientLight(0x000000)
	}, {
		maxPolarAngle: (Math.PI / 2) - 0.01
	});
	nexus.scene = scene;

	// listen to the orbit controls to disable the raycaster while user adjusts the view
	scene.controls.addEventListener('wheel', onControlWheel);

	var grid = new vg.HexGrid();
	nexus.grid = grid;
	var board = new vg.Board(grid);
	nexus.board = board;
	var mouse = new vg.MouseCaster(board.group, scene.camera, canvas);
	nexus.mouse = mouse;

	var input = new Input(board.group, mouse);
	nexus.input = input;
	var plane = new EditorPlane(board.group, grid, mouse);
	nexus.plane = plane;

	require('tilemaker').init();

	tower.tileAction.add(onMapChange, this);
	tower.save.add(onMapChange, this);

	function dataChanged(key, oldData, newData) {
		if (key === 'settings') {
			board.tileHeightStep = newData.tileHeightStep;
		}
		if (key === 'load-success') {
			board.tileHeightStep = oldData.settings.tileHeightStep;
		}
	}
	data.changed.add(dataChanged);

	scene.focusOn(board.group);

	if (map) {
		ui.trigger(ui.Events.UPDATE_SETTINGS, data.get('settings'));
		loadMap(map);
	}
	else {
		grid.generate({
			size: 5
		});
		board.makeTiles(30);

		map = grid.toJSON();
		data.set('map', map);

		var settings = {
			mapSize: grid.size,
			cellSize: grid.cellSize,
			planeSize: plane.planeSize,
			tileHeightStep: 3,
			planeColor: '#ffffff',
			tileset: 'default'
		};
		data.set('settings', settings);

		console.log('Created a new map');
		data.save();

		plane.generate();
	}

	// reflect new values in the UI
	ui.trigger(ui.Events.UPDATE_SETTINGS, data.get('settings'));

	scene.add(board.group);

	ui.on(ui.Events.UPDATE_SETTINGS, function(settings) {
		// console.log('current grid size: '+grid.size+', new: '+settings.mapSize);
		// console.log('current cell size: '+grid.cellSize+', new: '+settings.cellSize);
		plane.updatePlane(settings.planeColor, settings.planeSize);

		data.set('settings', settings);
		onMapChange();

		if (settings.mapSize === grid.size) {
			if (settings.cellSize === grid.cellSize) {
				// console.log('neither changed, ignored');
				return;
			}
			// console.log('only cell size changed');
			grid.updateCellSize(settings.cellSize);
		}
		else {
			// only map size or both changed
			grid.updateCellSize(settings.cellSize);
			// if map size changed, we have to rebuild the map from scratch
			grid.generate({
				size: settings.mapSize
			});
		}

		plane.generate();

		if (settings.tileset === 'default') {
			board.makeTiles(30);
		}
	});

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
				data.set('map', map);
				data.save();
				console.log('Map saved');
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
		map = grid.toJSON();
	}

	function loadMap(json) {
		grid.fromJSON(json);
		board.setGrid(grid);

		plane.generate();

		var settings = data.get('settings');

		if (settings.tileset === 'default') {
			board.makeTiles(30);
		}

		plane.updatePlane(settings.planeColor, settings.planeSize);

		console.log('Map load complete');
	}

	function saveMap() {
		var output = null;

		map = grid.toJSON();

		try {
			output = JSON.stringify(map, null, '\t');
			output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
		}
		catch (err) {
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