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