/*
	Grid cell that constructs its geometry for rendering and holds gameplay properties.
 */

define(function() {

var Square = function(size, scale, geometry, color) {
	this.type = Square.FLAT;
	this.color = color || 0x404040;
	this.size = size;
	this.width = size;
	this.height = size;
	
	this.cell = null;
	
	this.mat = new THREE.MeshPhongMaterial({
		color: this.color,
		ambient: this.color,
		side: THREE.DoubleSide
	});
	
	this.mesh = new THREE.Mesh(geometry, this.mat);
	/*this.mesh = new THREE.Line(this.shape.createPointsGeometry(), new THREE.LineBasicMaterial({
		color: this.color,
		linewidth: 3 // this doesn't work on windows because ANGLE doesn't implement it (the WebGL driver)
	}));*/

	this.mesh.userData.structure = this;
	
	// create references so we can control orientation through this (Square), instead of drilling down
	this.position = this.mesh.position;
	this.rotation = this.mesh.rotation;
	// rotate it to face up
	this.rotation.x = -90 * 0.0174532925;
	this.mesh.scale.set(scale, scale, scale);
};

Square.FLAT = 0;
Square.POINTY = 45 * 0.0174532925;

Square.prototype = {
	placeAt: function(cell) {
		this.position.x = cell.x * this.size/* - (this.size / 2)*/;
		this.position.z = cell.z * this.size/* - (this.size / 2)*/;
		this.cell = cell;
	}
};

return Square;

});