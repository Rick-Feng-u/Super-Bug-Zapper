
var vertexShaderText = [
'precision mediump float;',

'attribute vec2 vertPosition;',
'attribute vec3 vertColor;',
'uniform vec2 motion;',
'varying vec3 fragColor;',

'void main()',
'{',
'	fragColor = vertColor;',
'	gl_Position = vec4(vertPosition+motion,0,1.0);',
'	gl_PointSize = 10.0;',
'}'
].join('\n');

var fragmentShaderText =
[
'precision mediump float;',

'varying vec3 fragColor;',

'void main()',
'{',
	
'	gl_FragColor = vec4(fragColor,1.0);',
'}',
].join('\n')


var InitDemo = function() {


	//////////////////////////////////
	//       initialize WebGL       //
	//////////////////////////////////
	console.log('this is working');

	var canvas = document.getElementById('game-surface');
	var gl = canvas.getContext('webgl');

	if (!gl){
		console.log('webgl not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}
	if (!gl){
		alert('your browser does not support webgl');
	}

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
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
	var triangleVertices = [
		//X,   Y,     R, G, B
		0.0,  0.5,    1, 0, 0,
		-0.5,-0.5,    0, 1, 0,
		0.5, -0.5,    0, 0, 1
	];

	var triangleVertexBufferObject = gl.createBuffer();
	//set the active buffer to the triangle buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
	//gl expecting Float32 Array not Float64
	//gl.STATIC_DRAW means we send the data only once (the triangle vertex position
	//will not change over time)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices),gl.STATIC_DRAW);

	var positionAttribLocation = gl.getAttribLocation(program,'vertPosition');
	var colorAttribLocation = gl.getAttribLocation(program,'vertColor');
	gl.vertexAttribPointer(
		positionAttribLocation, //attribute location
		2, //number of elements per attribute
		gl.FLOAT, 
		gl.FALSE,
		5*Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
		0*Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
		);
	gl.vertexAttribPointer(
		colorAttribLocation, //attribute location
		3, //number of elements per attribute
		gl.FLOAT, 
		gl.FALSE,
		5*Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
		2*Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
		);
	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(colorAttribLocation);

	gl.useProgram(program);
	//////////////////////////////////
	//          math things         //
	//////////////////////////////////
	
	var motion = new Float32Array(2);

	//get the address of motion variable in the vertex shader
	var motionUniformLocation = gl.getUniformLocation(program, 'motion');
	
	gl.uniform2fv(motionUniformLocation, motion);

	//////////////////////////////////
	//       Main render loop       //
	//////////////////////////////////

	var x = 0;
	var y = 0;
	var loop = function(){
		
		motion[0] = x;
		motion[1] = y;
		gl.uniform2fv(motionUniformLocation, motion);
				
		gl.clearColor(0.5,0.8,0.8,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES,0,3);
	
		//call loop function whenever a frame is ready for drawing, usually it is 60fps.
		//Also, if the tab is not focused loop function will not be called
		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);

		//motion[0] = motion[0]-0.001;
		//motion[1] = motion[1]-0.001;
		

	//gl.drawArrays(gl.POINTS,0,3);
	//gl.drawArrays(gl.LINES,0,3);
	//gl.drawArrays(gl.LINE_STRIP,0,3);
	//gl.drawArrays(gl.LINE_LOOP,0,3);
		
	
	canvas.onmousedown = function(ev) {
		var mx = ev.clientX, my = ev.clientY;
		mx = mx/canvas.width - 0.5;
		my = my/canvas.height - 0.5;
		mx = mx*2;
		my = my*-2;
		console.log(mx + ' ' + my);
		x = mx;
		y = my;
	}


	window.onkeypress = function(event){
		if (event.key == 'd')
			x = x+0.005;

		if (event.key == 'a')
			x = x-0.005;
		if (event.key == 'w')
			y = y+0.005;

		if (event.key == 's')
			y = y-0.005;
	}


};