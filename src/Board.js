/*
	Interface to the grid. Holds data about what's occupying cells, and a general interface from entities to cells.

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
// 'utils/Loader', 'pathing/AStarFinder'
vg.Board = function(grid, finderConfig) {
	if (!grid) throw new Error('You must pass in a grid system for the board to use.');

	// this.pieces = []; // haven't found a use for this yet
	this.group = new THREE.Object3D();
	this.grid = null;
	this.overlay = null;
	this.finder = new vg.AStarFinder(finderConfig);
	// need to keep a resource cache around, so this Loader does that, use it instead of THREE.ImageUtils
	vg.Loader.init();

	this.setGrid(grid);
};

vg.Board.prototype = {

	// immediately snap a piece to a cell; merely copies position
	placeEntityAtCell: function(entity, cell) {
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

	placeAtCell: function(vec, cell) {
		// var c = this.grid.pixelToCell(vec);
		// this.grid.cellToPixel(cell, vec);
		// console.log(cell);
	},

	findPath: function(startCell, endCell, heuristic) {
		return this.finder.findPath(startCell, endCell, heuristic, this.grid);
	},

	getRandomCell: function() {
		return this.grid.getRandomCell();
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

	setGrid: function(newGrid) {
		if (this.grid) {
			this.group.remove(this.grid.group);
			this.grid.dispose();
		}
		this.grid = newGrid;
		this.group.add(newGrid.group);
	},

	generateOverlay: function(size) {
		var mat = new THREE.LineBasicMaterial({
			color: 0x000000,
			opacity: 0.3
		});

		if (this.overlay) {
			this.group.remove(this.overlay);
		}

		this.overlay = new THREE.Object3D();
		var vec = new THREE.Vector3();
		var x, y, z;

		if (this.grid.type === vg.HEX) {
			for (x = -size; x < size+1; x++) {
				for (y = -size; y < size+1; y++) {
					z = -x-y;
					if (Math.abs(x) <= size && Math.abs(y) <= size && Math.abs(z) <= size) {
						vec.set(x, y, z);
						var line = new THREE.Line(this.grid.cellGeo, mat);
						this.grid.setPositionToCell(line.position, vec);
						line.rotation.x = 90 * vg.DEG_TO_RAD;
						this.overlay.add(line);
					}
				}
			}
		}
		else if (this.grid.type === vg.SQR) {
			/*for (x = -size; x < size+1; x++) {
				for (y = -size; y < size+1; y++) {
					if (Math.abs(x) <= size && Math.abs(y) <= size && Math.abs(z) <= size) {
						vec.set(x, y, z);
						var line = new THREE.Line(this.grid.cellGeo, mat);
						this.grid.setPositionToCell(line.position, vec);
						line.rotation.x = 90 * vg.DEG_TO_RAD;
						this.overlay.add(line);
					}
				}
			}*/
		}
		else {
			console.warn('The board cannot generate '+this.grid.type+'-type grid overlays');
		}


		this.group.add(this.overlay);
	}
};
