/*
	A* path-finder based upon http://www.redblobgames.com/pathfinding/a-star/introduction.html
	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
// 'utils/Tools', 'lib/LinkedList'
vg.AStarFinder = function(finderConfig) {
	finderConfig = finderConfig || {};

	this.allowDiagonal = false;
	this.heuristicFilter = null;

	vg.Tools.merge(this, finderConfig);

	this.list = new vg.LinkedList();
};

vg.AStarFinder.prototype = {
	/*
		Find and return the path.
		@return Array<Cell> The path, including both start and end positions. Null if it failed.
	 */
	findPath: function(startNode, endNode, heuristic, grid) {
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
				return vg.PathUtil.backtrace(endNode);
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
						return vg.PathUtil.backtrace(endNode);
					}

					this.list.add(neighbor);
				}
			} // end for each neighbor
		} // end while not open list empty

		// failed to find the path
		return null;
	},

	compare: function(nodeA, nodeB) {
		return nodeA.priority - nodeB.priority;
	}
};
