/*
	Wraps three.sprite to take care of boilerplate and add data for the board to use.
 */
define(['utils/Tools'], function(Tools) {

// constructor
var Sprite = function(settings) {
	this.material = null;
	this.geo = null;
	
	this.url = null;
	this.container = null;
	this.texture = null;
	this.scale = 1;
	this.highlight = 'rgb(0, 0, 255)';
	this.offsetY = 0; // how high off the board this object sits
	this.obstacle = false;
	
	// attribute override
	Tools.merge(this, settings);
	
	// other objects like the SelectionManager expect these on all objects that are added to the scene
	this.active = false;
	this.uniqueId = Tools.generateID();
	this.objectType = 'entity'; // Board.Entity
	this.cell = null;
	
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
		this.cell = null;
		this.position = null;
		this.view = null;
	}
};

return Sprite;

});
