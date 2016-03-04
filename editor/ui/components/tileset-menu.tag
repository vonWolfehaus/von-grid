<tileset-menu class="flex-container">
	<form>
		<label for="tilesets">Tileset:</label>

		<select name="tilesets" onchange={ selectTileset }>
			<option each={ name, value in sets } value={ name }>{ name }</option>
		</select>

		<span class="tilesets__add" onclick={ addTileset } title="Add a new tileset">
			<i class="icon-plus"></i>
		</span>
	</form>

	<ul class="btn-list tilesets__list">
		<li class="tilesets__item { active: active }" each={ items } onclick={ selectTile } data-slotid={ slotid }>
			<img if={ preview } src="">
		</li>
		<li class="tilesets__item" onclick={ addTile } title="Add a new tile to this set">
			<i class="icon-plus"></i>
		</li>
	</ul>

	<div class="tilesets__preview">
		<preview-canvas/>
		<button onclick={ onEdit }>Change Tile</button>
	</div>

	<script>
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
			},
			{
				active: false,
				slotid: -1,
				preview: null
			},
		],
		'stuff': [
			{
				active: false,
				slotid: 0,
				preview: null
			},
		]
	};

	this.items = this.sets.default;

	onEdit() {
		// var el = document.getElementById('js-overlay-changetile');
		// el.classList.remove('hidden');
	}

	newTileset(name) {
		// when a new tileset was created by the overlay
		this.sets[name] = [];
		this.selectTileset({target:{value:name}});
		this.tilesets.value = name;
		this.update();
	}

	newTile() {
		// another ui element created a tile
	}

	addTileset() {
		var el = document.getElementById('js-overlay-newtileset');
		el.classList.remove('hidden');
	}

	addTile() {
		var el = document.getElementById('js-overlay-newtile');
		el.classList.remove('hidden');
	}

	selectTileset(evt) {
		var name = evt.target.value;
		this.items = this.sets[name];
		this.update();
	}

	selectTile(evt) {
		var item = evt.item;
		if (ui.activeTile.slotid === -1) {
			this.addTile();
			return;
		}

		if (ui.activeTile.slotid === item.slotid) {
			return;
		}

		ui.activeTile.active = false;

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
		ui.activeTile = this.items[0];
		// hacks to open it on start since this tag mounts after tool-menu, where the first tool change event is fired
		this.open(ui.Tools.ADD_TILE);
		this.selectTile({item: ui.activeTile});
	});

	ui.on(ui.Events.TOOL_CHANGE, this.open);
	ui.on(ui.Events.NEW_TILESET, this.newTileset);
	ui.on(ui.Events.NEW_TILE, this.newTile);
	</script>
</tileset-menu>