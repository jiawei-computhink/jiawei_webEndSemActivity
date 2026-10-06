const canvasWidth = 960;
const canvasHeight = 700;
const boardColumns = 5;
const boardRows = 5;
const cellSize = 66;
const boardLeft = 46;
const boardTop = 180;
const boilerCell = { col: 0, row: 2 };
const dynamoCell = { col: 4, row: 2 };
const jammedCell = { col: 2, row: 2 };
const roundLength = 60;
const gearCount = 9;

let boardTiles;
let gears = [];
let heldGear = null;
let gameState = 'title';
let roundStartedAt = 0;
let timeLeft = roundLength;
let finalScore = 0;
let statusMessage = 'Drag gears to build the machine.';

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  world.gravity.y = 0;
  createBoardTiles();
  createGears();
}

function createBoardTiles() {
  boardTiles = new Group();
  boardTiles.collider = 'none';

  for (let row = 0; row < boardRows; row++) {
    for (let col = 0; col < boardColumns; col++) {
      const tile = new boardTiles.Sprite(cellCenterX(col), cellCenterY(row), cellSize - 5, cellSize - 5, 'none');
      tile.color = isJammedCell(col, row) ? '#382b1f' : '#493827';
      tile.stroke = isJammedCell(col, row) ? '#bd7041' : '#80623e';
      tile.strokeWeight = 2;
      tile.rotationLock = true;
    }
  }
}

function createGears() {
  const trayPositions = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      trayPositions.push({ x: 550 + col * 112, y: 300 + row * 104 });
    }
  }

  for (let index = 0; index < gearCount; index++) {
    const home = trayPositions[index];
    const sprite = new Sprite(home.x, home.y, 43, 43, 'none');
    sprite.shape = 'circle';
    sprite.color = '#bd8148';
    sprite.stroke = '#f4c778';
    sprite.strokeWeight = 3;
    sprite.rotationLock = true;
    gears.push({
      sprite,
      homeX: home.x,
      homeY: home.y,
      gridCol: null,
      gridRow: null
    });
  }
}

function draw() {
  if (gameState === 'playing') {
    timeLeft = max(0, roundLength - floor((millis() - roundStartedAt) / 1000));
    if (timeLeft === 0) gameState = 'lost';
  }

  const network = getPoweredNetwork();
  updateGearColors(network);
  drawBackdrop();
  drawSprites();
  drawBoardDecorations(network);
  drawGearTeeth();
  drawHud(network);

  if (gameState !== 'playing') drawStateOverlay(network);
}

function drawBackdrop() {
  background('#211810');
  noStroke();
  fill('#2d2117');
  rect(20, 20, width - 40, height - 40, 20);

  stroke('#634628');
  strokeWeight(2);
  noFill();
  rect(31, 31, width - 62, height - 62, 14);
  for (let x = 56; x < width - 40; x += 36) {
    line(x, 31, x, 40);
    line(x, height - 40, x, height - 31);
  }

  noStroke();
  fill('#3c2b1b');
  rect(boardLeft - 16, boardTop - 16, boardColumns * cellSize + 32, boardRows * cellSize + 32, 14);
  fill('#39291a');
  rect(492, 198, 390, 340, 16);
}

function drawBoardDecorations(network) {
  drawEndpoint(boilerCell, 'BOILER', '#f0ae55', true, network);
  drawEndpoint(dynamoCell, 'DYNAMO', '#75d9bb', false, network);

  push();
  translate(cellCenterX(jammedCell.col), cellCenterY(jammedCell.row));
  rotate(frameCount * 0.008);
  noStroke();
  fill('#b75f38');
  for (let tooth = 0; tooth < 8; tooth++) {
    push();
    rotate(tooth * TWO_PI / 8);
    rect(-5, -24, 10, 12, 2);
    pop();
  }
  fill('#291c14');
  circle(0, 0, 30);
  pop();

  noStroke();
  fill('#e6c895');
  textAlign(CENTER, CENTER);
  textSize(12);
  text('JAMMED', cellCenterX(jammedCell.col), cellCenterY(jammedCell.row) + 31);

  fill('#c8ad83');
  textAlign(LEFT, CENTER);
  textSize(15);
  text('GEAR TRAY', 515, 228);
  textSize(12);
  text('Drag a gear onto the board', 515, 251);

  drawPoweredLinks(network);
}

function drawEndpoint(cell, label, colorValue, isSource, network) {
  const x = cellCenterX(cell.col);
  const y = cellCenterY(cell.row);
  const active = isSource || network.reachesDynamo;

  noStroke();
  fill(active ? colorValue : '#69543b');
  circle(x, y, 38);
  fill('#211810');
  circle(x, y, 20);
  stroke(active ? colorValue : '#8a7659');
  strokeWeight(5);
  line(x, y, x + (isSource ? 22 : -22), y);

  noStroke();
  fill('#f7e7c8');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(10);
  text(label, x, y + 39);
  textStyle(NORMAL);
}

function drawPoweredLinks(network) {
  stroke('#74dbbb');
  strokeWeight(5);
  strokeCap(ROUND);

  for (const key of network.poweredKeys) {
    const [col, row] = key.split(',').map(Number);
    for (const [nextCol, nextRow] of [[col + 1, row], [col, row + 1]]) {
      const nextKey = cellKey(nextCol, nextRow);
      if (network.poweredKeys.has(nextKey) && getGearAt(nextCol, nextRow)) {
        line(cellCenterX(col), cellCenterY(row), cellCenterX(nextCol), cellCenterY(nextRow));
      }
    }
  }

  if (network.poweredKeys.has(cellKey(boilerCell.col, boilerCell.row))) {
    const firstGear = getGearAt(boilerCell.col + 1, boilerCell.row);
    if (firstGear && network.poweredKeys.has(cellKey(boilerCell.col + 1, boilerCell.row))) {
      line(cellCenterX(boilerCell.col), cellCenterY(boilerCell.row), firstGear.sprite.x, firstGear.sprite.y);
    }
  }

  if (network.reachesDynamo) {
    const lastGear = getGearAt(dynamoCell.col - 1, dynamoCell.row);
    if (lastGear && network.poweredKeys.has(cellKey(dynamoCell.col - 1, dynamoCell.row))) {
      line(lastGear.sprite.x, lastGear.sprite.y, cellCenterX(dynamoCell.col), cellCenterY(dynamoCell.row));
    }
  }
}

function drawGearTeeth() {
  for (const gear of gears) {
    const sprite = gear.sprite;
    push();
    translate(sprite.x, sprite.y);
    rotate(frameCount * 0.012);
    noStroke();
    fill(sprite.color);
    for (let tooth = 0; tooth < 8; tooth++) {
      push();
      rotate(tooth * TWO_PI / 8);
      rect(-4, -26, 8, 12, 2);
      pop();
    }
    fill('#f4d394');
    circle(0, 0, 8);
    pop();
  }
}

function drawHud(network) {
  noStroke();
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  fill('#f1d8aa');
  textSize(20);
  text('GEARWORKS: BRASS CIRCUIT', 52, 72);
  textStyle(NORMAL);
  textSize(14);
  fill('#cbb58e');
  text('Route steam around the jammed valve and power the dynamo.', 52, 101);

  fill('#f4d394');
  textStyle(BOLD);
  textSize(17);
  text(`SCORE  ${gameState === 'won' ? finalScore : network.score}`, 704, 72);
  fill(timeLeft <= 10 ? '#ff9468' : '#bdebd8');
  text(`TIME  ${timeLeft}s`, 704, 101);
  textStyle(NORMAL);

  drawButton(820, 48, 96, 38, 'RESTART', '#65452c');

  fill('#d6c3a0');
  textAlign(CENTER, CENTER);
  textSize(13);
  text('10 points per powered gear  •  25 per closed loop  •  100 + time bonus to finish', width / 2, 590);
  fill(network.reachesDynamo ? '#96f0c8' : '#d8b76f');
  textSize(14);
  text(statusMessage, width / 2, 624);
}

function drawStateOverlay(network) {
  noStroke();
  fill(18, 12, 8, 205);
  rect(0, 0, width, height);

  fill('#f2c578');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(gameState === 'title' ? 39 : 35);
  text(gameState === 'title' ? 'BUILD THE BRASS CIRCUIT' : gameState === 'won' ? 'THE DYNAMO IS ALIVE!' : 'TIME HAS RUN OUT', width / 2, 254);
  textStyle(NORMAL);

  fill('#f5e5c8');
  textSize(17);
  if (gameState === 'title') {
    text('Drag gears from the tray into empty cells to connect the boiler to the dynamo.', width / 2, 309);
    text('Build powered branches and loops for more points. Avoid the jammed valve!', width / 2, 339);
    text('You have 60 seconds. Use only your mouse.', width / 2, 369);
    drawButton(width / 2 - 92, 411, 184, 52, 'START BUILDING', '#91602e');
  } else if (gameState === 'won') {
    text(`Final score: ${finalScore}   •   Powered gears: ${network.poweredGearCount}`, width / 2, 318);
    text('The boiler is powering the dynamo. Try again for an even higher score.', width / 2, 352);
    drawButton(width / 2 - 76, 397, 152, 48, 'PLAY AGAIN', '#28765d');
  } else {
    text(`Score: ${network.score}   •   Powered gears: ${network.poweredGearCount}`, width / 2, 318);
    text('The dynamo needs a complete route from the boiler.', width / 2, 352);
    drawButton(width / 2 - 76, 397, 152, 48, 'TRY AGAIN', '#91602e');
  }
}

function drawButton(x, y, buttonWidth, buttonHeight, label, colorValue) {
  noStroke();
  fill(colorValue);
  rect(x, y, buttonWidth, buttonHeight, 10);
  stroke('#f0ca85');
  strokeWeight(2);
  noFill();
  rect(x, y, buttonWidth, buttonHeight, 10);
  noStroke();
  fill('#fff2d4');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(14);
  text(label, x + buttonWidth / 2, y + buttonHeight / 2);
  textStyle(NORMAL);
}

function updateGearColors(network) {
  for (const gear of gears) {
    if (gear === heldGear) {
      gear.sprite.color = '#f2d185';
    } else if (gear.gridCol !== null && network.poweredKeys.has(cellKey(gear.gridCol, gear.gridRow))) {
      gear.sprite.color = '#5bbd9a';
    } else {
      gear.sprite.color = '#bd8148';
    }
  }
}

function getPoweredNetwork() {
  const poweredKeys = new Set([cellKey(boilerCell.col, boilerCell.row)]);
  const queue = [cellKey(boilerCell.col, boilerCell.row)];

  while (queue.length > 0) {
    const current = queue.shift();
    const [col, row] = current.split(',').map(Number);
    for (const [nextCol, nextRow] of [[col + 1, row], [col - 1, row], [col, row + 1], [col, row - 1]]) {
      if (current === cellKey(boilerCell.col, boilerCell.row) &&
          (nextCol !== boilerCell.col + 1 || nextRow !== boilerCell.row)) continue;
      if (nextCol === dynamoCell.col && nextRow === dynamoCell.row &&
          (col !== dynamoCell.col - 1 || row !== dynamoCell.row)) continue;

      const nextKey = cellKey(nextCol, nextRow);
      if (nextCol === dynamoCell.col && nextRow === dynamoCell.row) {
        poweredKeys.add(nextKey);
      } else if (getGearAt(nextCol, nextRow) && !poweredKeys.has(nextKey)) {
        poweredKeys.add(nextKey);
        queue.push(nextKey);
      }
    }
  }

  const reachesDynamo = poweredKeys.has(cellKey(dynamoCell.col, dynamoCell.row));
  const poweredGearCount = gears.filter((gear) => (
    gear.gridCol !== null && poweredKeys.has(cellKey(gear.gridCol, gear.gridRow))
  )).length;
  const poweredNodeCount = poweredGearCount + 1 + (reachesDynamo ? 1 : 0);
  let poweredEdgeCount = 0;

  for (const key of poweredKeys) {
    const [col, row] = key.split(',').map(Number);
    for (const [nextCol, nextRow] of [[col + 1, row], [col, row + 1]]) {
      const nextKey = cellKey(nextCol, nextRow);
      const isEndpoint = nextKey === cellKey(dynamoCell.col, dynamoCell.row);
      if (poweredKeys.has(nextKey) && (isEndpoint || getGearAt(nextCol, nextRow))) {
        poweredEdgeCount++;
      }
    }
  }

  const closedLoops = max(0, poweredEdgeCount - poweredNodeCount + 1);
  const score = poweredGearCount * 10 + closedLoops * 25;
  return { poweredKeys, poweredGearCount, reachesDynamo, closedLoops, score };
}

function mousePressed() {
  if (gameState !== 'playing') {
    const button = gameState === 'title'
      ? { x: width / 2 - 92, y: 411, width: 184, height: 52 }
      : { x: width / 2 - 76, y: 397, width: 152, height: 48 };
    if (pointInRect(mouseX, mouseY, button)) startNewRound();
    return false;
  }

  if (pointInRect(mouseX, mouseY, { x: 820, y: 48, width: 96, height: 38 })) {
    startNewRound();
    return false;
  }

  for (let index = gears.length - 1; index >= 0; index--) {
    const gear = gears[index];
    if (dist(mouseX, mouseY, gear.sprite.x, gear.sprite.y) <= 30) {
      heldGear = gear;
      return false;
    }
  }
}

function mouseDragged() {
  if (gameState === 'playing' && heldGear) {
    heldGear.sprite.x = mouseX;
    heldGear.sprite.y = mouseY;
    return false;
  }
}

function mouseReleased() {
  if (!heldGear) return;
  const gear = heldGear;
  heldGear = null;

  if (isInsideTray(mouseX, mouseY)) {
    gear.gridCol = null;
    gear.gridRow = null;
    gear.sprite.x = gear.homeX;
    gear.sprite.y = gear.homeY;
    statusMessage = 'Gear returned to the tray.';
    return false;
  }

  const cell = cellAtPointer(mouseX, mouseY);
  if (!cell || isJammedCell(cell.col, cell.row) || isEndpointCell(cell.col, cell.row) || getGearAt(cell.col, cell.row, gear)) {
    restoreGear(gear);
    statusMessage = 'That spot is blocked or already occupied.';
    return false;
  }

  gear.gridCol = cell.col;
  gear.gridRow = cell.row;
  gear.sprite.x = cellCenterX(cell.col);
  gear.sprite.y = cellCenterY(cell.row);

  const network = getPoweredNetwork();
  statusMessage = network.reachesDynamo
    ? 'Circuit complete! Your powered gears, loops, and remaining time score points.'
    : network.poweredGearCount > 0
      ? `${network.poweredGearCount} gear${network.poweredGearCount === 1 ? '' : 's'} powered. Keep building toward the dynamo!`
      : 'Gear placed. Connect it to the boiler to power it.';

  if (network.reachesDynamo) {
    finalScore = network.score + 100 + timeLeft * 2;
    gameState = 'won';
  }
  return false;
}

function startNewRound() {
  for (const gear of gears) {
    gear.gridCol = null;
    gear.gridRow = null;
    gear.sprite.x = gear.homeX;
    gear.sprite.y = gear.homeY;
  }
  heldGear = null;
  timeLeft = roundLength;
  finalScore = 0;
  roundStartedAt = millis();
  statusMessage = 'Drag gears to build the machine.';
  gameState = 'playing';
}

function restoreGear(gear) {
  if (gear.gridCol === null) {
    gear.sprite.x = gear.homeX;
    gear.sprite.y = gear.homeY;
  } else {
    gear.sprite.x = cellCenterX(gear.gridCol);
    gear.sprite.y = cellCenterY(gear.gridRow);
  }
}

function getGearAt(col, row, ignoredGear = null) {
  return gears.find((gear) => (
    gear !== ignoredGear && gear.gridCol === col && gear.gridRow === row
  ));
}

function cellAtPointer(x, y) {
  if (x < boardLeft || x >= boardLeft + boardColumns * cellSize ||
      y < boardTop || y >= boardTop + boardRows * cellSize) return null;
  return {
    col: floor((x - boardLeft) / cellSize),
    row: floor((y - boardTop) / cellSize)
  };
}

function isInsideTray(x, y) {
  return x >= 492 && x <= 882 && y >= 198 && y <= 538;
}

function isJammedCell(col, row) {
  return col === jammedCell.col && row === jammedCell.row;
}

function isEndpointCell(col, row) {
  return (col === boilerCell.col && row === boilerCell.row) ||
    (col === dynamoCell.col && row === dynamoCell.row);
}

function cellCenterX(col) {
  return boardLeft + col * cellSize + cellSize / 2;
}

function cellCenterY(row) {
  return boardTop + row * cellSize + cellSize / 2;
}

function cellKey(col, row) {
  return `${col},${row}`;
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width &&
    y >= rect.y && y <= rect.y + rect.height;
}
