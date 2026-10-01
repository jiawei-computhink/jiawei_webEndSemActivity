const arenaWidth = 900;
const arenaHeight = 560;
const survivalSeconds = 60;
const playerSpeed = 4;
const valveColors = ['#55d6be', '#f6c453', '#e88d67'];

let player;
let enemies;
let bullets;
let valves = [];
let gameState = 'ready';
let lives = 3;
let defeatedEnemies = 0;
let startedAt = 0;
let lastShotAt = 0;
let lastEnemyAt = 0;
let invulnerableUntil = 0;
let valveCode = [];
let nextValve = 0;
let aimX = 1;
let aimY = 0;
let statusMessage = '';
let statusUntil = 0;

function setup() {
  createCanvas(arenaWidth, arenaHeight);
  world.gravity.y = 0;

  enemies = new Group();
  enemies.collider = 'none';
  bullets = new Group();
  bullets.collider = 'none';

  player = new Sprite(width / 2, height / 2, 30, 30, 'none');
  player.shape = 'circle';
  player.color = '#f3b55b';
  player.stroke = '#fff0bd';
  player.strokeWeight = 3;

  createValves();
  resetGame();
}

function createValves() {
  const positions = [
    [width * 0.22, height * 0.28],
    [width * 0.78, height * 0.28],
    [width * 0.5, height * 0.78]
  ];

  valves = positions.map((position, index) => {
    const valve = new Sprite(position[0], position[1], 34, 34, 'none');
    valve.shape = 'circle';
    valve.color = valveColors[index];
    valve.stroke = '#fff1cb';
    valve.strokeWeight = 2;
    valve.activated = false;
    valve.number = index + 1;
    return valve;
  });
}

function draw() {
  drawArena();

  if (gameState === 'playing') {
    updatePlayer();
    updateAim();
    updateShooting();
    updateEnemies();
    updateBullets();
    checkPlayerHits();
    checkRoundEnd();
  }

  drawSprites();
  drawValveDetails();
  drawHud();

  if (gameState !== 'playing') drawStateMessage();
}

function drawArena() {
  background('#292017');
  noStroke();
  fill('#34271b');
  rect(20, 20, width - 40, height - 40, 18);

  stroke('#705032');
  strokeWeight(2);
  noFill();
  rect(34, 34, width - 68, height - 68, 12);
  for (let x = 66; x < width - 50; x += 42) {
    line(x, 34, x, 42);
    line(x, height - 42, x, height - 34);
  }
  for (let y = 66; y < height - 50; y += 42) {
    line(34, y, 42, y);
    line(width - 42, y, width - 34, y);
  }

  noStroke();
  fill('#463322');
  drawGear(100, 110, 46, frameCount * 0.01);
  drawGear(width - 100, height - 110, 58, -frameCount * 0.008);
  fill('#68482a');
  circle(width / 2, height / 2, 78);
  fill('#292017');
  circle(width / 2, height / 2, 50);
}

function drawGear(x, y, size, rotation) {
  push();
  translate(x, y);
  rotate(rotation);
  noStroke();
  fill('#503923');
  circle(0, 0, size);
  fill('#34271b');
  circle(0, 0, size * 0.48);
  fill('#503923');
  for (let tooth = 0; tooth < 8; tooth++) {
    push();
    rotate(tooth * TWO_PI / 8);
    rect(-size * 0.11, -size * 0.62, size * 0.22, size * 0.25, 3);
    pop();
  }
  pop();
}

function updatePlayer() {
  let moveX = 0;
  let moveY = 0;

  if (kb.pressing('a')) moveX--;
  if (kb.pressing('d')) moveX++;
  if (kb.pressing('w')) moveY--;
  if (kb.pressing('s')) moveY++;

  const length = Math.hypot(moveX, moveY) || 1;
  player.x = constrain(player.x + moveX / length * playerSpeed, 52, width - 52);
  player.y = constrain(player.y + moveY / length * playerSpeed, 58, height - 52);
}

function updateAim() {
  let keyAimX = 0;
  let keyAimY = 0;
  if (kb.pressing('left')) keyAimX--;
  if (kb.pressing('right')) keyAimX++;
  if (kb.pressing('up')) keyAimY--;
  if (kb.pressing('down')) keyAimY++;

  if (keyAimX || keyAimY) {
    aimX = keyAimX;
    aimY = keyAimY;
  } else if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    aimX = mouseX - player.x;
    aimY = mouseY - player.y;
  }

  const length = Math.hypot(aimX, aimY) || 1;
  aimX /= length;
  aimY /= length;
}

function updateShooting() {
  if (kb.pressing('space') || mouseIsPressed) shoot();
}

function shoot() {
  if (millis() - lastShotAt < 230) return;

  const bullet = new bullets.Sprite(
    player.x + aimX * 23,
    player.y + aimY * 23,
    10,
    10,
    'none'
  );
  bullet.shape = 'circle';
  bullet.color = '#ffe19a';
  bullet.stroke = '#fff8dd';
  bullet.speedX = aimX * 8;
  bullet.speedY = aimY * 8;
  bullet.createdAt = millis();
  lastShotAt = millis();
}

function updateEnemies() {
  const spawnDelay = max(420, 1250 - floor((millis() - startedAt) / 1000) * 12);
  if (millis() - lastEnemyAt >= spawnDelay) {
    spawnEnemy();
    lastEnemyAt = millis();
  }

  for (const enemy of enemies) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = 1.05 + min(1.1, (millis() - startedAt) / 60000);
    enemy.x += dx / distance * speed;
    enemy.y += dy / distance * speed;
  }
}

function spawnEnemy() {
  const edge = floor(random(4));
  let x;
  let y;

  if (edge === 0) [x, y] = [random(50, width - 50), 52];
  else if (edge === 1) [x, y] = [width - 52, random(55, height - 50)];
  else if (edge === 2) [x, y] = [random(50, width - 50), height - 52];
  else [x, y] = [52, random(55, height - 50)];

  const enemy = new enemies.Sprite(x, y, 28, 28, 'none');
  enemy.shape = 'circle';
  enemy.color = '#bc5540';
  enemy.stroke = '#f3a176';
  enemy.strokeWeight = 2;
}

function updateBullets() {
  for (const bullet of bullets) {
    bullet.x += bullet.speedX;
    bullet.y += bullet.speedY;

    if (
      millis() - bullet.createdAt > 1100 ||
      bullet.x < 30 || bullet.x > width - 30 ||
      bullet.y < 30 || bullet.y > height - 30
    ) {
      bullet.remove();
      continue;
    }

    let hitEnemy = false;
    for (const enemy of enemies) {
      if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < 23) {
        enemy.remove();
        bullet.remove();
        defeatedEnemies++;
        hitEnemy = true;
        break;
      }
    }

    if (hitEnemy) continue;
    for (const valve of valves) {
      if (!valve.activated && dist(bullet.x, bullet.y, valve.x, valve.y) < 25) {
        hitValve(valve);
        bullet.remove();
        break;
      }
    }
  }
}

function hitValve(valve) {
  const expectedValve = valveCode[nextValve];
  if (valve.number === expectedValve) {
    valve.activated = true;
    valve.color = '#8de2a5';
    nextValve++;
    statusMessage = nextValve === valveCode.length ? 'CODE ACCEPTED!' : 'CORRECT VALVE!';
  } else {
    for (const item of valves) {
      item.activated = false;
      item.color = valveColors[item.number - 1];
    }
    nextValve = 0;
    statusMessage = 'WRONG VALVE - CODE RESET';
  }
  statusUntil = millis() + 1100;
}

function checkPlayerHits() {
  if (millis() < invulnerableUntil) return;

  for (const enemy of enemies) {
    if (dist(player.x, player.y, enemy.x, enemy.y) < 27) {
      lives--;
      invulnerableUntil = millis() + 1200;
      enemy.remove();

      if (lives <= 0) gameState = 'lost';
      return;
    }
  }
}

function checkRoundEnd() {
  if (millis() - startedAt >= survivalSeconds * 1000) {
    gameState = nextValve === valveCode.length ? 'won' : 'lost';
  }
}

function drawValveDetails() {
  for (const valve of valves) {
    noStroke();
    fill('#352719');
    circle(valve.x, valve.y, 13);
    stroke(valve.activated ? '#dbffe0' : '#fff0c4');
    strokeWeight(3);
    line(valve.x - 13, valve.y, valve.x + 13, valve.y);
    line(valve.x, valve.y - 13, valve.x, valve.y + 13);
    noStroke();
    fill('#fff3d1');
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(13);
    text(valve.number, valve.x, valve.y + 1);
  }

  if (gameState === 'playing') {
    stroke('#fff0bd');
    strokeWeight(3);
    line(player.x, player.y, player.x + aimX * 27, player.y + aimY * 27);
    noStroke();
  }
}

function drawHud() {
  noStroke();
  fill('#f7e9ca');
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(17);
  text(`HULL: ${'♥ '.repeat(lives)}`, 48, 28);
  text(`VALVE CODE: ${valveCode.join('  >  ')}`, 260, 28);
  textAlign(RIGHT, CENTER);
  text(`K.O.: ${defeatedEnemies}`, width - 48, 28);

  const secondsLeft = gameState === 'playing'
    ? max(0, survivalSeconds - floor((millis() - startedAt) / 1000))
    : survivalSeconds;
  textAlign(CENTER, CENTER);
  textSize(20);
  fill('#ffc46b');
  text(`${secondsLeft}s`, width / 2, height - 22);

  if (millis() < statusUntil) {
    textSize(15);
    fill(statusMessage.includes('WRONG') ? '#ff927b' : '#a8f2be');
    text(statusMessage, width / 2, 58);
  }
  textStyle(NORMAL);
}

function drawStateMessage() {
  noStroke();
  fill(20, 15, 10, 225);
  rect(width / 2 - 250, height / 2 - 86, 500, 172, 18);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(31);

  if (gameState === 'ready') {
    fill('#ffc46b');
    text('CLOCKWORK ARENA', width / 2, height / 2 - 38);
    textStyle(NORMAL);
    textSize(16);
    fill('#f7e9ca');
    text('Survive 60 seconds and shoot the valve code in order.', width / 2, height / 2 + 3);
    text('Press ENTER or click to start', width / 2, height / 2 + 38);
  } else {
    fill(gameState === 'won' ? '#9cf0b4' : '#ff927b');
    text(gameState === 'won' ? 'ARENA CLEARED!' : 'CLOCKWORK OVERLOAD', width / 2, height / 2 - 26);
    textStyle(NORMAL);
    textSize(17);
    fill('#f7e9ca');
    text(gameState === 'won'
      ? `You survived and cracked the code! K.O.: ${defeatedEnemies}`
      : `K.O.: ${defeatedEnemies}  |  Valves: ${nextValve}/${valveCode.length}`,
    width / 2, height / 2 + 9);
    text('Press ENTER or click to play again', width / 2, height / 2 + 43);
  }

  textStyle(NORMAL);
}

function resetGame() {
  for (const enemy of enemies) enemy.remove();
  for (const bullet of bullets) bullet.remove();
  lives = 3;
  defeatedEnemies = 0;
  nextValve = 0;
  startedAt = 0;
  lastShotAt = 0;
  lastEnemyAt = 0;
  invulnerableUntil = 0;
  statusUntil = 0;
  player.x = width / 2;
  player.y = height / 2;
  for (const valve of valves) {
    valve.activated = false;
    valve.color = valveColors[valve.number - 1];
  }
  valveCode = [1, 2, 3].sort(() => random() - 0.5);
  gameState = 'ready';
}

function startGame() {
  resetGame();
  startedAt = millis();
  lastEnemyAt = millis();
  gameState = 'playing';
}

function keyPressed() {
  if ((keyCode === ENTER || key === ' ') && gameState !== 'playing') {
    startGame();
    return false;
  }

  if ((key === 'r' || key === 'R') && gameState !== 'playing') {
    startGame();
  }
}

function mousePressed() {
  if (gameState !== 'playing') {
    startGame();
  } else {
    updateAim();
    shoot();
  }
}
