// --- REDIRECCIÓN INICIAL ---
const params = new URLSearchParams(window.location.search);
if (params.get('start') !== 'true') {
    window.location.href = 'pages/inicio.html';
}

const isMultiplayer = params.get('players') === '2';
const selectedShipColor = params.get('shipColor') || 'aqua';

const SHIP_TINTS = {
    aqua: '#3cf4ff',
    magenta: '#ff2df4',
    gold: '#f4d166'
};

const SHIP_COLOR_ORDER = ['aqua', 'magenta', 'gold'];

function normalizeShipColor(color) {
    return SHIP_TINTS[color] ? color : 'aqua';
}

function getShipTint(color) {
    return SHIP_TINTS[normalizeShipColor(color)];
}

function getAlternateShipColor(color) {
    const normalized = normalizeShipColor(color);
    const currentIndex = SHIP_COLOR_ORDER.indexOf(normalized);
    return SHIP_COLOR_ORDER[(currentIndex + 2) % SHIP_COLOR_ORDER.length];
}

// --- CONFIGURACIÓN (1000x750) ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const countdownEl = document.getElementById("countdown");
const enemy_2p_scale = 0.75;

canvas.width = 1000;
canvas.height = 750;

const CONFIG = {
    PLAYER_SPEED: 9,
    LASER_SPEED: 15,
    STEP_SIZE: 19,
    STEP_INTERVAL: 25,
    LASER_COOLDOWN: 15,
    SIZES: { PLAYER: 94, ENEMY: 82 },
    LEVELS: {
        1: { kirk: 17, trump: 5, epstein: 2, rows: 4, cols: 6, music: '7R5ncn93KT4' },
        2: { kirk: 5, trump: 14, epstein: 5, rows: 4, cols: 6, music: 'SQk6UTdbRO0' },
        3: { kirk: 7, trump: 7, epstein: 10, rows: 4, cols: 6, music: 'nFSs4Q7MyaY' }
    },
    ITEM_DROP_CHANCE: 0.15,
    ITEM_SPEED: 3
};

const state = {
    active: false,
    countingDown: false,
    score: 0,
    level: 1,
    lives: 3,
    keys: {},
    player: null,
    players: [],
    isMultiplayer,
    enemies: [],
    lasers: [],
    enemyLasers: [],
    activeItems: [],
    formationX: 60,
    formationDirection: 1,
    formationStepCounter: 0,
    rowsState: [],
    isMultiplayer: params.get('players') === '2',
    players: [], // Cambiado de player: null a arreglo
    ytPlayer: null
};

// --- CARGA DE ACTIVOS ---
const images = {
    player: new Image(), kirk: new Image(), trump: new Image(), epstein: new Image(), heart: new Image(),
    itemDouble: new Image(), itemShield: new Image(), itemRecovery: new Image()
};
images.player.src = "assets/images/1player.png";
images.kirk.src = "assets/images/charlieKirk1.png";
images.trump.src = "assets/images/trump2.png";
images.epstein.src = "assets/images/epstein3.png";
images.heart.src = "assets/images/recovery.png";
images.itemDouble.src = "assets/images/double_shot.png";
images.itemShield.src = "assets/images/shield.png";
images.itemRecovery.src = "assets/images/recovery.png";

// --- YOUTUBE API ---
function onYouTubeIframeAPIReady() {
    state.ytPlayer = new YT.Player('ytplayer', {
        height: '0', width: '0',
        videoId: CONFIG.LEVELS[1].music,
        playerVars: { 'autoplay': 1, 'loop': 1, 'playlist': CONFIG.LEVELS[1].music, 'controls': 0 },
        events: { 'onReady': (e) => { e.target.setVolume(30); e.target.playVideo(); } }
    });
}

// --- CLASES ---

function isControlPressed(control) {
    if (Array.isArray(control)) {
        return control.some(keyCode => state.keys[keyCode]);
    }
    return !!state.keys[control];
}

function getPlayerStartPosition(index, totalPlayers) {
    if (totalPlayers <= 1) {
        return canvas.width / 2 - CONFIG.SIZES.PLAYER / 2;
    }

    const positions = [
        canvas.width / 2 - CONFIG.SIZES.PLAYER - 28,
        canvas.width / 2 + 28
    ];

    return positions[index] ?? (canvas.width / 2 - CONFIG.SIZES.PLAYER / 2);
}

class Player {
    constructor(id, controls, xPos, shipColor) {
        this.id = id;
        this.controls = controls;
        this.width = CONFIG.SIZES.PLAYER;
        this.height = CONFIG.SIZES.PLAYER;
        this.x = xPos;
        this.y = canvas.height - this.height - 30;
        this.cooldown = 0;
        this.color = getShipTint(shipColor);
        this.lives = 3;
        this.maxLives = 5;
        this.alive = true;
        this.hasDoubleShot = false;
        this.hasShield = false;
    }

    update() {
        if (!this.alive) return;

        if (isControlPressed(this.controls.left)) this.x -= CONFIG.PLAYER_SPEED;
        if (isControlPressed(this.controls.right)) this.x += CONFIG.PLAYER_SPEED;
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        if (this.cooldown > 0) this.cooldown--;

        if (isControlPressed(this.controls.shoot) && this.cooldown === 0) {
            this.shoot();
            this.cooldown = CONFIG.LASER_COOLDOWN;
        }
    }

    shoot() {
        const laserColor = this.color;
        if (this.hasDoubleShot) {
            state.lasers.push(new Laser(this.x + 20, this.y, -CONFIG.LASER_SPEED, laserColor));
            state.lasers.push(new Laser(this.x + this.width - 20, this.y, -CONFIG.LASER_SPEED, laserColor));
        } else {
            state.lasers.push(new Laser(this.x + this.width / 2 - 2, this.y, -CONFIG.LASER_SPEED, laserColor));
        }
    }
    draw() {
        if (!this.alive) return;

        if (this.hasShield) {
            ctx.strokeStyle = "#00d2ff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 65, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.drawImage(images.player, this.x, this.y, this.width, this.height);
        
        // Aplicamos el tinte de color seleccionado
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.restore();
    }
}

class Enemy {
    constructor(type, gridX, gridY) {
        this.type = type;
        this.width = CONFIG.SIZES.ENEMY;
        this.height = CONFIG.SIZES.ENEMY;
        this.gridX = gridX; this.gridY = gridY;
        this.x = -200; this.y = -200;
        this.hp = (type === 'kirk' ? 1 : 2);
        this.img = (type === 'kirk' ? images.kirk : (type === 'trump' ? images.trump : images.epstein));
        this.shootTimer = 100 + Math.random() * 200;
    }
    update(rowX, rowY) {
        this.x = rowX + this.gridX * (this.width + 20);
        this.y = rowY;
        if (this.type === 'epstein' && state.active) {
            this.shootTimer--;
            if (this.shootTimer <= 0) {
                state.enemyLasers.push(new Laser(this.x + this.width / 2, this.y + this.height, 6, '#ff2d55'));
                this.shootTimer = 150 + Math.random() * 200;
            }
        }
    }
    draw() {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
}

class Laser {
    constructor(x, y, dy, color) { this.x = x; this.y = y; this.dy = dy; this.width = 5; this.height = 25; this.color = color; }
    update() { this.y += this.dy; }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// --- ITEM LOGIC (OPTIMIZED) ---
function dropItem(x, y) {
    if (Math.random() <= CONFIG.ITEM_DROP_CHANCE) {
        const types = ['DOUBLE_SHOT', 'SHIELD', 'RECOVERY'];
        const type = types[Math.floor(Math.random() * types.length)];
        state.activeItems.push({ x: x, y: y, type: type, width: 45, height: 45 });
    }
}

function updateItems() {
    for (let i = state.activeItems.length - 1; i >= 0; i--) {
        const item = state.activeItems[i];
        item.y += CONFIG.ITEM_SPEED;

        const playerHit = state.players.find(player => player.alive && checkCollision(item, player));
        if (playerHit) {
            applyPowerUp(item.type, playerHit);
            state.activeItems.splice(i, 1);
            continue;
        }
        if (item.y > canvas.height + 50) state.activeItems.splice(i, 1);
    }
}

function applyPowerUp(type, player) {
    if (type === 'DOUBLE_SHOT') {
        player.hasDoubleShot = true;
        setTimeout(() => { player.hasDoubleShot = false; }, 10000);
    } else if (type === 'SHIELD') {
        player.hasShield = true;
    } else if (type === 'RECOVERY') {
        player.lives = Math.min(player.lives + 1, player.maxLives);
    }
}

function drawItems() {
    state.activeItems.forEach(item => {
        let img = images.itemDouble;
        if (item.type === 'SHIELD') img = images.itemShield;
        if (item.type === 'RECOVERY') img = images.itemRecovery;

        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, item.x, item.y, item.width, item.height);
        } else {
            ctx.save();
            ctx.fillStyle = (item.type === 'SHIELD') ? "#00FFFF" :
                            (item.type === 'RECOVERY') ? "#00FF00" : "#FF00FF";
            ctx.beginPath();
            ctx.arc(item.x + item.width / 2, item.y + item.height / 2, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });
}

function drawHeart(x, y, size) {
    ctx.fillStyle = "#ff2d55";
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.25, y - size * 0.25, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.1);
    ctx.lineTo(x + size * 0.4, y - size * 0.1);
    ctx.lineTo(x, y + size * 0.4);
    ctx.fill();
}

// --- CORE GAME LOGIC (OPTIMIZED) ---
function spawnWave() {
    const config = CONFIG.LEVELS[state.level];
    state.enemies = []; state.rowsState = [];
    state.formationX = 60; state.formationDirection = 1; state.formationStepCounter = 0;
    state.enemies = [];
    state.rowsState = [];
    
    // Ajuste de dificultad por multijugador
    const enemyScale = state.isMultiplayer ? enemy_2p_scale : 1;
    const extraRows = state.isMultiplayer ? 2 : 0;
    const extraCols = state.isMultiplayer ? 2 : 0;

    let enemyPool = [];
    // Aumentamos la cantidad de enemigos proporcionalmente
    const totalEnemiesMult = state.isMultiplayer ? 1.5 : 1;
    for (let i = 0; i < config.kirk * totalEnemiesMult; i++) enemyPool.push('kirk');
    for (let i = 0; i < config.trump * totalEnemiesMult; i++) enemyPool.push('trump');
    for (let i = 0; i < config.epstein * totalEnemiesMult; i++) enemyPool.push('epstein');
    enemyPool.sort(() => Math.random() - 0.5);

    const rows = config.rows + extraRows;
    const cols = config.cols + extraCols;
    const enemySize = CONFIG.SIZES.ENEMY * enemyScale;

    for (let row = 0; row < rows; row++) {
        state.rowsState.push({
            y: -150 - (row * 100), 
            targetY: 100 + (row * (enemySize + 15)),
            isEntering: true
        });
        for (let col = 0; col < cols; col++) {
            const type = enemyPool.pop() || 'kirk';
            const enemy = new Enemy(type, col, row);
            enemy.width = enemySize;  // Aplicamos el nuevo tamaño
            enemy.height = enemySize;
            state.enemies.push(enemy);
        }
    }
}

function getClosestAlivePlayer(enemy) {
    const alivePlayers = state.players.filter(player => player.alive);
    if (alivePlayers.length === 0) return null;

    const enemyCenterX = enemy.x + enemy.width / 2;
    return alivePlayers.reduce((closest, player) => {
        const playerCenterX = player.x + player.width / 2;
        const closestDistance = Math.abs((closest.x + closest.width / 2) - enemyCenterX);
        const playerDistance = Math.abs(playerCenterX - enemyCenterX);
        return playerDistance < closestDistance ? player : closest;
    });
}

function updateRows() {
    if (state.enemies.length === 0) {
        if (state.level < 3) { state.level++; spawnWave(); }
        else { handleGameOver(true); }
        return;
    }
    const allEntered = state.rowsState.every(row => !row.isEntering);
    state.rowsState.forEach(row => { if (row.isEntering) { if (row.y < row.targetY) row.y += 4; else row.isEntering = false; } });
    if (allEntered) {
        state.formationStepCounter++;
        if (state.formationStepCounter >= CONFIG.STEP_INTERVAL) {
            state.formationStepCounter = 0;
            let minX = Math.min(...state.enemies.map(e => e.x));
            let maxX = Math.max(...state.enemies.map(e => e.x + e.width));
            if ((state.formationDirection === 1 && maxX + CONFIG.STEP_SIZE > canvas.width - 20) || (state.formationDirection === -1 && minX - CONFIG.STEP_SIZE < 20)) {
                state.rowsState.forEach(row => row.y += 35); state.formationDirection *= -1;
            } else { state.formationX += CONFIG.STEP_SIZE * state.formationDirection; }
        }
    }
    state.enemies.forEach(enemy => {
        const row = state.rowsState[enemy.gridY];
        enemy.update(state.formationX, row.y);
        state.players.forEach(p => {
            if (checkCollision(enemy, p)) handlePlayerHit();
        });
        if (enemy.y + enemy.height > canvas.height) { handlePlayerHit(); spawnWave(); }
    });
}

// --- LÓGICA GENERAL ---

function initGame() {
    state.score = 0; state.level = 1; state.lives = 5; // Más vidas para coop
    state.lasers = []; state.enemyLasers = []; state.enemies = [];
    
    // Definir controles
    const p1Controls = { left: 'ArrowLeft', right: 'ArrowRight', shoot: 'ArrowUp' };
    const p2Controls = { left: 'KeyA', right: 'KeyD', shoot: 'KeyW' };

    state.players = [new Player(1, p1Controls, canvas.width / 2 + 50)];
    
    if (state.isMultiplayer) {
        state.players[0].x = canvas.width / 2 + 100; // Mover P1 a la derecha
        state.players.push(new Player(2, p2Controls, canvas.width / 2 - 200)); // Añadir P2
    }
    startCountdown();
}

function update() {
    if (!state.active) return;
    
    state.players.forEach(p => p.update());
    updateRows();

    state.lasers.forEach((laser, lIdx) => {
        laser.update();
        if (laser.y < -30) state.lasers.splice(lIdx, 1);
        
        state.enemies.forEach((enemy, eIdx) => {
            if (checkCollision(laser, enemy)) {
                state.lasers.splice(lIdx, 1);
                enemy.hp--;
                if (enemy.hp <= 0) {
                    state.enemies.splice(eIdx, 1);
                    state.score += (enemy.type === 'kirk' ? 10 : 20);
                }
            }
        });
    });

    state.enemyLasers.forEach((laser, index) => {
        laser.update();
        state.players.forEach(player => {
            if (checkCollision(laser, player)) {
                state.enemyLasers.splice(index, 1);
                handlePlayerHit();
            }
        }); 
    }); 
}

function checkCollision(a, b) {
    if (!a || !b) return false;
    const p = 5; const aW = a.width || 5; const aH = a.height || 25;
    return a.x + p < b.x + b.width - p && a.x + aW - p > b.x + p && a.y + p < b.y + b.height - p && a.y + aH - p > b.y + p;
}

function handlePlayerHit(player) {
    if (!player || !player.alive) return;

    if (player.hasShield) {
        player.hasShield = false;
        return;
    }

    player.lives--;
    if (player.lives <= 0) {
        player.lives = 0;
        player.alive = false;
    }

    if (state.players.every(entry => !entry.alive)) {
        handleGameOver(false);
    }
}

function handleGameOver(won) { state.active = false; localStorage.setItem('finalScore', state.score); localStorage.setItem('gameResult', won ? 'WIN' : 'LOSS'); window.location.href = 'pages/final.html'; }

function drawPlayerLives(player, x, align = 'left') {
    const liveCount = Math.max(0, player.lives);
    for (let i = 0; i < liveCount; i++) {
        const offset = align === 'right' ? -(i * 50) : (i * 50);
        drawHeart(x + offset, 90, 18);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // CORRECCIÓN: Dibujar a todos los jugadores del arreglo
    state.players.forEach(p => p.draw());
    
    if (state.active || state.countingDown) {
        state.enemies.forEach(e => e.draw());
    }
    
    state.lasers.forEach(l => l.draw());
    state.enemyLasers.forEach(el => el.draw());
    drawItems();
    ctx.fillStyle = "#f4d166"; ctx.font = "20px 'Press Start 2P'"; ctx.textAlign = "left";
    ctx.fillText(`LEVEL: ${state.level}`, 40, 55);
    ctx.textAlign = "right"; ctx.fillText(`SCORE: ${state.score}`, canvas.width - 40, 55);

    if (state.players.length === 1) {
        drawPlayerLives(state.players[0], 65, 'left');
    } else if (state.players.length > 1) {
        drawPlayerLives(state.players[0], 65, 'left');
        drawPlayerLives(state.players[1], canvas.width - 65, 'right');
    }
}
function startCountdown() {
    state.countingDown = true; countdownEl.classList.remove('hidden');
    let count = 3;
    const timer = setInterval(() => {
        if (count > 0) countdownEl.textContent = count;
        else if (count === 0) countdownEl.textContent = "GO!";
        else { clearInterval(timer); countdownEl.classList.add('hidden'); state.countingDown = false; state.active = true; spawnWave(); gameLoop(); return; }
        count--;
    }, 1000);
}

function gameLoop() { if (state.active) { update(); draw(); requestAnimationFrame(gameLoop); } }
window.addEventListener('keydown', e => state.keys[e.code] = true);
window.addEventListener('keyup', e => state.keys[e.code] = false);

window.onload = () => {
    if (typeof initGame === 'function') {
        initGame();
    } else {
        console.error("initGame function is missing!");
    }
};

function initGame() {
    state.score = 0;
    state.level = 1;
    state.lives = 3;
    state.active = false;
    state.countingDown = false;
    state.activeItems = [];
    state.lasers = [];
    state.enemyLasers = [];
    state.enemies = [];
    state.rowsState = [];

    const primaryControls = { left: 'ArrowLeft', right: 'ArrowRight', shoot: ['ArrowUp', 'Space'] };
    const secondaryControls = { left: 'KeyA', right: 'KeyD', shoot: 'KeyW' };
    const primaryColor = normalizeShipColor(selectedShipColor);
    const secondaryColor = getAlternateShipColor(primaryColor);

    state.players = [
        new Player(1, primaryControls, getPlayerStartPosition(0, 1), primaryColor)
    ];

    if (state.isMultiplayer) {
        state.players[0].x = getPlayerStartPosition(0, 2);
        state.players.push(new Player(2, secondaryControls, getPlayerStartPosition(1, 2), secondaryColor));
    }

    state.player = state.players[0];

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('start') === 'true') {
        startCountdown();
    }
}
