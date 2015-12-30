/*
	A high-speed doubly-linked list of objects. Note that for speed reasons (using a dictionary lookup of
	cached nodes) there can only be a single instance of an object in the list at the same time. Adding the same
	object a second time will result in a silent return from the add method.

	In order to keep a track of node links, an object must be able to identify itself with a uniqueID function.

	To add an item use:
	<pre><code>
	  list.add(newItem);
	</code></pre>
	<p>
	You can iterate using the first and next members, such as:
	<pre><code>
	  var node = list.first;
	  while (node)
	  {
	      node.object().DOSOMETHING();
	      node = node.next();
	  }
	</code></pre>
 */
(function() {
	var LinkedListNode = function() {
		this.obj = null;
		this.next = null;
		this.prev = null;
		this.free = true;
	};

	var LinkedList = function() {
		this.first = null;
		this.last = null;
		this.length = 0;
		this.objToNodeMap = {}; // a quick lookup list to map linked list nodes to objects
		this.uniqueID = Date.now() + '' + Math.floor(Math.random()*1000);

		this.sortArray = [];
	};

	// static function for utility
	LinkedList.generateID = function() {
		return Math.random().toString(36).slice(2) + Date.now();
	};

	LinkedList.prototype = {
		/*
			Get the LinkedListNode for this object.
			@param obj The object to get the node for
		 */
		getNode: function(obj) {
			// objects added to a list must implement a uniqueID which returns a unique object identifier string
			return this.objToNodeMap[obj.uniqueID];
		},

		/*
			Adds a new node to the list -- typically only used internally unless you're doing something funky
			Use add() to add an object to the list, not this.
		 */
		addNode: function(obj) {
			var node = new LinkedListNode();
			if (!obj.uniqueID) {
				try {
					obj.uniqueID = LinkedList.generateID();
					console.log('New ID: '+obj.uniqueID);
				}
				catch (err) {
					console.error('[LinkedList.addNode] obj passed is immutable: cannot attach necessary identifier');
					return null;
				}
			}

			node.obj = obj;
			node.free = false;
			this.objToNodeMap[obj.uniqueID] = node;
			return node;
		},

		swapObjects: function(node, newObj) {
			this.objToNodeMap[node.obj.uniqueID] = null;
			this.objToNodeMap[newObj.uniqueID] = node;
			node.obj = newObj;
		},

		/*
			Add an item to the list
			@param obj The object to add
		 */
		add: function(obj) {
			var node = this.objToNodeMap[obj.uniqueID];

			if (!node) {
				node = this.addNode(obj);
			}
			else {
				if (node.free === false) return;

				// reusing a node, so we clean it up
				// this caching of node/object pairs is the reason an object can only exist
				// once in a list -- which also makes things faster (not always creating new node
				// object every time objects are moving on and off the list
				node.obj = obj;
				node.free = false;
				node.next = null;
				node.prev = null;
			}

			// append this obj to the end of the list
			if (!this.first) { // is this the first?
				this.first = node;
				this.last = node;
				node.next = null; // clear just in case
				node.prev = null;
			}
			else {
				if (!this.last) {
					throw new Error("[LinkedList.add] No last in the list -- that shouldn't happen here");
				}

				// add this entry to the end of the list
				this.last.next = node; // current end of list points to the new end
				node.prev = this.last;
				this.last = node;            // new object to add becomes last in the list
				node.next = null;      // just in case this was previously set
			}
			this.length++;

			if (this.showDebug) this.dump('after add');
		},

		has: function(obj) {
			return !!this.objToNodeMap[obj.uniqueID];
		},

		/*
			Moves this item upwards in the list
			@param obj
		 */
		moveUp: function(obj) {
			this.dump('before move up');
			var c = this.getNode(obj);
			if (!c) throw "Oops, trying to move an object that isn't in the list";
			if (!c.prev) return; // already first, ignore

			// This operation makes C swap places with B:
			// A <-> B <-> C <-> D
			// A <-> C <-> B <-> D

			var b = c.prev;
			var a = b.prev;

			// fix last
			if (c == this.last) this.last = b;

			var oldCNext = c.next;

			if (a) a.next = c;
			c.next = b;
			c.prev = b.prev;

			b.next = oldCNext;
			b.prev = c;

			// check to see if we are now first
			if (this.first == b) this.first = c;
		},

		/*
			Moves this item downwards in the list
			@param obj
		 */
		moveDown: function(obj) {
			var b = this.getNode(obj);
			if (!b) throw "Oops, trying to move an object that isn't in the list";
			if (!b.next) return; // already last, ignore

			// This operation makes B swap places with C:
			// A <-> B <-> C <-> D
			// A <-> C <-> B <-> D

			var c = b.next;
			this.moveUp(c.obj);

			// check to see if we are now last
			if (this.last == c) this.last = b;
		},

		/*
			Take everything off the list and put it in an array, sort it, then put it back.
		 */
		sort: function(compare) {
			var sortArray = this.sortArray;
			var i, l, node = this.first;
			sortArray.length = 0;

			while (node) {
				sortArray.push(node.obj);
				node = node.next;
			}

			this.clear();

			sortArray.sort(compare);
			// console.log(sortArray);
			l = sortArray.length;
			for (i = 0; i < l; i++) {
				this.add(sortArray[i]);
			}
		},

		/*
			Removes an item from the list
			@param obj The object to remove
			@returns boolean true if the item was removed, false if the item was not on the list
		 */
		remove: function(obj) {
			var node = this.getNode(obj);
			if (!node || node.free){
				return false; // ignore this error (trying to remove something not there)
			}

			// pull this object out and tie up the ends
			if (node.prev) node.prev.next = node.next;
			if (node.next) node.next.prev = node.prev;

			// fix first and last
			if (!node.prev) // if this was first on the list
				this.first = node.next; // make the next on the list first (can be null)
			if (!node.next) // if this was the last
				this.last = node.prev; // then this node's previous becomes last

			node.free = true;
			node.prev = null;
			node.next = null;

			this.length--;

			return true;
		},

		// remove the head and return it's object
		shift: function() {
			var node = this.first;
			if (this.length === 0) return null;
			// if (node == null || node.free == true) return null;

			// pull this object out and tie up the ends
			if (node.prev) {
				node.prev.next = node.next;
			}
			if (node.next) {
				node.next.prev = node.prev;
			}

			// make the next on the list first (can be null)
			this.first = node.next;
			if (!node.next) this.last = null; // make sure we clear this

			node.free = true;
			node.prev = null;
			node.next = null;

			this.length--;
			return node.obj;
		},

		// remove the tail and return it's object
		pop: function() {
			var node = this.last;
			if (this.length === 0) return null;

			// pull this object out and tie up the ends
			if (node.prev) {
				node.prev.next = node.next;
			}
			if (node.next) {
				node.next.prev = node.prev;
			}

			// this node's previous becomes last
			this.last = node.prev;
			if (!node.prev) this.first = null; // make sure we clear this

			node.free = true;
			node.prev = null;
			node.next = null;

			this.length--;
			return node.obj;
		},

		/**
		 * Add the passed list to this list, leaving it untouched.
		 */
		concat: function(list) {
			var node = list.first;
			while (node) {
				this.add(node.obj);
				node = node.next;
			}
		},

		/**
		 * Clears the list out
		 */
		clear: function() {
			var next = this.first;

			while (next) {
				next.free = true;
				next = next.next;
			}

			this.first = null;
			this.length = 0;
		},

		dispose: function() {
			var next = this.first;

			while (next) {
				next.obj = null;
				next = next.next;
			}
			this.first = null;

			this.objToNodeMap = null;
		},

		/*
			Outputs the contents of the current list for debugging.
		 */
		dump: function(msg) {
			console.log('====================' + msg + '=====================');
			var a = this.first;
			while (a) {
				console.log("{" + a.obj.toString() + "} previous=" + (a.prev ? a.prev.obj : "NULL"));
				a = a.next();
			}
			console.log("===================================");
			console.log("Last: {" + (this.last ? this.last.obj : 'NULL') + "} " +
				"First: {" + (this.first ? this.first.obj : 'NULL') + "}");
		}
	};

	LinkedList.prototype.constructor = LinkedList;

	hg.LinkedList = LinkedList;
}());