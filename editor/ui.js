riot.tag2('tool-menu', '<ul class="tool-menu__list"> <li class="tool-menu__item {tool-menu__item--active: active}" each="{items}" data="{this}" title="{displayText}" onclick="{parent.clickTool}"> <img riot-src="images/{icon}"> </li> </ul>', '', '', function(opts) {
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

	this.clickTool = function(evt) {
		var item = evt.item;
		if (ui.activeTool.name === item.name) return;

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
riot.tag2('lightbox', '<div class="lightbox__overlay absolute" onclick="{dismiss}"></div> <div class="lightbox__panel flex-container"> <yield></yield> <button class="overlay__close-btn" onclick="{dismiss}"><i class="icon-cancel"></i></button> </div>', '', 'class="flex-container absolute hidden"', function(opts) {
	this.dismiss = function() {
		this.root.classList.add('hidden');
	}.bind(this)

	ui.on(ui.Events.HIDE_OVERLAY, this.dismiss);
}, '{ }');
riot.tag2('form-newmap', '<span> <label for="mapSize">Map size:</label> <input name="mapSize" value="40" min="1" max="{maxMapSize}" type="number"> </span> <span> <label for="cellSize">Cell size:</label> <input name="cellSize" value="10" min="1" type="number"> </span> <span> <button onclick="{onCreate}">Create</buttn> </span>', '', 'class="flex-container"', function(opts) {
	this.maxMapSize = 1000;

	this.onCreate = function() {
		if (this.mapSize.value > this.maxMapSize) {
			this.mapSize.value = this.maxMapSize;
		}

		ui.trigger(ui.Events.NEW_MAP, this.mapSize.value, this.cellSize.value);
		ui.trigger(ui.Events.HIDE_OVERLAY);
	}.bind(this)
}, '{ }');
riot.tag2('form-map-settings', '<span> <label for="mapSize">Map size:</label> <input name="mapSize" value="5" min="1" max="{maxMapSize}" type="number"> <button onclick="{onMapUpdate}">Create Map</button> </span> <span> <label for="cellSize">Cell size:</label> <input name="cellSize" value="10" min="1" type="number"> <button onclick="{onMapUpdate}">Update Map</button> </span> <span> <label for="heightStep">Height step:</label> <input name="heightStep" value="3" min="1" type="number"> <button onclick="{onMapUpdate}">Update Map</button> </span> <span> <label for="maxTileHeight">Max Tile Height:</label> <input name="maxTileHeight" value="30" min="1" type="number"> <button onclick="{onMapUpdate}">Update</button> </span> <div class="form-group"> <span> <label for="planeSize">Plane size:</label> <input name="planeSize" value="50" min="1" type="number"> </span> <br> <span> <label for="planeColor">Plane color:</label> <input name="planeColor" value="#ffffff" type="color"> </span> <br> <button onclick="{onMapUpdate}">Update Plane</button> <div>', '', 'class="flex-container"', function(opts) {
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
riot.tag2('flyout', '<div class="flyout__panel flex-container"> <yield></yield> <button class="overlay__close-btn" onclick="{dismiss}"><i class="icon-cancel"></i></button> </div>', '', 'class="flex-container hidden"', function(opts) {
	this.dismiss = function() {
		this.root.classList.add('hidden');
	}.bind(this)

	ui.on(ui.Events.HIDE_FLYOUT, this.dismiss);
}, '{ }');
riot.tag2('app-menu', '<ul class="app-menu__list"> <li class="app-menu__item" onclick="{onClick}" data-action="settings"> <i class="icon-cogs"></i>Map </li> <li class="app-menu__item" onclick="{onClick}" data-action="saveMap"> <i class="icon-download"></i>Save </li> <li class="app-menu__item" onclick="{onClick}" data-action="loadMap"> <i class="icon-cw"></i>Load </li> <li class="app-menu__item" onclick="{onClick}" data-action="showHelp"> <i class="icon-help"></i>Help </li> </ul>', '', '', function(opts) {
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
	activeTool: null,

	Events: {
		TOOL_CHANGE: 'tool-change',
		UPDATE_SETTINGS: 'update-map-settings',
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
riot.mount('*');

//# sourceMappingURL=ui.js.map
