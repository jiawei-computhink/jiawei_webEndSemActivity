const goalDistance = 1000;
const forwardSpeed = 3.2;
const metersPerPixel = 0.16;
const playerXRatio = 0.23;
const flightTop = 48;
const flightBottomGap = 42;

let pilot;
let drones = [];
let starfield = [];
let gameState = 'title';
let distanceMeters = 0;
let distancePixels = 0;
let verticalSpeed = 0;
let nextDroneDistance = 55;
let boostButtonHeld = false;
let keyboardBoostHeld = false;
let lastFrameStep = 1;

function setup() {
  const canvas = createCanvas(900, 540);
  canvas.parent('game-canvas');
  world.gravity.y = 0;

  pilot = new Sprite(width * playerXRatio, height * 0.53, 34, 42, 'none');
  pilot.shape = 'circle';
  pilot.visible = false;

  for (let index = 0; index < 75; index++) {
    starfield.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      depth: random(0.12, 0.72),
      phase: random(TWO_PI)
    });
  }

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', () => {
    boostButtonHeld = false;
    keyboardBoostHeld = false;
  });

  const boostButton = document.getElementById('boost-button');
  boostButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    boostButtonHeld = true;
    startIfNeeded();
  });
  for (const eventName of ['pointerup', 'pointercancel', 'pointerleave']) {
    boostButton.addEventListener(eventName, () => {
      boostButtonHeld = false;
    });
  }
}

function draw() {
  lastFrameStep = min(deltaTime / (1000 / 60), 2);
  drawSky();

  if (gameState === 'playing') {
    updateRun();
  }

  drawSprites();
  drawDrones();
  drawPilot();
  drawHud();

  if (gameState === 'title') {
    drawOverlay('STARBOUND SPRINT', 'Hold SPACE to rise. Release to fall. Dodge the drones!', 'Press ENTER or hold SPACE to launch');
  } else if (gameState === 'won') {
    drawOverlay('SKYLINE CONQUERED!', `You crossed ${goalDistance.toLocaleString()} m without a scratch.`, 'Press ENTER or R to race again');
  } else if (gameState === 'lost') {
    drawOverlay('RUN OVER', `${floor(distanceMeters)} m flown · watch the flight lane and drones!`, 'Press ENTER or R to try again');
  }
}

function drawSky() {
  background('#111531');
  noStroke();

  fill('#1a2250');
  ellipse(width * 0.73, height * 0.31, width * 0.82, height * 0.78);
  fill('#241d54');
  ellipse(width * 0.17, height * 0.76, width * 0.95, height * 0.62);

  for (const star of starfield) {
    const starX = (star.x - distancePixels * star.depth) % width;
    const wrappedX = starX < 0 ? starX + width : starX;
    const twinkle = 0.55 + 0.45 * sin(frameCount * 0.045 + star.phase);
    fill(175, 224, 255, 100 + 155 * twinkle);
    circle(wrappedX, star.y, star.size * twinkle);
  }

  const scroll = distancePixels * 0.24;
  for (let index = -1; index < 12; index++) {
    const blockWidth = 72 + (index % 3) * 18;
    let buildingX = index * 112 - (scroll % 112);
    while (buildingX < -blockWidth) buildingX += width + 112;
    const buildingHeight = 92 + ((index * 47 + 900) % 126);
    const buildingY = height - buildingHeight;

    fill(index % 2 === 0 ? '#22294e' : '#29264f');
    rect(buildingX, buildingY, blockWidth, buildingHeight);
    fill(index % 2 === 0 ? '#ff75c8' : '#62e9ff');
    rect(buildingX + 9, buildingY + 13, 3, buildingHeight - 22, 2);

    for (let windowY = buildingY + 18; windowY < height - 12; windowY += 24) {
      fill(102, 224, 255, 90);
      rect(buildingX + 23, windowY, 10, 5, 2);
      rect(buildingX + 43, windowY, 10, 5, 2);
    }
  }

  const laneTop = flightTop;
  const laneBottom = height - flightBottomGap;
  fill('#65eaff');
  rect(0, laneTop, width, 2);
  fill('#ff69bd');
  rect(0, laneBottom, width, 3);
  fill(255, 105, 189, 18);
  rect(0, laneBottom + 3, width, height - laneBottom);
}

function updateRun() {
  const frameStep = lastFrameStep;
  const boostHeld = isBoostHeld();
  const gravity = 0.19;
  const thrust = boostHeld ? 0.39 : 0;

  verticalSpeed += (gravity - thrust) * frameStep;
  verticalSpeed = constrain(verticalSpeed, -5.2, 5.2);
  pilot.y += verticalSpeed * frameStep;
  distancePixels += forwardSpeed * frameStep;
  distanceMeters += forwardSpeed * metersPerPixel * frameStep;

  if (boostHeld && frameCount % 3 === 0) {
    drawJetpackTrail();
  }

  if (distanceMeters >= nextDroneDistance) {
    addDrone();
    nextDroneDistance += random(48, 68);
  }

  for (let index = drones.length - 1; index >= 0; index--) {
    const drone = drones[index];
    drone.sprite.x -= forwardSpeed * frameStep;
    drone.sprite.y = drone.baseY + sin(frameCount * 0.055 + drone.phase) * drone.wobble;

    if (pilot.overlaps(drone.sprite)) {
      endRun('lost');
      return;
    }
    if (drone.sprite.x < -70) {
      drone.sprite.remove();
      drones.splice(index, 1);
    }
  }

  if (pilot.y - 20 <= flightTop || pilot.y + 20 >= height - flightBottomGap) {
    endRun('lost');
  } else if (distanceMeters >= goalDistance) {
    distanceMeters = goalDistance;
    endRun('won');
  }
}

function addDrone() {
  const droneY = random(flightTop + 52, height - flightBottomGap - 52);
  const sprite = new Sprite(width + 65, droneY, 48, 42, 'none');
  sprite.shape = 'circle';
  sprite.visible = false;
  drones.push({
    sprite,
    baseY: droneY,
    phase: random(TWO_PI),
    wobble: random(9, 20)
  });
}

function drawDrones() {
  for (const drone of drones) {
    const x = drone.sprite.x;
    const y = drone.sprite.y;
    const pulse = 1 + sin(frameCount * 0.1 + drone.phase) * 0.08;

    drawingContext.shadowBlur = 18;
    drawingContext.shadowColor = '#ff4fc6';
    noStroke();
    fill('#642a72');
    ellipse(x, y, 54 * pulse, 39 * pulse);
    drawingContext.shadowBlur = 0;

    fill('#ff75cc');
    ellipse(x - 15, y, 12, 34);
    ellipse(x + 15, y, 12, 34);
    fill('#202344');
    ellipse(x, y, 35, 29);
    fill('#8ef5ff');
    ellipse(x + 2, y - 1, 15, 10);
    fill('#ffffff');
    circle(x + 4, y - 2, 4);
    fill('#ffdf83');
    circle(x - 15, y - 2, 4);
    circle(x + 15, y - 2, 4);
  }
}

function drawPilot() {
  const x = pilot.x;
  const y = pilot.y;
  const bob = gameState === 'playing' ? sin(frameCount * 0.11) * 1.5 : 0;

  push();
  translate(x, y + bob);
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = '#55e9ff';

  if (isBoostHeld() && gameState === 'playing') {
    noStroke();
    fill('#fff0a1');
    triangle(-11, 19, -3, 42 + random(0, 7), 4, 19);
    fill('#ff79d2');
    triangle(-7, 19, -3, 32 + random(0, 5), 0, 19);
  }

  noStroke();
  fill('#5fe8f3');
  rect(-16, -3, 8, 24, 4);
  rect(8, -3, 8, 24, 4);
  fill('#222a59');
  rect(-13, -8, 26, 29, 10);
  fill('#ff78c8');
  rect(-13, 4, 26, 4, 2);

  fill('#ffe0c8');
  ellipse(0, -13, 26, 28);
  fill('#f64cae');
  arc(0, -17, 30, 28, 180, 360, CHORD);
  triangle(-13, -18, -15, -31, -4, -23);
  triangle(-2, -21, 5, -32, 8, -18);
  fill('#8ef5ff');
  arc(4, -13, 14, 12, 180, 360, CHORD);
  fill('#26264d');
  ellipse(5, -10, 3, 5);
  fill('#ff73bb');
  circle(-7, -7, 4);

  fill('#fff1ab');
  rect(-4, -1, 8, 9, 3);
  drawingContext.shadowBlur = 0;
  pop();
}

function drawJetpackTrail() {
  const x = pilot.x - 3;
  const y = pilot.y + 22;
  noStroke();
  fill(255, 223, 129, 180);
  circle(x + random(-4, 4), y + random(0, 12), random(3, 6));
}

function drawHud() {
  noStroke();
  fill(8, 12, 35, 210);
  rect(15, 14, 250, 62, 12);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(15);
  fill('#e9f7ff');
  text('DISTANCE', 29, 33);
  textSize(23);
  fill('#fff1a3');
  text(`${floor(distanceMeters).toLocaleString()} m`, 29, 56);

  const barX = width - 225;
  const barY = 31;
  fill(8, 12, 35, 210);
  rect(barX - 15, 14, 210, 42, 12);
  fill('#e9f7ff');
  textSize(13);
  textAlign(LEFT, CENTER);
  text('GOAL', barX - 1, barY);
  noFill();
  stroke('#a4dbed');
  strokeWeight(5);
  line(barX + 43, barY, barX + 173, barY);
  stroke('#ff78ca');
  strokeWeight(5);
  line(barX + 43, barY, barX + 43 + 130 * (distanceMeters / goalDistance), barY);
  noStroke();

  if (gameState === 'playing' && abs(pilot.y - height * 0.5) < 105) {
    fill('#a8f6ff');
    textAlign(CENTER, CENTER);
    textSize(12);
    text(isBoostHeld() ? 'BOOST!' : 'RELEASE TO DROP', pilot.x, pilot.y - 36);
  }
  textStyle(NORMAL);
}

function drawOverlay(title, detail, instruction) {
  const panelWidth = min(width - 36, 590);
  const panelHeight = 174;
  const panelX = (width - panelWidth) / 2;
  const panelY = height * 0.5 - panelHeight / 2;

  noStroke();
  fill(5, 8, 27, 224);
  rect(panelX, panelY, panelWidth, panelHeight, 18);
  stroke('#72eaff');
  strokeWeight(1.5);
  noFill();
  rect(panelX, panelY, panelWidth, panelHeight, 18);
  noStroke();

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(width < 560 ? 23 : 30);
  fill(gameState === 'lost' ? '#ff9bbd' : '#fff0a1');
  text(title, width / 2, panelY + 43);

  textStyle(NORMAL);
  textSize(width < 560 ? 13 : 16);
  fill('#e2e8ff');
  text(detail, width / 2, panelY + 87);
  fill('#94f3ff');
  text(instruction, width / 2, panelY + 128);
}

function startIfNeeded() {
  if (gameState === 'title' || gameState === 'won' || gameState === 'lost') {
    resetRun();
  }
}

function resetRun() {
  for (const drone of drones) drone.sprite.remove();
  drones = [];
  pilot.x = width * playerXRatio;
  pilot.y = height * 0.53;
  verticalSpeed = 0;
  distanceMeters = 0;
  distancePixels = 0;
  nextDroneDistance = random(48, 65);
  gameState = 'playing';
}

function endRun(result) {
  gameState = result;
  verticalSpeed = 0;
  boostButtonHeld = false;
  keyboardBoostHeld = false;
}

function isBoostHeld() {
  return keyboardBoostHeld || boostButtonHeld;
}

function handleKeyDown(event) {
  if (event.code === 'Space') {
    event.preventDefault();
    keyboardBoostHeld = true;
    if (!event.repeat) startIfNeeded();
  } else if (event.code === 'Enter' || event.code === 'KeyR') {
    event.preventDefault();
    if (!event.repeat) startIfNeeded();
  }
}

function handleKeyUp(event) {
  if (event.code === 'Space') {
    keyboardBoostHeld = false;
  }
}

function mousePressed() {
  startIfNeeded();
}
