const arenaWidth = 900;
const arenaHeight = 540;
const ringLeft = 120;
const ringRight = 780;
const ringFloor = 430;
const fighterSpeed = 4;
const playerMaxHealth = 100;
const opponentMaxHealth = 100;

let player;
let opponent;
let gameState = 'title';
let playerHealth = playerMaxHealth;
let opponentHealth = opponentMaxHealth;
let playerAttackCooldown = 0;
let opponentAttackCooldown = 0;
let playerStun = 0;
let opponentStun = 0;
let playerAttackFlash = 0;
let opponentAttackFlash = 0;
let roundTime = 0;
let playerJumpRequested = false;

function setup() {
  createCanvas(arenaWidth, arenaHeight);
  world.gravity.y = 0;

  player = makeFighter(330, '#24d6c5', '#ffcf85');
  opponent = makeFighter(570, '#ff4d70', '#d99468');
}

function makeFighter(x, costumeColor, skinColor) {
  const fighter = new Sprite(x, ringFloor - 48, 42, 78, 'none');
  fighter.visible = false;
  fighter.color = costumeColor;
  fighter.stroke = '#ffffff';
  fighter.friction = 0;
  fighter.rotationLock = true;
  fighter.costumeColor = costumeColor;
  fighter.skinColor = skinColor;
  fighter.facing = x < arenaWidth / 2 ? 1 : -1;
  fighter.attackPose = 0;
  fighter.blocking = false;
  return fighter;
}

function draw() {
  drawArena();

  if (gameState === 'playing') {
    updateBout();
  }

  drawFighterDetails(player);
  drawFighterDetails(opponent);
  drawHud();

  if (gameState === 'title') {
    drawOverlay('RING RUMBLE', 'Press ENTER or click to start', 'A / D move   W jump   S block   J punch   K kick   L grapple');
  } else if (gameState === 'won') {
    drawOverlay('CHAMPION!', 'You won the bout!', 'Press R or click to fight again');
  } else if (gameState === 'lost') {
    drawOverlay('KNOCKED OUT!', 'Your opponent won the bout.', 'Press R or click to try again');
  }
}

function drawArena() {
  background('#101526');

  noStroke();
  for (let y = 0; y < height; y += 5) {
    fill(lerpColor(color('#171c32'), color('#392347'), y / height));
    rect(0, y, width, 5);
  }

  drawCrowd();

  noStroke();
  fill('#171b28');
  rect(0, ringFloor + 32, width, height - ringFloor - 32);
  fill('#b53d63');
  quad(82, 334, 818, 334, 858, 492, 42, 492);
  fill('#f3f0e9');
  quad(110, 350, 790, 350, 820, 468, 80, 468);
  fill('#de456d');
  quad(118, 360, 782, 360, 805, 456, 95, 456);

  stroke('#f6ecf4');
  strokeWeight(5);
  line(112, 355, 788, 355);
  line(100, 399, 800, 399);
  line(88, 445, 812, 445);
  noStroke();

  drawCornerPost(104, 354);
  drawCornerPost(796, 354);
  drawCornerPost(88, 445);
  drawCornerPost(812, 445);
  drawSpotlights();
}

function drawCrowd() {
  noStroke();
  for (let row = 0; row < 3; row++) {
    for (let x = 20 + (row % 2) * 14; x < width; x += 42) {
      const y = 178 + row * 42;
      fill((x + row * 19) % 3 === 0 ? '#ed638d' : '#6473a6');
      ellipse(x, y, 18, 16);
      fill('#f1bf9e');
      ellipse(x, y - 10, 12, 12);
    }
  }
}

function drawCornerPost(x, y) {
  noStroke();
  fill('#f4c95d');
  rect(x - 8, y - 5, 16, 105, 5);
  fill('#ff8fae');
  rect(x - 12, y + 4, 24, 14, 5);
  rect(x - 12, y + 48, 24, 14, 5);
}

function drawSpotlights() {
  noStroke();
  fill(132, 222, 255, 35);
  triangle(150, 0, 270, 0, 390, 335);
  fill(255, 207, 133, 30);
  triangle(650, 0, 770, 0, 510, 335);
  fill('#ffdd87');
  ellipse(210, 18, 44, 16);
  ellipse(690, 18, 44, 16);
}

function updateBout() {
  roundTime += deltaTime;
  playerAttackCooldown = max(0, playerAttackCooldown - deltaTime);
  opponentAttackCooldown = max(0, opponentAttackCooldown - deltaTime);
  playerStun = max(0, playerStun - deltaTime);
  opponentStun = max(0, opponentStun - deltaTime);
  playerAttackFlash = max(0, playerAttackFlash - deltaTime);
  opponentAttackFlash = max(0, opponentAttackFlash - deltaTime);

  updatePlayer();
  updateOpponent();
  updateFacing();
  keepInRing(player);
  keepInRing(opponent);

  if (playerHealth <= 0) {
    gameState = 'lost';
  } else if (opponentHealth <= 0) {
    gameState = 'won';
  }
}

function updatePlayer() {
  player.blocking = keyIsDown(83) && playerStun === 0;
  player.attackPose = playerAttackFlash > 0 ? player.attackPose : 0;

  if (playerStun > 0) {
    player.vel.x = 0;
    return;
  }

  if (player.blocking) {
    player.vel.x = 0;
  } else {
    const movingLeft = keyIsDown(65);
    const movingRight = keyIsDown(68);
    player.vel.x = (movingRight ? fighterSpeed : 0) - (movingLeft ? fighterSpeed : 0);
  }
  player.x += player.vel.x;

  if (playerJumpRequested && player.y >= ringFloor - 49) {
    player.vel.y = -11;
  }
  playerJumpRequested = false;

  player.vel.y = min(8, player.vel.y + 0.55);
  player.y += player.vel.y;
  if (player.y > ringFloor - 48) {
    player.y = ringFloor - 48;
    player.vel.y = 0;
  }
}

function updateOpponent() {
  opponent.blocking = false;
  opponent.attackPose = opponentAttackFlash > 0 ? opponent.attackPose : 0;

  if (opponentStun > 0) {
    opponent.vel.x = 0;
    return;
  }

  const distance = abs(player.x - opponent.x);
  const direction = player.x < opponent.x ? -1 : 1;

  if (distance > 88) {
    opponent.vel.x = direction * 2.1;
  } else {
    opponent.vel.x = 0;
    if (opponentAttackCooldown === 0 && random() < 0.035) {
      opponentAttack('kick');
    }
    if (random() < 0.008) {
      opponent.blocking = true;
    }
  }
  opponent.x += opponent.vel.x;
}

function updateFacing() {
  player.facing = player.x < opponent.x ? 1 : -1;
  opponent.facing = -player.facing;
}

function keepInRing(fighter) {
  fighter.x = constrain(fighter.x, ringLeft + 28, ringRight - 28);
  fighter.y = constrain(fighter.y, ringFloor - 125, ringFloor - 48);
}

function attack(kind) {
  if (gameState !== 'playing' || playerAttackCooldown > 0 || playerStun > 0 || player.blocking) return;

  const attacks = {
    punch: { damage: 9, range: 86, cooldown: 380, stun: 270 },
    kick: { damage: 16, range: 100, cooldown: 720, stun: 430 },
    grapple: { damage: 24, range: 76, cooldown: 1050, stun: 620 }
  };
  const move = attacks[kind];

  playerAttackCooldown = move.cooldown;
  player.attackPose = kind === 'kick' ? 2 : kind === 'grapple' ? 3 : 1;
  playerAttackFlash = 180;
  resolveHit(player, opponent, move);
}

function opponentAttack(kind) {
  const move = kind === 'kick'
    ? { damage: 11, range: 94, cooldown: 980, stun: 370 }
    : { damage: 8, range: 80, cooldown: 720, stun: 260 };

  opponentAttackCooldown = move.cooldown;
  opponent.attackPose = kind === 'kick' ? 2 : 1;
  opponentAttackFlash = 180;
  resolveHit(opponent, player, move);
}

function resolveHit(attacker, target, move) {
  const distance = abs(attacker.x - target.x);
  const facingTarget = (target.x - attacker.x) * attacker.facing > 0;
  if (distance > move.range || !facingTarget || abs(attacker.y - target.y) > 60) return;

  const damage = target.blocking ? max(2, floor(move.damage * 0.25)) : move.damage;
  if (target === player) {
    playerHealth = max(0, playerHealth - damage);
    playerStun = target.blocking ? 90 : move.stun;
  } else {
    opponentHealth = max(0, opponentHealth - damage);
    opponentStun = move.stun;
  }
  target.x += attacker.facing * (target.blocking ? 4 : 12);
}

function drawFighterDetails(fighter) {
  const x = fighter.x;
  const y = fighter.y;
  const facing = fighter.facing;
  const armReach = fighter.attackPose === 1 ? 30 : 16;
  const legReach = fighter.attackPose === 2 ? 36 : 13;

  push();
  translate(x, y);
  noStroke();

  fill('#211b2a');
  ellipse(0, 42, 52, 13);

  fill(fighter.costumeColor);
  rect(-17, 1, 13, 32, 5);
  rect(4, 1, 13, 32, 5);
  fill(fighter.skinColor);
  rect(-18, 24, 14, 8, 3);
  rect(4, 24, 14, 8, 3);

  fill(fighter.costumeColor);
  rect(-19, -37, 38, 39, 12);
  fill(fighter.skinColor);
  ellipse(0, -51, 29, 30);
  fill('#27202d');
  arc(0, -58, 31, 20, PI, TWO_PI);

  if (fighter.blocking) {
    stroke(fighter.skinColor);
    strokeWeight(9);
    line(-15, -26, facing * -8, -47);
    line(15, -26, facing * 8, -47);
    noStroke();
  } else {
    stroke(fighter.skinColor);
    strokeWeight(10);
    line(-15, -27, -facing * 24, -16);
    line(15, -27, facing * (fighter.attackPose === 1 ? armReach : 22), -23);
    noStroke();
    fill('#fff1c8');
    ellipse(facing * (fighter.attackPose === 1 ? armReach : 22), -23, 13, 13);
  }

  if (fighter.attackPose === 2) {
    stroke(fighter.skinColor);
    strokeWeight(12);
    line(facing * 10, -2, facing * legReach, 5);
    noStroke();
  } else if (fighter.attackPose === 3) {
    fill('#ffe07a');
    textAlign(CENTER, CENTER);
    textSize(15);
    text('!', facing * 33, -59);
  }

  fill('#ffffff');
  ellipse(facing * 5, -52, 4, 4);
  pop();
}

function drawHud() {
  noStroke();
  fill(8, 12, 26, 220);
  rect(0, 0, width, 92);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(17);
  fill('#7df5e5');
  text('THE FLYING KIWI', 28, 21);
  fill('#ff8aa5');
  text('IRON JACK', width - 160, 21);
  drawHealthBar(28, 38, 350, playerHealth, playerMaxHealth, '#32e0c5');
  drawHealthBar(width - 378, 38, 350, opponentHealth, opponentMaxHealth, '#ff4d70');

  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(13);
  fill('#fff0bd');
  text(`${floor(roundTime / 1000)}s`, width / 2, 55);
  fill('#f5eaff');
  text('A/D MOVE  •  W JUMP  •  S BLOCK  •  J PUNCH  •  K KICK  •  L GRAPPLE', width / 2, 515);
}

function drawHealthBar(x, y, w, health, maxHealth, barColor) {
  noStroke();
  fill('#343248');
  rect(x, y, w, 18, 9);
  fill(barColor);
  rect(x, y, w * (health / maxHealth), 18, 9);
  noFill();
  stroke('#ffffff');
  strokeWeight(2);
  rect(x, y, w, 18, 9);
  noStroke();
}

function drawOverlay(title, subtitle, controls) {
  noStroke();
  fill(6, 9, 21, 205);
  rect(120, 150, 660, 245, 20);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(38);
  fill('#fff0bd');
  text(title, width / 2, 205);
  textStyle(NORMAL);
  textSize(20);
  fill('#ffffff');
  text(subtitle, width / 2, 259);
  textSize(15);
  fill('#92f5e9');
  text(controls, width / 2, 318);
  textSize(13);
  fill('#d4d9eb');
  text('Reduce your rival’s health to zero to claim the championship.', width / 2, 354);
}

function startGame() {
  resetGame();
  gameState = 'playing';
}

function resetGame() {
  playerHealth = playerMaxHealth;
  opponentHealth = opponentMaxHealth;
  playerAttackCooldown = 0;
  opponentAttackCooldown = 0;
  playerStun = 0;
  opponentStun = 0;
  playerAttackFlash = 0;
  opponentAttackFlash = 0;
  roundTime = 0;
  playerJumpRequested = false;

  player.x = 330;
  player.y = ringFloor - 48;
  player.vel.x = 0;
  player.vel.y = 0;
  player.attackPose = 0;
  player.blocking = false;
  opponent.x = 570;
  opponent.y = ringFloor - 48;
  opponent.vel.x = 0;
  opponent.vel.y = 0;
  opponent.attackPose = 0;
  opponent.blocking = false;
}

function keyPressed() {
  if (gameState === 'title' && keyCode === ENTER) {
    startGame();
    return false;
  }
  if ((gameState === 'won' || gameState === 'lost') && (key === 'r' || key === 'R')) {
    startGame();
    return false;
  }

  if (key === 'j' || key === 'J') attack('punch');
  if (key === 'k' || key === 'K') attack('kick');
  if (key === 'l' || key === 'L') attack('grapple');
  if ((key === 'w' || key === 'W') && gameState === 'playing') {
    playerJumpRequested = true;
  }
  return false;
}

function mousePressed() {
  if (gameState !== 'playing') startGame();
}
