const rinkWidth = 900;
const rinkHeight = 540;
const goalSize = 150;
const winningScore = 5;

let playerOne;
let playerTwo;
let puck;
let walls;
let scores;
let gameState = 'ready';

function setup() {
  createCanvas(rinkWidth, rinkHeight);
  world.gravity.y = 0;

  walls = new Group();
  walls.collider = 'static';

  addWall(width / 2, 8, width, 16);
  addWall(width / 2, height - 8, width, 16);
  addWall(8, (height - goalSize) / 4 + 8, 16, (height - goalSize) / 2);
  addWall(8, height - (height - goalSize) / 4 - 8, 16, (height - goalSize) / 2);
  addWall(width - 8, (height - goalSize) / 4 + 8, 16, (height - goalSize) / 2);
  addWall(width - 8, height - (height - goalSize) / 4 - 8, 16, (height - goalSize) / 2);

  playerOne = makePaddle(width * 0.25, '#ff4fd8', '#ffb1ed');
  playerTwo = makePaddle(width * 0.75, '#42eaff', '#b1faff');
  puck = new Sprite(width / 2, height / 2, 26, 'dynamic');
  puck.color = '#ffffff';
  puck.stroke = '#d6fcff';
  puck.bounciness = 1;
  puck.friction = 0;
  puck.drag = 0;
  puck.mass = 0.7;

  scores = [0, 0];
  drawBackground();
  showMessage('NEON AIR HOCKEY', 'Press ENTER or click to start');
}

function addWall(x, y, w, h) {
  const wall = new walls.Sprite(x, y, w, h);
  wall.visible = false;
}

function makePaddle(x, colorValue, strokeValue) {
  const paddle = new Sprite(x, height / 2, 56, 'kinematic');
  paddle.color = colorValue;
  paddle.stroke = strokeValue;
  paddle.bounciness = 1;
  paddle.friction = 0;
  paddle.drag = 0;
  return paddle;
}

function draw() {
  drawBackground();

  if (gameState === 'playing') {
    movePaddles();
    checkGoal();
  } else {
    playerOne.vel.x = 0;
    playerOne.vel.y = 0;
    playerTwo.vel.x = 0;
    playerTwo.vel.y = 0;
  }

  drawSprites();
  drawScore();

  if (gameState === 'ready') {
    showMessage('NEON AIR HOCKEY', 'Press ENTER or click to start');
  } else if (gameState === 'paused') {
    showMessage('GOAL!', 'Press ENTER or click to continue');
  } else if (gameState === 'finished') {
    const winner = scores[0] === winningScore ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
    showMessage(winner, 'Press R or click to play again');
  }
}

function drawBackground() {
  background('#090d20');
  noFill();
  stroke('#38eaff');
  strokeWeight(3);
  rect(24, 24, width - 48, height - 48, 24);
  stroke('#284d75');
  strokeWeight(2);
  line(width / 2, 24, width / 2, height - 24);
  circle(width / 2, height / 2, 150);
  line(24, height / 2, width - 24, height / 2);

  noStroke();
  fill('#090d20');
  rect(0, (height - goalSize) / 2, 32, goalSize);
  rect(width - 32, (height - goalSize) / 2, 32, goalSize);
  fill('#ff4fd8');
  rect(5, (height - goalSize) / 2, 8, goalSize, 4);
  fill('#42eaff');
  rect(width - 13, (height - goalSize) / 2, 8, goalSize, 4);
}

function drawScore() {
  textAlign(CENTER, CENTER);
  textSize(36);
  textStyle(BOLD);
  fill('#ff7be2');
  text(scores[0], width / 2 - 45, 62);
  fill('#74f5ff');
  text(scores[1], width / 2 + 45, 62);
  textStyle(NORMAL);
}

function showMessage(title, subtitle) {
  noStroke();
  fill(5, 8, 24, 220);
  rect(width / 2 - 240, height / 2 - 76, 480, 152, 18);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(30);
  fill('#ffffff');
  text(title, width / 2, height / 2 - 20);
  textStyle(NORMAL);
  textSize(17);
  fill('#bdfaff');
  text(subtitle, width / 2, height / 2 + 25);
}

function movePaddles() {
  const speed = 5;
  playerOne.vel.x = (kb.pressing('d') ? speed : 0) - (kb.pressing('a') ? speed : 0);
  playerOne.vel.y = (kb.pressing('s') ? speed : 0) - (kb.pressing('w') ? speed : 0);
  playerTwo.vel.x = (kb.pressing('right') ? speed : 0) - (kb.pressing('left') ? speed : 0);
  playerTwo.vel.y = (kb.pressing('down') ? speed : 0) - (kb.pressing('up') ? speed : 0);

  keepPaddleInBounds(playerOne, 52, width / 2 - 32);
  keepPaddleInBounds(playerTwo, width / 2 + 32, width - 52);
}

function keepPaddleInBounds(paddle, minX, maxX) {
  paddle.x = constrain(paddle.x, minX, maxX);
  paddle.y = constrain(paddle.y, 52, height - 52);
}

function checkGoal() {
  if (puck.x < 20 && abs(puck.y - height / 2) < goalSize / 2) {
    scoreGoal(1);
  } else if (puck.x > width - 20 && abs(puck.y - height / 2) < goalSize / 2) {
    scoreGoal(0);
  }
}

function scoreGoal(playerIndex) {
  scores[playerIndex]++;
  puck.vel.x = 0;
  puck.vel.y = 0;
  puck.x = width / 2;
  puck.y = height / 2;
  playerOne.x = width * 0.25;
  playerOne.y = height / 2;
  playerTwo.x = width * 0.75;
  playerTwo.y = height / 2;
  gameState = scores[playerIndex] >= winningScore ? 'finished' : 'paused';
}

function startRound() {
  gameState = 'playing';
  puck.x = width / 2;
  puck.y = height / 2;
  const direction = random() < 0.5 ? -1 : 1;
  const angle = random(-0.45, 0.45);
  puck.vel.x = direction * 5 * cos(angle);
  puck.vel.y = 5 * sin(angle);
}

function resetGame() {
  scores = [0, 0];
  playerOne.x = width * 0.25;
  playerOne.y = height / 2;
  playerTwo.x = width * 0.75;
  playerTwo.y = height / 2;
  puck.x = width / 2;
  puck.y = height / 2;
  puck.vel.x = 0;
  puck.vel.y = 0;
  gameState = 'ready';
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    resetGame();
    return;
  }

  if (keyCode === ENTER || key === ' ') {
    if (gameState === 'ready' || gameState === 'paused') {
      startRound();
    } else if (gameState === 'finished') {
      resetGame();
    }
  }
}

function mousePressed() {
  if (gameState === 'ready' || gameState === 'paused') {
    startRound();
  } else if (gameState === 'finished') {
    resetGame();
  }
}
