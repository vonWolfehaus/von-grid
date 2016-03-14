<form-map-settings class="flex-container">
	<span>
		<label for="mapSize">Map size:</label>
		<input type="number" name="mapSize" value="5" min="1" max="{ maxMapSize }"/>
		<button onclick={ onMapUpdate }>Create Map</button>
	</span>

	<span>
		<label for="cellSize">Cell size:</label>
		<input type="number" name="cellSize" value="10" min="1"/>
		<button onclick={ onMapUpdate }>Update Map</button>
	</span>

	<span>
		<label for="heightStep">Height step:</label>
		<input type="number" name="heightStep" value="3" min="1"/>
		<button onclick={ onMapUpdate }>Update Map</button>
	</span>

	<div class="form-group">
		<span>
			<label for="planeSize">Plane size:</label>
			<input type="number" name="planeSize" value="50" min="1"/>
		</span>
		<br>
		<span>
			<label for="planeColor">Plane color:</label>
			<input type="color" name="planeColor" value="#ffffff"/>
		</span>
		<br>
		<button onclick={ onMapUpdate }>Update Plane</button>
	<div>

	<script>
	this.maxMapSize = 1000;

	updateSettings(settings) {
		this.mapSize.value = settings.mapSize;
		this.cellSize.value = settings.cellSize;
		this.heightStep.value = settings.heightStep;
		this.planeSize.value = settings.planeSize;
		this.planeColor.value = settings.planeColor;
		this.update();
	}

	onMapUpdate() {
		if (this.mapSize.value > this.maxMapSize) {
			this.mapSize.value = this.maxMapSize;
		}

		ui.trigger(ui.Events.UPDATE_SETTINGS, {
			mapSize: parseInt(this.mapSize.value),
			cellSize: parseInt(this.cellSize.value),
			heightStep: parseInt(this.heightStep.value),
			maxTileHeight: parseInt(this.maxTileHeight.value),
			planeSize: parseInt(this.planeSize.value),
			planeColor: this.planeColor.value,
		});

		// ui.trigger(ui.Events.HIDE_FLYOUT);
	}

	this.on('mount unmount', function(evt) {
		if (evt === 'mount') {
			ui.on(ui.Events.UPDATE_SETTINGS, this.updateSettings);
		}
		else if (evt === 'unmount') {
			ui.off(ui.Events.UPDATE_SETTINGS, this.updateSettings);
		}
	});
	</script>
</form-map-settings>