<app-menu>
	<ul class="app-menu__list">
		<!-- <li class="app-menu__item" onclick={ onClick } data-action="newMap">New Map</li> -->
		<li class="app-menu__item" onclick={ onClick } data-action="saveMap">Save</li>
		<li class="app-menu__item" onclick={ onClick } data-action="loadMap">Load</li>
		<li class="app-menu__item" onclick={ onClick } data-action="showHelp">
			<span class="help-icon" onclick={ onClick } data-action="showHelp">?</span>
		</li>
	</ul>

	<script>
	onClick(evt) {
		var action = evt.target.dataset.action;

		switch (action) {
			case 'newMap':
				var el = document.getElementById('js-overlay-newmap');
				el.classList.remove('hidden');
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