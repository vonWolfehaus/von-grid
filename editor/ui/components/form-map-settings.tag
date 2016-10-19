<form-map-settings class="flex-container">
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
	</div>

	<button onclick={ onNewMap } style="background-color: #fd0; color: black">New Map</button>

	<script>
	this.maxMapSize = 1000;

	onNewMap() {
		var el = document.getElementById('js-overlay-newmap');
		var newmapTag = el._tag.tags['form-newmap'];
		newmapTag.cellsize.value = this.cellSize.value;
		newmapTag.heightstep.value = this.heightStep.value;

		el.classList.remove('hidden');

		riot.update(); // brute force update so the overlay reflects new mode
	}

	updateSettings(settings) {
		this.cellSize.value = settings.cellSize;
		this.heightStep.value = settings.heightStep;
		this.planeSize.value = settings.planeSize;
		this.planeColor.value = settings.planeColor;
		this.update();
	}

	onMapUpdate() {
		ui.trigger(ui.Events.UPDATE_SETTINGS, {
			cellSize: parseInt(this.cellSize.value),
			heightStep: parseFloat(this.heightStep.value),
			planeSize: parseInt(this.planeSize.value),
			planeColor: this.planeColor.value,
		});
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