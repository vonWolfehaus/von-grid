<form-newtileset class="flex-container">
	<form onsubmit={ onCreate }>
		<label for="tilesetName">Name:</label>
		<input type="text" name="tilesetName"/>
		<button onclick={ onCreate }>Create</button>
	</form>

	<script>
	onCreate() {
		ui.trigger(ui.Events.NEW_TILESET, this.tilesetName.value);
		ui.trigger(ui.Events.HIDE_OVERLAY);
	}
	</script>
</form-newtileset>