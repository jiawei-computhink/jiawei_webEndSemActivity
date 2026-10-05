const screenWidth = 900;
const screenHeight = 520;
const levelWidth = 3200;
const floorY = 470;
const coreGoal = 3;

let player;
let platforms = [];
let enemies = [];
let cores = [];
let shots = [];
let exitGate;
let gameState = 'title';
let coresCollected = 0;
let health = 3;
let facing = 1;
let fireCooldown = 0;
let damageCooldown = 0;

function setup() {
  createCanvas(screenWidth, screenHeight);
  world.gravity.y = 0.65;
  createLevel();
}

function createLevel() {
  addPlatform(levelWidth / 2, floorY + 18, levelWidth, 36);

  player = new Sprite(70, floorY - 32, 32, 48, 'dynamic');
  player.color = '#45eaff';
  player.stroke = '#d9fbff';
  player.rotationLock = true;
  player.friction = 0;
  player.bounciness = 0;

  addPlatform(300, 370, 220, 24);
  addPlatform(600, 300, 190, 24);
  addPlatform(890, 385, 220, 24);
  addPlatform(1210, 320, 200, 24);
  addPlatform(1510, 375, 240, 24);
  addPlatform(1840, 295, 210, 24);
  addPlatform(2140, 365, 230, 24);
  addPlatform(2470, 305, 210, 24);
  addPlatform(2780, 390, 220, 24);

  addEnemy(430, floorY - 30);
  addEnemy(1000, 350);
  addEnemy(1600, floorY - 30);
  addEnemy(2250, 330);
  addEnemy(2850, 360);

  addCore(560, 260);
  addCore(1780, 245);
  addCore(2580, 255);

  exitGate = new Sprite(levelWidth - 80, floorY - 55, 54, 110, 'none');
  exitGate.color = '#ff5ebc';
  exitGate.stroke = '#ffd2ef';
}

function addPlatform(x, y, w, h) {
  const platform = new Sprite(x, y, w, h, 'static');
  platform.color = '#273952';
  platform.stroke = '#58daee';
  platforms.push(platform);
}

function addEnemy(x, y) {
  const enemy = new Sprite(x, y, 38, 38, 'dynamic');
  enemy.color = '#ff5574';
  enemy.stroke = '#ffd3dc';
  enemy.rotationLock = true;
  enemy.friction = 0;
  enemy.patrolDirection = 1;
  enemy.patrolOrigin = x;
  enemies.push(enemy);
}

function addCore(x, y) {
  const core = new Sprite(x, y, 24, 30, 'none');
  core.color = '#ffe66d';
  core.stroke = '#fff8c7';
  cores.push(core);
}

function draw() {
  drawBackdrop();

  if (gameState === 'title' && (kb.presses('enter') || kb.presses('space'))) {
    gameState = 'playing';
  }

  if (gameState === 'playing') {
    updateGame();
  }

  camera.x = constrain(player.x, screenWidth / 2, levelWidth - screenWidth / 2);
  camera.y = screenHeight / 2;
  drawSprites();

  camera.off();
  drawHud();
  if (gameState === 'title') {
    drawOverlay('POWER CORE RUNNER', 'Recover all three power cores and reach the magenta exit.', 'Press ENTER to begin');
  } else if (gameState === 'won') {
    drawOverlay('MISSION COMPLETE!', 'The factory is powered down. Nice work, runner!', 'Press R to play again');
  } else if (gameState === 'lost') {
    drawOverlay('SYSTEM FAILURE', 'The factory bots got the better of you.', 'Press R to try again');
  }
  camera.on();
}

function drawBackdrop() {
  background('#111a30');
  noStroke();

  fill('#192745');
  rect(0, 0, levelWidth, floorY);
  fill('#26324b');
  rect(0, floorY, levelWidth, height - floorY);
  fill('#42d9ed');
  rect(0, floorY, levelWidth, 5);

  for (let x = 70; x < levelWidth; x += 180) {
    fill('#243656');
    rect(x, 95 + (x % 3) * 15, 68, floorY - 95, 5);
    fill('#3a5574');
    for (let y = 130; y < floorY - 30; y += 58) {
      rect(x + 14, y + (x % 2) * 8, 12, 20, 2);
      rect(x + 42, y + (x % 2) * 8, 12, 20, 2);
    }
  }
}

function updateGame() {
  fireCooldown = max(0, fireCooldown - deltaTime);
  damageCooldown = max(0, damageCooldown - deltaTime);

  const movingLeft = kb.pressing('left');
  const movingRight = kb.pressing('right');
  player.vel.x = (movingRight ? 4 : 0) - (movingLeft ? 4 : 0);

  if (movingLeft) facing = -1;
  if (movingRight) facing = 1;

  if (kb.presses('up') && player.touching.bottom) {
    player.vel.y = -12;
  }

  if (kb.presses('space') && fireCooldown === 0) {
    fireShot();
  }

  for (const enemy of enemies) {
    enemy.vel.x = enemy.patrolDirection * 1.1;
    if (abs(enemy.x - enemy.patrolOrigin) > 65) {
      enemy.patrolDirection *= -1;
    }
  }

  for (const platform of platforms) {
    player.collides(platform);
    for (const enemy of enemies) enemy.collides(platform);
  }

  updateShots();
  collectCores();
  handleEnemyCollisions();

  if (player.y > height + 100) {
    loseHealth();
    player.x = max(70, player.x - 100);
    player.y = floorY - 80;
    player.vel.y = 0;
  }

  if (health <= 0) {
    gameState = 'lost';
  } else if (coresCollected >= coreGoal && player.overlaps(exitGate)) {
    gameState = 'won';
  }
}

function fireShot() {
  const shot = new Sprite(player.x + facing * 26, player.y - 2, 22, 8, 'kinematic');
  shot.color = '#ffe66d';
  shot.stroke = '#fff8c7';
  shot.vel.x = facing * 9;
  shot.life = 80;
  shots.push(shot);
  fireCooldown = 280;
}

function updateShots() {
  for (let shotIndex = shots.length - 1; shotIndex >= 0; shotIndex--) {
    const shot = shots[shotIndex];
    shot.life--;
    let hitEnemy = false;

    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      if (shot.overlaps(enemies[enemyIndex])) {
        enemies[enemyIndex].remove();
        enemies.splice(enemyIndex, 1);
        hitEnemy = true;
        break;
      }
    }

    if (hitEnemy || shot.life <= 0 || shot.x < 0 || shot.x > levelWidth) {
      shot.remove();
      shots.splice(shotIndex, 1);
    }
  }
}

function collectCores() {
  for (let coreIndex = cores.length - 1; coreIndex >= 0; coreIndex--) {
    if (player.overlaps(cores[coreIndex])) {
      cores[coreIndex].remove();
      cores.splice(coreIndex, 1);
      coresCollected++;
    }
  }
}

function handleEnemyCollisions() {
  if (damageCooldown > 0) return;

  for (const enemy of enemies) {
    if (player.overlaps(enemy)) {
      loseHealth();
      player.vel.x = player.x < enemy.x ? -5 : 5;
      player.vel.y = -5;
      break;
    }
  }
}

function loseHealth() {
  health--;
  damageCooldown = 1000;
}

function drawHud() {
  noStroke();
  fill(5, 10, 25, 220);
  rect(14, 14, 260, 70, 10);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(18);
  fill('#effbff');
  text(`CORES  ${coresCollected} / ${coreGoal}`, 30, 38);
  fill('#ff7892');
  text(`HULL  ${'♥'.repeat(max(0, health))}`, 30, 64);
  textStyle(NORMAL);
}

function drawOverlay(title, detail, instruction) {
  noStroke();
  fill(4, 8, 22, 225);
  rect(width / 2 - 300, height / 2 - 108, 600, 216, 18);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(34);
  fill(gameState === 'lost' ? '#ff7892' : '#8af7ff');
  text(title, width / 2, height / 2 - 58);

  textStyle(NORMAL);
  textSize(16);
  fill('#e1efff');
  text(detail, width / 2, height / 2 - 12);
  text('Move: ← / →    Jump: ↑    Fire: SPACE', width / 2, height / 2 + 24);
  fill('#ffe66d');
  text(instruction, width / 2, height / 2 + 65);
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    window.location.reload();
  }

  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || keyCode === UP_ARROW) {
    return false;
  }
}
