<form-newmap class="flex-container">
	<span>
		<label for="mapSize">Map size:</label>
		<input type="number" name="mapSize" value="40" min="1" max="{ maxMapSize }"/>
	</span>
	<span>
		<label for="cellSize">Cell size:</label>
		<input type="number" name="cellSize" value="10" min="1"/>
	</span>
	<span>
		<button onclick={ onCancel }>Cancel</buttn>
		<button onclick={ onCreate }>Create</buttn>
	</span>

	<script>
	this.maxMapSize = 1000;

	onCancel() {
		ui.trigger(ui.Events.HIDE_OVERLAY);
	}

	onCreate() {
		if (this.mapSize.value > this.maxMapSize) {
			this.mapSize.value = this.maxMapSize;
		}

		ui.trigger(ui.Events.NEW_MAP, this.mapSize.value, this.cellSize.value);
		ui.trigger(ui.Events.HIDE_OVERLAY);
	}
	</script>
</form-newmap>