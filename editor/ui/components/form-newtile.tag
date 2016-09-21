<form-newtile class="flex-container">
	<label>
		<input type="checkbox" name="generateTile"/>
		Generate
	</label>

	<span if={ !generateTile.checked }>
		<label>
			Map:
			<input type="file" accept=".jpg" name="tileFile"/>
		</label>
		<label>
			Normal map:
			<input type="file" accept=".jpg" name="tileFile"/>
		</label>
		<label>
			Specular map:
			<input type="file" accept=".jpg" name="tileFile"/>
		</label>
	</span>

	<label if={ generateTile.checked }>
		Color:
		<input type="color" name="tileColor"/>
	</label>
	<span if={ showMessage } class="form-newtile__error">
		{ warningMessage }
	</span>

	<button onclick={ onCreate }>{ ui.tileEditMode ? 'Change' : 'Create' } Tile</button>

	<script>
	this.wrongFileType = false;
	this.showMessage = false;
	this.warningMessage = '';
	this.daeLoader = new THREE.ColladaLoader();
	// this.daeLoader.options.convertUpAxis = true;

	onModelLoad(obj) {
		ui.activeTileMesh = obj.scene;
		this.onCreate();
	}

	onCreate() {
		var file = this.tileFile.value;
		var color = this.tileColor.value;

		if (this.wrongFileType) {
			return false;
		}

		if (!file && !this.generateTile.checked) {
			this.warningMessage = 'Please choose to generate a tile, or upload a DAE (Collada) file.';
			this.showMessage = true;
			this.update();
			return false;
		}

		if (ui.tileEditMode) {
			ui.trigger(ui.Events.EDIT_TILE, color);
		}
		else {
			ui.trigger(ui.Events.NEW_TILE, color);
		}

		ui.trigger(ui.Events.HIDE_OVERLAY);
	}

	this.on('mount', function() {
		var self = this;
		this.generateTile.onchange = function(evt) {
			ui.activeTileMesh = null;
			self.showMessage = false;
			self.update();
		};

		this.tileFile.onchange = function(evt) {
			if (self.tileFile.value.split('.')[1] !== 'dae') {
				self.wrongFileType = true;
				self.warningMessage = 'This editor only takes .DAE (Collada) models.';
			}
			else {
				self.wrongFileType = false;
			}
			self.showMessage = self.wrongFileType;
			self.update();

			if (self.showMessage) return false;

			var file = this.files[0];
			if (!file) {
				return;
			}

			ui.activeTileMesh = null;

			var reader = new FileReader();
			reader.onload = function(e) {
				try {
					self.daeLoader.parse(e.target.result, self.onModelLoad, './assets');
				}
				catch (err) {
					self.showMessage = true;
					self.warningMessage = 'There was an error parsing the Collada file: "'+err+'"';
					self.update();
					return false;
				}
			};

			reader.readAsText(file);
		};
	});
	</script>
</form-newtile>