var ui = {
	activeTool: null, // Tools.*
	activeTile: null, // ui object describing the tile
	activeTileMesh: null, // what's shown in the preview scene
	previewUpdate: null, // function that should get called every frame to update the preview scene
	tileEditMode: false,
	data: null, // a link to the app data store (require('data'))

	Events: {
		TOOL_CHANGE: 'tool-change',
		UPDATE_SETTINGS: 'update-map-settings',
		SELECT_TILE: 'select-tile',
		NEW_TILESET: 'new-tileset',
		NEW_TILE: 'new-tile',
		EDIT_TILE: 'edit-tile',
		GEN_TILE_PREVIEW: 'gen-tile-pre',
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

riot.mount('tool-menu');
riot.mount('app-menu');
riot.mount('flyout');
riot.mount('lightbox');
