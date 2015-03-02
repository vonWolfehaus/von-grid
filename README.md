# Hexagonal (and other) grid systems

![screenshot](hex-grid.jpg)

I never found a good (and free!) library for creating perfect hexagons and arranging them in a grid. But I did find [Amit's wonderful explanation](http://www.redblobgames.com/grids/hexagons/), and finally had the time to throw something together.

You can use the `Board` class with different graph types (hex, square, and later on: abstract), or you can make your own if you implement the interface.

Please use this to make awesome hex-based web games. Or port the code and make awesome hex games there. Just make cool hex games, ok?

## Features

- Simple API for attaching objects to the grid through `Board.js`
- **A* pathfinding**
- Make maps with `examples/map-maker.html`! (no import/export yet, but it's still cool)
- Varied height
- Sparse maps
- Multi-material support
- **Mouse interaction** with the grid's cells (over, out, down, up, click, wheel)
- Programmatic geometry, allow you to precisely adjust every aspect of the hexagon
- Square version ~~that can be used interchangeably~~(currently working but lots of disparities as I build the Map Maker)

## Usage

#### Map Maker

- Click on empty cell: create cell
- Click on cell: remove cell
- Mousewheel on cell: adjust height of cell
- Mousewheel elsewhere: adjust zoom of camera
- Left click and drag: orbit camera
- Right click and drag: pan camera

#### Examples

For the simple examples you can drop them into Chrome, but for ones that require images or models, you'll have to spin up [Node](http://nodejs.org/):
```
npm install
node server/server.js
```
Then you can navigate to the address it gives you in the console and go from there.