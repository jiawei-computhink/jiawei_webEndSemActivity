const boardCells = 24;
const cellSize = 24;
const boardSize = boardCells * cellSize;
const boardOffset = (720 - boardSize) / 2;
const fruitsToWin = 20;

let snake;
let fruit;
let direction;
let nextDirection;
let score;
let gameState;
let lastMoveTime;

function setup() {
  createCanvas(720, 720);
  world.gravity.y = 0;
  frameRate(60);
  resetGame();
}

function draw() {
  drawBoard();

  if (gameState === 'playing' && millis() - lastMoveTime >= movementDelay()) {
    moveSnake();
    lastMoveTime = millis();
  }

  drawSprites();
  drawScore();

  if (gameState !== 'playing') {
    drawMessage();
  }
}

function resetGame() {
  if (snake) {
    for (const segment of snake) {
      segment.sprite.remove();
    }
  }
  if (fruit) {
    fruit.remove();
  }

  snake = [];
  score = 0;
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  gameState = 'ready';
  lastMoveTime = millis();

  addSegment(8, 12);
  addSegment(7, 12);
  addSegment(6, 12);
  placeFruit();
}

function addSegment(gridX, gridY) {
  const segment = new Sprite(
    cellCenterX(gridX),
    cellCenterY(gridY),
    cellSize - 4,
    cellSize - 4,
    'none'
  );
  segment.color = snake.length === 0 ? '#a8fff0' : '#19e6c2';
  segment.stroke = snake.length === 0 ? '#ffffff' : '#76ffe5';
  segment.rotationLock = true;
  snake.push({ x: gridX, y: gridY, sprite: segment });
}

function placeFruit() {
  const openCells = [];

  for (let x = 0; x < boardCells; x++) {
    for (let y = 0; y < boardCells; y++) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        openCells.push({ x, y });
      }
    }
  }

  const location = random(openCells);
  fruit = new Sprite(
    cellCenterX(location.x),
    cellCenterY(location.y),
    cellSize - 8,
    cellSize - 8,
    'none'
  );
  fruit.color = '#ff4fa3';
  fruit.stroke = '#ffd0e8';
  fruit.xGrid = location.x;
  fruit.yGrid = location.y;
}

function moveSnake() {
  direction = nextDirection;
  const head = snake[0];
  const nextX = head.x + direction.x;
  const nextY = head.y + direction.y;
  const eatsFruit = nextX === fruit.xGrid && nextY === fruit.yGrid;

  if (nextX < 0 || nextX >= boardCells || nextY < 0 || nextY >= boardCells) {
    gameState = 'lost';
    return;
  }

  const bodyToCheck = snake.slice(0, eatsFruit ? snake.length : snake.length - 1);
  if (bodyToCheck.some((segment) => segment.x === nextX && segment.y === nextY)) {
    gameState = 'lost';
    return;
  }

  if (!eatsFruit) {
    const tail = snake.pop();
    tail.x = nextX;
    tail.y = nextY;
    snake.unshift(tail);
  } else {
    const newHead = new Sprite(
      cellCenterX(nextX),
      cellCenterY(nextY),
      cellSize - 4,
      cellSize - 4,
      'none'
    );
    newHead.color = '#a8fff0';
    newHead.stroke = '#ffffff';
    newHead.rotationLock = true;
    snake.unshift({ x: nextX, y: nextY, sprite: newHead });
    score++;

    if (score >= fruitsToWin) {
      gameState = 'won';
      return;
    }
    placeFruit();
  }

  for (let i = 0; i < snake.length; i++) {
    const segment = snake[i];
    segment.sprite.x = cellCenterX(segment.x);
    segment.sprite.y = cellCenterY(segment.y);
    segment.sprite.color = i === 0 ? '#a8fff0' : '#19e6c2';
    segment.sprite.stroke = i === 0 ? '#ffffff' : '#76ffe5';
  }
}

function drawBoard() {
  background('#080b19');
  noStroke();
  fill('#0d1428');
  rect(boardOffset, boardOffset, boardSize, boardSize, 8);

  stroke('#18334a');
  strokeWeight(1);
  for (let cell = 0; cell <= boardCells; cell++) {
    const position = boardOffset + cell * cellSize;
    line(position, boardOffset, position, boardOffset + boardSize);
    line(boardOffset, position, boardOffset + boardSize, position);
  }

  noFill();
  stroke('#30f4da');
  strokeWeight(2);
  rect(boardOffset, boardOffset, boardSize, boardSize, 8);
  noStroke();
}

function drawScore() {
  fill('#ecffff');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(24);
  text(`FRUIT: ${score} / ${fruitsToWin}`, width / 2, 42);
  textStyle(NORMAL);
}

function drawMessage() {
  noStroke();
  fill(5, 8, 24, 220);
  rect(width / 2 - 220, height / 2 - 76, 440, 152, 18);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(30);
  fill(gameState === 'lost' ? '#ff7baf' : '#a8fff0');

  if (gameState === 'ready') {
    text('NEON SNAKE', width / 2, height / 2 - 22);
    textStyle(NORMAL);
    textSize(16);
    fill('#d8faff');
    text('Press an arrow key or ENTER to start', width / 2, height / 2 + 24);
  } else if (gameState === 'won') {
    text('YOU WIN!', width / 2, height / 2 - 22);
    textStyle(NORMAL);
    textSize(16);
    fill('#d8faff');
    text('You ate all 20 fruits. Press R to play again', width / 2, height / 2 + 24);
  } else {
    text('GAME OVER', width / 2, height / 2 - 22);
    textStyle(NORMAL);
    textSize(16);
    fill('#d8faff');
    text('Press R to try again', width / 2, height / 2 + 24);
  }
}

function movementDelay() {
  return max(65, 140 - score * 3);
}

function cellCenterX(gridX) {
  return boardOffset + gridX * cellSize + cellSize / 2;
}

function cellCenterY(gridY) {
  return boardOffset + gridY * cellSize + cellSize / 2;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    resetGame();
    return false;
  }

  const isArrowKey = keyCode === UP_ARROW || keyCode === DOWN_ARROW
    || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW;

  if (gameState === 'ready' && (isArrowKey || keyCode === ENTER)) {
    gameState = 'playing';
    lastMoveTime = millis();
  }

  if (gameState !== 'playing') {
    return false;
  }

  if (keyCode === UP_ARROW && direction.y !== 1) {
    nextDirection = { x: 0, y: -1 };
  } else if (keyCode === DOWN_ARROW && direction.y !== -1) {
    nextDirection = { x: 0, y: 1 };
  } else if (keyCode === LEFT_ARROW && direction.x !== 1) {
    nextDirection = { x: -1, y: 0 };
  } else if (keyCode === RIGHT_ARROW && direction.x !== -1) {
    nextDirection = { x: 1, y: 0 };
  } else if (keyCode === ENTER) {
    return false;
  }

  return false;
}
