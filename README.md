# Hexagonal and square grid systems

![screenshot](hex-grid.jpg)

I never found a good (and free!) library for creating perfect hexagons and arranging them in a grid. But I did find [Amit's wonderful explanation](http://www.redblobgames.com/grids/hexagons/), and finally had the time to throw something together.

I created a hex grid (hex-shaped made with hexes) as a base, and maybe I (you?) will add more functionality, like data import (perhaps an editor?), or Amit's cool features (ring selection, wrapping, etc).

I also created a square grid to help me think about how to abstract the grid enough to build a decent API for, so you should be able to use the `Board` class with whatever grid you want, provided you implement the interface.

Please use this to make awesome hex-based web games.

## Features

- Simple API for attaching objects to the grid through `Board.js`
- A* Pathfinding
- Mouse interaction with the grid's cells (over, out, down, up, click)
- Programmatic geometry, allow you to precisely adjust every aspect of the hexagon
- Adjustable properties: cell size, grid size, mouse interactivity, board rotation, "flat" and "pointy" versions, cell bevel

## Usage

For the simple examples you can drop them into Chrome, but for ones that require images or models, you'll have to spin up [Node](http://nodejs.org/):
```
npm install
node server/server.js
```
Then you can navigate to the address it gives you in the console and go from there.