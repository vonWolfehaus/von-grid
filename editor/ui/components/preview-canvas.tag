<preview-canvas>
	<script>
	this.renderer = null;
	this.scene = null;
	this.camera = null;
	this.controls = null;

	updatePreview() {
		this.controls.update();
		this.renderer.render(this.scene, this.camera);
		if (!window.require) {
			// for debugging purposes in test-ui.html
			requestAnimationFrame(this.updatePreview);
		}
	}

	toggle(tool) {
		if (tool === ui.Tools.ADD_TILE) {
			// pause rendering when it's not in view
			ui.previewUpdate = this.updatePreview;
		}
		else {
			ui.previewUpdate = null;
		}
	}

	this.on('mount', function() {
		var width = 208;
		var height = 150;

		this.renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true
		});
		this.renderer.setClearColor('#fff', 0);
		this.renderer.sortObjects = false;

		this.scene = new THREE.Scene();
		this.scene.add(new THREE.AmbientLight(0xdddddd));
		this.scene.add(new THREE.DirectionalLight(0xdddddd));

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);
		this.root.appendChild(this.renderer.domElement);

		this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 5000);
		this.camera.position.set(0, 100, 100);

		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.minDistance = 50;
		this.controls.maxDistance = 100;
		this.controls.zoomSpeed = 2;
		this.controls.noZoom = false;
		this.controls.maxPolarAngle = (Math.PI / 2) - 0.01;

		var geometry = new THREE.BoxGeometry(20, 20, 20);
		var material = new THREE.MeshPhongMaterial({
			color: 0x156289,
			emissive: 0x072534,
			side: THREE.DoubleSide,
			shading: THREE.FlatShading
		});
		var cube = new THREE.Mesh(geometry, material);
		this.scene.add(cube);

		ui.previewUpdate = this.updatePreview;
		// console.log()

		if (!window.require) {
			requestAnimationFrame(this.updatePreview);
		}
	});

	ui.on(ui.Events.TOOL_CHANGE, this.toggle);
	</script>
</preview-canvas>