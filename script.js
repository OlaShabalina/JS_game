const canvas = document.getElementById('canvas1');

// getting 2D rendering context for canvas to draw within it
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// global variables
const cellSize = 100; // each sell in the game grid will be 100 * 100 px
const cellGap = 3; // gap between cells
const gameGrid = [];

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
    ctx.strokeStyle = 'black';
    ctx.strokeRect(this.x, this.y, this.width, this.height);
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
// resources
// utilities
function animate() { 
  ctx.fillStyle = 'blue';
  ctx.fillRect(0,0, controlsBar.width, controlsBar.height); // starting from top left corner till the width of game board
  handleGameGrid();
  requestAnimationFrame(animate); // to run over and over
 }

animate();

console.log(gameGrid);