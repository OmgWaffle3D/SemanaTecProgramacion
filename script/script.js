// --- REDIRECCIÓN INICIAL ---
const params = new URLSearchParams(window.location.search);
if (params.get('start') !== 'true') {
    window.location.href = 'pages/inicio.html';
}

// --- CONFIGURACIÓN (1000x750) ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const countdownEl = document.getElementById("countdown");

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
    enemies: [],
    lasers: [],
    enemyLasers: [],
    activeItems: [], 
    hasDoubleShot: false, 
    hasShield: false,    
    formationX: 60,
    formationDirection: 1,
    formationStepCounter: 0,
    rowsState: [],
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

class Player {
    constructor() {
        this.width = CONFIG.SIZES.PLAYER;
        this.height = CONFIG.SIZES.PLAYER;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 30;
        this.cooldown = 0;
    }
    update() {
        if (state.keys['ArrowLeft'] || state.keys['KeyA']) this.x -= CONFIG.PLAYER_SPEED;
        if (state.keys['ArrowRight'] || state.keys['KeyD']) this.x += CONFIG.PLAYER_SPEED;
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        if (this.cooldown > 0) this.cooldown--;
        if ((state.keys['ArrowUp'] || state.keys['Space']) && this.cooldown === 0) {
            this.shoot();
            this.cooldown = CONFIG.LASER_COOLDOWN;
        }
    }
    shoot() {
        if (state.hasDoubleShot) {
            state.lasers.push(new Laser(this.x + 20, this.y, -CONFIG.LASER_SPEED, '#FF00FF'));
            state.lasers.push(new Laser(this.x + this.width - 20, this.y, -CONFIG.LASER_SPEED, '#FF00FF'));
        } else {
            state.lasers.push(new Laser(this.x + this.width / 2 - 2, this.y, -CONFIG.LASER_SPEED, '#3cf4ff'));
        }
    }
    draw() { 
        if (state.hasShield) {
            ctx.strokeStyle = "#00d2ff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 65, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.drawImage(images.player, this.x, this.y, this.width, this.height);
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
        if (checkCollision(item, state.player)) {
            applyPowerUp(item.type);
            state.activeItems.splice(i, 1);
            continue;
        }
        if (item.y > canvas.height + 50) state.activeItems.splice(i, 1);
    }
}

function applyPowerUp(type) {
    if (type === 'DOUBLE_SHOT') {
        state.hasDoubleShot = true;
        setTimeout(() => { state.hasDoubleShot = false; }, 10000);
    } else if (type === 'SHIELD') {
        state.hasShield = true;
    } else if (type === 'RECOVERY') {
        state.lives = Math.min(state.lives + 1, 5);
    }
}

function drawItems() {
    state.activeItems.forEach(item => {
        let img = (item.type === 'SHIELD') ? images.itemShield : (item.type === 'RECOVERY') ? images.itemRecovery : images.itemDouble;
        ctx.drawImage(img, item.x, item.y, item.width, item.height);
    });
}

// --- CORE GAME LOGIC (OPTIMIZED) ---
function spawnWave() {
    const config = CONFIG.LEVELS[state.level];
    state.enemies = []; state.rowsState = [];
    state.formationX = 60; state.formationDirection = 1; state.formationStepCounter = 0;
    let enemyPool = [];
    for (let i = 0; i < config.kirk; i++) enemyPool.push('kirk');
    for (let i = 0; i < config.trump; i++) enemyPool.push('trump');
    for (let i = 0; i < config.epstein; i++) enemyPool.push('epstein');
    enemyPool.sort(() => Math.random() - 0.5);
    for (let row = 0; row < config.rows; row++) {
        const reversedRowIndex = (config.rows - 1) - row;
        state.rowsState.push({ y: -150 - (row * 150), targetY: 110 + (reversedRowIndex * (CONFIG.SIZES.ENEMY + 25)), isEntering: true });
        for (let col = 0; col < config.cols; col++) {
            const type = enemyPool.pop() || 'kirk';
            state.enemies.push(new Enemy(type, col, row));
        }
    }
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
        enemy.update(state.formationX, state.rowsState[enemy.gridY].y);
        if (checkCollision(enemy, state.player)) handlePlayerHit();
        if (enemy.y + enemy.height > canvas.height) { handlePlayerHit(); spawnWave(); }
    });
}

function update() {
    if (!state.active) return;
    state.player.update(); updateRows(); updateItems();
    // Optimized Laser Updates (Reverse Loop)
    for (let i = state.lasers.length - 1; i >= 0; i--) {
        const l = state.lasers[i]; l.update();
        if (l.y < -50) { state.lasers.splice(i, 1); continue; }
        let hit = false;
        for (let j = state.enemies.length - 1; j >= 0; j--) {
            const e = state.enemies[j];
            if (checkCollision(l, e)) {
                dropItem(e.x, e.y); e.hp--;
                if (e.hp <= 0) { state.enemies.splice(j, 1); state.score += (e.type === 'kirk' ? 10 : (e.type === 'trump' ? 20 : 30)); }
                hit = true; break;
            }
        }
        if (hit) state.lasers.splice(i, 1);
    }
    for (let i = state.enemyLasers.length - 1; i >= 0; i--) {
        const el = state.enemyLasers[i]; el.update();
        if (el.y > canvas.height + 50) { state.enemyLasers.splice(i, 1); continue; }
        if (checkCollision(el, state.player)) { state.enemyLasers.splice(i, 1); handlePlayerHit(); }
    }
}

function checkCollision(a, b) {
    if (!a || !b) return false;
    const p = 5; const aW = a.width || 5; const aH = a.height || 25;
    return a.x + p < b.x + b.width - p && a.x + aW - p > b.x + p && a.y + p < b.y + b.height - p && a.y + aH - p > b.y + p;
}

function handlePlayerHit() { if (state.hasShield) { state.hasShield = false; return; } state.lives--; if (state.lives <= 0) handleGameOver(false); }
function handleGameOver(won) { state.active = false; localStorage.setItem('finalScore', state.score); localStorage.setItem('gameResult', won ? 'WIN' : 'LOSS'); window.location.href = 'pages/final.html'; }

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.player) state.player.draw();
    state.enemies.forEach(e => e.draw());
    state.lasers.forEach(l => l.draw());
    state.enemyLasers.forEach(el => el.draw());
    drawItems();
    ctx.fillStyle = "#f4d166"; ctx.font = "20px 'Press Start 2P'"; ctx.textAlign = "left";
    ctx.fillText(`LEVEL: ${state.level}`, 40, 55);
    ctx.textAlign = "right"; ctx.fillText(`SCORE: ${state.score}`, canvas.width - 40, 55);
    if (state.active) { for (let i = 0; i < state.lives; i++) ctx.drawImage(images.heart, 40 + (i * 50), 75, 38, 38); }
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
    state.activeItems = [];
    state.lasers = [];
    state.enemyLasers = [];
    state.player = new Player(); 
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('start') === 'true') {
        startCountdown();
    }
}
