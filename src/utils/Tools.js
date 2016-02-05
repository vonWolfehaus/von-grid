vg.Tools = {
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
		}
		else if (angle < -this.PI) {
			angle += this.TAU;
		}
		return angle;
	},

	generateID: function() {
		return Math.random().toString(36).slice(2) + Date.now();
	},

	isPlainObject: function(obj) {
		if (typeof(obj) !== 'object' || obj.nodeType || obj === obj.window) {
			return false;
		}
		// The try/catch suppresses exceptions thrown when attempting to access the 'constructor' property of certain host objects, ie. |window.location|
		// https://bugzilla.mozilla.org/show_bug.cgi?id=814622
		try {
			if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf')) {
				return false;
			}
		}
		catch (err) {
			return false;
		}
		// If the function hasn't returned already, we're confident that
		// |obj| is a plain object, created by {} or constructed with new Object
		return true;
	},

	// https://github.com/KyleAMathews/deepmerge/blob/master/index.js
	merge: function(target, src) {
		var self = this, array = Array.isArray(src);
		var dst = array && [] || {};
		if (array) {
			target = target || [];
			dst = dst.concat(target);
			src.forEach(function(e, i) {
				if (typeof dst[i] === 'undefined') {
					dst[i] = e;
				}
				else if (self.isPlainObject(e)) {
					dst[i] = self.merge(target[i], e);
				}
				else {
					if (target.indexOf(e) === -1) {
						dst.push(e);
					}
				}
			});
			return dst;
		}
		if (target && self.isPlainObject(target)) {
			Object.keys(target).forEach(function (key) {
				dst[key] = target[key];
			});
		}
		Object.keys(src).forEach(function (key) {
			if (!src[key] || !self.isPlainObject(src[key])) {
				dst[key] = src[key];
			}
			else {
				if (!target[key]) {
					dst[key] = src[key];
				}
				else {
					dst[key] = self.merge(target[key], src[key]);
				}
			}
		});
		return dst;
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
	radixSort: function(arr, idxBegin, idxEnd, bit) {
		idxBegin = idxBegin || 0;
		idxEnd = idxEnd || arr.length;
		bit = bit || 31;
		if (idxBegin >= (idxEnd - 1) || bit < 0) {
			return;
		}
		var idx = idxBegin;
		var idxOnes = idxEnd;
		var mask = 0x1 << bit;
		while (idx < idxOnes) {
			if (arr[idx] & mask) {
				--idxOnes;
				var tmp = arr[idx];
				arr[idx] = arr[idxOnes];
				arr[idxOnes] = tmp;
			}
			else {
				++idx;
			}
		}
		this.radixSort(arr, idxBegin, idxOnes, bit-1);
		this.radixSort(arr, idxOnes, idxEnd, bit-1);
	},

	randomizeRGB: function(base, range) {
		var rgb = base.split(',');
		var color = 'rgb(';
		var i, c;
		range = this.randomInt(range);
		for (i = 0; i < 3; i++) {
			c = parseInt(rgb[i]) + range;
			if (c < 0) c = 0;
			else if (c > 255) c = 255;
			color += c + ',';
		}
		color = color.substring(0, color.length-1);
		color += ')';
		return color;
	},

	getJSON: function(config) {
		var xhr = new XMLHttpRequest();
		var uri = config.cache ? config.url : config.url + '?t=' + Math.floor(Math.random() * 10000) + Date.now();
		xhr.onreadystatechange = function() {
			if (this.status === 200) {
				var json = null;
				try {
					json = JSON.parse(this.responseText);
				}
				catch (err) {
					// console.warn('[Tools.getJSON] Error: '+config.url+' is not a json resource');
					return;
				}
				config.callback.call(config.scope || null, json);
				return;
			}
			else if (this.status !== 0) {
				console.warn('[Tools.getJSON] Error: '+this.status+' ('+this.statusText+') :: '+config.url);
			}
		}
		xhr.open('GET', uri, true);
		xhr.setRequestHeader('Accept', 'application/json');
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.send('');
	}
};
