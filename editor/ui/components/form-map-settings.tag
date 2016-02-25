<form-map-settings class="flex-container">
	<span>
		<label for="mapSize">Map size:</label>
		<input type="number" name="mapSize" value="40" min="1" max="{ maxMapSize }"/>
	</span>
	<span>
		<label for="cellSize">Cell size:</label>
		<input type="number" name="cellSize" value="10" min="1"/>
	</span>
	<span>
		<button onclick={ onUpdate }>Create Map</buttn>
	</span>

	<script>
	this.maxMapSize = 1000;

	updateSettings(settings) {
		this.mapSize.value = settings.mapSize;
		this.cellSize.value = settings.cellSize;
		this.update();
	}

	onUpdate() {
		if (this.mapSize.value > this.maxMapSize) {
			this.mapSize.value = this.maxMapSize;
		}

		ui.trigger(ui.Events.UPDATE_SETTINGS, {
			mapSize: parseInt(this.mapSize.value),
			cellSize: parseInt(this.cellSize.value)
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

	this.on('error', function(evt) {
		console.log(evt);
	});
	</script>
</form-map-settings>