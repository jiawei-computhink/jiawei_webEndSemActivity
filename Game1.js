let player;
let platforms;
let portal;
let goalReached = false;
let scrollX = 0;
let onGround = false;
const worldWidth = 3200;

function setup() {
  createCanvas(960, 540);
  noStroke();
  world.gravity.y = 1.2;

  player = new Sprite();
  player.diameter = 30;
  player.x = 90;
  player.y = 440;
  player.color = '#f7d154';
  player.stroke = '#fff2b3';
  player.rotationLock = true;
  player.collider = 'dynamic';
  player.friction = 0;
  player.mass = 1.3;

  platforms = new Group();
  platforms.collider = 'static';

  createPlatform(0, 500, 920, 90, '#315d4f');
  createPlatform(980, 500, 520, 90, '#315d4f');
  createPlatform(620, 390, 180, 20, '#4d7d66');
  createPlatform(980, 330, 180, 20, '#4d7d66');
  createPlatform(1280, 430, 180, 20, '#4d7d66');
  createPlatform(1520, 330, 220, 20, '#4d7d66');
  createPlatform(1810, 260, 210, 20, '#4d7d66');
  createPlatform(2110, 360, 200, 20, '#4d7d66');
  createPlatform(2390, 300, 200, 20, '#4d7d66');
  createPlatform(2680, 220, 220, 20, '#4d7d66');
  createPlatform(2940, 500, 300, 90, '#315d4f');

  portal = new Sprite(3050, 420, 42, 120);
  portal.color = '#d9a3ff';
  portal.stroke = '#f6dcff';
  portal.collider = 'static';

  for (let i = 0; i < 18; i++) {
    const crystalX = 200 + i * 150;
    const crystalY = 440 - (i % 3) * 22;
    const crystal = new Sprite(crystalX, crystalY, 18, 38);
    crystal.color = i % 2 === 0 ? '#8de4ff' : '#b2f7c7';
    crystal.stroke = 'rgba(255,255,255,0.3)';
    crystal.collider = 'static';
    crystal.layer = 1;
  }

  for (let i = 0; i < 14; i++) {
    const treeX = 150 + i * 180;
    const tree = new Sprite(treeX, 458, 30, 80);
    tree.color = '#523d27';
    tree.stroke = '#6b4d2d';
    tree.collider = 'static';
    tree.layer = 1;

    const leaves = new Sprite(treeX, 410, 65, 55);
    leaves.color = '#3a8f5b';
    leaves.stroke = '#5ec77d';
    leaves.collider = 'static';
    leaves.layer = 1;
  }
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
    player.vel.x = -4.2;
  } else if (moveRight && !moveLeft) {
    player.vel.x = 4.2;
  } else {
    player.vel.x *= 0.8;
    if (abs(player.vel.x) < 0.1) {
      player.vel.x = 0;
    }
  }

  onGround = isOnGround();

  if ((kb.presses('up') || kb.presses('w') || kb.presses('space')) && onGround) {
    player.vel.y = -12;
    onGround = false;
  }

  player.vel.y += 0.6;
  player.y += player.vel.y;
  player.x += player.vel.x;

  if (player.x < 20) player.x = 20;
  if (player.x > worldWidth - 20) player.x = worldWidth - 20;

  resolvePlatformCollisions();

  const targetScroll = constrain(player.x - width * 0.35, 0, worldWidth - width);
  scrollX += (targetScroll - scrollX) * 0.16;
}

function resolvePlatformCollisions() {
  for (const platform of platforms) {
    const playerHalf = player.diameter / 2;
    const playerBottom = player.y + playerHalf;
    const platformTop = platform.y - platform.h / 2;
    const playerTop = player.y - playerHalf;
    const withinX = abs(player.x - platform.x) < (platform.w + player.diameter) / 2;

    if (withinX && player.vel.y >= 0 && playerBottom >= platformTop - 5 && playerTop < platformTop) {
      player.y = platformTop - playerHalf;
      player.vel.y = 0;
      onGround = true;
    }
  }
}

function isOnGround() {
  const playerHalf = player.diameter / 2;
  const playerBottom = player.y + playerHalf;

  return platforms.some((platform) => {
    const platformTop = platform.y - platform.h / 2;
    const withinX = abs(player.x - platform.x) < (platform.w + player.diameter) / 2;
    const nearTop = playerBottom >= platformTop - 6 && playerBottom <= platformTop + 18;
    return withinX && nearTop;
  });
}

function drawBackground() {
  background(30, 38, 66);

  for (let i = 0; i < height; i += 4) {
    const c = lerpColor(color(31, 42, 74), color(116, 140, 199), i / height);
    stroke(c);
    line(0, i, width, i);
  }
  noStroke();

  const moonX = width - 160 - scrollX * 0.12;
  fill(246, 230, 168, 180);
  ellipse(moonX, 100, 68, 68);
  fill(255, 255, 255, 40);
  ellipse(moonX - 10, 92, 82, 82);

  push();
  translate(-scrollX * 0.18, 0);
  for (let x = -200; x < worldWidth + 400; x += 220) {
    fill('#465977');
    triangle(x, 420, x + 110, 200, x + 220, 420);
    fill('#2f3d56');
    triangle(x + 30, 420, x + 110, 240, x + 190, 420);
  }
  pop();
}

function drawHUD() {
  noStroke();
  fill(255);
  textSize(18);
  text('Fantasy Run', 22, 30);
  textSize(14);
  text('Move: A/D or arrow keys   Jump: W, ↑, or Space   Goal: Reach the portal', 22, 54);

  if (goalReached) {
    fill(255, 243, 170);
    rect(width / 2 - 170, height / 2 - 60, 340, 120, 18);
    fill('#1b1b2f');
    textSize(28);
    textAlign(CENTER, CENTER);
    text('You reached the end!', width / 2, height / 2 - 6);
    textSize(16);
    text('Press R to play again', width / 2, height / 2 + 26);
    textAlign(LEFT, BASELINE);
  }
}

function resetPlayer() {
  player.x = 90;
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
