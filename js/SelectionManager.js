/*
	
 */

define(['utils/Tools', 'lib/LinkedList', 'MouseCaster', 'lib/Signal'], function(Tools, LinkedList, MouseCaster, Signal) {

var States = {
	
};

var SelectionManager = function(mouse) {
	this.mouse = mouse;
	
	this.onSelect = new Signal();
	this.onDeselect = new Signal();
	
	this.selected = null;
	// deselect if player clicked on the same thing twice
	this.toggleSelection = false;
	
	// allow multiple entities to be selected at once
	// this.multiselect = false; // todo
	// this.allSelected = new LinkedList();
	
	this.mouse.signal.add(this.onMouse, this);
}

SelectionManager.prototype = {
	select: function(obj) {
		if (!obj) return;
		
		if (this.selected !== obj) {
			// deselect previous object
			this.clearSelection();
		}
		if (obj.selected) {
			if (this.toggleSelection) {
				this.onDeselect.dispatch(obj);
				obj.deselect();
			}
		}
		else {
			obj.select();
		}
		this.selected = obj;
		this.onSelect.dispatch(obj);
	},
	
	clearSelection: function() {
		if (this.selected) {
			this.onDeselect.dispatch(this.selected);
			this.selected.deselect();
		}
		this.selected = null;
	},
	
	onMouse: function(type, obj) {
		switch (type) {
			case MouseCaster.DOWN:
				if (!obj) {
					this.clearSelection();
				}
				break;
				
			case MouseCaster.CLICK:
				this.select(obj);
				break;
		}
	},
	
	_handleSelect: function(current, newObj) {
		if (current && current !== newObj) {
			// deselect previous object
			this.clearSelection();
		}
		if (newObj.selected) {
			if (this.toggleSelection) {
				this.onDeselect.dispatch(newObj);
				newObj.deselect();
			}
		}
		else {
			newObj.select();
		}
		current = newObj;
	}
};

return SelectionManager;

});