<flyout class="flex-container hidden">
	<div class="flyout__panel flex-container">
		<yield/>
		<button class="overlay__close-btn" onclick={ dismiss }>X</button>
	</div>

	<script>
	dismiss() {
		this.root.classList.add('hidden');
	}

	ui.on(ui.Events.HIDE_FLYOUT, this.dismiss);
	</script>
</flyout>