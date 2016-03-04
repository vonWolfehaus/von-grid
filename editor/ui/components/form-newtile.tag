<form-newtile class="flex-container">
	<label>
		<input type="checkbox" name="generateTile"/>
		Generate
	</label>

	<input if={ !generateTile.checked } type="file" accept=".dae" name="tileFile"/>

	<label if={ generateTile.checked }>
		Color:
		<input type="color" name="tileColor"/>
	</label>
	<span if={ showMessage } class="form-newtile__error">
		{ warningMessage }
	</span>

	<button onclick={ onCreate }>Create Tile</button>

	<script>
	this.wrongFileType = false;
	this.showMessage = false;
	this.warningMessage = '';

	onCreate() {
		var file = this.tileFile.value;
		var color = this.tileColor.value;

		if (this.wrongFileType) {
			return false;
		}

		if (!file && !this.generateTile.checked) {
			this.warningMessage = 'Please choose to generate a tile, or upload a DAE (Collada) file';
			this.showMessage = true;
			this.update();
			return false;
		}

		var tile = {
			file: file,
			color: color
		};

		ui.trigger(ui.Events.NEW_TILE, tile);
		ui.trigger(ui.Events.HIDE_OVERLAY);
	}

	this.on('mount', function() {
		var self = this;
		this.generateTile.onchange = function(evt) {
			self.showMessage = false;
			self.update();
		};

		this.tileFile.onchange = function(evt) {
			if (self.tileFile.value.split('.')[1] !== 'dae') {
				self.wrongFileType = true;
				self.warningMessage = 'This editor only takes .DAE (Collada) models';
			}
			else {
				self.wrongFileType = false;
			}
			self.showMessage = self.wrongFileType;
			self.update();
		};
	});
	</script>
</form-newtile>