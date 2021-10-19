var canvas = document.getElementById('game-surface');
canvas.width = window.innerWidth * 0.5;
canvas.height = window.innerHeight * 0.9;
let aspectRatio = canvas.width / canvas.height;
var gl = canvas.getContext('webgl');
var program = gl.createProgram();
var positionAttribLocation;
var colorUniformLocation;
var scalerAttribLocation;
var vertexCount = 64;
let growthRate = 0.01;
let gameRadius = 0.8;
let circleSpawnSpace = 0.03;
let circleSpawnRadius = 0.01;
let circleComplexity = 128;
let scaler = 1.2;
var triangleVertices = DrawCircle(0, 0, gameRadius, vertexCount, aspectRatio);
var elapsed = 0;
var timer = 0;


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
		'uniform vec4 fColor;',
		'void main()',
		'{',

		'	gl_FragColor = fColor;',
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
		x = ((gameRadius * Math.cos(2 * Math.PI * theta / 360))) / aspectRatio;
		y = (gameRadius * Math.sin(2 * Math.PI * theta / 360));
		for (const [key, value] of circleMap.entries()) {
			let deltaX = value.x - x;
			let deltaY = value.y - y;
			let distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
			if(distance < value.r + circleSpawnRadius + circleSpawnSpace) {
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
	var fragBuffer = gl.createBuffer();

	// return circle object
	return [rgbStr,{
		x:x,
		y:y,
		r:rgba[0],
		g:rgba[1],
		b:rgba[2],
		a:rgba[3],
		r:circleSpawnRadius,
		vertexBuffer:vertexBuffer,
		fragBuffer: fragBuffer
	}];
}


// Generate a random colour for circle
function GenerateColor() {
	let rgbVals = new Float32Array(3);
	for (let i = 0; i < 3; i++) {
		let val = Math.floor(Math.random() * 154) + 100;
		rgbVals[i] = val;
	}

	return rgbVals;
};
GenerateColor();


var InitDemo = function () {


	//////////////////////////////////
	//       initialize WebGL       //
	//////////////////////////////////

	if (!gl) {
		////console.log('webgl not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl', {preserveDrawingBuffer: true});
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
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('Error linking program!', gl.getProgramInfo(program));
		return;
	}

	gl.useProgram(program);
	positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	colorUniformLocation = gl.getUniformLocation(program, 'fColor');


	// TEST CODE
	for(let i = 0; i < 15; i++) {
		let circle = createCircle();
		circleMap.set(circle[0],circle[1]);
	}
	
	var triangleVertexBufferObject = gl.createBuffer();
	//set the active buffer to the triangle buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
	//gl expecting Float32 Array not Float64
	//gl.STATIC_DRAW means we send the data only once (the triangle vertex position
	//will not change over time)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
	gl.vertexAttribPointer(
		positionAttribLocation, //attribute location
		2, //number of elements per attribute
		gl.FLOAT,
		gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
		0 * Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
	);

	gl.uniform4f(colorUniformLocation, 0.0, 0.0, 0.0, 1);
	gl.enableVertexAttribArray(positionAttribLocation);
	



	//////////////////////////////////
	//            Drawing           //
	//////////////////////////////////
	let color = GenerateColor();
	//gl.clearColor(1.0,1.0,1.0,1.0);
	gl.clearColor(color[0], color[1], color[2], 1.0)
	gl.clear(gl.COLOR_BUFFER_BIT);	//
	gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexCount);
	drawCircleArray();
	

	
};

function DrawCircle(x, y, radius, numOfSides, aspectRatio) {
	let origin = { x, y };
	let pi = Math.PI;
	x = new Float32Array(numOfSides * 2);
	y = new Float32Array(numOfSides * 2);
	vertices = new Float32Array(numOfSides * 4);
	
	// cycle through each vertex in the circle
	for (let i = 0; i < numOfSides * 2; i++) {
		////console.log(aspectRatio);
		x[i] = (origin.x + (radius * Math.cos(2 * pi * i / numOfSides))) / aspectRatio;
		y[i] = origin.y + (radius * Math.sin(2 * pi * i / numOfSides));
	}
	for (let i = 0; i <= numOfSides; i+=2) {
		vertices[i] = x[i];
		vertices[i+1] = y[i]
	}
	//console.log(vertices)
	return vertices
};

function newDrawCircle(circle) {
	console.log(circle);
	x = new Float32Array(vertexCount * 2);
	y = new Float32Array(vertexCount * 2);
	vertices = new Float32Array(vertexCount * 4);

	// cycle through each vertex in the circle
	for (let i = 0; i < vertexCount * 2; i++) {
		////console.log(aspectRatio);
		x[i] = (circle.x + (0.1 / aspectRatio * Math.cos(2 * Math.PI * i / vertexCount)));
		y[i] = circle.y + (0.1 * Math.sin(2 * Math.PI * i / vertexCount));
	}
	for (let i = 0; i <= vertexCount; i+=2) {
		vertices[i] = x[i];
		vertices[i+1] = y[i]
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, circle.vertexBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
	gl.vertexAttribPointer(
		positionAttribLocation, //attribute location
		2, //number of elements per attribute
		gl.FLOAT,
		gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
		0 * Float32Array.BYTES_PER_ELEMENT //offset from the beginning of a single vertex to this attribute
	);

	gl.enableVertexAttribArray(positionAttribLocation);
	gl.uniform4f(colorUniformLocation, circle.r, circle.g, circle.b, circle.a);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexCount);
}

var loop = function () {
	drawCircleArray();
	var delta = 0;
	if(timer == 0)
		timer = new Date();
	else {
		delta = timer - new Date();
		timer = newDate();
	}

	//---
	canvas.onmousedown = function (event) {
		drawCircleArray();
		//gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount * 2)

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
		var rgbStr = "" + pixelR + pixelG + pixelB + pixelA;
		circleMap.delete(rgbStr);
		if(pixelR != 0)
			console.log("R:",pixelR);
		if(pixelG != 0)
			console.log("G:",pixelG);
		if(pixelB != 0)
			console.log("B:",pixelB);
		if(pixelA != 0)
			console.log("A:",pixelA);
		//var point = uiUtils.pixelInputToCanvasCoord(event, state.canvas);
		//var pixels = new Uint8Array(4);
		//state.gl.readPixels(point.x, point.y, 1, 1, state.gl.RGBA, state.gl.UNSIGNED_BYTE, pixels);
		////console.log(pixels[0]);
		drawCircleArray();
	}
};
requestAnimationFrame(loop);

function drawCircleArray() {
	for (const [key, value] of circleMap.entries()) {
		//console.log(value.vertexBuffer);
		var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
		gl.bindBuffer(gl.ARRAY_BUFFER, value.vertexBuffer);
		//gl expecting Float32 Array not Float64
		//gl.STATIC_DRAW means we send the data only once (the triangle vertex position
		//will not change over time)
		// position
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(value.vertices), gl.DYNAMIC_DRAW);
		gl.vertexAttribPointer(
			positionAttribLocation, //attribute location
			2, //number of elements per attribute
			gl.FLOAT,
			gl.FALSE,
			2 * Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
			0 * Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
		);
		gl.enableVertexAttribArray(positionAttribLocation);
		var colorUniformLocation = gl.getUniformLocation(program, 'fColor');
		gl.uniform4f(colorUniformLocation, value.r, value.g, value.b, value.a);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexCount);
	}
}

function drawCircleArray() {
	for (const [key, value] of circleMap.entries()) {
		console.log("Drawing circle");
		newDrawCircle(value);
	}
}