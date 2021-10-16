

var canvas = document.getElementById('game-surface');
canvas.width = window.innerWidth * 0.5;
canvas.height = window.innerHeight * 0.9;
let aspectRatio = canvas.width / canvas.height;
var gl = canvas.getContext('webgl');
var vertexCount = 64;
var triangleVertices = DrawCircle(0,0,1,vertexCount, aspectRatio);


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
	
'	gl_FragColor = vec4(0,0,0,1);',
'}',
].join('\n')

// Generate a random colour for circle
function GenerateColor() {	
	let scaler = 10000;
	let colorVal = 0;
	for(let i=0; i <= 4; i+=2) {
		let val = Math.floor(Math.random() * 98) + 1;
		val = val * scaler / Math.pow(10,i);
		colorVal += val;
	}
	console.log("ColorVal: " + colorVal);
};


0x646464
0x000001
/*
Math.random(1->100) * 3
Vertex -> vec3(0.11,0.72,0.90) -> Multiply by 100 -> 
0x64AAB3
*/

var color = GenerateColor();

var InitDemo = function() {


	//////////////////////////////////
	//       initialize WebGL       //
	//////////////////////////////////
	//console.log('this is working');



	if (!gl){
		//console.log('webgl not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}
	if (!gl){
		alert('your browser does not support webgl');
	}


	gl.viewport(0,0,canvas.width,canvas.height);

	

	//////////////////////////////////
	// create/compile/link shaders  //
	//////////////////////////////////
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader,vertexShaderText);
	gl.shaderSource(fragmentShader,fragmentShaderText);

	gl.compileShader(vertexShader);
	if(!gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS)){
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
		return;
	}
	gl.compileShader(fragmentShader);
		if(!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)){
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
		return;
	}

	var program = gl.createProgram();
	gl.attachShader(program,vertexShader);
	gl.attachShader(program,fragmentShader);

	gl.linkProgram(program);
	if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
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
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices),gl.STATIC_DRAW);

	var positionAttribLocation = gl.getAttribLocation(program,'vertPosition');
	gl.vertexAttribPointer(
		positionAttribLocation, //attribute location
		2, //number of elements per attribute
		gl.FLOAT, 
		gl.FALSE,
		2*Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
		0*Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
		);
	gl.enableVertexAttribArray(positionAttribLocation);

	gl.useProgram(program);


	
	//////////////////////////////////
	//            Drawing           //
	//////////////////////////////////
		
	gl.clearColor(1.0,1.0,1.0,1.0);
	//gl.clearColor(color[0], color[1], color[2], 1.0)
	gl.clear(gl.COLOR_BUFFER_BIT);	//
	gl.drawArrays(gl.TRIANGLE_STRIP,0,vertexCount*2)
	//DrawCircle(0,0,2,8);
};

function DrawCircle(x, y, radius, numOfSides, aspectRatio) {
	let origin = {x,y};
	let pi = Math.PI;
	x = new Float32Array(numOfSides*2);
	y = new Float32Array(numOfSides*2);
	vertices = new Float32Array(numOfSides*4);

	// cycle through each vertex in the circle
	for(let i=0; i < numOfSides*2; i++) {
		//console.log(aspectRatio);
		x[i] = (origin.x + ( radius * Math.cos(2 * pi * i / numOfSides))) / aspectRatio;
		y[i] = origin.y + ( radius * Math.sin(2 * pi * i / numOfSides));
	}
	for(let i=0; i < numOfSides*2; i+=2) {
		vertices[i*2] = x[i]
		vertices[(i*2)+1] = y[i]
	}

	return vertices
	// x + cos(2pi/numOfSides)
	// y = sin(2pi/numOfSides)
};

var loop = function() {
	canvas.onmousedown = function() {
		//gl.deleteBuffer(triangleVertexBufferObject);
		console.log("You clicked the circle!~");
		console.log(GenerateColor());

	}
};
requestAnimationFrame(loop);