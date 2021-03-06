var canvas = document.getElementById("game-surface");
canvas.width = window.innerWidth * 0.5;
canvas.height = window.innerHeight * 0.9;
let aspectRatio = canvas.width / canvas.height;
var gl = canvas.getContext("webgl");
var program = gl.createProgram();
var positionAttribLocation;
var colorUniformLocation;
var scalerAttribLocation;
var triangleVertexBufferObject;
var vertexCount = 64;
let growthRate = 0.0005;
let gameRadius = 0.8;
let circleSpawnSpace = 0.03;
let circleSpawnRadius = 0.05;
let circleComplexity = 128;
var poisonRadius = 0.01;
var poisonGrowthRate = 0.001;
let scaler = 1.2;
var triangleVertices = initGameBoardVertices(
  0,
  0,
  gameRadius,
  vertexCount,
  aspectRatio
);
var innerCircleVertices = initGameBoardVertices(
  0,
  0,
  gameRadius / 3,
  vertexCount,
  aspectRatio
);
var elapsed = 0;
var timer = 0;
var score = 0;
var maxBacteria = 20;
let maxThreshold = 2;

var poisons = [];

function createPoison(x, y) {
  const clampf = (r, g, b, a) => [r / 255, g / 255, b / 255, a];
  let rgba = clampf(1.0, 1.0, 1.0, 1.0);

  var vertexBuffer = gl.createBuffer();
  var fragBuffer = gl.createBuffer();

  // return circle object
  poisons.push({
    x: x,
    y: y,
    r: rgba[0],
    g: rgba[1],
    b: rgba[2],
    a: rgba[3],
    radius: poisonRadius,
    vertexBuffer: vertexBuffer,
    fragBuffer: fragBuffer,
  });
}

function drawPoisonArray() {
  var toRemove = [];
  for (var i = 0; i < poisons.length; i++) {
    poisons[i].radius = poisons[i].radius + poisonGrowthRate;
    if (poisons[i].radius >= (gameRadius * 1) / 6) {
      toRemove.push(i);
      continue;
    }
    newDrawCircle(poisons[i], gl.POINTS);
    poisons[i].g = 1.0;
  }

  for (var x = 0; x < toRemove.length; x++) poisons.splice(x, 1);
}

var vertexShaderText = [
  "precision mediump float;",
  "attribute vec2 vertPosition;",

  "void main()",
  "{",
  "	gl_Position = vec4(vertPosition,0.0,1.0);",
  "	gl_PointSize = 5.0;",
  "}",
].join("\n");

var fragmentShaderText = [
  "precision mediump float;",
  "uniform vec4 fColor;",
  "void main()",
  "{",

  "	gl_FragColor = fColor;",
  "}",
].join("\n");

// contains all circles being drawn on the canvas
const circleMap = new Map();

function createCircle() {
  // loop through outer-edge of circle until enough space is found to spawn a circle
  let x = 0,
    y = 0,
    theta = 0;
  let counter = 0;
  while (true) {
    let validCircle = true;
    theta = Math.floor(Math.random() * 360) + 1;
    x = (gameRadius * Math.cos((2 * Math.PI * theta) / 360)) / aspectRatio;
    y = gameRadius * Math.sin((2 * Math.PI * theta) / 360);
    for (const [key, value] of circleMap.entries()) {
      let deltaX = value.x - x;
      let deltaY = value.y - y;
      let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance < value.radius + circleSpawnRadius + circleSpawnSpace) {
        validCircle = false;
        break;
      }
    }
    if (validCircle) break;
    counter++;
    if (counter >= 10) {
      break;
    }
  }
  // generate color for circle
  let rgbInts = GenerateColor();

  // store rgbStr as id for buffer
  let rgbStr = "" + rgbInts[0] + rgbInts[1] + rgbInts[2];

  // keep generating colors until a unique one is found
  while (circleMap.has(rgbStr)) {
    rgbInts = GenerateColor();
    rgbStr = "" + rgbInts[0] + rgbInts[1] + rgbInts[2];
    counter++;
    if (counter >= 10) {
      break;
    }
  }

  const clampf = (r, g, b, a) => [r / 255, g / 255, b / 255, a];
  let rgba = clampf(rgbInts[0], rgbInts[1], rgbInts[2], 1.0); // debug

  // create buffer for circle and add it to the hashmap
  var vertexBuffer = gl.createBuffer();
  var fragBuffer = gl.createBuffer();

  // return circle object
  return [
    rgbStr,
    {
      x: x,
      y: y,
      r: rgba[0],
      g: rgba[1],
      b: rgba[2],
      a: rgba[3],
      radius: circleSpawnRadius,
      vertexBuffer: vertexBuffer,
      fragBuffer: fragBuffer,
    },
  ];
}

// Generate a random colour for circle
function GenerateColor() {
  let rgbVals = new Float32Array(3);
  for (let i = 0; i < 3; i++) {
    let val = Math.floor(Math.random() * 154) + 100;
    rgbVals[i] = val;
  }

  return rgbVals;
}

// keep track of score in the game
var scoreCounter = document.getElementById("score");

var InitDemo = function () {
  //////////////////////////////////
  //       initialize WebGL       //
  //////////////////////////////////

  if (!gl) {
    console.log("webgl not supported, falling back on experimental-webgl");
    gl = canvas.getContext("experimental-webgl", {
      preserveDrawingBuffer: true,
    });
  }
  if (!gl) {
    alert("your browser does not support webgl");
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
    console.error(
      "Error compiling vertex shader!",
      gl.getShaderInfoLog(vertexShader)
    );
    return;
  }
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(
      "Error compiling vertex shader!",
      gl.getShaderInfoLog(fragmentShader)
    );
    return;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Error linking program!", gl.getProgramInfo(program));
    return;
  }

  gl.useProgram(program);
  positionAttribLocation = gl.getAttribLocation(program, "vertPosition");
  colorUniformLocation = gl.getUniformLocation(program, "fColor");

  // initialize the starting circles
  for (let i = 0; i < 5; i++) {
    spawnCircle();
  }

  // create vertex buffer for game disc
  triangleVertexBufferObject = gl.createBuffer();

  //////////////////////////////////
  //            Drawing           //
  //////////////////////////////////
};

// initialize the game board vertices (used for inner and outer disc)
function initGameBoardVertices(x, y, radius, numOfSides) {
  let origin = { x, y };
  let pi = Math.PI;
  x = new Float32Array(numOfSides * 2);
  y = new Float32Array(numOfSides * 2);
  vertices = new Float32Array(numOfSides * 4);

  // cycle through each vertex in the circle
  for (let i = 0; i < numOfSides * 2; i++) {
    x[i] =
      (origin.x + radius * Math.cos((2 * pi * i) / numOfSides)) / aspectRatio;
    y[i] = origin.y + radius * Math.sin((2 * pi * i) / numOfSides);
  }
  for (let i = 0; i <= numOfSides; i += 2) {
    vertices[i] = x[i];
    vertices[i + 1] = y[i];
  }
  return vertices;
}

// draw call for gameboard
function DrawGameBoard() {
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(triangleVertices),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(
    positionAttribLocation, 
    2, 
    gl.FLOAT,
    gl.FALSE,
    2 * Float32Array.BYTES_PER_ELEMENT, 
    0 * Float32Array.BYTES_PER_ELEMENT 
  );

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.uniform4f(colorUniformLocation, 0.0, 0.0, 0.0, 1);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexCount);

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(innerCircleVertices),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(
    positionAttribLocation,
    2, 
    gl.FLOAT,
    gl.FALSE,
    2 * Float32Array.BYTES_PER_ELEMENT, //size of an individual vertex
    0 * Float32Array.BYTES_PER_ELEMENT
  );

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.uniform4f(colorUniformLocation, 1, 0, 0, 1);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexCount);
}

function newDrawCircle(circle, drawType) {
  x = new Float32Array(vertexCount * 2);
  y = new Float32Array(vertexCount * 2);
  vertices = new Float32Array(vertexCount * 4);
  // cycle through each vertex in the circle
  for (let i = 0; i < vertexCount * 2; i++) {
    x[i] =
      circle.x +
      (circle.radius / aspectRatio) * Math.cos((2 * Math.PI * i) / vertexCount);
    y[i] = circle.y + circle.radius * Math.sin((2 * Math.PI * i) / vertexCount);
  }
  for (let i = 0; i <= vertexCount; i += 2) {
    vertices[i] = x[i];
    vertices[i + 1] = y[i];
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, circle.vertexBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(
    positionAttribLocation, //attribute location
    2, //number of elements per attribute
    gl.FLOAT,
    gl.FALSE,
    2 * Float32Array.BYTES_PER_ELEMENT, //size of an individual vertex
    0 * Float32Array.BYTES_PER_ELEMENT //offset from the beginning of a single vertex to this attribute
  );

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.uniform4f(colorUniformLocation, circle.r, circle.g, circle.b, circle.a);
  gl.drawArrays(drawType, 0, vertexCount);
}

// game logic loop
var loop = function () {
  DrawGameBoard();
  drawCircleArray();
  drawPoisonArray();
  scoreCounter.innerHTML = "Score: " + score;

  // if > 2 bacteria reach center disc -> game over
  if (maxThreshold <= 0) {
    alert("you lose!");
  }

  // when user clicks on canvas...
  canvas.onmousedown = function (event) {
	// draw circles so pixel colours can be read for picking
    drawCircleArray();

	// get pixel colours from gl drawing buffer
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
    var rect = event.target.getBoundingClientRect();
    x = event.clientX - rect.left;
    y = rect.bottom - event.clientY;
      // detect pixal colour which the mouse is clicking on
    var pixelR = pixels[4 * (y * gl.drawingBufferWidth + x)];
    var pixelG = pixels[4 * (y * gl.drawingBufferWidth + x) + 1];
    var pixelB = pixels[4 * (y * gl.drawingBufferWidth + x) + 2];
    var pixelA = pixels[4 * (y * gl.drawingBufferWidth + x) + 3];
    var rgbStr = "" + pixelR + pixelG + pixelB;

    // if this colour matchs the id in the circle hashmap
    if (circleMap.has(rgbStr)) {
      circleMap.delete(rgbStr);
      if (score == 9) { // when score is 10, previous 9 score + this click = score 10
        score = 10;
        alert("you win!");// Winning message for the player
      } else {
        score++; // increase score by one if click on bacteria 
        spawnCircle(); // a new bacteria is generated on the ashes of the old one
        var mx = event.clientX,
        my = event.clientY;
        mx = mx / canvas.width - 0.5;
        my = my / canvas.height - 0.5;
        mx = mx * 2;
        my = my * -2;
        createPoison(mx, my); // this create posion which propagates outward at this position
      }
    }
  };
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

// draw all bacteria in circleMap
function drawCircleArray() {
  // check if bacteria has collided with poison cloud, and delete if so
  for (const [key1, circle1] of circleMap.entries()) {
    for (let i = 0; i < poisons.length; i++) {
      let pdeltaX = (circle1.x - poisons[i].x) * 1.1;
      let pdeltaY = (circle1.y - poisons[i].y) * 1.1;
      let distance = Math.sqrt(pdeltaX * pdeltaX + pdeltaY * pdeltaY);
      if (distance < circle1.radius + poisons[i].radius) {
        circleMap.delete(key1);
        continue;
      }
    }
	// check if any bacteria are overlapping by measuring their distance against the combined radii
    for (const [key2, circle2] of circleMap.entries()) {
      if (key1 === key2) continue;
      let deltaX = (circle1.x - circle2.x) * 1.1;
      let deltaY = (circle1.y - circle2.y) * 1.1;
      let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      var newRadius = Math.sqrt(
        Math.pow(circle1.radius, 2),
        Math.pow(circle2.radius, 2)
      );

	  // if bacteria overlap, delete the smaller one OR the first if both are the same size
      if (distance < circle1.radius + circle2.radius) {
        if (circle1.radius > circle2.radius) {
          circleMap.get(key1).radius *= 1.5;
          circleMap.delete(key2);
        } else {
          circleMap.get(key2).radius *= 1.5;
          circleMap.delete(key1);
        }
      }
    }
  }

  // check if bacteria reach the inner disc
  for (const [key, value] of circleMap.entries()) {
    value.radius = value.radius + growthRate;
    if (value.radius >= ((gameRadius * 2) / 3) * 1.0) {
	  // if reached, reduce maxThreshold and delete bacteria
      maxThreshold--;
      circleMap.delete(key);
      let circle = createCircle();
      circleMap.set(circle[0], circle[1]);
    }
    newDrawCircle(value, gl.TRIANGLE_FAN);
  }
}

// function to spawn a new circle
function spawnCircle() {
  let circle = createCircle();
  circleMap.set(circle[0], circle[1]);
}
