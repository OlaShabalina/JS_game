const canvas = document.getElementById('canvas1');

// getting 2D rendering context for canvas to draw within it
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// global variables
const cellSize = 100; // each sell in the game grid will be 100 * 100 px
const cellGap = 3; // gap between cells
let numberOfResources = 500; // how much resources we give to the player initially
let enemiesInterval = 600; // how often new enemies appear on the grid  
let frame = 0; // time count for the game
let gameOver = false;
let score = 0; // points 
let winningScore = 10;

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];

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

// projectiles
class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y; 
    this.width = 10;
    this.height = 10;
    this.power = 20;
    this.speed = 5;
  }
  update() {
    this.x += this.speed;
  }
  draw() {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    // draw a circle 
    ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    ctx.fill();
  }
}

function handleProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    projectiles[i].update();
    projectiles[i].draw();

    // checking for collusion between projectiles and enemies
    for (let j = 0; j < enemies.length; j++) {

      if (enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])) {
        // if projectiles and enemies collide, we reduce the enemy health by projectiles power amount
        enemies[j].health -= projectiles[i].power;
        // once projectile hits the enemy, we want to remove it from the projectiles array as it's already used
        projectiles.splice(i, 1);
        // reduce index so we don't miss the next projectile after the removed one
        i--;
      }
    }

    // make sure we can only hit enemies when they are fully visible on the screen
    if (projectiles[i] && projectiles[i].x > (canvas.width - cellSize)) {

      // remove that projectile
      projectiles.splice(i, 1);
      // once projectile is removed we make sure we don't skip the next one
      i--; 
    }
  }
}


// defenders
class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2; // so defenders don't collide with enemies from another lane
    this.height = cellSize -cellGap * 2;
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
  update() {
    // only use projectiles if there is enemy on the line
    if (this.shooting) {

      this.timer++;

      // every time when times exceeds 100 new projectile is added to the defender with the same coordinates as defender
      if (this.timer % 100 === 0) {
        projectiles.push(new Projectile(this.x + 70, this.y + 50));
      } 
    } else {
      this.timer = 0;
    }
  }
}

canvas.addEventListener('click', function () { 
  // the value of the closest horizontal position to the left
  const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;

  // the value of the closest vertical position to the top
  const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;

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
    defenders[i].update();

    // if there is an enemy on the same position with defender, defender will shoot
    if ( enemyPositions.indexOf(defenders[i].y - 3) !== -1 ) {
      defenders[i].shooting = true;
    } else {
      defenders[i].shooting = false;
    }

    for (let j = 0; j < enemies.length; j++) {
      if (defenders[i] && collision(defenders[i], enemies[j])) {

        // if there is a collusion, enemy will stop moving beond defender position
        enemies[j].movement = 0;
        // and defender will start losing health
        defenders[i].health -= 1;
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
    this.speed = Math.random() * 0.2 + 0.4;
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

    // remove enemies from the grid if their health is less than 0
    if (enemies[i].health <= 0) {

      // giving points(resources) to defenders once they bit an enemy (for enemy with 100 will give 10)
      const gainedResources = enemies[i].maxHealth/10;
      numberOfResources += gainedResources;
      // points for each enemy will be equal to resources acquired 
      score += gainedResources;

      // remove enemy coordinate 
      const findEnemyIndex = enemyPositions.indexOf(enemies[i].y);
      enemyPositions.splice(findEnemyIndex, 1);

      // remove enemy 
      enemies.splice(i, 1);
      // reduce index so we don't miss the next enemy once the current one is removed
      i--;
    }

  }

  // every time frame count is passing 100, we add a new enemy to the game
  if (frame % enemiesInterval === 0 && score < winningScore) {
    let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize;
    // adding new enemy to the grid
    enemies.push(new Enemy(verticalPosition));
    // giving that new enemy a position by adding his vertical position to the enemy position array
    enemyPositions.push(verticalPosition);
    console.log(enemyPositions)
    if (enemiesInterval > 120) enemiesInterval -= 50; // reduce interval as the time progresses
  }
}


// resources
const amounts = [20, 30, 40];

class Resource {
  constructor() {
    this.x = Math.random() * (canvas.width - cellSize);
    // resources will be sitting on rows to avoid clipping issues 
    this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
    this.height = cellSize * 0.6;
    this.width = cellSize * 0.6;

    this.amount = amounts[Math.floor(Math.random() * amounts.length)];
  }
  draw(){
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'white';
    ctx.font = '20px Cairo';
    ctx.fillText(this.amount, this.x + 15, this.y + 25)
  }
}

function handleResources(){
  // every 500 frames there will be new resourse available
  if ( frame % 500 === 0 && score < winningScore ){
    resources.push(new Resource());
  }

  for (let i = 0; i < resources.length; i++) {
    resources[i].draw();

    // collecting resources on mouseover
    if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)){
      numberOfResources += resources[i].amount;
      resources.splice(i, 1);
      i--;
    }
  }
}

// utilities

function handleGameStatus() {
  ctx.fillStyle = 'gold';
  ctx.font = '30px Cairo';
  ctx.fillText('Score: ' + score, 20, 40);
  ctx.fillText('Resources: ' + numberOfResources, 20, 80);

  // game over declaration
  if (gameOver) {
    ctx.fillStyle = 'black';
    ctx.font = '100px Cairo';
    ctx.fillText('GAME OVER', 200, 330);
  }

  // display winning message - if score is more than winning score and all the enemies are refeated
  if (score >= winningScore && enemies.length === 0) {
    ctx.fillStyle = 'black';
    ctx.font = '60px Cairo';
    ctx.fillText('LEVEL COMPLETE', 200, 330);
    ctx.font = '30px Cairo';
    ctx.fillText('You win with ' + score + ' points!', 200, 360);

  }
}


// activating all the elements 
function animate() { 
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'blue';
  ctx.fillRect(0,0, controlsBar.width, controlsBar.height); // starting from top left corner till the width of game board
  handleGameGrid();
  handleDefenders();
  handleResources();
  handleProjectiles();
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

// fixing the issue of mouse not having correct cordinates by creating resize event
window.addEventListener('resize', function () { 
  canvasPosition = canvas.getBoundingClientRect();
 })