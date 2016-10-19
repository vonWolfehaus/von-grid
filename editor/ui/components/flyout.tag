<flyout class="flex-container { opts.side } hidden">
	<div class="flyout__panel flex-container">
		<yield/>
		<button if={ !opts.hideclose } class="overlay__close-btn { opts.side }" onclick={ dismiss }><i class="icon-cancel"></i></button>
	</div>

	<script>
	dismiss() {
		if (ui.activeTool.name === ui.Tools.ADD_TILE && this.tags['tileset-menu']) {
			// always keep this menu up unless a different tool is selected expicitly
			return;
		}

		this.root.classList.add('hidden');
	}

	ui.on(ui.Events.HIDE_FLYOUT, this.dismiss);
	</script>
</flyout>