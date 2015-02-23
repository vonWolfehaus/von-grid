/*
	@source https://github.com/qiao/PathFinding.js/
*/

define(['Tools', 'pathing/Util', 'lib/heap', 'pathing/Heuristic', 'pathing/DiagonalMovement'], function(Tools, Util, Heap, Heuristic, DiagonalMovement) {

/**
 * A* path-finder.
 * based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed. Deprecated, use diagonalMovement instead.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners. Deprecated, use diagonalMovement instead.
 * @param {DiagonalMovement} opt.diagonalMovement Allowed diagonal movement.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths, 
 *     in order to speed up the search.
 */
function AStarFinder(finderConfig) {
	finderConfig = finderConfig || {};
	
	this.allowDiagonal = false;
	this.dontCrossCorners = true;
	this.heuristic = Heuristic.manhattan;
	this.diagonalMovement = DiagonalMovement.Never;
	
	Tools.merge(true, this, finderConfig);
	
	this.list = new Heap(function(nodeA, nodeB) {
		return nodeA.f - nodeB.f;
	});

	if (!this.diagonalMovement) {
		if (!this.allowDiagonal) {
			this.diagonalMovement = DiagonalMovement.Never;
		} else {
			if (this.dontCrossCorners) {
				this.diagonalMovement = DiagonalMovement.OnlyWhenNoObstacles;
			} else {
				this.diagonalMovement = DiagonalMovement.IfAtMostOneObstacle;
			}
		}
	}

	//When diagonal movement is allowed the manhattan heuristic is not admissible
	//It should be octile instead
	if (this.diagonalMovement === DiagonalMovement.Never) {
		this.heuristic = finderConfig.heuristic || Heuristic.manhattan;
	} else {
		this.heuristic = finderConfig.heuristic || Heuristic.octile;
	}
}

AStarFinder.prototype = {
	/**
	 * Find and return the the path.
	 * @return {Array.<[number, number]>} The path, including both start and
	 *     end positions.
	 */
	findPath: function(startNode, endNode, grid) {
		grid.clearPath(); // get rids of old values from previous pathfinding
		this.list.nodes.length = 0; // heap.clear() creates a new array, precisely what we need to avoid
		var openList = this.list,/*new Heap(function(nodeA, nodeB) {
				return nodeA.f - nodeB.f;
			}),*/
			abs = Math.abs, SQRT2 = Math.SQRT2,
			node, neighbors, neighbor, i, l, x, y, ng;

		// set the `g` and `f` value of the start node to be 0
		startNode.g = 0;
		startNode.f = 0;

		// push the start node into the open list
		openList.push(startNode);
		startNode.opened = true;

		// while the open list is not empty
		while (openList.nodes.length > 0) {
			// pop the position of node which has the minimum `f` value.
			node = openList.pop();
			node.closed = true;

			// if reached the end position, construct the path and return it
			if (node === endNode) {
				return Util.backtrace(endNode);
			}

			// get neigbours of the current node
			neighbors = grid.getNeighbors(node, false);
			for (i = 0, l = neighbors.length; i < l; ++i) {
				neighbor = neighbors[i];
				neighbor.select();
				if (neighbor.closed || !neighbor.walkable) {
					continue;
				}

				// x = neighbor.x;
				// y = neighbor.y;

				// get the distance between current node and the neighbor
				// and calculate the next g score
				// ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);
				ng = node.g + 1;

				// check if the neighbor has not been inspected yet, or
				// can be reached with smaller cost from the current node
				if (!neighbor.opened || ng < neighbor.g) {
					neighbor.g = ng;
					// neighbor.h = neighbor.h || this.weight * this.heuristic(abs(x - endX), abs(y - endY));
					neighbor.h = neighbor.h || grid.distance(node, neighbor);
					neighbor.f = neighbor.g + neighbor.h;
					neighbor.parent = node;

					if (!neighbor.opened) {
						openList.push(neighbor);
						neighbor.opened = true;
					} else {
						// the neighbor can be reached with smaller cost.
						// Since its f value has been updated, we have to
						// update its position in the open list
						openList.updateItem(neighbor);
					}
				}
			} // end for each neighbor
		} // end while not open list empty

		// fail to find the path
		return [];
	}
};

return AStarFinder;

});