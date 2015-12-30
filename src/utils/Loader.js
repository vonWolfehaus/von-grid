hg.Loader = {
	manager: null,
	imageLoader: null,
	crossOrigin: false,

	init: function(crossOrigin) {
		this.crossOrigin = crossOrigin || false;

		this.manager = new THREE.LoadingManager(function() {
			// called when all images are loaded, so call your state manager or something
		}, function() {
			// noop
		}, function() {
			console.warn('Error loading images');
		});

		this.imageLoader = new THREE.ImageLoader(this.manager);
		this.imageLoader.crossOrigin = crossOrigin;
	},

	loadTexture: function(url, mapping, onLoad, onError) {
		var texture = new THREE.Texture(undefined, mapping);
		loader.load(url, function(image) {
			texture.image = image;
			texture.needsUpdate = true;
			if (onLoad) onLoad(texture);
		}, undefined, function (event) {
			if (onError) onError(event);
		});
		texture.sourceFile = url;

		return texture;
	}
};
