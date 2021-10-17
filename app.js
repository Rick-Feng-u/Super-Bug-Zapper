

var canvas = document.getElementById('game-surface');
canvas.width = window.innerWidth * 0.5;
canvas.height = window.innerHeight * 0.9;
let aspectRatio = canvas.width / canvas.height;
var gl = canvas.getContext('webgl');
var vertexCount = 64;
let startRadius = 0.05;
let growthRate = 0.01;
let circleSpawnSpace = 0.03;
let circleSpawnRadius = 0.05;
var triangleVertices = DrawCircle(0, 0, 1, vertexCount, aspectRatio);


var vertexShaderText = [
	'precision mediump float;',

	'attribute vec2 vertPosition;',

	'void main()',
	'{',
	'	gl_Position = vec4(vertPosition,0.0,1.0);',
	'	gl_PointSize = 10.0;',
	'}'
].join('\n');

var fragmentShaderText =
	[
		'precision mediump float;',


		'void main()',
		'{',

		'	gl_FragColor = vec4(0.5,0.5,0.5,1);',
		'}',
	].join('\n')


// contains all circles being drawn on the canvas
const circleMap = new Map();

function createCircle() {

	// loop through outer-edge of circle until enough space is found to spawn a circle
	let x=0, y=0, theta=0;
	while(true) {
		let validCircle = true;
		theta = Math.floor(Math.random() * 360) + 1;
		x = ((radius * Math.cos(2 * pi * theta / 360))) / aspectRatio;
		y = (radius * Math.sin(2 * pi * theta / 360));
		for (var i in circleMap) {
			let deltaX = i.x - x;
			let deltaY = i.y - y;
			let distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
			if(distance < i.r + circleSpawnRadius + circleSpawnSpace) {
				validCircle = false;
				break;
			}
		}
		if(validCircle) break;
	}
	// generate color for circle
	let rgbInts = GenerateColor();
	
	// store rgbStr as id for buffer
	let rgbStr = "" + rgbInts[0] + rgbInts[1] + rgbInts[2]
	const clampf = (r, g, b, a) => [r / 255, g / 255, b / 255, a];
	let rgba = clampf(rgbInts[0], rgbInts[1], rgbInts[2], 1.0);

	// keep generating colors until a unique one is found
	while (circleMap.has(rgbStr)) {
		rgbInts = GenerateColor();
		rgbStr = "" + rgbInts[0] + rgbInts[1] + rgbInts[2]
	}

	// create buffer for circle and add it to the hashmap
	var vertexBuffer = gl.createBuffer();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW); // FIX ME

	circleMap.set(rgbStr,{
		x:x,
		y:y,
		r:circleSpawnRadius,
		buffer:vertexBuffer
	})
}


function deleteCircle() {

}

// Generate a random colour for circle
function GenerateColor() {
	let rgbVals = new Float32Array(3);
	for (let i = 0; i < 3; i++) {
		let val = Math.floor(Math.random() * 154) + 100;
		rgbVals[i] = val;
	}

	return rgbVals;
	//gl.clearColor(rgba[0], rgba[1], rgba[2], rgba[3]);
	//console.log(colorVal);
	//return rgbVals;
};
GenerateColor();


var InitDemo = function () {


	//////////////////////////////////
	//       initialize WebGL       //
	//////////////////////////////////
	//console.log('this is working');



	if (!gl) {
		//console.log('webgl not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}
	if (!gl) {
		alert('your browser does not support webgl');
	}


	gl.viewport(0, 0, canvas.width, canvas.height);



	//////////////////////////////////
	// create/compile/link shaders  //
	//////////////////////////////////
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
		return;
	}
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
		return;
	}

	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('Error linking program!', gl.getProgramInfo(program));
		return;
	}

	//////////////////////////////////
	//    create triangle buffer    //
	//////////////////////////////////

	//all arrays in JS is Float64 by default

	//console.log(triangleVertices);
	/*
		//X,   Y,      
		-0.5, 0.5,
		0.5, 0.5,

		-0.5, -0.5,
		-0.5, -0.5,
		0.5, 0.5,
		0.5, -0.5
	];*/

	var triangleVertexBufferObject = gl.createBuffer();
	//set the active buffer to the triangle buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
	//gl expecting Float32 Array not Float64
	//gl.STATIC_DRAW means we send the data only once (the triangle vertex position
	//will not change over time)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);

	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	gl.vertexAttribPointer(
		positionAttribLocation, //attribute location
		2, //number of elements per attribute
		gl.FLOAT,
		gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
		0 * Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(positionAttribLocation);

	gl.useProgram(program);



	//////////////////////////////////
	//            Drawing           //
	//////////////////////////////////
	let color = GenerateColor();
	//gl.clearColor(1.0,1.0,1.0,1.0);
	gl.clearColor(color[0], color[1], color[2], 1.0)
	gl.clear(gl.COLOR_BUFFER_BIT);	//
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount * 2)
	//DrawCircle(0,0,2,8);
};

function DrawCircle(x, y, radius, numOfSides, aspectRatio) {
	let origin = { x, y };
	let pi = Math.PI;
	x = new Float32Array(numOfSides * 2);
	y = new Float32Array(numOfSides * 2);
	vertices = new Float32Array(numOfSides * 4);

	// cycle through each vertex in the circle
	for (let i = 0; i < numOfSides * 2; i++) {
		//console.log(aspectRatio);
		x[i] = (origin.x + (radius * Math.cos(2 * pi * i / numOfSides))) / aspectRatio;
		y[i] = origin.y + (radius * Math.sin(2 * pi * i / numOfSides));
	}
	for (let i = 0; i < numOfSides * 2; i += 2) {
		vertices[i * 2] = x[i]
		vertices[(i * 2) + 1] = y[i]
	}

	return vertices
	// x + cos(2pi/numOfSides)
	// y = sin(2pi/numOfSides)
};

var loop = function () {

	canvas.onmousedown = function (event) {
		gl.clearColor(0.21, 0.31, 0.51, 1.0) //DEBUG
		gl.clear(gl.COLOR_BUFFER_BIT);	//
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount * 2)
		//gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount * 2)
		var pixels = new Uint8Array(
			4 * gl.drawingBufferWidth * gl.drawingBufferHeight
		);
		gl.readPixels(
			0,
			0,
			gl.drawingBufferWidth,
			gl.drawingBufferHeight,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			pixels
		);
		// And here's components of a pixel on (x, y):
		var pixelR = pixels[4 * (event.clientY * gl.drawingBufferWidth + event.clientX)];
		var pixelG = pixels[4 * (event.clientY * gl.drawingBufferWidth + event.clientX) + 1];
		var pixelB = pixels[4 * (event.clientY * gl.drawingBufferWidth + event.clientX) + 2];
		var pixelA = pixels[4 * (event.clientY * gl.drawingBufferWidth + event.clientX) + 3];
		console.log(pixelR);
		console.log(pixelG);
		console.log(pixelB);
		console.log(pixelA);
		//var point = uiUtils.pixelInputToCanvasCoord(event, state.canvas);
		//var pixels = new Uint8Array(4);
		//state.gl.readPixels(point.x, point.y, 1, 1, state.gl.RGBA, state.gl.UNSIGNED_BYTE, pixels);
		//console.log(pixels[0]);
	}
};

requestAnimationFrame(loop);
