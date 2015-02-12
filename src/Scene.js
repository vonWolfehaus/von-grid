define(function() {
/*
	Sets up and manages a THREEjs scene, camera, and light, making it easy to get going.
	Also provides camera control.
	
	Assumes full screen.
 */
var Scene = function(cameraPos, control) {
	this.renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true
	});
	this.renderer.setClearColor('#fff', 0);
	this.renderer.sortObjects = false;
	
	this.width = window.innerWidth;
	this.height = window.innerHeight;
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 2000);
	
	this.contolled = typeof control === 'undefined' ? true : control;
	if (this.contolled) {
		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.minDistance = 200;
		this.controls.maxDistance = 1000;
		this.controls.zoomSpeed = 2;
	}
	
	if (cameraPos) {
		this.camera.position.copy(cameraPos);
	}
	
	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(-1, 1, -1).normalize();
	this.scene.add(light);
	
	window.addEventListener('resize', function onWindowResize() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.width, this.height);
	}.bind(this), false);
};

Scene.prototype = {
	
	attachTo: function(element) {
		element.style.width = this.width + 'px';
		element.style.height = this.height + 'px';
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);
		element.appendChild(this.renderer.domElement);
	},
	
	add: function(mesh) {
		this.scene.add(mesh);
	},
	
	render: function() {
		if (this.contolled) this.controls.update();
		this.renderer.render(this.scene, this.camera);
	},
	
	focusOn: function(obj) {
		this.camera.lookAt(obj.position);
	}
};

return Scene;

});