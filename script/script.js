// --- REDIRECCIÓN INICIAL ---
const params = new URLSearchParams(window.location.search);
const SHIP_COLORS = { aqua: '#3cf4ff', magenta: '#ff2df4', gold: '#f4d166' };
const requestedShipColor = params.get('shipColor') || 'aqua';
const shipTint = SHIP_COLORS[requestedShipColor] || SHIP_COLORS.aqua;

if (params.get('start') !== 'true') {
    window.location.href = 'pages/inicio.html';
}

// --- CONFIGURACIÓN ESCALADA (1000x750) ---
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
    SIZES: { PLAYER: 94, ENEMY: 82, BOSS: 150 },
    LEVELS: {
        1: { kirk: 17, trump: 5, epstein: 2, rows: 4, cols: 6, music: '7R5ncn93KT4' },
        2: { kirk: 5, trump: 14, epstein: 5, rows: 4, cols: 6, music: 'SQk6UTdbRO0' },
        3: { kirk: 7, trump: 7, epstein: 10, rows: 4, cols: 6, music: 'nFSs4Q7MyaY' }
    }
};

const state = {
    active: false,
    countingDown: false,
    score: 0,
    level: 1,
    lives: 5,
    keys: {},
    enemies: [],
    lasers: [],
    enemyLasers: [],
    formationX: 60,
    formationDirection: 1,
    formationStepCounter: 0,
    rowsState: [],
    isMultiplayer: params.get('players') === '2',
    players: [],
    ytPlayer: null,
    // --- NUEVAS VARIABLES EASTER EGG ---
    isPvP: false,
    challengerActive: false,
    challengerPhase: false,
    challengerImageOpacity: 0,
    challengerWinnerIndex: null
};

// --- CARGA DE ACTIVOS ---
const images = {
    player: new Image(), kirk: new Image(), trump: new Image(), 
    epstein: new Image(), heart: new Image(),
    challengerScreen: new Image() // Imagen del Easter Egg
};
images.player.src = "assets/images/1player.png";
images.kirk.src = "assets/images/charlieKirk1.png";
images.trump.src = "assets/images/trump2.png";
images.epstein.src = "assets/images/epstein3.png";
images.heart.src = "assets/heartlive.png";
images.challengerScreen.src = "https://i.postimg.cc/0jXqPq5B/image-5baa8f.jpg"; // URL de la imagen que subiste

const sounds = {
    alert: new Audio('https://www.myinstants.com/media/sounds/siren.mp3')
};

// --- YOUTUBE API INTEGRATION ---
function onYouTubeIframeAPIReady() {
    state.ytPlayer = new YT.Player('ytplayer', {
        height: '0', width: '0',
        videoId: CONFIG.LEVELS[1].music,
        playerVars: { 'autoplay': 1, 'loop': 1, 'playlist': CONFIG.LEVELS[1].music, 'controls': 0 },
        events: {
            'onReady': (e) => {
                e.target.setVolume(40);
                e.target.playVideo();
            }
        }
    });
}

function updateLevelMusic(id = null) {
    if (state.ytPlayer && state.ytPlayer.loadVideoById) {
        const nextMusicId = id || CONFIG.LEVELS[state.level].music;
        state.ytPlayer.cueVideoById({ videoId: nextMusicId, startSeconds: 0, suggestedQuality: 'small' });
        setTimeout(() => state.ytPlayer.playVideo(), 500);
    }
}

// --- CLASES ---

class Player {
    constructor(id, controls, xPos) {
        this.id = id;
        this.width = CONFIG.SIZES.PLAYER;
        this.height = CONFIG.SIZES.PLAYER;
        this.x = xPos;
        this.y = canvas.height - this.height - 30;
        this.cooldown = 0;
        this.controls = controls; 
        this.color = (id === 1) ? shipTint : '#ffeb3b';
        this.isBoss = false; // Para el modo PvP
    }

    update() {
        if (state.keys[this.controls.left]) this.x -= CONFIG.PLAYER_SPEED;
        if (state.keys[this.controls.right]) this.x += CONFIG.PLAYER_SPEED;
        
        // En modo PvP permitimos movimiento arriba/abajo
        if (state.isPvP) {
            if (state.keys['KeyW'] && this.id === 2) this.y -= CONFIG.PLAYER_SPEED;
            if (state.keys['KeyS'] && this.id === 2) this.y += CONFIG.PLAYER_SPEED;
            if (state.keys['ArrowUp'] && this.id === 1) this.y -= CONFIG.PLAYER_SPEED;
            if (state.keys['ArrowDown'] && this.id === 1) this.y += CONFIG.PLAYER_SPEED;
        }

        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));

        if (this.cooldown > 0) this.cooldown--;
        if (state.keys[this.controls.shoot] && this.cooldown === 0) {
            this.shoot();
            this.cooldown = CONFIG.LASER_COOLDOWN;
        }
    }

    shoot() {
        const laserColor = this.color;
        const dy = (state.isPvP && this.isBoss) ? CONFIG.LASER_SPEED : -CONFIG.LASER_SPEED;
        state.lasers.push(new Laser(this.x + this.width / 2 - 2, this.y, dy, laserColor, this.id));
    }

    draw() { 
        ctx.save();
        if (this.isBoss) {
            ctx.filter = "brightness(0) invert(1) drop-shadow(0 0 20px red)";
            this.width = CONFIG.SIZES.BOSS;
            this.height = CONFIG.SIZES.BOSS;
        }
        ctx.drawImage(images.player, this.x, this.y, this.width, this.height);
        
        if (!this.isBoss) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
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
        this.hp = (type === 'challenger' ? 10 : (type === 'kirk' ? 1 : 2));
        this.img = images[type] || images.epstein;
        this.shootTimer = 100 + Math.random() * 200;
    }
    update(rowX, rowY) {
        this.x = rowX + this.gridX * (this.width + 20);
        this.y = rowY;
    }
    draw() { 
        ctx.save();
        if (this.type === 'challenger') {
            ctx.filter = "brightness(0) blur(2px) drop-shadow(0 0 15px white)";
        }
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

class Laser {
    constructor(x, y, dy, color, ownerId = null) { 
        this.x = x; this.y = y; this.dy = dy; 
        this.width = 5; this.height = 25; 
        this.color = color; this.ownerId = ownerId; 
    }
    update() { this.y += this.dy; }
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// --- LÓGICA DE MOVIMIENTO ---

function spawnWave() {
    if (state.isPvP) return;
    const config = CONFIG.LEVELS[state.level];
    state.enemies = []; state.rowsState = [];
    
    const scale = state.isMultiplayer ? enemy_2p_scale : 1;
    let enemyPool = [];
    const multiplier = state.isMultiplayer ? 1.5 : 1;

    // --- CHANCE DE EASTER EGG ---
    if (state.isMultiplayer && state.level >= 1 && !state.challengerActive) {
        enemyPool.push('challenger');
        state.challengerActive = true;
    }

    for (let i = 0; i < config.kirk * multiplier; i++) enemyPool.push('kirk');
    for (let i = 0; i < config.trump * multiplier; i++) enemyPool.push('trump');
    for (let i = 0; i < config.epstein * multiplier; i++) enemyPool.push('epstein');
    enemyPool.sort(() => Math.random() - 0.5);

    const rows = config.rows + (state.isMultiplayer ? 2 : 0);
    const cols = config.cols + (state.isMultiplayer ? 2 : 0);

    for (let row = 0; row < rows; row++) {
        state.rowsState.push({
            y: -150 - (row * 100), 
            targetY: 110 + (row * (CONFIG.SIZES.ENEMY * scale + 20)),
            isEntering: true
        });
        for (let col = 0; col < cols; col++) {
            const type = enemyPool.pop() || 'kirk';
            const e = new Enemy(type, col, row);
            if (type === 'challenger') { e.width *= 1.5; e.height *= 1.5; }
            else { e.width *= scale; e.height *= scale; }
            state.enemies.push(e);
        }
    }
}

function updateRows() {
    if (state.isPvP) return;
    if (state.enemies.length === 0) {
        if (state.level < 3) { state.level++; spawnWave(); } 
        else handleGameOver(true);
        return;
    }
    const allEntered = state.rowsState.every(row => !row.isEntering);
    state.rowsState.forEach((row) => {
        if (row.isEntering) {
            if (row.y < row.targetY) row.y += 4;
            else row.isEntering = false;
        }
    });
    if (allEntered) {
        state.formationStepCounter++;
        if (state.formationStepCounter >= CONFIG.STEP_INTERVAL) {
            state.formationStepCounter = 0;
            let minX = Math.min(...state.enemies.map(e => e.x));
            let maxX = Math.max(...state.enemies.map(e => e.x + e.width));
            if (state.formationDirection === 1 && maxX + CONFIG.STEP_SIZE > canvas.width - 20) state.formationDirection = -1;
            else if (state.formationDirection === -1 && minX - CONFIG.STEP_SIZE < 20) state.formationDirection = 1;
            else state.formationX += CONFIG.STEP_SIZE * state.formationDirection;
        }
    }
    state.enemies.forEach(enemy => {
        enemy.update(state.formationX, state.rowsState[enemy.gridY].y);
        state.players.forEach(p => { if (checkCollision(enemy, p)) handlePlayerHit(); });
    });
}

// --- LÓGICA GENERAL ---

function initGame() {
    state.score = 0; state.level = 1; state.lives = 5;
    state.players = [];
    const p1Controls = { left: 'ArrowLeft', right: 'ArrowRight', shoot: 'ArrowUp' };
    const p2Controls = { left: 'KeyA', right: 'KeyD', shoot: 'KeyW' };

    state.players.push(new Player(1, p1Controls, canvas.width / 2 + 100));
    if (state.isMultiplayer) state.players.push(new Player(2, p2Controls, canvas.width / 2 - 200));
    
    startCountdown();
}

function triggerChallengerEasterEgg(winnerId) {
    state.active = false;
    state.challengerPhase = true;
    state.challengerWinnerIndex = winnerId - 1;
    sounds.alert.play();
    updateLevelMusic('Sz_kQuEM0mI'); // Música de tensión

    let opacity = 0;
    const fadeInt = setInterval(() => {
        state.challengerImageOpacity += 0.05;
        if (state.challengerImageOpacity >= 1) {
            clearInterval(fadeInt);
            setTimeout(startPvPMode, 4000); // 4 segundos de pantalla negra/imagen
        }
    }, 50);
}

function startPvPMode() {
    state.isPvP = true;
    state.challengerPhase = false;
    state.active = true;
    state.enemies = [];
    state.lasers = [];
    
    // El que lo mató se vuelve el Boss arriba
    const winner = state.players[state.challengerWinnerIndex];
    winner.isBoss = true;
    winner.x = canvas.width / 2 - 75;
    winner.y = 50;

    // El otro jugador abajo
    const loser = state.players[state.challengerWinnerIndex === 0 ? 1 : 0];
    loser.x = canvas.width / 2 - 47;
    loser.y = canvas.height - 150;
    
    state.lives = 10; // Duelo a 10 toques
    gameLoop();
}

function update() {
    if (!state.active) return;
    state.players.forEach(p => p.update());
    updateRows();

    state.lasers.forEach((laser, lIdx) => {
        laser.update();
        if (laser.y < -50 || laser.y > canvas.height + 50) state.lasers.splice(lIdx, 1);
        
        // Colisión con enemigos
        state.enemies.forEach((enemy, eIdx) => {
            if (checkCollision(laser, enemy)) {
                state.lasers.splice(lIdx, 1);
                enemy.hp--;
                if (enemy.hp <= 0) {
                    if (enemy.type === 'challenger') triggerChallengerEasterEgg(laser.ownerId);
                    state.enemies.splice(eIdx, 1);
                    state.score += 50;
                }
            }
        });

        // Colisión PvP (Solo si el modo PvP está activo)
        if (state.isPvP) {
            state.players.forEach((p, pIdx) => {
                if (laser.ownerId !== p.id && checkCollision(laser, p)) {
                    state.lasers.splice(lIdx, 1);
                    state.lives--; // En PvP las vidas son compartidas como contador de daño
                    if (state.lives <= 0) handleGameOver(true);
                }
            });
        }
    });
}

function checkCollision(a, b) {
    const p = 10; 
    return a.x + p < b.x + b.width - p && a.x + (a.width||5) - p > b.x + p &&
           a.y + p < b.y + b.height - p && a.y + (a.height||25) - p > b.y + p;
}

function handlePlayerHit() {
    if (state.isPvP) return;
    state.lives--;
    if (state.lives <= 0) handleGameOver(false);
}

function handleGameOver(won) {
    state.active = false;
    localStorage.setItem('finalScore', state.score);
    localStorage.setItem('gameResult', won ? 'WIN' : 'LOSS');
    window.location.href = 'pages/final.html';
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (state.challengerPhase) {
        ctx.globalAlpha = state.challengerImageOpacity;
        ctx.drawImage(images.challengerScreen, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        return;
    }

    state.players.forEach(p => p.draw());
    if (state.active || state.countingDown) state.enemies.forEach(e => e.draw());
    state.lasers.forEach(l => l.draw());
    
    ctx.fillStyle = "#f4d166"; 
    ctx.font = "20px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.fillText(state.isPvP ? "DUEL" : `LEVEL: ${state.level}`, 40, 55);
    ctx.textAlign = "right";
    ctx.fillText(`SCORE: ${state.score}`, canvas.width - 40, 55);
    
    if (state.active) {
        for (let i = 0; i < state.lives; i++) {
            ctx.drawImage(images.heart, 40 + (i * 45), 75, 30, 30);
        }
    }
}

function startCountdown() {
    state.countingDown = true;
    countdownEl.classList.remove('hidden');
    let count = 3;
    const timer = setInterval(() => {
        if (count > 0) countdownEl.textContent = count;
        else if (count === 0) countdownEl.textContent = "GO!";
        else {
            clearInterval(timer);
            countdownEl.classList.add('hidden');
            state.countingDown = false; state.active = true;
            spawnWave(); gameLoop(); return;
        }
        count--;
    }, 1000);
}

function gameLoop() { if (state.active) { update(); draw(); requestAnimationFrame(gameLoop); } }

window.addEventListener('keydown', e => state.keys[e.code] = true);
window.addEventListener('keyup', e => state.keys[e.code] = false);

if (params.get('start') === 'true') initGame();
draw();
