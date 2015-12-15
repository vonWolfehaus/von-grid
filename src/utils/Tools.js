define({
	PI: Math.PI,
	TAU: Math.PI * 2,
	DEG_TO_RAD: 0.0174532925,
	RAD_TO_DEG: 57.2957795,

	clamp: function(val, min, max) {
		return Math.max(min, Math.min(max, val));
	},

	sign: function(val) {
		return val && val / Math.abs(val);
	},

	/**
	 * If one value is passed, it will return something from -val to val.
	 * Else it returns a value between the range specified by min, max.
	 */
	random: function(min, max) {
		if (arguments.length === 1) {
			return (Math.random() * min) - (min * 0.5);
		}
		return Math.random() * (max - min) + min;
	},

	// from min to (and including) max
	randomInt: function(min, max) {
		if (arguments.length === 1) {
			return (Math.random() * min) - (min * 0.5) | 0;
		}
		return (Math.random() * (max - min + 1) + min) | 0;
	},

	normalize: function(v, min, max) {
		return (v - min) / (max - min);
	},

	getShortRotation: function(angle) {
		angle %= this.TAU;
		if (angle > this.PI) {
			angle -= this.TAU;
		} else if (angle < -this.PI) {
			angle += this.TAU;
		}
		return angle;
	},

	generateID: function() {
		return Math.random().toString(36).slice(2) + Date.now();
	},

	isPlainObject: function(obj) {
		// Not plain objects:
		// - Any object or value whose internal [[Class]] property is not '[object Object]'
		// - DOM nodes
		// - window
		if (typeof(obj) !== 'object' || obj.nodeType || obj === obj.window) {
			return false;
		}

		// Support: Firefox <20
		// The try/catch suppresses exceptions thrown when attempting to access
		// the 'constructor' property of certain host objects, ie. |window.location|
		// https://bugzilla.mozilla.org/show_bug.cgi?id=814622
		try {
			if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf')) {
				return false;
			}
		} catch (e) {
			return false;
		}

		// If the function hasn't returned already, we're confident that
		// |obj| is a plain object, created by {} or constructed with new Object
		return true;
	},

	merge: function() {
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[0] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if (typeof target === 'boolean') {
			deep = target;
			target = arguments[1] || {};
			// skip the boolean and the target
			i = 2;
		}

		for ( ; i < length; i++) {
			// Only deal with non-null/undefined values
			if ((options = arguments[i]) !== null) {
				// Extend the base object
				for (name in options) {
					src = target[name];
					copy = options[name];

					// Prevent never-ending loop
					if (target === copy) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (this.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && Array.isArray(src) ? src : [];
						}
						else {
							clone = src && this.isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = this.merge(deep, clone, copy);

					}
					else if (copy !== undefined) {
						// Don't bring in undefined values
						target[name] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	},

	now: function() {
		return window.nwf ? window.nwf.system.Performance.elapsedTime : window.performance.now();
	},

	empty: function(node) {
		while (node.lastChild) {
			node.removeChild(node.lastChild);
		}
	},

	/*
		@source: http://jsperf.com/radix-sort
	 */
	radixSort: function(arr, idx_begin, idx_end, bit) {
		idx_begin = idx_begin || 0;
		idx_end = idx_end || arr.length;
		bit = bit || 31;
		if (idx_begin >= (idx_end - 1) || bit < 0) {
			return;
		}
		var idx = idx_begin;
		var idx_ones = idx_end;
		var mask = 0x1 << bit;
		while (idx < idx_ones) {
			if (arr[idx] & mask) {
				--idx_ones;
				var tmp = arr[idx];
				arr[idx] = arr[idx_ones];
				arr[idx_ones] = tmp;
			} else {
				++idx;
			}
		}
		this.radixSort(arr, idx_begin, idx_ones, bit-1);
		this.radixSort(arr, idx_ones, idx_end, bit-1);
	},

	randomizeRGB: function(base, range) {
		var rgb = base.split(',');
		var color = 'rgb(';
		var i, c;
		range = this.randomInt(range);
		for (i = 0; i < 3; i++ ) {
			c = parseInt(rgb[i]) + range;
			if (c < 0) c = 0;
			else if (c > 255) c = 255;
			color += c + ',';
		}
		color = color.substring(0, color.length-1);
		color += ')';
		return color;
	},

	getJSON: function(url, callback, scope) {
		var xhr;
		if (typeof XMLHttpRequest !== 'undefined') {
			xhr = new XMLHttpRequest();
		}
		else {
			var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"];
			for (var i = 0, len = versions.length; i < len; i++) {
				try {
					xhr = new ActiveXObject(versions[i]);
					break;
				} catch (err) { }
			}
		}
		xhr.onreadystatechange = function() {
			if (this.readyState < 4 || this.status !== 200) {
				console.warn('[Tools] Error - '+this.statusText +' - loading '+url);
				return;
			}
			callback.call(scope || this, JSON.parse(this.responseText));
		}
		xhr.open('GET', url, true);
		xhr.send('');
	}
});
