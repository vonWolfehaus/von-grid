<app-menu>
	<ul class="btn-list app-menu__list">
		<li class="app-menu__item" onclick={ onClick } data-action="settings">
			<i class="icon-cogs"></i>Map
		</li>
		<li class="app-menu__item" onclick={ onClick } data-action="saveMap">
			<i class="icon-download"></i>Save
		</li>
		<li class="app-menu__item" onclick={ onClick } data-action="loadMap">
			<i class="icon-cw"></i>Load
		</li>
		<li class="app-menu__item" onclick={ onClick } data-action="showHelp">
			<i class="icon-help"></i>Help
		</li>
	</ul>

	<script>
	onClick(evt) {
		var action = evt.target.dataset.action;

		switch (action) {
			case 'settings':
				var el = document.getElementById('js-flyout-settings');
				if (el.classList.contains('hidden')) {
					el.classList.remove('hidden');
				}
				else {
					el.classList.add('hidden');
				}
				break;
			case 'saveMap':
				ui.trigger(ui.Events.SAVE_MAP);
				break;
			case 'loadMap':
				ui.trigger(ui.Events.LOAD_MAP);
				break;
			case 'showHelp':
				var el = document.getElementById('js-overlay-help');
				el.classList.remove('hidden');
				break;
		}
	}
	</script>
</app-menu>