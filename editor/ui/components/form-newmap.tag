<form-newmap class="flex-container">
	<span>
		<label for="mapsize">Map size:</label>
		<input type="number" name="mapsize" value="5" min="1" max="{ maxMapSize }"/>
	</span>

	<span>
		<label for="cellsize">Cell size:</label>
		<input type="number" name="cellsize" value="10" min="1"/>
	</span>

	<span>
		<label for="heightstep">Height step:</label>
		<input type="number" name="heightstep" value="3" min="1"/>
	</span>

	<span>
		<label for="Grid type">Grid type:</label>
		<select name="gridtype">
			<option value="hex">Hexagon</option>
			<option value="square">Square</option>
		</select>
	</span>

	<span>
		<button onclick={ onCreate }>Create New Map</button>
	</span>

	<script>
	this.maxMapSize = 1000;

	onCreate() {
		if (this.mapsize.value > this.maxMapSize) {
			this.mapsize.value = this.maxMapSize;
		}

		ui.trigger(ui.Events.NEW_MAP, {
			mapSize: this.mapsize.value,
			cellSize: this.cellsize.value,
			heightStep: this.heightstep.value,
			type: this.gridtype.value
		});

		ui.trigger(ui.Events.HIDE_OVERLAY);
		ui.trigger(ui.Events.HIDE_FLYOUT);
	}
	</script>
</form-newmap>