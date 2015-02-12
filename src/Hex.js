/*
	Grid cell that constructs its geometry for rendering and holds gameplay properties.
 */

define(function() {

var Hex = function(size, scale, geometry, color) {
	this.type = Hex.FLAT;
	this.color = color || 0x404040;
	this.size = size;
	
	if (this.type === Hex.FLAT) {
		this.width = this.size * 2;
		this.height = Math.sqrt(3)/2 * this.width;
	}
	else {
		this.height = this.size * 2;
		this.width = Math.sqrt(3)/2 * this.height;
	}
	
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
	
	// create references so we can control orientation through this (Hex), instead of drilling down
	this.position = this.mesh.position;
	this.rotation = this.mesh.rotation;
	// rotate it to face up
	this.rotation.x = -90 * 0.0174532925;
	this.mesh.scale.set(scale, scale, scale);
};

Hex.FLAT = 0;
Hex.POINTY = 30 * 0.0174532925;

Hex.createVert = function(type, size, i) {
	var angle = ((2 * Math.PI) / 6) * i;
	angle += type; // 0 if flat-topped, or 30deg if pointy
	return new THREE.Vector3((size * Math.cos(angle)), (size * Math.sin(angle)), 0);
};

Hex.prototype = {
	placeAt: function(cube) {
		// i found this algorithm through trial and error, please don't touch
		if (this.type === Hex.FLAT) {
			this.position.x = cube.x * this.width * 0.75;
			this.position.z = (cube.z - cube.y) * this.height * 0.5;
		}
		else {
			this.position.x = cube.x * this.width * 0.5;
			this.position.z = (cube.z - cube.y) * this.height * 0.75;
		}
		this.cell = cube;
	}
};

return Hex;

});