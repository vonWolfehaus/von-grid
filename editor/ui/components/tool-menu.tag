<tool-menu>
	<ul class="btn-list tool-menu__list">
		<li class="tool-menu__item { active: active }" each={ items } data={ this } title={ displayText } onclick={ parent.selectTool }>
			<img src="images/{ icon }"/>
		</li>
	</ul>

	<script>
	this.items = [
		{
			name: ui.Tools.ADD_TILE,
			displayText: 'Add Tile',
			icon: 'add-tile.png',
			active: true
		},
		{
			name: ui.Tools.REMOVE_TILE,
			displayText: 'Remove Tile',
			icon: 'remove-tile.png',
			active: false
		},
		{
			name: ui.Tools.WALK_TILE,
			displayText: 'Set Tile Walkability',
			icon: 'set-walkability.png',
			active: false
		},
	];

	selectTool(evt) {
		var item = evt.item;
		if (ui.activeTool.name === item.name) {
			return;
		}

		ui.activeTool.active = false;

		item.active = true;
		ui.activeTool = item;

		ui.trigger(ui.Events.TOOL_CHANGE, item.name);
		this.update();
	}

	this.on('mount', function() {
		ui.activeTool = this.items[0];
		ui.trigger(ui.Events.TOOL_CHANGE, ui.activeTool.name);
	});
	</script>
</tool-menu>