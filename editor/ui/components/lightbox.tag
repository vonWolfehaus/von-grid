<lightbox class="flex-container absolute hidden">
	<div class="lightbox__overlay absolute" onclick={ dismiss }></div>
	<div class="lightbox__panel flex-container">
		<yield/>
		<button class="overlay__close-btn" onclick={ dismiss }><i class="icon-cancel"></i></button>
	</div>

	<script>
	dismiss() {
		this.root.classList.add('hidden');
	}

	ui.on(ui.Events.HIDE_OVERLAY, this.dismiss);
	</script>
</lightbox>