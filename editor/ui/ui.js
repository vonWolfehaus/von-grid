var ui = {
	activeTool: null,

	Events: {
		TOOL_CHANGE: 'tool-change',
		NEW_MAP: 'new-map',
		SAVE_MAP: 'save-map',
		LOAD_MAP: 'load-map',
		HIDE_OVERLAY: 'ui-hide-overlay'
	},

	Tools: {
		ADD_TILE: 'Add Tile',
		REMOVE_TILE: 'Remove Tile',
	}
};

riot.observable(ui);
riot.mount('*');
