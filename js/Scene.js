define(['utils/Tools'], function(Tools) {
/*
	Sets up and manages a THREEjs container, camera, and light, making it easy to get going.
	Also provides camera control.
	
	Assumes full screen.
 */
var Scene = function(sceneConfig, controlConfig) {
	var sceneSettings = {
		element: document.body,
		alpha: true,
		antialias: true,
		clearColor: '#fff',
		sortObjects: false,
		fog: null,
		camera: null,
		cameraPosition: null // {x, y, z}
	};
	
	var controlSettings = {
		minDistance: 100,
		maxDistance: 1000,
		zoomSpeed: 2
	};
	
	Tools.merge(sceneSettings, sceneConfig);
	Tools.merge(controlSettings, controlConfig);
	
	this.renderer = new THREE.WebGLRenderer({
		alpha: sceneSettings.alpha,
		antialias: sceneSettings.antialias
	});
	this.renderer.setClearColor(sceneSettings.clearColor, 0);
	this.renderer.sortObjects = sceneSettings.sortObjects;
	
	this.width = window.innerWidth;
	this.height = window.innerHeight;
	
	this.container = new THREE.Scene();
	this.container.fog = sceneSettings.fog;
	
	this.light = new THREE.DirectionalLight(0xffffff);
	this.light.position.set(-1, 1, -1).normalize();
	this.container.add(this.light);
	
	this.camera = sceneSettings.camera || new THREE.PerspectiveCamera(50, this.width / this.height, 1, 10000);
	
	this.contolled = !!controlConfig;
	if (this.contolled) {
		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.minDistance = controlSettings.minDistance;
		this.controls.maxDistance = controlSettings.maxDistance;
		this.controls.zoomSpeed = controlSettings.zoomSpeed;
	}
	
	if (sceneSettings.cameraPosition) {
		this.camera.position.copy(sceneSettings.cameraPosition);
	}
	
	window.addEventListener('resize', function onWindowResize() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.width, this.height);
	}.bind(this), false);
	
	this.attachTo(sceneSettings.element);
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
		this.container.add(mesh);
	},
	
	render: function() {
		if (this.contolled) this.controls.update();
		this.renderer.render(this.container, this.camera);
	},
	
	focusOn: function(obj) {
		this.camera.lookAt(obj.position);
	}
};

return Scene;

});