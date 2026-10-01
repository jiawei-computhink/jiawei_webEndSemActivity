const canvasWidth = 800;
const canvasHeight = 520;
const starsToCollect = 5;
const roundLengthSeconds = 60;
const playerSpeed = 4.5;

let player;
let asteroids = [];
let stars = [];
let backgroundStars = [];
let collectedStars = 0;
let remainingLives = 3;
let roundStartedAt = 0;
let invulnerableUntil = 0;
let gameState = 'ready';

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  world.gravity.y = 0;

  player = new Sprite(width / 2, height / 2, 34, 34, 'none');
  player.shape = 'circle';
  player.color = '#57e8ff';
  player.stroke = '#d1fbff';
  player.strokeWeight = 3;

  for (let index = 0; index < 4; index++) {
    const asteroid = new Sprite(0, 0, 42, 42, 'none');
    asteroid.shape = 'circle';
    asteroid.color = '#ff647c';
    asteroid.stroke = '#ffc1bd';
    asteroid.strokeWeight = 2;
    asteroids.push(asteroid);
  }

  for (let index = 0; index < starsToCollect; index++) {
    stars.push({ x: 0, y: 0, twinkle: random(TWO_PI) });
  }

  for (let index = 0; index < 70; index++) {
    backgroundStars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3)
    });
  }

  resetRound();
}

function draw() {
  drawSpaceBackground();

  if (gameState === 'playing') {
    updatePlayer();
    updateAsteroids();
    collectStars();
    checkAsteroidHits();
    checkRoundEnd();
  }

  drawSprites();
  drawAsteroidDetails();
  drawCollectibleStars();
  drawHud();
  drawStateMessage();
}

function drawSpaceBackground() {
  background('#080d24');
  noStroke();
  fill('#101a3b');
  circle(105, 390, 180);
  circle(700, 100, 120);

  fill('#dce7ff');
  for (const backgroundStar of backgroundStars) {
    circle(backgroundStar.x, backgroundStar.y, backgroundStar.size);
  }
}

function updatePlayer() {
  let horizontal = 0;
  let vertical = 0;

  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) horizontal--;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) horizontal++;
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) vertical--;
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) vertical++;

  const movementLength = Math.hypot(horizontal, vertical) || 1;
  player.x += (horizontal / movementLength) * playerSpeed;
  player.y += (vertical / movementLength) * playerSpeed;
  player.x = constrain(player.x, 20, width - 20);
  player.y = constrain(player.y, 20, height - 20);
}

function updateAsteroids() {
  for (const asteroid of asteroids) {
    asteroid.x += asteroid.speedX;
    asteroid.y += asteroid.speedY;

    if (asteroid.x < -30) asteroid.x = width + 30;
    if (asteroid.x > width + 30) asteroid.x = -30;
    if (asteroid.y < -30) asteroid.y = height + 30;
    if (asteroid.y > height + 30) asteroid.y = -30;
  }
}

function collectStars() {
  for (const star of stars) {
    if (dist(player.x, player.y, star.x, star.y) < 30) {
      collectedStars++;
      placeStar(star);
    }
  }
}

function checkAsteroidHits() {
  if (millis() < invulnerableUntil) return;

  for (const asteroid of asteroids) {
    if (dist(player.x, player.y, asteroid.x, asteroid.y) < 38) {
      remainingLives--;
      invulnerableUntil = millis() + 1000;
      player.x = width / 2;
      player.y = height / 2;
      asteroid.x = random(width);
      asteroid.y = -30;

      if (remainingLives <= 0) gameState = 'lost';
      return;
    }
  }
}

function checkRoundEnd() {
  if (collectedStars >= starsToCollect) {
    gameState = 'won';
  } else if (millis() - roundStartedAt >= roundLengthSeconds * 1000) {
    gameState = 'lost';
  }
}

function drawAsteroidDetails() {
  noStroke();
  fill('#bd405c');
  for (const asteroid of asteroids) {
    circle(asteroid.x - 7, asteroid.y - 4, 9);
    circle(asteroid.x + 8, asteroid.y + 7, 6);
  }
}

function drawCollectibleStars() {
  for (const star of stars) {
    const pulse = 1 + sin(frameCount * 0.08 + star.twinkle) * 0.12;
    drawStar(star.x, star.y, 8 * pulse, 17 * pulse);
  }
}

function drawStar(x, y, innerRadius, outerRadius) {
  fill('#ffe680');
  stroke('#fff6c2');
  strokeWeight(2);
  beginShape();

  for (let point = 0; point < 10; point++) {
    const angle = -HALF_PI + point * PI / 5;
    const radius = point % 2 === 0 ? outerRadius : innerRadius;
    vertex(x + cos(angle) * radius, y + sin(angle) * radius);
  }

  endShape(CLOSE);
}

function drawHud() {
  noStroke();
  fill('#ffffff');
  textAlign(LEFT, CENTER);
  textSize(18);
  text(`Stars: ${collectedStars}/${starsToCollect}`, 22, 28);
  text(`Lives: ${'♥ '.repeat(remainingLives)}`, 22, 56);

  const secondsLeft = gameState === 'playing'
    ? max(0, roundLengthSeconds - floor((millis() - roundStartedAt) / 1000))
    : roundLengthSeconds;
  textAlign(RIGHT, CENTER);
  text(`Time: ${secondsLeft}`, width - 22, 28);
}

function drawStateMessage() {
  if (gameState === 'playing') return;

  noStroke();
  fill(5, 8, 24, 220);
  rect(width / 2 - 235, height / 2 - 78, 470, 156, 18);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(32);

  if (gameState === 'ready') {
    fill('#ffe680');
    text('STAR RESCUE', width / 2, height / 2 - 28);
    textStyle(NORMAL);
    textSize(17);
    fill('#eefaff');
    text('Collect 5 stars. Avoid asteroids!', width / 2, height / 2 + 12);
    text('Press ENTER or click to start', width / 2, height / 2 + 42);
  } else if (gameState === 'won') {
    fill('#a4ffbe');
    text('MISSION COMPLETE!', width / 2, height / 2 - 18);
    drawRestartMessage();
  } else {
    fill('#ff8d9c');
    text('MISSION FAILED', width / 2, height / 2 - 18);
    drawRestartMessage();
  }

  textStyle(NORMAL);
}

function drawRestartMessage() {
  textStyle(NORMAL);
  textSize(17);
  fill('#eefaff');
  text('Press ENTER or click to play again', width / 2, height / 2 + 28);
}

function placeStar(star) {
  let attempts = 0;

  do {
    star.x = random(40, width - 40);
    star.y = random(80, height - 40);
    attempts++;
  } while (
    attempts < 20 &&
    (dist(player.x, player.y, star.x, star.y) < 80 ||
      asteroids.some((asteroid) => dist(asteroid.x, asteroid.y, star.x, star.y) < 55))
  );
}

function resetRound() {
  collectedStars = 0;
  remainingLives = 3;
  roundStartedAt = 0;
  invulnerableUntil = 0;
  player.x = width / 2;
  player.y = height / 2;

  for (let index = 0; index < asteroids.length; index++) {
    const asteroid = asteroids[index];
    asteroid.x = random(50, width - 50);
    asteroid.y = random(80, height - 50);
    asteroid.speedX = random(-2.2, 2.2) || 1.5;
    asteroid.speedY = random(-2.2, 2.2) || -1.5;
  }

  for (const star of stars) {
    placeStar(star);
  }
}

function startGame() {
  resetRound();
  roundStartedAt = millis();
  gameState = 'playing';
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    startGame();
  } else if (keyCode === ENTER && gameState !== 'playing') {
    startGame();
  }
}

function mousePressed() {
  if (gameState !== 'playing') startGame();
}
