function addHexagonGeometry (size, center, height, geometry) {
	// var center = new THREE.Vector2(0, 0);
	var coordinates;
	for (var i = 0; i < 7; i++) {
		coordinates = hexCorner(center, size - bevelSize, i);
		geometry.vertices.push(new THREE.Vector3( coordinates.x, height, coordinates.y ));
	}

	// var line = new THREE.Line( geometry, material );
	// scene.add( line );
}

function drawHexagon (size, height, bevelSize, bevelThickness, material) {

	var hexShape = new THREE.Shape();
	var center = new THREE.Vector2(0, 0);
	var coordinates;

	for (var i = 0; i < 7; i++) {
		coordinates = hexCorner(center, size - bevelSize, i);
		if (i === 0) {
			hexShape.moveTo(coordinates.x, coordinates.y);
		} else {
			hexShape.lineTo(coordinates.x, coordinates.y);
		}
	}

	var hexGeometry = new THREE.ExtrudeGeometry(hexShape, {
		amount: height,
		bevelEnabled: true,
		bevelThickness: bevelThickness,
		bevelSize: bevelSize
	});

	var hexMesh = new THREE.Mesh(hexGeometry, material);
	hexMesh.rotation.x = Math.PI / 2;

	return hexMesh;
}


function hexCorner(center, size, i) {
    var angle = 2 * Math.PI / 6 * (i + 0.5);
    return new THREE.Vector2(center.x + size * Math.cos(angle), center.y + size * Math.sin(angle));
}


function pixelToAxial(x, y, size) {
	var q = (x * Math.sqrt(3)/3 - y / 3) / size;
	var r = y * 2/3 / size;
	var axial = hexRound({x: q, y: r});
	return hexToCube(axial);
}

function hexToCube(h) {
	var x = h.x;
	var y = h.y;
	var z = -x - y;
	return {x: x, y: y, z: z};
}

function cubeToHex(h){
	return {x: h.x, y: h.y};
}

function axialToPixel(cube) {
	var xOffset = cube.z * (hexagonWidth/2);

	var xCoord = (cube.x * hexagonWidth) + xOffset;
	var zCoord = cube.z * hexagonHeight * 0.75;
	return {x: xCoord, z: zCoord};
}


function hexRound(h) {
	return cubeToHex(cubeRound(hexToCube(h)));
}

function cubeRound(h) {
	var rx = Math.round(h.x);
	var ry = Math.round(h.y);
	var rz = Math.round(h.z);

	var x_diff = Math.abs(rx - h.x);
	var y_diff = Math.abs(ry - h.y);
	var z_diff = Math.abs(rz - h.z);

	if (x_diff > y_diff && x_diff > z_diff) {
		rx = -ry-rz;
	}
	else if (y_diff > z_diff) {
		ry = -rx-rz;
	}
	else {
		rz = -rx-ry;
	}

	return {x: rx, y: ry, z: rz};
 }

function hexToPixel(h, size) {
	x = size * Math.sqrt(3) * (h.x + h.y/2);
	y = size * 3/2 * h.y;
	return {x: x, y: y};
}

function hexDistance(a, b){
	var ac = hexToCube(a);
	var bc = hexToCube(b);
	return cube_distance(ac, bc);
}

function cubeDistance(a, b) {
	return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
}
