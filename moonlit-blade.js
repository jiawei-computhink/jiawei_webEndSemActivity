const arenaWidth = 900;
const arenaHeight = 540;
const enemiesToDefeat = 8;
const enemyStartingHealth = 3;
const playerStartingHealth = 5;

let player;
let platforms;
let enemies;
let defeatedEnemies = 0;
let spawnedEnemies = 0;
let playerHealth = playerStartingHealth;
let gameState = 'ready';
let nextSpawnAt = 0;
let lastDamageAt = 0;
let attackStartedAt = -1000;
let attackResolved = false;
let playerFacing = 1;
let comboStep = 0;
let comboExpiresAt = 0;

function setup() {
  createCanvas(arenaWidth, arenaHeight);
  world.gravity.y = 10;

  platforms = new Group();
  platforms.collider = 'static';
  addPlatform(width / 2, height - 24, width, 48);
  addPlatform(width * 0.39, 402, 190, 18);
  addPlatform(width * 0.72, 340, 150, 18);

  player = new Sprite(125, height - 100, 32, 48, 'dynamic');
  player.color = '#d9eaff';
  player.stroke = '#83d7ff';
  player.strokeWeight = 3;
  player.friction = 0;
  player.drag = 0;
  player.rotationLock = true;

  enemies = new Group();
  enemies.collider = 'dynamic';
  enemies.shape = 'circle';
  enemies.color = '#a93e72';
  enemies.stroke = '#ff8fbd';
  enemies.strokeWeight = 3;
  enemies.friction = 0;
  enemies.drag = 0;
}

function addPlatform(x, y, platformWidth, platformHeight) {
  const platform = new platforms.Sprite(x, y, platformWidth, platformHeight);
  platform.visible = false;
}

function draw() {
  drawCavern();

  if (gameState === 'playing') {
    movePlayer();
    updateEnemies();
    spawnEnemies();
    checkEnemyContact();
    checkGameEnd();
  } else {
    player.vel.x = 0;
  }

  drawSprites();
  drawPlatformArt();
  drawCharacterDetails();
  drawSlash();
  drawHud();
  drawStateMessage();
}

function drawCavern() {
  background('#101329');

  noStroke();
  fill('#171b37');
  ellipse(160, 430, 350, 220);
  ellipse(740, 430, 420, 260);
  fill('#202442');
  triangle(0, 210, 125, 0, 250, 210);
  triangle(540, 165, 690, 0, 840, 165);
  triangle(740, 205, 840, 35, 900, 185);

  for (let index = 0; index < 24; index++) {
    const x = (index * 79 + 24) % width;
    const y = 75 + (index * 47) % 290;
    const glow = 120 + sin(frameCount * 0.035 + index) * 55;
    noStroke();
    fill(127, 213, 255, glow);
    circle(x, y, 3 + (index % 3));
  }

  noStroke();
  fill('#101329');
  rect(0, height - 48, width, 48);
  stroke('#6371aa');
  strokeWeight(2);
  line(0, height - 48, width, height - 48);
}

function drawPlatformArt() {
  noStroke();
  fill('#313754');
  rect(0, height - 48, width, 48);
  fill('#66759d');
  rect(0, height - 50, width, 4);

  drawStonePlatform(width * 0.39, 402, 190);
  drawStonePlatform(width * 0.72, 340, 150);
}

function drawStonePlatform(x, y, platformWidth) {
  noStroke();
  fill('#303754');
  rect(x - platformWidth / 2, y - 9, platformWidth, 18, 5);
  fill('#7782ae');
  rect(x - platformWidth / 2, y - 9, platformWidth, 3, 2);
}

function drawCharacterDetails() {
  push();
  rectMode(CENTER);

  // The player's pale mask and scarf make the small p5play sprite read as a knight.
  fill('#f2f5ff');
  noStroke();
  ellipse(player.x, player.y - 7, 23, 25);
  fill('#242a46');
  ellipse(player.x + playerFacing * 5, player.y - 7, 3, 5);
  fill('#8b72e8');
  triangle(
    player.x - 11, player.y + 5,
    player.x + playerFacing * 17, player.y + 12,
    player.x - 5, player.y + 13
  );

  for (const enemy of enemies) {
    fill('#401d46');
    noStroke();
    ellipse(enemy.x, enemy.y, 29, 30);
    fill('#ffcbdd');
    ellipse(enemy.x - 6, enemy.y - 2, 4, 5);
    ellipse(enemy.x + 6, enemy.y - 2, 4, 5);
    fill('#e66e9f');
    triangle(enemy.x - 10, enemy.y - 11, enemy.x - 14, enemy.y - 20, enemy.x - 3, enemy.y - 13);
    triangle(enemy.x + 10, enemy.y - 11, enemy.x + 14, enemy.y - 20, enemy.x + 3, enemy.y - 13);

    const healthBarWidth = 34;
    const healthRatio = enemy.health / enemyStartingHealth;
    fill('#24172d');
    rect(enemy.x - healthBarWidth / 2, enemy.y - 28, healthBarWidth, 5, 2);
    fill('#ff7da8');
    rect(enemy.x - healthBarWidth / 2, enemy.y - 28, healthBarWidth * healthRatio, 5, 2);
  }

  pop();
}

function drawSlash() {
  const attackAge = millis() - attackStartedAt;
  if (attackAge < 0 || attackAge > 190 || gameState !== 'playing') return;

  push();
  noFill();
  stroke(comboStep === 3 ? '#ffe88a' : '#b9f5ff');
  strokeWeight(comboStep === 3 ? 10 : 7);
  const slashX = player.x + playerFacing * 38;
  const slashSize = comboStep === 3 ? 100 : 72;
  arc(slashX, player.y - 5, slashSize, slashSize, playerFacing > 0 ? -1.1 : PI - 1.1, playerFacing > 0 ? 1.1 : PI + 1.1);
  stroke('#ffffff');
  strokeWeight(2);
  line(player.x + playerFacing * 12, player.y - 15, player.x + playerFacing * (comboStep === 3 ? 70 : 55), player.y + 8);
  pop();
}

function drawHud() {
  noStroke();
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(17);
  fill('#e8eeff');
  text(`Wraiths: ${defeatedEnemies}/${enemiesToDefeat}`, 22, 26);
  fill('#ff98c7');
  text(`Health: ${'♥ '.repeat(playerHealth)}`, 22, 53);
  fill('#c7f5ff');
  const visibleCombo = millis() < comboExpiresAt ? comboStep : 0;
  text(`Combo: ${visibleCombo}/3`, 22, 80);
  textStyle(NORMAL);

  textAlign(RIGHT, CENTER);
  fill('#aeb9dc');
  text('WASD / arrows: move   Space / W / ↑: jump   J / X: slash', width - 20, 28);
}

function drawStateMessage() {
  if (gameState === 'playing') return;

  noStroke();
  fill(7, 9, 25, 230);
  rect(width / 2 - 250, height / 2 - 88, 500, 176, 18);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(32);

  if (gameState === 'ready') {
    fill('#c7f5ff');
    text('MOONLIT BLADE', width / 2, height / 2 - 38);
    textStyle(NORMAL);
    textSize(17);
    fill('#e4e9ff');
    text('Defeat all 8 wraiths before they overwhelm you.', width / 2, height / 2 + 2);
    text('Press ENTER or click to begin', width / 2, height / 2 + 37);
  } else if (gameState === 'won') {
    fill('#baffda');
    text('THE CAVERN IS CLEARED!', width / 2, height / 2 - 18);
    drawRestartMessage();
  } else {
    fill('#ff9ab9');
    text('THE WRAITHS PREVAIL', width / 2, height / 2 - 18);
    drawRestartMessage();
  }

  textStyle(NORMAL);
}

function drawRestartMessage() {
  textStyle(NORMAL);
  textSize(17);
  fill('#e4e9ff');
  text('Press ENTER or click to play again', width / 2, height / 2 + 28);
}

function movePlayer() {
  const movementSpeed = 4.2;
  let horizontalMovement = 0;

  if (kb.pressing('left') || kb.pressing('a')) horizontalMovement--;
  if (kb.pressing('right') || kb.pressing('d')) horizontalMovement++;

  player.vel.x = horizontalMovement * movementSpeed;
  if (horizontalMovement !== 0) playerFacing = Math.sign(horizontalMovement);

  player.x = constrain(player.x, 20, width - 20);
  player.colliding(platforms);

  if (millis() - attackStartedAt <= 190 && !attackResolved) {
    resolveSlash();
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    const direction = Math.sign(player.x - enemy.x);
    enemy.vel.x = direction * 1.15;
    enemy.colliding(platforms);
  }
}

function spawnEnemies() {
  if (spawnedEnemies >= enemiesToDefeat || millis() < nextSpawnAt || enemies.length >= 3) return;

  const spawnX = player.x < width / 2 ? random(width * 0.68, width - 45) : random(45, width * 0.32);
  const enemy = new enemies.Sprite(spawnX, height - 90, 34, 36, 'dynamic');
  enemy.shape = 'circle';
  enemy.bounciness = 0;
  enemy.friction = 0;
  enemy.drag = 0;
  enemy.rotationLock = true;
  enemy.health = enemyStartingHealth;
  spawnedEnemies++;
  nextSpawnAt = millis() + 1250;
}

function resolveSlash() {
  if (attackResolved) return;
  attackResolved = true;

  const slashReach = comboStep === 3 ? 128 : comboStep === 2 ? 104 : 92;
  const verticalReach = comboStep === 3 ? 70 : 55;

  for (const enemy of enemies) {
    const horizontalDistance = (enemy.x - player.x) * playerFacing;
    const verticalDistance = abs(enemy.y - player.y);

    if (horizontalDistance > 8 && horizontalDistance < slashReach && verticalDistance < verticalReach) {
      enemy.health--;
      if (enemy.health <= 0) {
        enemy.remove();
        defeatedEnemies++;
      }
    }
  }
}

function checkEnemyContact() {
  if (millis() - lastDamageAt < 900) return;

  for (const enemy of enemies) {
    if (abs(enemy.x - player.x) < 34 && abs(enemy.y - player.y) < 40) {
      playerHealth--;
      lastDamageAt = millis();
      player.vel.x = enemy.x < player.x ? 5 : -5;
      player.vel.y = -4;

      if (playerHealth <= 0) gameState = 'lost';
      return;
    }
  }
}

function checkGameEnd() {
  if (defeatedEnemies >= enemiesToDefeat) {
    gameState = 'won';
  }
}

function startGame() {
  resetGame();
  gameState = 'playing';
  nextSpawnAt = millis() + 500;
}

function resetGame() {
  for (const enemy of enemies) enemy.remove();
  defeatedEnemies = 0;
  spawnedEnemies = 0;
  playerHealth = playerStartingHealth;
  lastDamageAt = 0;
  attackStartedAt = -1000;
  attackResolved = false;
  comboStep = 0;
  comboExpiresAt = 0;
  playerFacing = 1;
  player.x = 125;
  player.y = height - 100;
  player.vel.x = 0;
  player.vel.y = 0;
}

function keyPressed() {
  if (key === ' ' || keyCode === UP_ARROW || key === 'w' || key === 'W') {
    if (gameState === 'playing' && player.colliding(platforms)) {
      player.vel.y = -7;
    }
  }

  if (key === 'j' || key === 'J' || key === 'x' || key === 'X') {
    if (gameState === 'playing' && millis() - attackStartedAt > 240) {
      comboStep = millis() <= comboExpiresAt ? comboStep % 3 + 1 : 1;
      comboExpiresAt = millis() + 900;
      attackStartedAt = millis();
      attackResolved = false;
      resolveSlash();
    }
  }

  if (keyCode === ENTER && gameState !== 'playing') {
    startGame();
  } else if (key === 'r' || key === 'R') {
    startGame();
  }

  if (key === ' ' || keyCode === UP_ARROW) return false;
}

function mousePressed() {
  if (gameState !== 'playing') startGame();
}
