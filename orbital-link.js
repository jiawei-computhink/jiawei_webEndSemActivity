const canvasWidth = 800;
const canvasHeight = 640;
const gridSize = 5;
const cellSize = 82;
const boardX = (canvasWidth - gridSize * cellSize) / 2;
const boardY = 112;
const moveLimit = 18;

const directions = ['N', 'E', 'S', 'W'];
const pathLayout = [
  { col: 1, row: 2, shape: 'elbow', solution: 2, start: 1 },
  { col: 1, row: 3, shape: 'straight', solution: 0, start: 1 },
  { col: 1, row: 4, shape: 'elbow', solution: 0, start: 2 },
  { col: 2, row: 4, shape: 'straight', solution: 1, start: 0 },
  { col: 3, row: 4, shape: 'elbow', solution: 3, start: 1 },
  { col: 3, row: 3, shape: 'straight', solution: 0, start: 3 },
  { col: 3, row: 2, shape: 'elbow', solution: 1, start: 0 }
];

let boardCells;
let conduits;
let selectedConduit;
let moveCount;
let gameState;

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  world.gravity.y = 0;
  createBoard();
  resetGame();
}

function createBoard() {
  boardCells = new Group();
  boardCells.collider = 'none';
  conduits = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cell = new boardCells.Sprite(cellCenterX(col), cellCenterY(row), cellSize - 5, cellSize - 5);
      cell.color = '#122842';
      cell.stroke = '#294b69';
      cell.strokeWeight = 1;
      cell.rotationLock = true;
    }
  }

  for (const data of pathLayout) {
    const conduit = boardCells.find((cell) => cell.x === cellCenterX(data.col) && cell.y === cellCenterY(data.row));
    conduit.shape = data.shape;
    conduit.col = data.col;
    conduit.row = data.row;
    conduit.solution = data.solution;
    conduit.orientation = data.start;
    conduit.color = '#193a50';
    conduit.stroke = '#4fdcf1';
    conduits.push(conduit);
  }
}

function resetGame() {
  for (const conduit of conduits) {
    conduit.orientation = pathLayout.find((tile) => tile.col === conduit.col && tile.row === conduit.row).start;
  }
  selectedConduit = conduits[0];
  moveCount = 0;
  gameState = 'title';
}

function draw() {
  drawBackground();
  drawSprites();
  drawBoardDetails();
  drawHud();

  if (gameState === 'title') {
    drawOverlay('ORBITAL LINK', 'Route reactor power through every conduit to the escape pod.', 'Press ENTER to begin');
  } else if (gameState === 'won') {
    drawOverlay('POWER RESTORED!', 'The escape pod is online. The crew is safe!', 'Press R to play again');
  } else if (gameState === 'lost') {
    drawOverlay('POWER DEPLETED', 'The reactor ran out of reserve energy.', 'Press R to try again');
  }
}

function drawBackground() {
  background('#071426');
  noStroke();

  for (let i = 0; i < 55; i++) {
    const x = (i * 149 + 31) % canvasWidth;
    const y = (i * 83 + 19) % canvasHeight;
    fill(185, 225, 255, 55 + (i % 3) * 35);
    circle(x, y, i % 5 === 0 ? 3 : 2);
  }

  fill('#0b1e34');
  rect(boardX - 18, boardY - 18, gridSize * cellSize + 36, gridSize * cellSize + 36, 18);
}

function drawBoardDetails() {
  drawEndpoint(0, 2, 'REACTOR', '#ffbd62', 'E');
  drawEndpoint(4, 2, 'POD', '#91ffce', 'W');

  for (const conduit of conduits) {
    const x = conduit.x;
    const y = conduit.y;
    const connectors = getConnectors(conduit);
    const isSelected = conduit === selectedConduit && gameState === 'playing';

    noStroke();
    fill(isSelected ? '#2b6074' : '#193a50');
    circle(x, y, 23);

    stroke('#72eaff');
    strokeWeight(10);
    strokeCap(ROUND);
    for (const direction of connectors) {
      const [dx, dy] = directionVector(direction);
      line(x, y, x + dx * 24, y + dy * 24);
    }
    noStroke();
    fill('#e6fbff');
    circle(x, y, 10);

    if (isSelected) {
      noFill();
      stroke('#fff2a6');
      strokeWeight(2);
      circle(x, y, 54);
    }
  }
}

function drawEndpoint(col, row, label, colorValue, direction) {
  const x = cellCenterX(col);
  const y = cellCenterY(row);
  const [dx, dy] = directionVector(direction);

  noStroke();
  fill(colorValue);
  circle(x, y, 30);
  stroke(colorValue);
  strokeWeight(9);
  strokeCap(ROUND);
  line(x, y, x + dx * 27, y + dy * 27);
  noStroke();
  fill('#eafaff');
  textAlign(CENTER, CENTER);
  textSize(11);
  textStyle(BOLD);
  text(label, x, y + 35);
  textStyle(NORMAL);
}

function drawHud() {
  noStroke();
  fill('#eafaff');
  textAlign(LEFT, CENTER);
  textSize(18);
  text('REACTOR RESERVE', 92, 54);
  fill('#193a50');
  rect(92, 76, 616, 12, 6);
  fill(moveCount < moveLimit - 4 ? '#61e7c3' : '#ffbd62');
  const remainingWidth = 616 * (1 - moveCount / moveLimit);
  rect(92, 76, remainingWidth, 12, 6);

  textAlign(CENTER, CENTER);
  textSize(14);
  fill('#c6d9e9');
  text(`MOVES ${moveCount} / ${moveLimit}`, canvasWidth / 2, 555);
  text('Connect every conduit on the route. Each rotation uses one reserve unit.', canvasWidth / 2, 584);
}

function drawOverlay(title, message, instruction) {
  noStroke();
  fill(4, 12, 25, 205);
  rect(0, 0, canvasWidth, canvasHeight);

  textAlign(CENTER, CENTER);
  fill('#f3fbff');
  textSize(34);
  textStyle(BOLD);
  text(title, canvasWidth / 2, 264);
  textStyle(NORMAL);
  fill('#c6d9e9');
  textSize(17);
  text(message, canvasWidth / 2, 311);
  fill('#91ffce');
  textSize(15);
  text(instruction, canvasWidth / 2, 356);
}

function getConnectors(conduit) {
  const baseConnectors = conduit.shape === 'straight' ? ['N', 'S'] : ['N', 'E'];
  return baseConnectors.map((direction) => {
    const directionIndex = directions.indexOf(direction);
    return directions[(directionIndex + conduit.orientation) % directions.length];
  });
}

function directionVector(direction) {
  if (direction === 'N') return [0, -1];
  if (direction === 'E') return [1, 0];
  if (direction === 'S') return [0, 1];
  return [-1, 0];
}

function cellCenterX(col) {
  return boardX + col * cellSize + cellSize / 2;
}

function cellCenterY(row) {
  return boardY + row * cellSize + cellSize / 2;
}

function mousePressed() {
  if (gameState !== 'playing') return;

  for (const conduit of conduits) {
    if (dist(mouseX, mouseY, conduit.x, conduit.y) <= cellSize / 2) {
      selectedConduit = conduit;
      rotateSelectedConduit();
      return false;
    }
  }
}

function keyPressed() {
  if (gameState === 'title' && (keyCode === ENTER || key === ' ')) {
    gameState = 'playing';
    return false;
  }

  if (key === 'r' || key === 'R') {
    resetGame();
    return false;
  }

  if (gameState !== 'playing') return;

  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    selectAdjacentConduit(keyCode);
    return false;
  }

  if (key === ' ' || keyCode === ENTER) {
    rotateSelectedConduit();
    return false;
  }
}

function selectAdjacentConduit(keyCodeValue) {
  const [dx, dy] = keyCodeValue === LEFT_ARROW ? [-1, 0]
    : keyCodeValue === RIGHT_ARROW ? [1, 0]
      : keyCodeValue === UP_ARROW ? [0, -1] : [0, 1];

  const candidates = conduits.filter((conduit) => (
    conduit.col === selectedConduit.col + dx && conduit.row === selectedConduit.row + dy
  ));

  if (candidates.length > 0) {
    selectedConduit = candidates[0];
  }
}

function rotateSelectedConduit() {
  if (!selectedConduit || gameState !== 'playing') return;

  selectedConduit.orientation = (selectedConduit.orientation + 1) % 4;
  moveCount++;

  if (hasPowerRoute()) {
    gameState = 'won';
  } else if (moveCount >= moveLimit) {
    gameState = 'lost';
  }
}

function hasPowerRoute() {
  const route = [
    { col: 1, row: 2 },
    { col: 1, row: 3 },
    { col: 1, row: 4 },
    { col: 2, row: 4 },
    { col: 3, row: 4 },
    { col: 3, row: 3 },
    { col: 3, row: 2 }
  ];
  let incoming = 'W';

  for (const position of route) {
    const conduit = conduits.find((tile) => tile.col === position.col && tile.row === position.row);
    if (!conduit) return false;

    const connectors = getConnectors(conduit);
    if (!connectors.includes(incoming)) return false;

    const nextDirection = connectors.find((direction) => direction !== incoming);
    if (!nextDirection) return false;
    incoming = oppositeDirection(nextDirection);
  }

  return incoming === 'W';
}

function oppositeDirection(direction) {
  return directions[(directions.indexOf(direction) + 2) % directions.length];
}
