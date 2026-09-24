let player;
let platforms;
let portal;
let crystals;
let scrollX = 0;
let goalReached = false;
const worldWidth = 3600;

function setup() {
  createCanvas(960, 540);
  noStroke();
  world.gravity.y = 1.2;

  player = new Sprite();
  player.diameter = 30;
  player.x = 80;
  player.y = 440;
  player.color = '#f7d154';
  player.stroke = '#fff0a8';
  player.rotationLock = true;
  player.collider = 'dynamic';
  player.friction = 0;
  player.mass = 1.3;

  platforms = new Group();
  platforms.collider = 'static';

  crystals = new Group();
  crystals.collider = 'static';

  createPlatform(0, 500, 860, 90, '#2f4f40');
  createPlatform(960, 500, 880, 90, '#2f4f40');
  createPlatform(1960, 500, 680, 90, '#2f4f40');
  createPlatform(2880, 500, 720, 90, '#2f4f40');

  createPlatform(350, 420, 180, 18, '#5a7a68');
  createPlatform(640, 350, 180, 18, '#5a7a68');
  createPlatform(920, 285, 210, 18, '#5a7a68');
  createPlatform(1260, 360, 170, 18, '#5a7a68');
  createPlatform(1560, 300, 170, 18, '#5a7a68');
  createPlatform(1840, 250, 210, 18, '#5a7a68');
  createPlatform(2260, 350, 200, 18, '#5a7a68');
  createPlatform(2600, 290, 188, 18, '#5a7a68');
  createPlatform(2950, 220, 190, 18, '#5a7a68');

  for (let i = 0; i < 18; i++) {
    const crystalX = 140 + i * 170;
    const crystalY = 440 - (i % 4) * 26;
    const crystal = new Sprite(crystalX, crystalY, 18, 36);
    crystal.color = i % 2 === 0 ? '#8de4ff' : '#d8b4ff';
    crystal.stroke = 'rgba(255,255,255,0.4)';
    crystal.collider = 'static';
    crystal.layer = 1;
    crystals.add(crystal);
  }

  for (let i = 0; i < 15; i++) {
    const treeX = 120 + i * 200;
    const trunk = new Sprite(treeX, 455, 28, 80);
    trunk.color = '#4f3826';
    trunk.collider = 'static';
    trunk.layer = 1;

    const leaves = new Sprite(treeX, 410, 70, 60);
    leaves.color = '#3f8f61';
    leaves.stroke = '#5cc987';
    leaves.collider = 'static';
    leaves.layer = 1;
  }

  portal = new Sprite(3380, 425, 48, 120);
  portal.color = '#d9a3ff';
  portal.stroke = '#f5dfff';
  portal.collider = 'static';
}

function createPlatform(x, y, w, h, colorValue) {
  const platform = new Sprite(x, y, w, h);
  platform.color = colorValue;
  platform.collider = 'static';
  platform.stroke = 'rgba(0,0,0,0)';
  platform.layer = 2;
  return platform;
}

function draw() {
  if (!goalReached) {
    handleMovement();

    if (player.overlap(portal)) {
      goalReached = true;
      player.vel.x = 0;
      player.vel.y = 0;
    }

    if (player.y > height + 200) {
      resetPlayer();
    }
  }

  drawBackground();

  push();
  translate(-scrollX, 0);
  drawSprites();
  pop();

  drawHUD();
}

function handleMovement() {
  const moveLeft = kb.pressing('left') || kb.pressing('a');
  const moveRight = kb.pressing('right') || kb.pressing('d');

  if (moveLeft && !moveRight) {
    player.vel.x = -4.8;
  } else if (moveRight && !moveLeft) {
    player.vel.x = 4.8;
  } else {
    player.vel.x *= 0.8;
    if (abs(player.vel.x) < 0.1) {
      player.vel.x = 0;
    }
  }

  if ((kb.presses('up') || kb.presses('w') || kb.presses('space')) && isOnGround()) {
    player.vel.y = -13;
  }

  player.vel.y += 0.6;
  player.x += player.vel.x;
  player.y += player.vel.y;

  player.x = constrain(player.x, 20, worldWidth - 20);

  resolvePlatformCollisions();

  const targetScroll = constrain(player.x - width * 0.35, 0, worldWidth - width);
  scrollX += (targetScroll - scrollX) * 0.15;
}

function resolvePlatformCollisions() {
  const playerRadius = player.diameter / 2;

  for (const platform of platforms) {
    const playerBottom = player.y + playerRadius;
    const playerTop = player.y - playerRadius;
    const platformTop = platform.y - platform.h / 2;
    const withinX = abs(player.x - platform.x) < (platform.w + player.diameter) / 2;

    if (withinX && player.vel.y >= 0 && playerBottom >= platformTop - 5 && playerTop < platformTop) {
      player.y = platformTop - playerRadius;
      player.vel.y = 0;
    }
  }
}

function isOnGround() {
  const playerRadius = player.diameter / 2;
  const playerBottom = player.y + playerRadius;

  return platforms.some((platform) => {
    const platformTop = platform.y - platform.h / 2;
    const withinX = abs(player.x - platform.x) < (platform.w + player.diameter) / 2;
    const nearTop = playerBottom >= platformTop - 8 && playerBottom <= platformTop + 18;
    return withinX && nearTop;
  });
}

function drawBackground() {
  background(18, 23, 38);

  for (let y = 0; y < height; y += 4) {
    const colorValue = lerpColor(color(18, 23, 38), color(102, 120, 175), y / height);
    stroke(colorValue);
    line(0, y, width, y);
  }
  noStroke();

  const moonX = width - 160 - scrollX * 0.12;
  fill(245, 233, 160, 200);
  ellipse(moonX, 110, 78, 78);
  fill(255, 255, 255, 40);
  ellipse(moonX - 10, 100, 96, 96);

  push();
  translate(-scrollX * 0.15, 0);
  for (let x = -220; x < worldWidth + 200; x += 220) {
    fill('#3d4d64');
    triangle(x, 470, x + 110, 220, x + 220, 470);
    fill('#2d3c52');
    triangle(x + 30, 470, x + 110, 260, x + 190, 470);
  }
  pop();

  push();
  translate(-scrollX * 0.35, 0);
  for (let i = 0; i < 18; i++) {
    fill(255, 255, 255, 120);
    ellipse(140 + i * 220, 60 + (i % 4) * 24, 2, 2);
    ellipse(260 + i * 220, 130 + (i % 3) * 18, 2.5, 2.5);
  }
  pop();
}

function drawHUD() {
  fill('#f9f4d2');
  textSize(20);
  text('Moonlit Forest Escape', 22, 28);
  textSize(14);
  text('Move: A/D or arrows   Jump: W, ↑, or Space   Goal: Reach the glowing portal', 22, 50);

  if (goalReached) {
    fill(255, 245, 170, 230);
    rect(width / 2 - 190, height / 2 - 70, 380, 140, 18);
    fill('#182239');
    textAlign(CENTER, CENTER);
    textSize(28);
    text('You reached the end!', width / 2, height / 2 - 8);
    textSize(16);
    text('Press R to play again', width / 2, height / 2 + 28);
    textAlign(LEFT, BASELINE);
  }
}

function resetPlayer() {
  player.x = 80;
  player.y = 440;
  player.vel.x = 0;
  player.vel.y = 0;
}

function keyPressed() {
  if (goalReached && key === 'r') {
    goalReached = false;
    resetPlayer();
  }
}
