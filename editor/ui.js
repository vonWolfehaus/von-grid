riot.tag2('tool-menu', '<ul class="btn-list tool-menu__list"> <li class="tool-menu__item {active: active}" each="{items}" data="{this}" title="{displayText}" onclick="{parent.selectTool}"> <img riot-src="images/{icon}"> </li> </ul>', '', '', function(opts) {
	this.items = [
		{
			name: 'ADD_TILE',
			displayText: 'Add Tile',
			icon: 'add-tile.png',
			active: true
		},
		{
			name: 'REMOVE_TILE',
			displayText: 'Remove Tile',
			icon: 'remove-tile.png',
			active: false
		},
		{
			name: 'WALK_TILE',
			displayText: 'Set Tile Walkability',
			icon: 'set-walkability.png',
			active: false
		},
	];

	this.selectTool = function(evt) {
		var item = evt.item;
		if (ui.activeTool.name === item.name) {
			return;
		}

		ui.activeTool.active = false;

		item.active = true;
		ui.activeTool = item;

		ui.trigger(ui.Events.TOOL_CHANGE, ui.Tools[item.name]);
		this.update();
	}.bind(this)

	this.on('mount', function() {
		ui.activeTool = this.items[0];
		ui.trigger(ui.Events.TOOL_CHANGE, ui.Tools[ui.activeTool]);
	});
}, '{ }');
riot.tag2('tileset-menu', '<form> <label for="tilesets">Tileset:</label> <select name="tilesets" onchange="{selectTileset}"> <option each="{name, value in sets}" value="{name}">{name}</option> </select> <span class="tilesets__add" onclick="{addTileset}" title="Add a new tileset"> <i class="icon-plus"></i> </span> </form> <ul class="btn-list tilesets__list"> <li class="tilesets__item {active: active}" each="{items}" onclick="{selectTile}" data-slotid="{slotid}"> <img if="{preview}" src=""> </li> <li class="tilesets__item" onclick="{addTile}" title="Add a new tile to this set"> <i class="icon-plus"></i> </li> </ul> <div class="tilesets__preview"> <preview-canvas></preview-canvas> <button onclick="{onEdit}">Change Tile</button> </div>', '', 'class="flex-container"', function(opts) {
	this.sets = {
		'default': [
			{
				active: false,
				slotid: 0,
				preview: null
			},
			{
				active: false,
				slotid: 1,
				preview: null
			},
			{
				active: false,
				slotid: 2,
				preview: null
			},
			{
				active: false,
				slotid: 3,
				preview: null
			},
			{
				active: false,
				slotid: 4,
				preview: null
			},
			{
				active: false,
				slotid: -1,
				preview: null
			},
		],
		'stuff': [
			{
				active: false,
				slotid: 0,
				preview: null
			},
		]
	};

	this.items = this.sets.default;

	this.onEdit = function() {

	}.bind(this)

	this.newTileset = function(name) {

		this.sets[name] = [];
		this.selectTileset({target:{value:name}});
		this.tilesets.value = name;
		this.update();
	}.bind(this)

	this.newTile = function() {

	}.bind(this)

	this.addTileset = function() {
		var el = document.getElementById('js-overlay-newtileset');
		el.classList.remove('hidden');
	}.bind(this)

	this.addTile = function() {
		var el = document.getElementById('js-overlay-newtile');
		el.classList.remove('hidden');
	}.bind(this)

	this.selectTileset = function(evt) {
		var name = evt.target.value;
		this.items = this.sets[name];
		this.update();
	}.bind(this)

	this.selectTile = function(evt) {
		var item = evt.item;
		if (ui.activeTile.slotid === -1) {
			this.addTile();
			return;
		}

		if (ui.activeTile.slotid === item.slotid) {
			return;
		}

		ui.activeTile.active = false;

		item.active = true;
		ui.activeTile = item;

		ui.trigger(ui.Events.SELECT_TILE, item.slotid);
		this.update();
	}.bind(this)

	this.open = function(tool) {
		var el = document.getElementById('js-flyout-tilesets');
		if (tool === ui.Tools.ADD_TILE) {
			el.classList.remove('hidden');
		}
		else {
			el.classList.add('hidden');
		}
	}.bind(this)

	this.on('mount', function(evt) {
		ui.activeTile = this.items[0];

		this.open(ui.Tools.ADD_TILE);
		this.selectTile({item: ui.activeTile});
	});

	ui.on(ui.Events.TOOL_CHANGE, this.open);
	ui.on(ui.Events.NEW_TILESET, this.newTileset);
	ui.on(ui.Events.NEW_TILE, this.newTile);
}, '{ }');
riot.tag2('preview-canvas', '<canvas id="preview"></canvas> <span class="preview__info"> {meshSize} </span>', '', '', function(opts) {
	this.renderer = null;
	this.scene = null;
	this.camera = null;
	this.controls = null;
	this.meshSize = '';

	this.roundTenths = function(val) {
		return Math.round(val * 10) / 10;
	}.bind(this)

	this.addMesh = function(obj) {
		var o = this.scene.children[0];
		while (o) {
			this.scene.remove(o);
			o = this.scene.children[0];
		}
		this.scene.add(obj);

		var box = new THREE.Box3().setFromObject(obj);
		var size = box.size();
		this.meshSize = 'Size {x:'+this.roundTenths(size.x)+' y:'+this.roundTenths(size.y)+' z:'+this.roundTenths(size.z)+'}';

		var fov = this.camera.fov * vg.DEG_TO_RAD;
		var dist = Math.abs(Math.min(size.x, size.z) / Math.sin(fov / 2)) / 2;
		console.log('Camera distance:', dist);

		this.camera.position.set(0, dist, dist);
		this.update();
	}.bind(this)

	this.showTile = function(color) {

		if (ui.activeTileMesh) {
			this.addMesh(ui.activeTileMesh);
		}
		else {

		}
	}.bind(this)

	this.updatePreview = function() {
		this.controls.update();
		this.renderer.render(this.scene, this.camera);
		if (!window.require) {

			requestAnimationFrame(this.updatePreview);
		}
	}.bind(this)

	this.toggle = function(tool) {
		if (tool === ui.Tools.ADD_TILE) {

			ui.previewUpdate = this.updatePreview;
		}
		else {
			ui.previewUpdate = null;
		}
	}.bind(this)

	this.on('mount', function() {
		var width = 208;
		var height = 150;

		this.renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('preview'),
			alpha: true,
			antialias: true
		});
		this.renderer.setClearColor('#fff', 0);
		this.renderer.sortObjects = false;

		this.scene = new THREE.Scene();
		this.scene.add(new THREE.AmbientLight(0xffffff));
		var light = new THREE.DirectionalLight(0xffffff);
		light.position.set(-1, 1, -1).normalize();
		this.scene.add(light);

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);

		this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 5000);
		this.camera.position.set(0, 20, 100);

		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.minDistance = 1;
		this.controls.maxDistance = 10000;
		this.controls.zoomSpeed = 2;

		this.controls.maxPolarAngle = (Math.PI / 2) - 0.01;

		ui.previewUpdate = this.updatePreview;

		if (!window.require) {
			requestAnimationFrame(this.updatePreview);

			var geometry = new THREE.BoxGeometry(20, 20, 20);
			var material = new THREE.MeshPhongMaterial({
				color: 0x156289,
				emissive: 0x072534,
				shading: THREE.FlatShading
			});
			var cube = new THREE.Mesh(geometry, material);
			this.scene.add(cube);
		}
	});

	this.on('error', function(evt) {
		console.error(evt);
	});

	ui.on(ui.Events.TOOL_CHANGE, this.toggle);
	ui.on(ui.Events.NEW_TILE, this.showTile);
}, '{ }');
riot.tag2('lightbox', '<div class="lightbox__overlay absolute" onclick="{dismiss}"></div> <div class="lightbox__panel flex-container"> <yield></yield> <button class="overlay__close-btn" onclick="{dismiss}"><i class="icon-cancel"></i></button> </div>', '', 'class="flex-container absolute hidden"', function(opts) {
	this.dismiss = function() {
		this.root.classList.add('hidden');
	}.bind(this)

	ui.on(ui.Events.HIDE_OVERLAY, this.dismiss);
}, '{ }');
riot.tag2('form-newtileset', '<form onsubmit="{onCreate}"> <label for="tilesetName">Name:</label> <input type="text" name="tilesetName"> <button onclick="{onCreate}">Create</button> </form>', '', 'class="flex-container"', function(opts) {
	this.onCreate = function() {
		ui.trigger(ui.Events.NEW_TILESET, this.tilesetName.value);
		ui.trigger(ui.Events.HIDE_OVERLAY);
	}.bind(this)
}, '{ }');
riot.tag2('form-newtile', '<label> <input type="checkbox" name="generateTile"> Generate </label> <input if="{!generateTile.checked}" type="file" accept=".dae" name="tileFile"> <label if="{generateTile.checked}"> Color: <input name="tileColor" type="color"> </label> <span if="{showMessage}" class="form-newtile__error"> {warningMessage} </span> <button onclick="{onCreate}">Create Tile</button>', '', 'class="flex-container"', function(opts) {
	this.wrongFileType = false;
	this.showMessage = false;
	this.warningMessage = '';
	this.daeLoader = new THREE.ColladaLoader();

	this.onModelLoad = function(obj) {
		ui.activeTileMesh = obj.scene;
		this.onCreate();
	}.bind(this)

	this.onCreate = function() {
		var file = this.tileFile.value;
		var color = this.tileColor.value;

		if (this.wrongFileType) {
			return false;
		}

		if (!file && !this.generateTile.checked) {
			this.warningMessage = 'Please choose to generate a tile, or upload a DAE (Collada) file.';
			this.showMessage = true;
			this.update();
			return false;
		}

		ui.trigger(ui.Events.NEW_TILE, color);
		ui.trigger(ui.Events.HIDE_OVERLAY);
	}.bind(this)

	this.on('mount', function() {
		var self = this;
		this.generateTile.onchange = function(evt) {
			ui.activeTileMesh = null;
			self.showMessage = false;
			self.update();
		};

		this.tileFile.onchange = function(evt) {
			if (self.tileFile.value.split('.')[1] !== 'dae') {
				self.wrongFileType = true;
				self.warningMessage = 'This editor only takes .DAE (Collada) models.';
			}
			else {
				self.wrongFileType = false;
			}
			self.showMessage = self.wrongFileType;
			self.update();

			if (self.showMessage) return false;

			var file = this.files[0];
			if (!file) {
				return;
			}

			ui.activeTileMesh = null;

			var reader = new FileReader();
			reader.onload = function(e) {
				try {
					self.daeLoader.parse(e.target.result, self.onModelLoad, './assets');
				}
				catch (err) {
					self.showMessage = true;
					self.warningMessage = 'There was an error parsing the Collada file: "'+err+'"';
					self.update();
					return false;
				}
			};

			reader.readAsText(file);
		};
	});
}, '{ }');
riot.tag2('form-newmap', '<span> <label for="mapSize">Map size:</label> <input name="mapSize" value="40" min="1" max="{maxMapSize}" type="number"> </span> <span> <label for="cellSize">Cell size:</label> <input name="cellSize" value="10" min="1" type="number"> </span> <span> <button onclick="{onCreate}">Create</button> </span>', '', 'class="flex-container"', function(opts) {
	this.maxMapSize = 1000;

	this.onCreate = function() {
		if (this.mapSize.value > this.maxMapSize) {
			this.mapSize.value = this.maxMapSize;
		}

		ui.trigger(ui.Events.NEW_MAP, this.mapSize.value, this.cellSize.value);
		ui.trigger(ui.Events.HIDE_OVERLAY);
	}.bind(this)
}, '{ }');
riot.tag2('form-map-settings', '<span> <label for="mapSize">Map size:</label> <input name="mapSize" value="5" min="1" max="{maxMapSize}" type="number"> <button onclick="{onMapUpdate}">Create Map</button> </span> <span> <label for="cellSize">Cell size:</label> <input name="cellSize" value="10" min="1" type="number"> <button onclick="{onMapUpdate}">Update Map</button> </span> <span> <label for="heightStep">Height step:</label> <input name="heightStep" value="3" min="1" type="number"> <button onclick="{onMapUpdate}">Update Map</button> </span> <div class="form-group"> <span> <label for="planeSize">Plane size:</label> <input name="planeSize" value="50" min="1" type="number"> </span> <br> <span> <label for="planeColor">Plane color:</label> <input name="planeColor" value="#ffffff" type="color"> </span> <br> <button onclick="{onMapUpdate}">Update Plane</button> <div>', '', 'class="flex-container"', function(opts) {
	this.maxMapSize = 1000;

	this.updateSettings = function(settings) {
		this.mapSize.value = settings.mapSize;
		this.cellSize.value = settings.cellSize;
		this.heightStep.value = settings.heightStep;
		this.maxTileHeight.value = settings.maxTileHeight;
		this.planeSize.value = settings.planeSize;
		this.planeColor.value = settings.planeColor;
		this.update();
	}.bind(this)

	this.onMapUpdate = function() {
		if (this.mapSize.value > this.maxMapSize) {
			this.mapSize.value = this.maxMapSize;
		}

		ui.trigger(ui.Events.UPDATE_SETTINGS, {
			mapSize: parseInt(this.mapSize.value),
			cellSize: parseInt(this.cellSize.value),
			heightStep: parseInt(this.heightStep.value),
			maxTileHeight: parseInt(this.maxTileHeight.value),
			planeSize: parseInt(this.planeSize.value),
			planeColor: this.planeColor.value,
		});

	}.bind(this)

	this.on('mount unmount', function(evt) {
		if (evt === 'mount') {
			ui.on(ui.Events.UPDATE_SETTINGS, this.updateSettings);
		}
		else if (evt === 'unmount') {
			ui.off(ui.Events.UPDATE_SETTINGS, this.updateSettings);
		}
	});
}, '{ }');
riot.tag2('flyout', '<div class="flyout__panel flex-container"> <yield></yield> <button if="{!opts.hideclose}" class="overlay__close-btn {opts.side}" onclick="{dismiss}"><i class="icon-cancel"></i></button> </div>', '', 'class="flex-container {opts.side} hidden"', function(opts) {
	this.dismiss = function() {
		this.root.classList.add('hidden');
	}.bind(this)

	ui.on(ui.Events.HIDE_FLYOUT, this.dismiss);
}, '{ }');
riot.tag2('app-menu', '<ul class="btn-list app-menu__list"> <li class="app-menu__item" onclick="{onClick}" data-action="settings"> <i class="icon-cogs"></i>Map </li> <li class="app-menu__item" onclick="{onClick}" data-action="saveMap"> <i class="icon-download"></i>Save </li> <li class="app-menu__item" onclick="{onClick}" data-action="loadMap"> <i class="icon-cw"></i>Load </li> <li class="app-menu__item" onclick="{onClick}" data-action="showHelp"> <i class="icon-help"></i>Help </li> </ul>', '', '', function(opts) {
	this.onClick = function(evt) {
		var action = evt.target.dataset.action;

		switch (action) {
			case 'settings':
				var el = document.getElementById('js-flyout-settings');
				if (el.classList.contains('hidden')) {
					el.classList.remove('hidden');
				}
				else {
					el.classList.add('hidden');
				}
				break;
			case 'saveMap':
				ui.trigger(ui.Events.SAVE_MAP);
				break;
			case 'loadMap':
				ui.trigger(ui.Events.LOAD_MAP);
				break;
			case 'showHelp':
				var el = document.getElementById('js-overlay-help');
				el.classList.remove('hidden');
				break;
		}
	}.bind(this)
}, '{ }');
var ui = {
	activeTool: null, // Tools.*
	activeTile: null, // ui object describing the tile
	activeTileMesh: null, // what's shown in the preview scene
	previewUpdate: null, // function that should get called every frame to update the preview scene

	Events: {
		TOOL_CHANGE: 'tool-change',
		UPDATE_SETTINGS: 'update-map-settings',
		SELECT_TILE: 'select-tile',
		NEW_TILESET: 'new-tileset',
		NEW_TILE: 'new-tile',
		NEW_MAP: 'new-map',
		SAVE_MAP: 'save-map',
		LOAD_MAP: 'load-map',
		HIDE_OVERLAY: 'ui-hide-overlay',
		HIDE_FLYOUT: 'ui-hide-flyout'
	},

	Tools: {
		ADD_TILE: 'add-tile',
		REMOVE_TILE: 'remove-tile',
		WALK_TILE: 'set-tile-walk',
	}
};

riot.observable(ui);
// riot.mount('*');
riot.mount('tool-menu');
riot.mount('app-menu');
riot.mount('flyout');
riot.mount('lightbox');

//# sourceMappingURL=ui.js.map
