window.addEventListener('load', function(evt) {
	// make ui
	var namespace = 'vongrid.map';

	var map = window.localStorage.getItem(namespace);
	if (map) {
		map = JSON.parse(map);
	}

	var timeTilAutoSave = 300;
	var saveTimer = 10;
	var dirtyMap = true;

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

	// setup the thing

	var scene = new hg.Scene({
		element: document.getElementById('view'),
		cameraPosition: {x:0, y:300, z:120}
	}, {
		noZoom: false
	});

	// listen to the orbit controls to disable the raycaster while user adjusts the view
	scene.controls.addEventListener('wheel', onControlWheel);

	var grid = new hg.HexGrid({
		rings: 1,
		cellSize: 10,
		cellDepth: 5,
		cellScale: 0.95
	});

	var board = new hg.Board(grid);
	var mouse = new hg.MouseCaster(board.group, scene.camera);
	// disable orbit controls if user hovers over a cell so they can adjust the height with the mouse wheel
	mouse.signal.add(onMouse, this);

	var plane = new EditorPlane(board.group, grid, mouse);
	plane.addHoverMeshToGroup(scene.container);

	plane.mapChanged.add(onMapChange, this);

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
	}

	update();
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
				window.localStorage.setItem(namespace, JSON.stringify(map));
				console.log('Auto-saved new map data');
			}
		}
		mouse.update();
		plane.update();
		scene.render();
		requestAnimationFrame(update);
	}

	var wheelTimer = 10;
	function onControlWheel() {
		mouse.active = false;
		wheelTimer = 0;
	}

	function onMouse(type, obj) {
		switch (type) {
			case hg.MouseCaster.OVER:
				if (obj) {
					scene.controls.noZoom = true;
				}
				break;
			case hg.MouseCaster.OUT:
				if (obj) {
					scene.controls.noZoom = false;
				}
				break;
			case hg.MouseCaster.WHEEL:
				if (mouse.wheel < 1) {
					// prevent wheel from going negative since cells can't extrude inside-out (well, shouldn't)
					mouse.wheel = 1;
				}
				break;
		}
	}

	function onMapChange(tile) {
		dirtyMap = true;
		saveTimer = timeTilAutoSave;
	}

	// taken from https://github.com/mrdoob/three.js/blob/master/editor/js/Menubar.File.js
	var link = document.createElement('a');
	link.style.display = 'none';
	document.body.appendChild(link); // Firefox workaround

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

	function loadMap(json) {
		board.group.remove(grid.group);
		grid.onLoad(json);
		board.setGrid(grid);
		scene.add(board.group);
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
});