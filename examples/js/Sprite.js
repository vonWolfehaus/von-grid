/*
	Wraps three.sprite to take care of boilerplate and add data for the board to use.
 */
var Sprite = function(settings) {
	var config = {
		material: null,
		geo: null,
		url: null,
		container: null,
		texture: null,
		scale: 1,
		highlight: 'rgb(0, 168, 228)',
		heightOffset: 0, // how high off the board this object sits
		obstacle: false
	};
	// attribute override
	config = vg.Tools.merge(config, settings);

	this.material = config.material;
	this.geo = config.geo;
	this.url = config.url;
	this.container = config.container;
	this.texture = config.texture;
	this.scale = config.scale;
	this.highlight = config.highlight;
	this.heightOffset = config.heightOffset;
	this.obstacle = config.obstacle;

	// other objects like the SelectionManager expect these on all objects that are added to the scene
	this.active = false;
	this.uniqueId = vg.Tools.generateID();
	this.objectType = vg.ENT;
	this.tile = null;

	// sanity checks
	if (!this.texture) {
		if (!this.url) {
			console.error('[Sprite] Either provide an image URL, or Threejs Texture');
		}
		this.texture = THREE.ImageUtils.loadTexture(this.url);
	}

	if (!this.material) {
		// for better performance, reuse materials as much as possible
		this.material = new THREE.SpriteMaterial({
			map: this.texture,
			color: 0xffffff,
			// color: 0xff0000,
			fog: true
		});
	}

	if (!this.highlightMaterial) {
		this.highlightMaterial = this.material;
	}

	this.view = new THREE.Sprite(this.material);
	this.view.scale.set(this.scale, this.scale, this.scale);
	this.view.visible = false;
	this.view.userData.structure = this;
	this.geo = this.view.geometry;

	this.position = this.view.position;
};

Sprite.prototype = {
	activate: function(x, y, z) {
		this.active = true;
		this.view.visible = true;
		this.position.set(x || 0, y || 0, z || 0);
		this.container.add(this.view);
	},

	disable: function() {
		this.active = false;
		this.view.visible = false;
		this.container.remove(this.view);
	},

	update: function() {

	},

	select: function() {
		this.material.color.set(this.highlight);
	},

	deselect: function() {
		this.material.color.set('rgb(255, 255, 255)');
	},

	dispose: function() {
		this.container = null;
		this.tile = null;
		this.position = null;
		this.view = null;
	}
};
