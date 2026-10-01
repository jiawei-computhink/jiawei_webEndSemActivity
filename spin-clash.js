const arenaWidth = 900;
const arenaHeight = 620;
const arenaCenterX = arenaWidth / 2;
const arenaCenterY = 350;
const arenaRadius = 250;
const ringOutRadius = 272;
const playerTopColor = '#42e8ff';
const rivalTopColor = '#ff4f8b';

let playerTop;
let rivalTop;
let gameState = 'ready';
let boostReadyAt = 0;
let rivalBoostAt = 0;
let playerBoostFlash = 0;
let rivalBoostFlash = 0;

function setup() {
  createCanvas(arenaWidth, arenaHeight);
  world.gravity.y = 0;

  playerTop = makeTop(arenaCenterX - 95, arenaCenterY, playerTopColor);
  rivalTop = makeTop(arenaCenterX + 95, arenaCenterY, rivalTopColor);
}

function makeTop(x, y, topColor) {
  const top = new Sprite(x, y, 48, 48, 'dynamic');
  top.shape = 'circle';
  top.color = topColor;
  top.stroke = '#ffffff';
  top.strokeWeight = 3;
  top.bounciness = 0.92;
  top.friction = 0.05;
  top.drag = 0.03;
  top.mass = 1;
  return top;
}

function draw() {
  drawArena();

  if (gameState === 'playing') {
    steerPlayerTop();
    steerRivalTop();
    checkRingOut();
  } else {
    stopTops();
  }

  drawSprites();
  drawTopDetails(playerTop, playerTopColor, 1);
  drawTopDetails(rivalTop, rivalTopColor, -1);
  drawHud();

  if (gameState === 'ready') {
    drawMessage('SPIN CLASH', 'Click to enter the arena', 'Guide your top with the mouse. Click to boost!');
  } else if (gameState === 'won') {
    drawMessage('RIVAL RINGED OUT!', 'You are the last top spinning!', 'Click to battle again');
  } else if (gameState === 'lost') {
    drawMessage('YOUR TOP RINGED OUT!', 'The rival claims the arena.', 'Click to try again');
  }
}

function drawArena() {
  background('#090d20');

  noStroke();
  for (let y = 0; y < height; y += 4) {
    fill(lerpColor(color('#101832'), color('#241339'), y / height));
    rect(0, y, width, 4);
  }

  noFill();
  stroke('#34426c');
  strokeWeight(2);
  circle(arenaCenterX, arenaCenterY, arenaRadius * 2 + 20);

  stroke('#ff568f');
  strokeWeight(5);
  circle(arenaCenterX, arenaCenterY, arenaRadius * 2);

  stroke('#62406f');
  strokeWeight(2);
  circle(arenaCenterX, arenaCenterY, arenaRadius * 1.45);
  circle(arenaCenterX, arenaCenterY, arenaRadius * 0.76);

  noStroke();
  fill('#31224d');
  circle(arenaCenterX, arenaCenterY, 88);
  fill('#f6cb62');
  circle(arenaCenterX, arenaCenterY, 18);

  drawArenaTicks();
}

function drawArenaTicks() {
  push();
  translate(arenaCenterX, arenaCenterY);
  stroke('#f7d5f0');
  strokeWeight(3);
  for (let tick = 0; tick < 16; tick++) {
    rotate(TWO_PI / 16);
    line(0, -arenaRadius + 8, 0, -arenaRadius + 18);
  }
  pop();
}

function steerPlayerTop() {
  const target = getMouseTarget();
  const directionX = target.x - playerTop.x;
  const directionY = target.y - playerTop.y;
  const distance = sqrt(directionX * directionX + directionY * directionY);
  const desiredSpeed = min(5.4, distance * 0.055);
  const desiredVelocityX = distance > 1 ? directionX / distance * desiredSpeed : 0;
  const desiredVelocityY = distance > 1 ? directionY / distance * desiredSpeed : 0;

  playerTop.vel.x += (desiredVelocityX - playerTop.vel.x) * 0.035;
  playerTop.vel.y += (desiredVelocityY - playerTop.vel.y) * 0.035;
  playerBoostFlash = max(0, playerBoostFlash - deltaTime);
}

function getMouseTarget() {
  let x = constrain(mouseX, 0, width);
  let y = constrain(mouseY, 72, height);
  const offsetX = x - arenaCenterX;
  const offsetY = y - arenaCenterY;
  const distance = sqrt(offsetX * offsetX + offsetY * offsetY);
  const steeringRadius = arenaRadius * 0.78;

  if (distance > steeringRadius) {
    x = arenaCenterX + offsetX / distance * steeringRadius;
    y = arenaCenterY + offsetY / distance * steeringRadius;
  }
  return { x, y };
}

function steerRivalTop() {
  const directionX = playerTop.x - rivalTop.x;
  const directionY = playerTop.y - rivalTop.y;
  const distance = max(1, sqrt(directionX * directionX + directionY * directionY));
  const desiredSpeed = distance > 70 ? 3.5 : 2.8;
  const desiredVelocityX = directionX / distance * desiredSpeed;
  const desiredVelocityY = directionY / distance * desiredSpeed;

  rivalTop.vel.x += (desiredVelocityX - rivalTop.vel.x) * 0.018;
  rivalTop.vel.y += (desiredVelocityY - rivalTop.vel.y) * 0.018;
  rivalBoostFlash = max(0, rivalBoostFlash - deltaTime);

  if (millis() >= rivalBoostAt && distance < 250) {
    rivalTop.vel.x += directionX / distance * 3.2;
    rivalTop.vel.y += directionY / distance * 3.2;
    rivalBoostFlash = 180;
    rivalBoostAt = millis() + random(1800, 3000);
  }
}

function checkRingOut() {
  const playerDistance = dist(playerTop.x, playerTop.y, arenaCenterX, arenaCenterY);
  const rivalDistance = dist(rivalTop.x, rivalTop.y, arenaCenterX, arenaCenterY);

  if (playerDistance > ringOutRadius) {
    gameState = 'lost';
  } else if (rivalDistance > ringOutRadius) {
    gameState = 'won';
  }
}

function drawTopDetails(top, topColor, spinDirection) {
  const spin = frameCount * 0.22 * spinDirection;
  const size = topBoostFlashFor(top);

  push();
  translate(top.x, top.y);
  rotate(spin);
  noStroke();
  fill('#ffffff');
  for (let blade = 0; blade < 3; blade++) {
    push();
    rotate(TWO_PI * blade / 3);
    fill(topColor);
    triangle(-5, -5, 5, -5, 0, -21);
    pop();
  }
  fill('#fff2bb');
  circle(0, 0, size);
  fill('#f6c85d');
  circle(0, 0, size * 0.45);
  pop();

  if (topBoostFlashFor(top) > 0) {
    noFill();
    stroke(topColor);
    strokeWeight(3);
    circle(top.x, top.y, 64 + sin(frameCount * 0.5) * 8);
  }
}

function topBoostFlashFor(top) {
  return top === playerTop
    ? (playerBoostFlash > 0 ? 13 : 10)
    : (rivalBoostFlash > 0 ? 13 : 10);
}

function drawHud() {
  noStroke();
  fill(5, 9, 24, 220);
  rect(0, 0, width, 70);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(19);
  fill(playerTopColor);
  text('YOU', 28, 24);
  fill(rivalTopColor);
  text('RIVAL', width - 92, 24);

  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(14);
  fill('#f2eaff');
  text(millis() < boostReadyAt ? 'BOOST RECHARGING' : 'BOOST READY', width / 2, 24);
  fill('#c8d1f0');
  text('MOVE MOUSE TO STEER  •  CLICK TO BOOST', width / 2, 49);
}

function drawMessage(title, subtitle, instruction) {
  noStroke();
  fill(5, 8, 24, 225);
  rect(width / 2 - 255, height / 2 - 86, 510, 172, 18);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(31);
  fill('#ffffff');
  text(title, width / 2, height / 2 - 43);
  textStyle(NORMAL);
  textSize(17);
  fill('#bdefff');
  text(subtitle, width / 2, height / 2 + 2);
  textSize(14);
  fill('#ffd778');
  text(instruction, width / 2, height / 2 + 43);
}

function stopTops() {
  playerTop.vel.x = 0;
  playerTop.vel.y = 0;
  rivalTop.vel.x = 0;
  rivalTop.vel.y = 0;
}

function startGame() {
  playerTop.x = arenaCenterX - 95;
  playerTop.y = arenaCenterY;
  playerTop.vel.x = 0;
  playerTop.vel.y = 0;
  rivalTop.x = arenaCenterX + 95;
  rivalTop.y = arenaCenterY;
  rivalTop.vel.x = 0;
  rivalTop.vel.y = 0;

  boostReadyAt = 0;
  rivalBoostAt = millis() + 1200;
  playerBoostFlash = 0;
  rivalBoostFlash = 0;
  gameState = 'playing';
}

function mousePressed() {
  if (gameState !== 'playing') {
    startGame();
    return;
  }

  if (millis() < boostReadyAt) return;

  const target = getMouseTarget();
  const directionX = target.x - playerTop.x;
  const directionY = target.y - playerTop.y;
  const distance = max(1, sqrt(directionX * directionX + directionY * directionY));
  playerTop.vel.x += directionX / distance * 5.5;
  playerTop.vel.y += directionY / distance * 5.5;
  playerBoostFlash = 220;
  boostReadyAt = millis() + 950;
}
