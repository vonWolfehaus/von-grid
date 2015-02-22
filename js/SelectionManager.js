/*
	
 */

define(['utils/Tools', 'lib/LinkedList', 'MouseCaster', 'lib/Signal'], function(Tools, LinkedList, MouseCaster, Signal) {

var States = {
	
};

var SelectionManager = function(mouse) {
	this.mouse = mouse;
	
	this.onSelect = new Signal();
	this.onDeselect = new Signal();
	
	// allow selection of board cells; if false, will only manage entity selection
	this.selectCells = true;
	// allow multiple entities to be selected at once
	this.multiselect = false;
	
	// any piece sitting on the active cell, or just the selected piece (whichever suits the game)
	// this.activeEntity = null;
	// this.activeEntities = new LinkedList();
	// our custom structure that holds the cell geo
	this.activeCell = null;
	this.activeCells = new LinkedList();
	
	this.mouse.signal.add(this.onMouse, this);
}

SelectionManager.prototype = {
	select: function(obj) {
		if (!obj) return;
		
		this.activeCell = obj;
		this.activeCell.select();
		
		this.onSelect.dispatch(this.activeCell);
	},
	
	deselect: function() {
		if (!this.activeCell) return;
		this.onDeselect.dispatch(this.activeCell);
		
		this.activeCell.deselect();
		
		this.activeCell = null;
		// this.activeEntity = null;
	},
	
	onMouse: function(type, obj) {
		switch (type) {
			case MouseCaster.DOWN:
				if (!obj) {
					this.deselect();
				}
				break;
				
			case MouseCaster.CLICK:
				if (this.activeCell && obj === this.activeCell.obj) {
					break; // ignore click on same obj
				}
				this.deselect();
				if (obj) {
					this.select(obj);
				}
				break;
		}
	}
};

return SelectionManager;

});