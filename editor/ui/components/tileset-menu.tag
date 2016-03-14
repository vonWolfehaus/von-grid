<tileset-menu class="flex-container">
	<span class="flex-container flex-row">
		<label for="tilesets">Tileset</label>

		<span class="tilesets__add" onclick={ addTileset } title="Add a new tileset">
			<i class="icon-plus"></i>
		</span>
	</span>

	<form>
		<select name="tilesets" onchange={ selectTileset }>
			<option no-reorder each={ name, i in setList } value={ i }>{ name }</option>
		</select>
	</form>

	<ul class="btn-list tilesets__list">
		<li class="tilesets__item { active: active }" each={ items } onclick={ selectTile } data-slotid={ slotid }>
			<img class="tilesets__item-preview" src={ preview }>
		</li>
		<li class="tilesets__item" onclick={ addTile } title="Add a new tile to this set">
			<i class="icon-plus"></i>
		</li>
	</ul>

	<div class="tilesets__preview">
		<preview-canvas/>
		<button onclick={ onEdit }>Edit</button>
		<button onclick={ onDelete }>Delete</button>
	</div>

	<script>
	var self = this;

	this.setList = ['default'];

	this.sets = {
		'default': [
			{
				active: false,
				slotid: 0,
				preview: null
			},
			{
				active: false,
				slotid: 1,
				preview: null
			},
			{
				active: false,
				slotid: 2,
				preview: null
			},
			{
				active: false,
				slotid: 3,
				preview: null
			},
			{
				active: false,
				slotid: 4,
				preview: null
			}
		]
	};

	this.items = null;

	onEdit() {
		var el = document.getElementById('js-overlay-newtile');
		el.classList.remove('hidden');
		ui.tileEditMode = true;
		riot.update(); // brute force update so the overlay reflects new mode
	}

	onDelete() {
		var i = ui.activeTile.slotid;

		this.items.splice(i, 1);
		ui.activeTile = null;

		// if (this.items.length > 0) {
			// if (i >= this.items.length) i = this.items.length - 1;
			this.selectTile({item: this.items[i]});
		/*}
		else {
			this.update();
		}*/
	}

	newTileset(name) {
		// when a new tileset was created by the overlay
		this.sets[name] = [];
		this.setList.push(name);
		this.update();
	}

	newTile(evt) {
		// another ui element created or edited a tile
		var slot = this.items.length; // assume create
		if (evt === ui.Events.EDIT_TILE) {
			// trash ui.activeTile
			slot = ui.activeTile.slotid; // nope, it's an edit
		}

		// create a new tile
		var tile = {
			active: false,
			slotid: slot,
			preview: null
		};
		this.items.push(tile);

		// create snapshot of the tile, but give the model some time to load first
		setTimeout(function() {
			ui.trigger(ui.Events.GEN_TILE_PREVIEW, tile);
		}, 65);
	}

	addTileset() {
		var el = document.getElementById('js-overlay-newtileset');
		el.classList.remove('hidden');
	}

	addTile() {
		var el = document.getElementById('js-overlay-newtile');
		el.classList.remove('hidden');
		ui.tileEditMode = false;
		riot.update();
	}

	selectTileset(evt) {
		var i = parseInt(evt.target.value);

		this.items = this.sets[this.setList[i]];
		this.update();
	}

	selectTile(evt) {
		var item = evt.item;

		if (ui.activeTile) {
			if (ui.activeTile.slotid === item.slotid) {
				return;
			}
			ui.activeTile.active = false;
		}

		item.active = true;
		ui.activeTile = item;

		ui.trigger(ui.Events.SELECT_TILE, item.slotid);
		this.update();
	}

	open(tool) {
		var el = document.getElementById('js-flyout-tilesets');
		if (tool === ui.Tools.ADD_TILE) {
			el.classList.remove('hidden');
		}
		else {
			el.classList.add('hidden');
		}
	}

	this.on('mount', function(evt) {
		this.items = this.sets.default;
		// hacks to open it on start since this tag mounts after tool-menu, where the first tool change event is fired
		this.open(ui.Tools.ADD_TILE);
		this.selectTile({item: this.items[0]});
		this.update();
	});

	ui.on(ui.Events.TOOL_CHANGE, this.open);
	ui.on(ui.Events.NEW_TILESET, this.newTileset);
	ui.on(ui.Events.NEW_TILE+' '+ui.Events.EDIT_TILE, this.newTile);
	</script>
</tileset-menu>