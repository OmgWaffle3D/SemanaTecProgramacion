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
    SIZES: { PLAYER: 94, ENEMY: 82 },
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
    lives: 3,
    keys: {},
    enemies: [],
    lasers: [],
    enemyLasers: [],
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
    player: new Image(), kirk: new Image(), trump: new Image(), epstein: new Image(), heart: new Image()
};
images.player.src = "assets/images/1player.png";
images.kirk.src = "assets/images/charlieKirk1.png";
images.trump.src = "assets/images/trump2.png";
images.epstein.src = "assets/images/epstein3.png";
images.heart.src = "assets/heartlive.png";

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

function updateLevelMusic() {
    if (state.ytPlayer && state.ytPlayer.loadVideoById) {
        const nextMusicId = CONFIG.LEVELS[state.level].music;
        console.log("Cambiando música a nivel:", state.level, "ID:", nextMusicId);
        
        // Usamos cue + play para asegurar que el buffer se llene
        state.ytPlayer.cueVideoById({
            videoId: nextMusicId,
            startSeconds: 0,
            suggestedQuality: 'small'
        });
        
        setTimeout(() => {
            state.ytPlayer.playVideo();
        }, 500); // Pequeño retraso para asegurar la carga
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
        this.color = shipTint;
    }

    update() {
        if (state.keys[this.controls.left]) this.x -= CONFIG.PLAYER_SPEED;
        if (state.keys[this.controls.right]) this.x += CONFIG.PLAYER_SPEED;
        
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        if (this.cooldown > 0) this.cooldown--;

        if (state.keys[this.controls.shoot] && this.cooldown === 0) {
            this.shoot();
            this.cooldown = CONFIG.LASER_COOLDOWN;
        }
    }

    shoot() {
        // Color basado en el ID del jugador
        const laserColor = this.id === 1 ? '#3cf4ff' : '#ffeb3b';
        state.lasers.push(new Laser(this.x + this.width / 2 - 2, this.y, -CONFIG.LASER_SPEED, laserColor));
    }

    draw() { 
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.id === 1 ? "#3cf4ff" : "#ffeb3b";
        
        // Dibujamos la imagen base
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
        ctx.shadowBlur = 12;
        ctx.shadowColor = (this.type === 'kirk' ? "#ff9500" : (this.type === 'trump' ? "#ff2d55" : "#ff00ff"));
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class Laser {
    constructor(x, y, dy, color) { this.x = x; this.y = y; this.dy = dy; this.width = 5; this.height = 25; this.color = color; }
    update() { this.y += this.dy; }
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// --- LÓGICA DE MOVIMIENTO ARCADE ---

function spawnWave() {
    const config = CONFIG.LEVELS[state.level];
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

function updateRows() {
    if (state.enemies.length === 0) {
        if (state.level < 3) { 
            state.level++; 
            updateLevelMusic(); // CAMBIO DE MÚSICA
            spawnWave(); 
        } 
        else { handleGameOver(true); }
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
            let hitEdge = false;
            if (state.formationDirection === 1 && maxX + CONFIG.STEP_SIZE > canvas.width - 20) hitEdge = true;
            if (state.formationDirection === -1 && minX - CONFIG.STEP_SIZE < 20) hitEdge = true;
            if (hitEdge) {
                state.rowsState.forEach(row => row.y += 35);
                state.formationDirection *= -1;
            } else {
                state.formationX += CONFIG.STEP_SIZE * state.formationDirection;
            }
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
    const p1Controls = { left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Space' };
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
    const p = 5; 
    return a.x + p < b.x + b.width - p && a.x + (a.width||5) - p > b.x + p &&
           a.y + p < b.y + b.height - p && a.y + (a.height||25) - p > b.y + p;
}

function handlePlayerHit() {
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // CORRECCIÓN: Dibujar a todos los jugadores del arreglo
    state.players.forEach(p => p.draw());
    
    if (state.active || state.countingDown) {
        state.enemies.forEach(e => e.draw());
    }
    
    state.lasers.forEach(l => l.draw());
    state.enemyLasers.forEach(l => l.draw());
    
    ctx.fillStyle = "#f4d166"; 
    ctx.font = "20px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.fillText(`LEVEL: ${state.level}`, 40, 55);
    
    ctx.textAlign = "right";
    ctx.fillText(`SCORE: ${state.score}`, canvas.width - 40, 55);
    ctx.textAlign = "left";
    
    if (state.active) {
        const heartSize = 38;
        for (let i = 0; i < state.lives; i++) {
            ctx.drawImage(images.heart, 40 + (i * 50), 75, heartSize, heartSize);
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

function renderCountdownFrame() { if (state.countingDown) { draw(); requestAnimationFrame(renderCountdownFrame); } }
function gameLoop() { if (state.active) { update(); draw(); requestAnimationFrame(gameLoop); } }

window.addEventListener('keydown', e => state.keys[e.code] = true);
window.addEventListener('keyup', e => state.keys[e.code] = false);

if (params.get('start') === 'true') initGame();
draw();
