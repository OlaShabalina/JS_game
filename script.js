const canvas = document.getElementById('canvas1');

// getting 2D rendering context for canvas to draw within it
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// global variables
const cellSize = 100; // each sell in the game grid will be 100 * 100 px
const cellGap = 3; // gap between cells
const gameGrid = [];
const defenders = [];
let numberOfResources = 401; // how much resources we give to the player initially

//  mouse 
const mouse = {
  x: 10,
  y: 10,
  width: 0.1,
  height: 0.1,
}
let canvasPosition = canvas.getBoundingClientRect();

canvas.addEventListener('mousemove', function(e) {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave', function () { 
  mouse.x = undefined;
  mouse.y = undefined;
 })

// game board
const controlsBar = {
  width: canvas.width,
  height: cellSize
}

// creating constractor for custom cell object
class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
  }
  draw() {
    // if mouse is overlaping the cell -> the cell gets a black strokeStyle
    if (mouse.x && mouse.y && collision(this, mouse)) {
      ctx.strokeStyle = 'black';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}

// function for filling grid with custom cell objects to fill canvas
function createGrid() {
  // creating loop to move vertically
  for (let y = cellSize; y < canvas.height; y +=cellSize) {
    // creating loop to move horizontally inside vertical loop
    for (let x = 0; x < canvas.width; x += cellSize) {

      // every time we move - we push a new cellSize inside the grid array
      gameGrid.push(new Cell(x, y));
    }
  }
}

createGrid();

// going through the array drawing each indivisual cell
function handleGameGrid() {
  for (let i = 0; i < gameGrid.length; i++) {
    gameGrid[i].draw();
  }
}

// project units
// defenders
class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
    this.shooting = false;
    this.health = 100; // defenders lose health when they collide with enemies
    this.projectiles = []; 
    this.timer = 0; 
  }
  draw() {
    // if mouse is overlaping the cell -> the cell gets a red strokeStyle
    ctx.strokeStyle = 'red';
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'red';
    ctx.font = '30px Arial';
    ctx.fillText( Math.floor(this.health), this.x + 15, this.y ); // show health 
  }
}

canvas.addEventListener('click', function () { 
  // the value of the closest horizontal position to the left
  const gridPositionX = mouse.x - (mouse.x % cellSize);

  // the value of the closest vertical position to the top
  const gridPositionY = mouse.y - (mouse.y % cellSize);

  // we don't place it on the grid if it's inside top area
  if (gridPositionY < cellSize) return;

  // every time we place a defender we will deduct this amount from total amount of resources
  let defenderCost = 100; 

  if (numberOfResources > defenderCost) {
    defenders.push(new Defender(gridPositionX, gridPositionY));
    numberOfResources -= defenderCost;
  }

});


function handleDefenders() {
  for (let i = 0; i < defenders.length; i++) {
    defenders[i].draw();
  }
}



// resources
// utilities
function animate() { 
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'blue';
  ctx.fillRect(0,0, controlsBar.width, controlsBar.height); // starting from top left corner till the width of game board
  handleGameGrid();
  handleDefenders();
  requestAnimationFrame(animate); // to run over and over
 }

animate();

// functions to detect collisions
function collision(first, second) {

  // checking overlapping of horizontal and vertical positions of first and second objects
  if (  !( first.x > second.x + second.width || 
           first.x + first.width < second.x ||
           first.y > second.y + second.height ||
           first.y + first.height < second.y )
  ) {
    return true;
  }
}