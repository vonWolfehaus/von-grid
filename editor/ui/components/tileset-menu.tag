<tileset-menu class="flex-container">
	<ul class="btn-list tilesets__list">
		<li class="tilesets__item { active: active }" each={ tiles } onclick={ selectTile } data-slotid={ slotid }>
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

	this.tiles = [
		{
			active: false,
			slotid: 0,
			preview: null
		}
	];

	onEdit() {
		var el = document.getElementById('js-overlay-newtile');
		el.classList.remove('hidden');
		ui.tileEditMode = true;
		riot.update(); // brute force update so the overlay reflects new mode
	}

	onDelete() {
		var i = ui.activeTile.slotid;

		this.tiles.splice(i, 1);
		ui.activeTile = null;

		// if (this.tiles.length > 0) {
			// if (i >= this.tiles.length) i = this.tiles.length - 1;
			this.selectTile({item: this.tiles[i]});
		/*}
		else {
			this.update();
		}*/
	}

	newTile(evt) {
		// another ui element created or edited a tile
		var slot = this.tiles.length; // assume create

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
		this.tiles.push(tile);

		// create snapshot of the tile, but give the model some time to load first
		setTimeout(function() {
			ui.trigger(ui.Events.GEN_TILE_PREVIEW, tile);
		}, 65);
	}

	addTile() {
		var el = document.getElementById('js-overlay-newtile');
		el.classList.remove('hidden');
		ui.tileEditMode = false;
		riot.update();
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
		// hacks to open it on start since this tag mounts after tool-menu, where the first tool change event is fired
		this.open(ui.Tools.ADD_TILE);
		this.selectTile({item: this.tiles[0]});
	});

	ui.on(ui.Events.TOOL_CHANGE, this.open);
	ui.on(ui.Events.NEW_TILE+' '+ui.Events.EDIT_TILE, this.newTile);
	</script>
</tileset-menu>