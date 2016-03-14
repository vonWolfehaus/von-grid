<preview-canvas>
	<canvas id="preview"/>
	<span class="preview__info">
		{ meshSize }
	</span>

	<script>
	this.renderer = null;
	this.scene = null;
	this.camera = null;
	this.controls = null;
	this.meshSize = '';

	roundTenths(val) {
		return Math.round(val * 10) / 10;
	}

	addMesh(obj) {
		var o = this.scene.children[0];
		while (o) {
			this.scene.remove(o);
			o = this.scene.children[0];
		}
		this.scene.add(obj);

		// calculate bounding box size and display it to the user
		var box = new THREE.Box3().setFromObject(obj);
		var size = box.size();
		this.meshSize = 'Size {x:'+this.roundTenths(size.x)+' y:'+this.roundTenths(size.y)+' z:'+this.roundTenths(size.z)+'}';

		// try to fit the object within view
		var fov = this.camera.fov * vg.DEG_TO_RAD;
		var dist = Math.abs(Math.min(size.x, size.z) / Math.sin(fov / 2)) / 2;
		console.log('Camera distance:', dist);

		this.camera.position.set(0, dist, dist);
		this.update();
	}

	showTile(color) {
		// console.log(ui.activeTileMesh)
		if (ui.activeTileMesh) {
			this.addMesh(ui.activeTileMesh);
		}
		else {
			// generated
		}
	}

	genPreview(tile) {
		var canvas = document.getElementById('preview');
		tile.preview = canvas.toDataURL('image/png');
		riot.update();
	}

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
		var width = 136;
		var height = 150;

		this.renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('preview'),
			alpha: true,
			antialias: true
		});
		this.renderer.setClearColor('#fff', 0);
		this.renderer.sortObjects = false;

		this.scene = new THREE.Scene();
		this.scene.add(new THREE.AmbientLight(0xffffff));
		var light = new THREE.DirectionalLight(0xffffff);
		light.position.set(-1, 1, -1).normalize();
		this.scene.add(light);

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);

		this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 5000);
		this.camera.position.set(0, 20, 100);

		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.minDistance = 1;
		this.controls.maxDistance = 10000;
		this.controls.zoomSpeed = 2;
		// this.controls.noZoom = false;
		// this.controls.noPan = true;
		this.controls.maxPolarAngle = (Math.PI / 2) - 0.01;

		ui.previewUpdate = this.updatePreview;
		// console.log()
		if (!window.require) {
			requestAnimationFrame(this.updatePreview);

			var geometry = new THREE.BoxGeometry(20, 20, 20);
			var material = new THREE.MeshPhongMaterial({
				color: 0x156289,
				emissive: 0x072534,
				shading: THREE.FlatShading
			});
			var cube = new THREE.Mesh(geometry, material);
			this.scene.add(cube);
		}
	});

	this.on('error', function(evt) {
		console.error(evt);
	});

	ui.on(ui.Events.TOOL_CHANGE, this.toggle);
	ui.on(ui.Events.NEW_TILE+' '+ui.Events.EDIT_TILE, this.showTile);
	ui.on(ui.Events.GEN_TILE_PREVIEW, this.genPreview);
	</script>
</preview-canvas>