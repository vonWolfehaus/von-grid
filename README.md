# Hexagonal (and other) grid systems

![screenshot](hex-grid.jpg)

I never found a good (and free!) library for creating perfect hexagons and arranging them in a grid. But I did find [Amit's wonderful explanation](http://www.redblobgames.com/grids/hexagons/), and finally had the time to throw something together.

You can use the `Board` class with different graph types (hex and square), or you can make your own if you implement the interface.

Please use this to make awesome hex-based web games. Or port the code and make awesome hex games there. Just make awesome hex games, ok?

## Features

- Simple API for attaching objects to the grid through `Board.js`
- **A* pathfinding**
- Make maps with `editor/index.html` (save/load with `.json` files)
- Varied height
- Sparse maps
- **Mouse interaction** with the grid's cells (over, out, down, up, click, wheel)
- Programmatic geometry, allow you to precisely adjust every aspect of the hexagon
- Square grid ~~that can be used interchangeably~~(currently working but lots of disparities as I build the editor)

#### Roadmap

- Textured tile support (UV creation)
- Vastly improved editor
- Abstract graph

## Usage

#### Basic board

![screenshot](hex-grid-basic.jpg)

```javascript
var scene = new hg.Scene({ // I made a very handy util for creating three.js scenes quickly
	cameraPosition: {x:0, y:150, z:150}
}, true); // add orbit controls

var grid = new hg.HexGrid({
	rings: 4
});

var board = new hg.Board(grid);

scene.add(board.group);
scene.focusOn(board.group);

update();

function update() {
	scene.render();
	requestAnimationFrame(update);
}
```

#### Examples

For the simple examples you can drop them into Chrome, but for ones that require images or models, you'll have to run `gulp examples`. A browser tab will be opened to the examples directory for you.