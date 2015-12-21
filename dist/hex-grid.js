(function(THREE) {
var utils_Loader, utils_Tools, pathing_Util, LinkedList, lib_LinkedList, pathing_AStarFinder, Board;
utils_Loader = {
  manager: null,
  imageLoader: null,
  crossOrigin: false,
  init: function (crossOrigin) {
    this.crossOrigin = crossOrigin || false;
    this.manager = new THREE.LoadingManager(function () {
    }, function () {
    }, function () {
      console.warn('Error loading images');
    });
    this.imageLoader = new THREE.ImageLoader(this.manager);
    this.imageLoader.crossOrigin = crossOrigin;
  },
  loadTexture: function (url, mapping, onLoad, onError) {
    var texture = new THREE.Texture(undefined, mapping);
    loader.load(url, function (image) {
      texture.image = image;
      texture.needsUpdate = true;
      if (onLoad)
        onLoad(texture);
    }, undefined, function (event) {
      if (onError)
        onError(event);
    });
    texture.sourceFile = url;
    return texture;
  }
};
utils_Tools = {
  PI: Math.PI,
  TAU: Math.PI * 2,
  DEG_TO_RAD: 0.0174532925,
  RAD_TO_DEG: 57.2957795,
  clamp: function (val, min, max) {
    return Math.max(min, Math.min(max, val));
  },
  sign: function (val) {
    return val && val / Math.abs(val);
  },
  /**
  * If one value is passed, it will return something from -val to val.
  * Else it returns a value between the range specified by min, max.
  */
  random: function (min, max) {
    if (arguments.length === 1) {
      return Math.random() * min - min * 0.5;
    }
    return Math.random() * (max - min) + min;
  },
  // from min to (and including) max
  randomInt: function (min, max) {
    if (arguments.length === 1) {
      return Math.random() * min - min * 0.5 | 0;
    }
    return Math.random() * (max - min + 1) + min | 0;
  },
  normalize: function (v, min, max) {
    return (v - min) / (max - min);
  },
  getShortRotation: function (angle) {
    angle %= this.TAU;
    if (angle > this.PI) {
      angle -= this.TAU;
    } else if (angle < -this.PI) {
      angle += this.TAU;
    }
    return angle;
  },
  generateID: function () {
    return Math.random().toString(36).slice(2) + Date.now();
  },
  isPlainObject: function (obj) {
    // Not plain objects:
    // - Any object or value whose internal [[Class]] property is not '[object Object]'
    // - DOM nodes
    // - window
    if (typeof obj !== 'object' || obj.nodeType || obj === obj.window) {
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
  merge: function () {
    var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
    // Handle a deep copy situation
    if (typeof target === 'boolean') {
      deep = target;
      target = arguments[1] || {};
      // skip the boolean and the target
      i = 2;
    }
    for (; i < length; i++) {
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
            } else {
              clone = src && this.isPlainObject(src) ? src : {};
            }
            // Never move original objects, clone them
            target[name] = this.merge(deep, clone, copy);
          } else if (copy !== undefined) {
            // Don't bring in undefined values
            target[name] = copy;
          }
        }
      }
    }
    // Return the modified object
    return target;
  },
  now: function () {
    return window.nwf ? window.nwf.system.Performance.elapsedTime : window.performance.now();
  },
  empty: function (node) {
    while (node.lastChild) {
      node.removeChild(node.lastChild);
    }
  },
  /*
  @source: http://jsperf.com/radix-sort
  */
  radixSort: function (arr, idx_begin, idx_end, bit) {
    idx_begin = idx_begin || 0;
    idx_end = idx_end || arr.length;
    bit = bit || 31;
    if (idx_begin >= idx_end - 1 || bit < 0) {
      return;
    }
    var idx = idx_begin;
    var idx_ones = idx_end;
    var mask = 1 << bit;
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
    this.radixSort(arr, idx_begin, idx_ones, bit - 1);
    this.radixSort(arr, idx_ones, idx_end, bit - 1);
  },
  randomizeRGB: function (base, range) {
    var rgb = base.split(',');
    var color = 'rgb(';
    var i, c;
    range = this.randomInt(range);
    for (i = 0; i < 3; i++) {
      c = parseInt(rgb[i]) + range;
      if (c < 0)
        c = 0;
      else if (c > 255)
        c = 255;
      color += c + ',';
    }
    color = color.substring(0, color.length - 1);
    color += ')';
    return color;
  },
  getJSON: function (url, callback, scope) {
    var xhr;
    if (typeof XMLHttpRequest !== 'undefined') {
      xhr = new XMLHttpRequest();
    } else {
      var versions = [
        'MSXML2.XmlHttp.5.0',
        'MSXML2.XmlHttp.4.0',
        'MSXML2.XmlHttp.3.0',
        'MSXML2.XmlHttp.2.0',
        'Microsoft.XmlHttp'
      ];
      for (var i = 0, len = versions.length; i < len; i++) {
        try {
          xhr = new ActiveXObject(versions[i]);
          break;
        } catch (err) {
        }
      }
    }
    xhr.onreadystatechange = function () {
      if (this.readyState < 4 || this.status !== 200) {
        console.warn('[Tools] Error - ' + this.statusText + ' - loading ' + url);
        return;
      }
      callback.call(scope || this, JSON.parse(this.responseText));
    };
    xhr.open('GET', url, true);
    xhr.send('');
  }
};
pathing_Util = {
  /**
   * Backtrace according to the parent records and return the path.
   * (including both start and end nodes)
   * @param {Node} node End node
   * @return {Array.<Array.<number>>} the path
   */
  backtrace: function (node) {
    var path = [node];
    while (node.parent) {
      node = node.parent;
      path.push(node);
    }
    return path.reverse();
  },
  /**
   * Backtrace from start and end node, and return the path.
   * (including both start and end nodes)
   * @param {Node}
   * @param {Node}
   */
  biBacktrace: function (nodeA, nodeB) {
    var pathA = backtrace(nodeA), pathB = backtrace(nodeB);
    return pathA.concat(pathB.reverse());
  },
  /**
   * Compute the length of the path.
   * @param {Array.<Array.<number>>} path The path
   * @return {number} The length of the path
   */
  pathLength: function (path) {
    var i, sum = 0, a, b, dx, dy;
    for (i = 1; i < path.length; ++i) {
      a = path[i - 1];
      b = path[i];
      dx = a[0] - b[0];
      dy = a[1] - b[1];
      sum += Math.sqrt(dx * dx + dy * dy);
    }
    return sum;
  },
  /**
   * Given the start and end coordinates, return all the coordinates lying
   * on the line formed by these coordinates, based on Bresenham's algorithm.
   * http://en.wikipedia.org/wiki/Bresenham's_line_algorithm#Simplification
   * @param {number} x0 Start x coordinate
   * @param {number} y0 Start y coordinate
   * @param {number} x1 End x coordinate
   * @param {number} y1 End y coordinate
   * @return {Array.<Array.<number>>} The coordinates on the line
   */
  interpolate: function (x0, y0, x1, y1) {
    var abs = Math.abs, line = [], sx, sy, dx, dy, err, e2;
    dx = abs(x1 - x0);
    dy = abs(y1 - y0);
    sx = x0 < x1 ? 1 : -1;
    sy = y0 < y1 ? 1 : -1;
    err = dx - dy;
    while (true) {
      line.push([
        x0,
        y0
      ]);
      if (x0 === x1 && y0 === y1) {
        break;
      }
      e2 = 2 * err;
      if (e2 > -dy) {
        err = err - dy;
        x0 = x0 + sx;
      }
      if (e2 < dx) {
        err = err + dx;
        y0 = y0 + sy;
      }
    }
    return line;
  },
  /**
   * Given a compressed path, return a new path that has all the segments
   * in it interpolated.
   * @param {Array.<Array.<number>>} path The path
   * @return {Array.<Array.<number>>} expanded path
   */
  expandPath: function (path) {
    var expanded = [], len = path.length, coord0, coord1, interpolated, interpolatedLen, i, j;
    if (len < 2) {
      return expanded;
    }
    for (i = 0; i < len - 1; ++i) {
      coord0 = path[i];
      coord1 = path[i + 1];
      interpolated = interpolate(coord0[0], coord0[1], coord1[0], coord1[1]);
      interpolatedLen = interpolated.length;
      for (j = 0; j < interpolatedLen - 1; ++j) {
        expanded.push(interpolated[j]);
      }
    }
    expanded.push(path[len - 1]);
    return expanded;
  },
  /**
   * Smoothen the give path.
   * The original path will not be modified; a new path will be returned.
   * @param {PF.Grid} grid
   * @param {Array.<Array.<number>>} path The path
   */
  smoothenPath: function (grid, path) {
    var len = path.length, x0 = path[0][0],
      // path start x
      y0 = path[0][1],
      // path start y
      x1 = path[len - 1][0],
      // path end x
      y1 = path[len - 1][1],
      // path end y
      sx, sy,
      // current start coordinate
      ex, ey,
      // current end coordinate
      newPath, i, j, coord, line, testCoord, blocked;
    sx = x0;
    sy = y0;
    newPath = [[
        sx,
        sy
      ]];
    for (i = 2; i < len; ++i) {
      coord = path[i];
      ex = coord[0];
      ey = coord[1];
      line = interpolate(sx, sy, ex, ey);
      blocked = false;
      for (j = 1; j < line.length; ++j) {
        testCoord = line[j];
        if (!grid.isWalkableAt(testCoord[0], testCoord[1])) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        lastValidCoord = path[i - 1];
        newPath.push(lastValidCoord);
        sx = lastValidCoord[0];
        sy = lastValidCoord[1];
      }
    }
    newPath.push([
      x1,
      y1
    ]);
    return newPath;
  },
  /**
   * Compress a path, remove redundant nodes without altering the shape
   * The original path is not modified
   * @param {Array.<Array.<number>>} path The path
   * @return {Array.<Array.<number>>} The compressed path
   */
  compressPath: function (path) {
    // nothing to compress
    if (path.length < 3) {
      return path;
    }
    var compressed = [], sx = path[0][0],
      // start x
      sy = path[0][1],
      // start y
      px = path[1][0],
      // second point x
      py = path[1][1],
      // second point y
      dx = px - sx,
      // direction between the two points
      dy = py - sy,
      // direction between the two points
      lx, ly, ldx, ldy, sq, i;
    // normalize the direction
    sq = Math.sqrt(dx * dx + dy * dy);
    dx /= sq;
    dy /= sq;
    // start the new path
    compressed.push([
      sx,
      sy
    ]);
    for (i = 2; i < path.length; i++) {
      // store the last point
      lx = px;
      ly = py;
      // store the last direction
      ldx = dx;
      ldy = dy;
      // next point
      px = path[i][0];
      py = path[i][1];
      // next direction
      dx = px - lx;
      dy = py - ly;
      // normalize
      sq = Math.sqrt(dx * dx + dy * dy);
      dx /= sq;
      dy /= sq;
      // if the direction has changed, store the point
      if (dx !== ldx || dy !== ldy) {
        compressed.push([
          lx,
          ly
        ]);
      }
    }
    // store the last point
    compressed.push([
      px,
      py
    ]);
    return compressed;
  }
};
LinkedList = function () {
  var LinkedListNode = function () {
    this.obj = null;
    this.next = null;
    this.prev = null;
    this.free = true;
  };
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
  var LinkedList = function () {
    this.first = null;
    this.last = null;
    this.length = 0;
    this.objToNodeMap = {};
    // a quick lookup list to map linked list nodes to objects
    this.uniqueID = Date.now() + '' + Math.floor(Math.random() * 1000);
    this.sortArray = [];
    /*
    Get the LinkedListNode for this object.
    @param obj The object to get the node for
    */
    this.getNode = function (obj) {
      // objects added to a list must implement a uniqueID which returns a unique object identifier string
      return this.objToNodeMap[obj.uniqueID];
    };
    /*
    Adds a new node to the list -- typically only used internally unless you're doing something funky
    Use add() to add an object to the list, not this.
    */
    this.addNode = function (obj) {
      var node = new LinkedListNode();
      if (!obj.uniqueID) {
        try {
          obj.uniqueID = LinkedList.generateID();
          console.log('New ID: ' + obj.uniqueID);
        } catch (err) {
          console.error('[LinkedList.addNode] obj passed is immutable: cannot attach necessary identifier');
          return null;
        }
      }
      node.obj = obj;
      node.free = false;
      this.objToNodeMap[obj.uniqueID] = node;
      return node;
    };
    this.swapObjects = function (node, newObj) {
      this.objToNodeMap[node.obj.uniqueID] = null;
      this.objToNodeMap[newObj.uniqueID] = node;
      node.obj = newObj;
    };
    /*
    Add an item to the list
    @param obj The object to add
    */
    this.add = function (obj) {
      var node = this.objToNodeMap[obj.uniqueID];
      if (!node) {
        node = this.addNode(obj);
      } else {
        if (node.free === false)
          return;
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
      if (!this.first) {
        // is this the first?
        this.first = node;
        this.last = node;
        node.next = null;
        // clear just in case
        node.prev = null;
      } else {
        if (!this.last) {
          throw new Error('[LinkedList.add] No last in the list -- that shouldn\'t happen here');
        }
        // add this entry to the end of the list
        this.last.next = node;
        // current end of list points to the new end
        node.prev = this.last;
        this.last = node;
        // new object to add becomes last in the list
        node.next = null;  // just in case this was previously set
      }
      this.length++;
      if (this.showDebug)
        this.dump('after add');
    };
    this.has = function (obj) {
      return !!this.objToNodeMap[obj.uniqueID];
    };
    /*
    Moves this item upwards in the list
    @param obj
    */
    this.moveUp = function (obj) {
      this.dump('before move up');
      var c = this.getNode(obj);
      if (!c)
        throw 'Oops, trying to move an object that isn\'t in the list';
      if (!c.prev)
        return;
      // already first, ignore
      // This operation makes C swap places with B:
      // A <-> B <-> C <-> D
      // A <-> C <-> B <-> D
      var b = c.prev;
      var a = b.prev;
      // fix last
      if (c == this.last)
        this.last = b;
      var oldCNext = c.next;
      if (a)
        a.next = c;
      c.next = b;
      c.prev = b.prev;
      b.next = oldCNext;
      b.prev = c;
      // check to see if we are now first
      if (this.first == b)
        this.first = c;
    };
    /*
    Moves this item downwards in the list
    @param obj
    */
    this.moveDown = function (obj) {
      var b = this.getNode(obj);
      if (!b)
        throw 'Oops, trying to move an object that isn\'t in the list';
      if (!b.next)
        return;
      // already last, ignore
      // This operation makes B swap places with C:
      // A <-> B <-> C <-> D
      // A <-> C <-> B <-> D
      var c = b.next;
      this.moveUp(c.obj);
      // check to see if we are now last
      if (this.last == c)
        this.last = b;
    };
    /*
    Take everything off the list and put it in an array, sort it, then put it back.
    */
    this.sort = function (compare) {
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
    };
    /*
    Removes an item from the list
    @param obj The object to remove
    @returns boolean true if the item was removed, false if the item was not on the list
    */
    this.remove = function (obj) {
      var node = this.getNode(obj);
      if (!node || node.free) {
        return false;  // ignore this error (trying to remove something not there)
      }
      // pull this object out and tie up the ends
      if (node.prev)
        node.prev.next = node.next;
      if (node.next)
        node.next.prev = node.prev;
      // fix first and last
      if (!node.prev)
        // if this was first on the list
        this.first = node.next;
      // make the next on the list first (can be null)
      if (!node.next)
        // if this was the last
        this.last = node.prev;
      // then this node's previous becomes last
      node.free = true;
      node.prev = null;
      node.next = null;
      this.length--;
      return true;
    };
    // remove the head and return it's object
    this.shift = function () {
      var node = this.first;
      if (this.length === 0)
        return null;
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
      if (!node.next)
        this.last = null;
      // make sure we clear this
      node.free = true;
      node.prev = null;
      node.next = null;
      this.length--;
      return node.obj;
    };
    // remove the tail and return it's object
    this.pop = function () {
      var node = this.last;
      if (this.length === 0)
        return null;
      // pull this object out and tie up the ends
      if (node.prev) {
        node.prev.next = node.next;
      }
      if (node.next) {
        node.next.prev = node.prev;
      }
      // this node's previous becomes last
      this.last = node.prev;
      if (!node.prev)
        this.first = null;
      // make sure we clear this
      node.free = true;
      node.prev = null;
      node.next = null;
      this.length--;
      return node.obj;
    };
    /**
    * Add the passed list to this list, leaving it untouched.
    */
    this.concat = function (list) {
      var node = list.first;
      while (node) {
        this.add(node.obj);
        node = node.next;
      }
    };
    /**
    * Clears the list out
    */
    this.clear = function () {
      var next = this.first;
      while (next) {
        next.free = true;
        next = next.next;
      }
      this.first = null;
      this.length = 0;
    };
    this.dispose = function () {
      var next = this.first;
      while (next) {
        next.obj = null;
        next = next.next;
      }
      this.first = null;
      this.objToNodeMap = null;
    };
    /*
    Outputs the contents of the current list for debugging.
    */
    this.dump = function (msg) {
      console.log('====================' + msg + '=====================');
      var a = this.first;
      while (a) {
        console.log('{' + a.obj.toString() + '} previous=' + (a.prev ? a.prev.obj : 'NULL'));
        a = a.next();
      }
      console.log('===================================');
      console.log('Last: {' + (this.last ? this.last.obj : 'NULL') + '} ' + 'First: {' + (this.first ? this.first.obj : 'NULL') + '}');
    };
  };
  // static function for utility
  LinkedList.generateID = function () {
    return Math.random().toString(36).slice(2) + Date.now();
  };
  return LinkedList;
}();
lib_LinkedList = undefined;
pathing_AStarFinder = function (Tools, Util, LinkedList) {
  /*
  	A* path-finder based upon http://www.redblobgames.com/pathfinding/a-star/introduction.html
  	@author Corey Birnbaum https://github.com/vonWolfehaus/
   */
  function AStarFinder(finderConfig) {
    finderConfig = finderConfig || {};
    this.allowDiagonal = false;
    this.heuristicFilter = null;
    Tools.merge(this, finderConfig);
    this.list = new LinkedList();
  }
  AStarFinder.prototype = {
    /*
    Find and return the path.
    @return Array<Cell> The path, including both start and end positions. Null if it failed.
    */
    findPath: function (startNode, endNode, heuristic, grid) {
      var current, costSoFar, neighbors, neighbor, i, l;
      heuristic = heuristic || this.heuristicFilter;
      // clear old values from previous finding
      grid.clearPath();
      this.list.clear();
      // push the start current into the open list
      this.list.add(startNode);
      // while the open list is not empty
      while (this.list.length > 0) {
        // sort so lowest cost is first
        this.list.sort(this.compare);
        // pop the position of current which has the minimum `calcCost` value.
        current = this.list.shift();
        current.visited = true;
        // if reached the end position, construct the path and return it
        if (current === endNode) {
          return Util.backtrace(endNode);
        }
        // cycle through each neighbor of the current current
        neighbors = grid.getNeighbors(current, this.allowDiagonal, heuristic);
        for (i = 0, l = neighbors.length; i < l; i++) {
          neighbor = neighbors[i];
          if (!neighbor.walkable) {
            continue;
          }
          costSoFar = current.calcCost + grid.distance(current, neighbor);
          // check if the neighbor has not been inspected yet, or can be reached with smaller cost from the current current
          if (!neighbor.visited || costSoFar < neighbor.calcCost) {
            neighbor.visited = true;
            neighbor.parent = current;
            neighbor.calcCost = costSoFar;
            // priority is the most important property, since it makes the algorithm "greedy" and seek the goal.
            // otherwise it behaves like a brushfire/breadth-first.
            neighbor.priority = costSoFar + grid.distance(endNode, neighbor);
            // check neighbor if it's the end current as well--often cuts steps by a significant amount
            if (neighbor === endNode) {
              return Util.backtrace(endNode);
            }
            this.list.add(neighbor);
          }
        }  // end for each neighbor
      }
      // end while not open list empty
      // failed to find the path
      return null;
    },
    compare: function (nodeA, nodeB) {
      return nodeA.priority - nodeB.priority;
    }
  };
  return AStarFinder;
}(utils_Tools, pathing_Util, lib_LinkedList);
Board = function (Loader, AStarFinder) {
  var Board = function (grid, finderConfig) {
    if (!grid)
      throw new Error('You must pass in a grid system for the board to use.');
    // this.pieces = []; // haven't found a use for this yet
    this.group = new THREE.Object3D();
    this.grid = null;
    this.finder = new AStarFinder(finderConfig);
    // need to keep a resource cache around, so this Loader does that, use it instead of THREE.ImageUtils
    Loader.init();
    this.setGrid(grid);
  };
  // useful enums for type checking. change to whatever fits your game. these are just examples
  Board.Cell = 'cell';
  Board.Entity = 'entity';
  // dynamic things
  Board.Structure = 'structure';
  // static things
  Board.prototype = {
    // smoothly animate a piece from its current position to the cell
    moveEntityToCell: function (entity, cell) {
    },
    // immediately snap a piece to a cell; doesn't have to be a member of the board, merely copies position
    placeEntityAtCell: function (entity, cell) {
      this.grid.cellToPixel(cell, entity.position);
      entity.position.y += entity.offsetY;
      // remove entity from old cell
      if (entity.cell) {
        entity.cell.entity = null;
      }
      // set new situation
      entity.cell = cell;
      cell.entity = entity;
    },
    findPath: function (startCell, endCell, heuristic) {
      return this.finder.findPath(startCell, endCell, heuristic, this.grid);
    },
    getRandomCell: function () {
      return this.grid.getRandomCell();
    },
    // rotate the board either left (-1, default) or right (1)
    rotate: function (direction, animate) {
      animate = animate || false;
      if (animate) {
      } else {
        this.group.rotation.y += this.grid.rotationIncrement * (direction || -1) * 2;
      }
    },
    // i think it's better to grab cells from the grid, then check the entities on them instead
    /*addPieceAt: function(entity, cell) {
    		this.pieces.push(entity);
    
    		entity.disable();
    		entity.container = this.group;
    		entity.placeEntityAtCell(entity, cell);
    	},
    
    	removePiece: function(entity) {
    		var i = this.pieces.indexOf(entity);
    		this.pieces.splice(i, 1);
    
    		entity.disable();
    	},
    
    	clear: function() {
    		this.pieces.length = 0;
    		// does not dig into children of children because they'll be removed when their parent is removed anyway
    		this.group.children.length = 0;
    	},*/
    setGrid: function (newGrid) {
      if (this.grid) {
        this.group.remove(this.grid.group);
      }
      this.grid = newGrid;
      this.group.add(newGrid.group);
    }
  };
  return Board;
}(utils_Loader, pathing_AStarFinder);}(typeof THREE !== "undefined" ? THREE : null));