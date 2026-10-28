const arenaWidth = 960;
const arenaHeight = 620;
const floorY = 525;
const actorHalfWidth = 18;
const actorHalfHeight = 25;
const gravityStep = 0.55;
const playerMaxHealth = 100;
const rivalMaxHealth = 60;
const shotsPerBurst = 5;
const shotCooldown = 310;
const reloadCooldown = 600;
const spreadPowerupDuration = 8000;
const playerColor = '#54e6cf';
const rivalColors = ['#fa6d9a', '#b58aff', '#ffb84f'];

const levels = [
  {
    name: 'Moonlit Meadow',
    skyTop: '#171b3c',
    skyBottom: '#3b285e',
    islandColor: '#79c98d',
    platformColor: '#433567',
    platformTopColor: '#9be6ad',
    platforms: [
      { x: 0, y: floorY, width: arenaWidth, height: 95 },
      { x: 120, y: 430, width: 215, height: 20 },
      { x: 625, y: 430, width: 215, height: 20 },
      { x: 365, y: 335, width: 230, height: 20 },
      { x: 35, y: 300, width: 115, height: 18 },
      { x: 810, y: 300, width: 115, height: 18 }
    ],
    rivalStarts: [
      { x: 735, y: floorY - actorHalfHeight },
      { x: 475, y: 310 },
      { x: 880, y: 275 }
    ]
  },
  {
    name: 'Crystal Caverns',
    skyTop: '#102d43',
    skyBottom: '#235b70',
    islandColor: '#59c9bf',
    platformColor: '#315b76',
    platformTopColor: '#8ff2dc',
    platforms: [
      { x: 0, y: floorY, width: arenaWidth, height: 95 },
      { x: 55, y: 445, width: 195, height: 20 },
      { x: 710, y: 445, width: 195, height: 20 },
      { x: 345, y: 405, width: 270, height: 20 },
      { x: 165, y: 320, width: 205, height: 18 },
      { x: 590, y: 300, width: 205, height: 18 },
      { x: 390, y: 240, width: 180, height: 18 }
    ],
    rivalStarts: [
      { x: 140, y: 420 },
      { x: 800, y: 420 },
      { x: 480, y: 215 }
    ]
  },
  {
    name: 'Ember Heights',
    skyTop: '#42233b',
    skyBottom: '#8a3d4d',
    islandColor: '#e58a63',
    platformColor: '#70405a',
    platformTopColor: '#ffd17c',
    platforms: [
      { x: 0, y: floorY, width: arenaWidth, height: 95 },
      { x: 70, y: 455, width: 190, height: 20 },
      { x: 700, y: 455, width: 190, height: 20 },
      { x: 365, y: 435, width: 230, height: 20 },
      { x: 255, y: 345, width: 190, height: 18 },
      { x: 515, y: 345, width: 190, height: 18 },
      { x: 70, y: 265, width: 170, height: 18 },
      { x: 720, y: 265, width: 170, height: 18 }
    ],
    rivalStarts: [
      { x: 150, y: 430 },
      { x: 480, y: 410 },
      { x: 810, y: 430 }
    ]
  }
];

const stars = Array.from({ length: 70 }, (_, index) => ({
  x: (index * 137 + 41) % arenaWidth,
  y: (index * 83 + 17) % 310,
  size: 1 + index % 3
}));

let player;
let rivals = [];
let projectiles = [];
let platforms = levels[0].platforms;
let gameState = 'title';
let levelIndex = 0;
let levelTransitionTimer = 0;
let playerHealth = playerMaxHealth;
let fireCooldown = 0;
let playerShotsInBurst = 0;
let isPlayerReloading = false;
let spreadPowerup = null;
let spreadPowerupSpawnTimer = 7000;
let spreadShotTimer = 0;
let elapsedTime = 0;
let jumpWasHeld = false;

function setup() {
  createCanvas(arenaWidth, arenaHeight);
  world.gravity.y = 0;
  player = makeActor(170, floorY - actorHalfHeight, playerColor, 'player');
}

function makeActor(x, y, actorColor, actorType) {
  const actor = new Sprite(x, y, actorHalfWidth * 2, actorHalfHeight * 2, 'none');
  actor.visible = false;
  actor.gameColor = actorColor;
  actor.gameType = actorType;
  actor.gameHealth = actorType === 'player' ? playerMaxHealth : rivalMaxHealth;
  actor.gameVerticalSpeed = 0;
  actor.gameHorizontalSpeed = 0;
  actor.gameOnGround = false;
  actor.gameFacing = actorType === 'player' ? 1 : -1;
  actor.gameShootCooldown = random(350, 900);
  actor.gameJumpCooldown = 0;
  actor.gameHitFlash = 0;
  actor.gameInvulnerable = 0;
  return actor;
}

function draw() {
  drawArena();

  if (gameState === 'title' && kb.presses('enter')) {
    startGame();
  } else if ((gameState === 'won' || gameState === 'lost') && kb.presses('r')) {
    startGame();
  }

  if (gameState === 'playing') {
    updateGame();
  } else if (gameState === 'level-transition') {
    updateLevelTransition();
  }

  drawSprites();
  drawActors();
  drawProjectiles();
  if (gameState === 'playing') {
    drawSpreadPowerup();
  }
  drawHud();
  drawTouchControls();

  if (gameState === 'title') {
    drawOverlay('SPELLBOUND SHOWDOWN', 'A magical platform battle!', 'Clear all three stages to become the arena champion.');
  } else if (gameState === 'won') {
    drawOverlay('ARENA CHAMPION!', 'Every rival has been defeated.', 'Click, tap, or press R to play again.');
  } else if (gameState === 'lost') {
    drawOverlay('SPELLS EXHAUSTED!', 'The rival spellcasters won this round.', 'Click, tap, or press R to try again.');
  } else if (gameState === 'level-transition') {
    drawOverlay(
      'STAGE CLEARED!',
      'Next stage: ' + levels[levelIndex + 1].name,
      'Get ready for a new arena and a different set of platforms.'
    );
  }
}

function drawArena() {
  const level = levels[levelIndex];
  background(level.skyTop);
  noStroke();
  for (let y = 0; y < height; y += 5) {
    fill(lerpColor(color(level.skyTop), color(level.skyBottom), y / height));
    rect(0, y, width, 5);
  }

  drawStars();
  drawMoon(level);
  drawFloatingIslands();
  drawPlatforms();
}

function drawStars() {
  noStroke();
  for (let index = 0; index < stars.length; index++) {
    const star = stars[index];
    fill(index % 4 === 0 ? '#ffe89b' : '#d8d8ff');
    circle(star.x, star.y, star.size + (index % 9 === 0 ? sin(frameCount * 0.06 + index) : 0));
  }
}

function drawMoon(level) {
  noStroke();
  fill(level.islandColor);
  circle(780, 125, 150);
  fill(level.platformTopColor);
  circle(780, 125, 94);
  fill(level.islandColor);
  circle(756, 110, 12);
  circle(803, 142, 17);
  circle(792, 99, 8);
}

function drawFloatingIslands() {
  const level = levels[levelIndex];
  noStroke();
  fill('#282348');
  ellipse(75, 235, 190, 36);
  triangle(8, 237, 142, 237, 80, 330);
  fill('#493665');
  ellipse(875, 205, 190, 34);
  triangle(810, 207, 940, 207, 875, 292);
  fill(level.islandColor);
  ellipse(75, 225, 190, 24);
  ellipse(875, 195, 190, 23);
}

function drawPlatforms() {
  const level = levels[levelIndex];
  for (let index = 0; index < platforms.length; index++) {
    const platform = platforms[index];
    noStroke();
    fill(index === 0 ? '#302750' : level.platformColor);
    rect(platform.x, platform.y, platform.width, platform.height, 8);
    fill(index === 0 ? level.islandColor : level.platformTopColor);
    rect(platform.x, platform.y, platform.width, 8, 5);
    fill('#f1cf75');
    for (let decoration = platform.x + 18; decoration < platform.x + platform.width - 8; decoration += 48) {
      circle(decoration, platform.y + 4, 4);
    }
  }

  noStroke();
  fill('#211c40');
  rect(0, floorY + 10, width, height - floorY - 10);
  fill('#8154a1');
  for (let x = 20; x < width; x += 80) {
    circle(x, floorY + 47 + (x % 3) * 7, 5);
  }
}

function updateGame() {
  const step = constrain(deltaTime / 16.67, 0, 2);
  elapsedTime += deltaTime;
  fireCooldown = max(0, fireCooldown - deltaTime);
  if (fireCooldown === 0) {
    isPlayerReloading = false;
  }
  updateSpreadPowerup();
  updatePlayer(step);

  for (const rival of rivals) {
    updateRival(rival, step);
  }

  if (isFirePressed() && fireCooldown === 0) {
    fireSpell(player, true);
  }

  updateProjectiles(step);

  if (playerHealth <= 0) {
    gameState = 'lost';
  } else if (rivals.length === 0) {
    if (levelIndex === levels.length - 1) {
      gameState = 'won';
    } else {
      gameState = 'level-transition';
      levelTransitionTimer = 1400;
    }
  }
}

function updateLevelTransition() {
  levelTransitionTimer = max(0, levelTransitionTimer - deltaTime);
  if (levelTransitionTimer === 0) {
    startNextLevel();
  }
}

function updateSpreadPowerup() {
  if (spreadShotTimer > 0) {
    spreadShotTimer = max(0, spreadShotTimer - deltaTime);
  }

  if (!spreadPowerup) {
    spreadPowerupSpawnTimer -= deltaTime;
    if (spreadPowerupSpawnTimer <= 0) {
      spawnSpreadPowerup();
    }
    return;
  }

  spreadPowerup.pickupBob += deltaTime * 0.006;
  const touchingPickup = abs(player.x - spreadPowerup.pickupX) < actorHalfWidth + 18
    && abs(player.y - spreadPowerup.pickupY) < actorHalfHeight + 18;
  if (touchingPickup) {
    spreadPowerup = null;
    spreadShotTimer = spreadPowerupDuration;
    spreadPowerupSpawnTimer = 9000;
  }
}

function spawnSpreadPowerup() {
  const platform = platforms[floor(random(1, platforms.length))];
  spreadPowerup = {
    pickupX: random(platform.x + 25, platform.x + platform.width - 25),
    pickupY: platform.y - 22,
    pickupBob: 0
  };
}

function updatePlayer(step) {
  const movingLeft = kb.pressing('a') || kb.pressing('left') || touchButtonPressed('left');
  const movingRight = kb.pressing('d') || kb.pressing('right') || touchButtonPressed('right');
  const jumpHeld = kb.pressing('w') || kb.pressing('up') || touchButtonPressed('jump');
  const jumpPressed = kb.presses('w') || kb.presses('up') || (jumpHeld && !jumpWasHeld);

  player.gameHorizontalSpeed = (movingRight ? 4.4 : 0) - (movingLeft ? 4.4 : 0);
  if (player.gameHorizontalSpeed !== 0) {
    player.gameFacing = player.gameHorizontalSpeed > 0 ? 1 : -1;
  }
  if (jumpPressed && player.gameOnGround) {
    player.gameVerticalSpeed = -11.5;
    player.gameOnGround = false;
  }
  jumpWasHeld = jumpHeld;

  moveActor(player, step);
  player.gameHitFlash = max(0, player.gameHitFlash - deltaTime);
  player.gameInvulnerable = max(0, player.gameInvulnerable - deltaTime);
}

function updateRival(rival, step) {
  rival.gameShootCooldown = max(0, rival.gameShootCooldown - deltaTime);
  rival.gameJumpCooldown = max(0, rival.gameJumpCooldown - deltaTime);
  rival.gameHitFlash = max(0, rival.gameHitFlash - deltaTime);

  const horizontalDistance = player.x - rival.x;
  const verticalDistance = player.y - rival.y;
  const distance = dist(player.x, player.y, rival.x, rival.y);

  if (abs(horizontalDistance) > 205) {
    rival.gameHorizontalSpeed = Math.sign(horizontalDistance) * 1.8;
  } else if (abs(horizontalDistance) < 125) {
    rival.gameHorizontalSpeed = -Math.sign(horizontalDistance) * 1.45;
  } else {
    rival.gameHorizontalSpeed = 0;
  }
  if (rival.gameHorizontalSpeed !== 0) {
    rival.gameFacing = rival.gameHorizontalSpeed > 0 ? 1 : -1;
  } else {
    rival.gameFacing = horizontalDistance >= 0 ? 1 : -1;
  }

  if (verticalDistance < -45 && rival.gameOnGround && rival.gameJumpCooldown === 0) {
    rival.gameVerticalSpeed = -10.5;
    rival.gameOnGround = false;
    rival.gameJumpCooldown = random(650, 1050);
  }

  moveActor(rival, step);

  if (distance < 590 && rival.gameShootCooldown === 0) {
    fireSpell(rival, false);
    rival.gameShootCooldown = random(1050, 1550);
  }
}

function moveActor(actor, step) {
  const previousBottom = actor.y + actorHalfHeight;
  actor.x += actor.gameHorizontalSpeed * step;
  actor.x = constrain(actor.x, actorHalfWidth + 8, width - actorHalfWidth - 8);
  actor.gameVerticalSpeed = min(13, actor.gameVerticalSpeed + gravityStep * step);
  actor.y += actor.gameVerticalSpeed * step;
  actor.gameOnGround = false;

  const currentBottom = actor.y + actorHalfHeight;
  if (actor.gameVerticalSpeed >= 0) {
    for (const platform of platforms) {
      const overlapsPlatform = actor.x + actorHalfWidth > platform.x
        && actor.x - actorHalfWidth < platform.x + platform.width;
      const crossedPlatformTop = previousBottom <= platform.y && currentBottom >= platform.y;
      if (overlapsPlatform && crossedPlatformTop) {
        actor.y = platform.y - actorHalfHeight;
        actor.gameVerticalSpeed = 0;
        actor.gameOnGround = true;
        break;
      }
    }
  }
}

function fireSpell(shooter, isPlayerShot) {
  let aimX;
  let aimY;

  if (isPlayerShot && touchButtonPressed('fire')) {
    const target = nearestRival();
    aimX = target ? target.x - shooter.x : shooter.gameFacing;
    aimY = target ? target.y - shooter.y : 0;
  } else if (isPlayerShot && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    aimX = mouseX - shooter.x;
    aimY = mouseY - shooter.y;
  } else {
    aimX = player.x - shooter.x;
    aimY = player.y - shooter.y;
  }

  const aimLength = max(1, sqrt(aimX * aimX + aimY * aimY));
  const directionX = aimX / aimLength;
  const directionY = aimY / aimLength;
  const spreadAngles = isPlayerShot && spreadShotTimer > 0
    ? [-18, 0, 18]
    : [0];

  for (const spreadAngle of spreadAngles) {
    const shotDirectionX = directionX * cos(spreadAngle) - directionY * sin(spreadAngle);
    const shotDirectionY = directionX * sin(spreadAngle) + directionY * cos(spreadAngle);
    createProjectile(shooter, shotDirectionX, shotDirectionY, isPlayerShot);
  }

  if (isPlayerShot) {
    playerShotsInBurst++;
    if (playerShotsInBurst === shotsPerBurst) {
      playerShotsInBurst = 0;
      isPlayerReloading = true;
      fireCooldown = reloadCooldown;
    } else {
      fireCooldown = shotCooldown;
    }
  }
}

function createProjectile(shooter, directionX, directionY, isPlayerShot) {
  const projectile = new Sprite(
    shooter.x + directionX * 24,
    shooter.y + directionY * 24,
    14,
    14,
    'none'
  );
  projectile.visible = false;
  projectile.shotVelocityX = directionX * 8.5;
  projectile.shotVelocityY = directionY * 8.5;
  projectile.shotOwner = shooter;
  projectile.shotLife = 1700;
  projectile.shotColor = isPlayerShot ? '#9cfff0' : shooter.gameColor;
  projectiles.push(projectile);
}

function updateProjectiles(step) {
  for (let index = projectiles.length - 1; index >= 0; index--) {
    const projectile = projectiles[index];
    projectile.x += projectile.shotVelocityX * step;
    projectile.y += projectile.shotVelocityY * step;
    projectile.shotLife -= deltaTime;

    let removeProjectile = projectile.shotLife <= 0
      || projectile.x < -20
      || projectile.x > width + 20
      || projectile.y < -20
      || projectile.y > height + 20;

    if (!removeProjectile && projectile.shotOwner === player) {
      for (let rivalIndex = rivals.length - 1; rivalIndex >= 0; rivalIndex--) {
        const rival = rivals[rivalIndex];
        if (abs(projectile.x - rival.x) < actorHalfWidth + 8
          && abs(projectile.y - rival.y) < actorHalfHeight + 8) {
          rival.gameHealth = max(0, rival.gameHealth - 25);
          rival.gameHitFlash = 170;
          removeProjectile = true;
          if (rival.gameHealth === 0) {
            rival.remove();
            rivals.splice(rivalIndex, 1);
          }
          break;
        }
      }
    } else if (!removeProjectile && projectile.shotOwner !== player
      && player.gameInvulnerable === 0
      && abs(projectile.x - player.x) < actorHalfWidth + 8
      && abs(projectile.y - player.y) < actorHalfHeight + 8) {
      playerHealth = max(0, playerHealth - 12);
      player.gameHitFlash = 220;
      player.gameInvulnerable = 520;
      removeProjectile = true;
    }

    if (removeProjectile) {
      projectile.remove();
      projectiles.splice(index, 1);
    }
  }
}

function nearestRival() {
  let closest = null;
  let closestDistance = Infinity;
  for (const rival of rivals) {
    const rivalDistance = dist(player.x, player.y, rival.x, rival.y);
    if (rivalDistance < closestDistance) {
      closest = rival;
      closestDistance = rivalDistance;
    }
  }
  return closest;
}

function isFirePressed() {
  return (mouseIsPressed && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height)
    || touchButtonPressed('fire');
}

function touchButtonPressed(buttonName) {
  if (typeof touches === 'undefined') return false;
  for (const touch of touches) {
    if (buttonContains(buttonName, touch.x, touch.y)) return true;
  }
  return false;
}

function buttonContains(buttonName, x, y) {
  const buttons = {
    left: { x: 64, y: 582, radius: 34 },
    right: { x: 142, y: 582, radius: 34 },
    jump: { x: 792, y: 582, radius: 34 },
    fire: { x: 884, y: 582, radius: 34 }
  };
  const button = buttons[buttonName];
  return dist(x, y, button.x, button.y) <= button.radius;
}

function drawActors() {
  drawActor(player, true);
  for (const rival of rivals) {
    drawActor(rival, false);
  }
}

function drawActor(actor, isPlayer) {
  if (isPlayer && actor.gameInvulnerable > 0 && frameCount % 8 < 4) return;
  const x = actor.x;
  const y = actor.y;
  const facing = actor.gameFacing;
  const bodyColor = actor.gameHitFlash > 0 ? '#ffffff' : actor.gameColor;

  push();
  translate(x, y);
  noStroke();
  fill(15, 13, 35, 100);
  ellipse(0, actorHalfHeight + 4, 42, 10);

  fill('#34284d');
  rect(-14, 5, 11, 17, 4);
  rect(3, 5, 11, 17, 4);
  fill('#f5d69c');
  rect(-15, 19, 13, 6, 3);
  rect(2, 19, 13, 6, 3);

  fill(bodyColor);
  rect(-17, -17, 34, 30, 10);
  fill('#f6d5aa');
  ellipse(0, -25, 28, 27);
  fill(isPlayer ? '#30294e' : '#392943');
  arc(0, -30, isPlayer ? 38 : 32, isPlayer ? 28 : 23, PI, TWO_PI);
  fill('#ffffff');
  circle(facing * 6, -25, 4);
  fill('#25233a');
  circle(facing * 7, -25, 2);

  fill(isPlayer ? '#ffe17c' : '#e8d9ff');
  triangle(-13, -38, 0, -58, 12, -38);
  fill('#fff2c4');
  circle(0, -43, 6);

  stroke('#f6d5aa');
  strokeWeight(6);
  line(facing * 10, -9, facing * 23, -15);
  noStroke();
  fill(isPlayer ? '#fff1aa' : '#f7d8ff');
  circle(facing * 24, -16, 11 + (sin(frameCount * 0.15 + x) + 1) * 2);
  pop();

  if (!isPlayer) {
    drawHealthBar(x - 24, y - 47, 48, actor.gameHealth, rivalMaxHealth, actor.gameColor);
  }
}

function drawProjectiles() {
  noStroke();
  for (const projectile of projectiles) {
    fill(170, 255, 239, 70);
    circle(projectile.x, projectile.y, 26);
    fill(projectile.shotColor);
    circle(projectile.x, projectile.y, 13);
    fill('#ffffff');
    circle(projectile.x - 2, projectile.y - 2, 5);
  }
}

function drawSpreadPowerup() {
  if (!spreadPowerup) return;

  const bobY = sin(spreadPowerup.pickupBob) * 5;
  noStroke();
  fill(255, 207, 100, 45);
  circle(spreadPowerup.pickupX, spreadPowerup.pickupY + bobY, 42);
  fill('#ffca62');
  circle(spreadPowerup.pickupX, spreadPowerup.pickupY + bobY, 27);
  fill('#fff2bd');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(18);
  text('✦', spreadPowerup.pickupX, spreadPowerup.pickupY + bobY);
  fill('#fff0ad');
  textSize(11);
  text('CONE', spreadPowerup.pickupX, spreadPowerup.pickupY + bobY + 27);
}

function drawHud() {
  const level = levels[levelIndex];
  noStroke();
  fill(14, 16, 39, 225);
  rect(0, 0, width, 76);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(15);
  fill(level.platformTopColor);
  text('STAGE ' + (levelIndex + 1) + ': ' + level.name, 22, 21);
  textSize(13);
  fill('#e0d9fb');
  text('RIVALS LEFT: ' + rivals.length, 22, 51);

  fill('#d7defa');
  textAlign(CENTER, CENTER);
  text('YOUR HEALTH', width / 2, 19);
  drawHealthBar(width / 2 - 115, 34, 230, playerHealth, playerMaxHealth, playerColor);
  textSize(12);
  fill(isPlayerReloading ? '#ffd879' : spreadShotTimer > 0 ? '#ffcf70' : '#c9f8ed');
  const shotStatus = isPlayerReloading ? 'RECHARGING SPELLS' : 'SPELLS: ' + playerShotsInBurst + '/' + shotsPerBurst;
  const powerupStatus = spreadShotTimer > 0 ? 'CONE SHOT ' + (spreadShotTimer / 1000).toFixed(1) + 's  •  ' : '';
  text(powerupStatus + shotStatus, width / 2, 60);

  textAlign(RIGHT, CENTER);
  fill('#d7defa');
  text(floor(elapsedTime / 1000) + 's', width - 22, 28);
}

function drawHealthBar(x, y, barWidth, health, maxHealth, barColor) {
  noStroke();
  fill('#352d4e');
  rect(x, y, barWidth, 10, 5);
  fill(barColor);
  rect(x, y, barWidth * (health / maxHealth), 10, 5);
  noFill();
  stroke('#fff4df');
  strokeWeight(1);
  rect(x, y, barWidth, 10, 5);
  noStroke();
}

function drawTouchControls() {
  drawTouchButton(64, 582, 'L');
  drawTouchButton(142, 582, 'R');
  drawTouchButton(792, 582, 'JUMP');
  drawTouchButton(884, 582, 'FIRE');
}

function drawTouchButton(x, y, label) {
  noStroke();
  fill(18, 19, 43, 155);
  circle(x, y, 68);
  noFill();
  stroke('#c4b8ec');
  strokeWeight(2);
  circle(x, y, 68);
  noStroke();
  fill('#f7efff');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(label.length > 2 ? 11 : 17);
  text(label, x, y);
}

function drawOverlay(title, subtitle, instruction) {
  noStroke();
  fill(12, 14, 36, 225);
  rect(105, 163, 750, 230, 22);
  stroke('#d8a2ff');
  strokeWeight(2);
  noFill();
  rect(105, 163, 750, 230, 22);
  noStroke();

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(34);
  fill('#ffe69b');
  text(title, width / 2, 218);
  textStyle(NORMAL);
  textSize(20);
  fill('#ffffff');
  text(subtitle, width / 2, 267);
  textSize(15);
  fill('#c9f8ed');
  text(instruction, width / 2, 319);
  fill('#dfd9f4');
  text('Move and jump between the floating platforms. Aim and fire at every rival!', width / 2, 354);
}

function loadLevel() {
  const level = levels[levelIndex];
  platforms = level.platforms;
  elapsedTime = 0;
  fireCooldown = 0;
  playerShotsInBurst = 0;
  isPlayerReloading = false;
  spreadPowerup = null;
  spreadPowerupSpawnTimer = 0;
  spreadShotTimer = 0;
  jumpWasHeld = false;

  for (const rival of rivals) {
    rival.remove();
  }
  rivals = level.rivalStarts.map((start, index) => {
    const rival = makeActor(
      start.x,
      start.y,
      rivalColors[index % rivalColors.length],
      'rival'
    );
    resetActor(rival, rivalMaxHealth, start.x < arenaWidth / 2 ? 1 : -1);
    return rival;
  });

  player.x = 170;
  player.y = floorY - actorHalfHeight;
  resetActor(player, playerMaxHealth, 1);

  for (const projectile of projectiles) {
    projectile.remove();
  }
  projectiles = [];
  spreadPowerupSpawnTimer = 0;
  spawnSpreadPowerup();
}

function resetActor(actor, health, facing) {
  actor.gameHealth = health;
  actor.gameVerticalSpeed = 0;
  actor.gameHorizontalSpeed = 0;
  actor.gameOnGround = false;
  actor.gameFacing = facing;
  actor.gameShootCooldown = random(350, 900);
  actor.gameJumpCooldown = 0;
  actor.gameHitFlash = 0;
  actor.gameInvulnerable = 0;
}

function startGame() {
  levelIndex = 0;
  playerHealth = playerMaxHealth;
  loadLevel();
  gameState = 'playing';
}

function startNextLevel() {
  levelIndex++;
  playerHealth = min(playerMaxHealth, playerHealth + 25);
  loadLevel();
  gameState = 'playing';
}

function mousePressed() {
  if (gameState === 'title' || gameState === 'won' || gameState === 'lost') {
    startGame();
  }
}

function touchStarted() {
  if (gameState === 'title' || gameState === 'won' || gameState === 'lost') {
    startGame();
  }
  return false;
}
