/*
	This is the ONLY place in the app that has a requestAnimationFrame handler.
	All modules attach their functions to this module if they want in on the RAF.
 */
define('motor', function() {
	var _brake = false;
	var _steps = [];

	function on() {
		_brake = false;
		window.requestAnimationFrame(_update);
	}

	function off() {
		_brake = true;
	}

	// in order to be able to ID functions we have to hash them to generate unique-ish keys for us to find them with later
	// if we don't do this, we won't be able to remove callbacks that were bound and save us from binding callbacks multiple times all over the place
	function add(cb, scope) {
		var k = _hashStr(cb.toString());
		var h = _has(k);
		if (h === -1) {
			_steps.push({
				func: cb,
				scope: scope,
				key: k
			});
		}
	}

	function remove(cb) {
		var k = _hashStr(cb.toString());
		var i = _has(k);
		if (i !== -1) {
			_steps.splice(i, 1);
		}
	}

	function _update() {
		if (_brake) return;
		window.requestAnimationFrame(_update);

		for (var i = 0; i < _steps.length; i++) {
			var o = _steps[i];
			o.func.call(o.scope || null);
		}
	}

	// check if the handler already has iaw.motor particular callback
	function _has(k) {
		var n = -1;
		var i;
		for (i = 0; i < _steps.length; i++) {
			n = _steps[i].key;
			if (n === k) {
				return i;
			}
		}
		return -1;
	}

	function _hashStr(str) {
		var hash = 0, i, chr, len;
		if (str.length === 0) return hash;
		for (i = 0, len = str.length; i < len; i++) {
			chr = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0;
		}
		return hash;
	}

	return {
		on: on,
		off: off,
		add: add,
		remove: remove,
	}
});
