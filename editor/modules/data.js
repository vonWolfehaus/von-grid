/*
	Handles JSON for whatever data needs to be saved to localStorage, and provides a convenient signal for whenever that data changes.
*/
define('data', {
	_store: {},
	changed: new vg.Signal(),

	get: function(key) {
		return this._store[key] || null;
	},

	set: function(key, val) {
		// fire event first so we can retrieve old data before it's overwritten (just in case)
		this.changed.dispatch(key, this._store[key], val);
		this._store[key] = val;
	},

	save: function() {
		window.localStorage['vongrid'] = JSON.stringify(this._store);
	},

	load: function(json) {
		var data = window.localStorage['vongrid'];
		if (json || data) {
			try {
				this._store = json || JSON.parse(data);
				this.changed.dispatch('load-success');
			}
			catch (err) {
				console.warn('Error loading editor data');
				this.changed.dispatch('load-failure');
			}
		}
	}
});