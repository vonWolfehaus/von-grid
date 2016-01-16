vg.Cell = {
	q: 0, // x grid coordinate (using different letters so that it won't be confused with pixel/world coordinates)
	r: 0, // y grid coordinate
	h: 1, // 3D height of the cell, used by visual representation and pathfinder
	tile: null, // optional link to the visual representation's class instance
	userData: {}, // populate with any extra data needed in your game
	walkable: true, // if true, pathfinder will use as a through node
	// rest of these are used by the pathfinder and overwritten at runtime, so don't touch
	_calcCost: 0,
	_priority: 0,
	_visited: false,
	_parent: null
};