const columns = 10;
const rows = 20;
const tileSize = 28;
const boardX = 54;
const boardY = 54;
const boardWidth = columns * tileSize;
const boardHeight = rows * tileSize;
const canvasWidth = 760;
const canvasHeight = 700;
const linesToWin = 10;
const highScoreKey = 'enchantedTetrisHighScore';

const runes = [
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], color: '#66e8ff' },
  { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: '#ffe16b' },
  { cells: [[1, 0], [0, 1], [1, 1], [2, 1]], color: '#ce8aff' },
  { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], color: '#80f0a5' },
  { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: '#ff7eae' },
  { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], color: '#ffae66' },
  { cells: [[2, 0], [0, 1], [1, 1], [2, 1]], color: '#7c9cff' }
];

let settledGrid;
let activePiece;
let nextRune;
let score;
let highScore;
let clearedLines;
let gameState;
let lastFallTime;

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  world.gravity.y = 0;
  highScore = Number(localStorage.getItem(highScoreKey)) || 0;
  resetGame();
}

function draw() {
  drawBackground();

  if (gameState === 'playing') {
    const fallDelay = max(120, 650 - floor(clearedLines / 2) * 70);
    if (millis() - lastFallTime >= fallDelay) {
      stepDown();
      lastFallTime = millis();
    }
  }

  drawSprites();
  drawBoardGrid();
  drawSidebar();

  if (gameState !== 'playing') {
    drawEndMessage();
  }
}

function resetGame() {
  if (activePiece) {
    activePiece.blocks.forEach((block) => block.remove());
  }
  if (settledGrid) {
    for (const row of settledGrid) {
      for (const block of row) {
        if (block) block.remove();
      }
    }
  }

  settledGrid = Array.from({ length: rows }, () => Array(columns).fill(null));
  score = 0;
  clearedLines = 0;
  gameState = 'playing';
  nextRune = random(runes);
  spawnPiece();
  lastFallTime = millis();
}

function spawnPiece() {
  const rune = nextRune;
  nextRune = random(runes);
  const originX = floor(columns / 2) - 2;
  const originY = 0;
  const blocks = rune.cells.map(([x, y]) => makeBlock(originX + x, originY + y, rune.color));

  activePiece = { cells: rune.cells.map(([x, y]) => ({ x, y })), blocks, color: rune.color, x: originX, y: originY };

  if (!canPlace(activePiece.cells, activePiece.x, activePiece.y)) {
    gameState = 'lost';
  }
}

function makeBlock(gridX, gridY, colorValue) {
  const block = new Sprite(gridToX(gridX), gridToY(gridY), tileSize - 2, tileSize - 2, 'none');
  block.color = colorValue;
  block.stroke = '#fff3ff';
  block.strokeWeight = 1;
  block.rotationLock = true;
  return block;
}

function canPlace(cells, originX, originY) {
  return cells.every(({ x, y }) => {
    const gridX = originX + x;
    const gridY = originY + y;
    return gridX >= 0 && gridX < columns && gridY >= 0 && gridY < rows
      && settledGrid[gridY][gridX] === null;
  });
}

function movePiece(dx, dy) {
  if (!activePiece || !canPlace(activePiece.cells, activePiece.x + dx, activePiece.y + dy)) {
    return false;
  }

  activePiece.x += dx;
  activePiece.y += dy;
  updateActiveBlocks();
  return true;
}

function updateActiveBlocks() {
  activePiece.cells.forEach(({ x, y }, index) => {
    const block = activePiece.blocks[index];
    block.x = gridToX(activePiece.x + x);
    block.y = gridToY(activePiece.y + y);
  });
}

function rotatePiece() {
  const rotatedCells = activePiece.cells.map(({ x, y }) => ({ x: -y, y: x }));
  const minX = min(...rotatedCells.map(({ x }) => x));
  const minY = min(...rotatedCells.map(({ y }) => y));
  const normalizedCells = rotatedCells.map(({ x, y }) => ({ x: x - minX, y: y - minY }));

  for (const offsetX of [0, -1, 1, -2, 2]) {
    if (canPlace(normalizedCells, activePiece.x + offsetX, activePiece.y)) {
      activePiece.cells = normalizedCells;
      activePiece.x += offsetX;
      updateActiveBlocks();
      return;
    }
  }
}

function stepDown() {
  if (!movePiece(0, 1)) {
    lockPiece();
  }
}

function hardDrop() {
  while (movePiece(0, 1)) {
    score += 2;
  }
  saveHighScore();
  lockPiece();
}

function lockPiece() {
  activePiece.cells.forEach(({ x, y }, index) => {
    const gridX = activePiece.x + x;
    const gridY = activePiece.y + y;
    const block = activePiece.blocks[index];
    block.x = gridToX(gridX);
    block.y = gridToY(gridY);
    settledGrid[gridY][gridX] = block;
  });

  clearFullRows();
  spawnPiece();
  lastFallTime = millis();
}

function clearFullRows() {
  const remainingRows = settledGrid.filter((row) => row.some((block) => block === null));
  const cleared = rows - remainingRows.length;
  if (cleared === 0) return;

  const emptyRows = Array.from({ length: cleared }, () => Array(columns).fill(null));
  settledGrid = [...emptyRows, ...remainingRows];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const block = settledGrid[y][x];
      if (block) block.y = gridToY(y);
    }
  }

  clearedLines += cleared;
  score += [0, 100, 300, 500, 800][min(cleared, 4)];
  saveHighScore();

  if (clearedLines >= linesToWin) {
    gameState = 'won';
  }
}

function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(highScoreKey, String(highScore));
  }
}

function drawBackground() {
  background('#100b20');

  noStroke();
  for (let i = 0; i < 36; i++) {
    const x = (i * 137 + 29) % width;
    const y = (i * 83 + 17) % height;
    fill(215, 184, 255, 40 + (i % 3) * 20);
    circle(x, y, i % 4 === 0 ? 3 : 2);
  }

  noStroke();
  fill('#1d1231');
  rect(boardX - 8, boardY - 8, boardWidth + 16, boardHeight + 16, 12);
  noFill();
  stroke('#bd7aff');
  strokeWeight(2);
  rect(boardX - 8, boardY - 8, boardWidth + 16, boardHeight + 16, 12);
}

function drawBoardGrid() {
  stroke('#33234a');
  strokeWeight(1);
  for (let x = 0; x <= columns; x++) {
    const px = boardX + x * tileSize;
    line(px, boardY, px, boardY + boardHeight);
  }
  for (let y = 0; y <= rows; y++) {
    const py = boardY + y * tileSize;
    line(boardX, py, boardX + boardWidth, py);
  }
}

function drawSidebar() {
  noStroke();
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(17);
  fill('#e0bdff');
  text('ENCHANTED HALL', 370, 70);

  textStyle(NORMAL);
  textSize(15);
  fill('#f5efff');
  text(`Score: ${score}`, 370, 110);
  text(`High score: ${highScore}`, 370, 139);
  text(`Lines: ${clearedLines} / ${linesToWin}`, 370, 168);

  textStyle(BOLD);
  fill('#e0bdff');
  text('NEXT RUNE', 370, 225);
  drawNextRune();

  textStyle(NORMAL);
  textSize(13);
  fill('#d3c5e6');
  text('← →  Move sideways', 370, 350);
  text('↓  Fall faster', 370, 378);
  text('L  Rotate', 370, 406);
  text('SPACE  Drop', 370, 434);
  text('R  Restart', 370, 462);
}

function drawNextRune() {
  const previewScale = tileSize * 0.72;
  const minX = min(...nextRune.cells.map(([x]) => x));
  const maxX = max(...nextRune.cells.map(([x]) => x));
  const minY = min(...nextRune.cells.map(([, y]) => y));
  const maxY = max(...nextRune.cells.map(([, y]) => y));
  const shapeWidth = (maxX - minX + 1) * previewScale;
  const shapeHeight = (maxY - minY + 1) * previewScale;
  const startX = 470 - shapeWidth / 2;
  const startY = 280 - shapeHeight / 2;

  noStroke();
  for (const [x, y] of nextRune.cells) {
    fill(nextRune.color);
    rect(
      startX + (x - minX) * previewScale,
      startY + (y - minY) * previewScale,
      previewScale - 2,
      previewScale - 2,
      4
    );
  }
}

function drawEndMessage() {
  noStroke();
  fill(13, 8, 27, 225);
  rect(boardX + 15, boardY + 230, boardWidth - 30, 120, 12);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(24);
  fill(gameState === 'won' ? '#a7ffc5' : '#ff9ebd');
  text(gameState === 'won' ? 'HALL CLEARED!' : 'THE MAGIC FADES', canvasWidth / 2, boardY + 268);
  textStyle(NORMAL);
  textSize(14);
  fill('#f5efff');
  text(gameState === 'won' ? 'You cleared 10 lines!' : 'The runes reached the top.', canvasWidth / 2, boardY + 300);
  text('Press R to play again', canvasWidth / 2, boardY + 326);
}

function gridToX(gridX) {
  return boardX + gridX * tileSize + tileSize / 2;
}

function gridToY(gridY) {
  return boardY + gridY * tileSize + tileSize / 2;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    resetGame();
    return false;
  }
  if (gameState !== 'playing') return false;

  if (keyCode === LEFT_ARROW) {
    movePiece(-1, 0);
  } else if (keyCode === RIGHT_ARROW) {
    movePiece(1, 0);
  } else if (keyCode === DOWN_ARROW) {
    if (movePiece(0, 1)) {
      score += 1;
      saveHighScore();
      lastFallTime = millis();
    } else {
      stepDown();
    }
  } else if (key === 'l' || key === 'L') {
    rotatePiece();
  } else if (key === ' ') {
    hardDrop();
    return false;
  }

  return false;
}
