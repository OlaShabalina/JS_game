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
let numberOfResources = 400; // how much resources we give to the player initially
const enemies = [];
const enemyPositions = [];
let enemiesInterval = 600; // how often new enemies appear on the grid  
let frame = 0; // time count for the game
let gameOver = false;

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
    ctx.fillStyle = 'green';
    ctx.font = '30px Cairo';
    ctx.fillText( Math.floor(this.health), this.x + 20, this.y + 30 ); // show health 
  }
}

canvas.addEventListener('click', function () { 
  // the value of the closest horizontal position to the left
  const gridPositionX = mouse.x - (mouse.x % cellSize);

  // the value of the closest vertical position to the top
  const gridPositionY = mouse.y - (mouse.y % cellSize);

  // we don't place it on the grid if it's inside top area
  if (gridPositionY < cellSize) return;

  // before placing a defender we need to check if there is one in that cell already 
  // -- this is to prevent using resources while placing defender on the same spot
  for (let i = 0; i < defenders.length; i++) {

    // checking if their x and y coordinates are the same as gridPositionX and gridPositionY
    if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) return;
  }

  // every time we place a defender we will deduct this amount from total amount of resources
  let defenderCost = 100; 

  if (numberOfResources >= defenderCost) {
    defenders.push(new Defender(gridPositionX, gridPositionY));
    numberOfResources -= defenderCost;
  }

});


function handleDefenders() {
  for (let i = 0; i < defenders.length; i++) {
    defenders[i].draw();
    for (let j = 0; j < enemies.length; j++) {
      if (collision(defenders[i], enemies[j])) {

        // if there is a collusion, enemy will stop moving beond defender position
        enemies[j].movement = 0;
        // and defender will start losing health
        defenders[i].health -= 0.2;
      }

      //  if defender has no health left we remove that defender from the array
      if (defenders[i] && defenders[i].health <= 0) {
        defenders.splice(i, 1);

        // to make sure next element in the array doesn't get skipped we reduce i by 1
        i--;

        // if defender is gone, enemy will move forward again
        enemies[j].movement = enemies[j].speed; 
      }
    }
  }
}

// enemies
class Enemy {
  constructor(verticalPosition) {
    this.x = canvas.width;
    this.y = verticalPosition;
    this.width = cellSize;
    this.height = cellSize; 
    this.speed = Math.random() * 0.2 + 4;
    this.movement = this.speed;
    this.health = 100;
    this.maxHealth = this.health;
  }
  update() {
    // enemy will walk from right to left
    this.x -= this.movement;
  }
  draw() {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '30px Cairo';
    ctx.fillText( Math.floor(this.health), this.x + 20, this.y + 30 ); // show health 
  }
}

function handleEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].update();
    enemies[i].draw();

    // if enemy reaches left side of the grid - game is over
    if (enemies[i].x < 0) {
      gameOver = true;
    }
  }

  // every time frame count is passing 100, we add a new enemy to the game
  if (frame % enemiesInterval === 0) {
    let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize;
    // adding new enemy to the grid
    enemies.push(new Enemy(verticalPosition));
    // giving that new enemy a position by adding his vertical position to the enemy position array
    enemyPositions.push(verticalPosition);
    if (enemiesInterval > 120) enemiesInterval -= 50; // reduce interval as the time progresses
  }
}


// resources
// utilities

function handleGameStatus() {
  ctx.fillStyle = 'gold';
  ctx.font = '30px Cairo';
  ctx.fillText('Resources: ' + numberOfResources, 20, 50);

  // game over declaration
  if (gameOver) {
    ctx.fillStyle = 'black';
    ctx.font = '100px Cairo'
    ctx.fillText('GAME OVER', 200, 330);
  }
}


// activating all the elements 
function animate() { 
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'blue';
  ctx.fillRect(0,0, controlsBar.width, controlsBar.height); // starting from top left corner till the width of game board
  handleGameGrid();
  handleDefenders();
  handleEnemies();
  handleGameStatus();
  frame++; // time count is increasing during the game

  // we only continue running animation if the game is not over
  if (!gameOver) requestAnimationFrame(animate); // to run over and over
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