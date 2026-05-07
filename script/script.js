/**
 * SPACE INVADERS - MAIN GAME ENGINE
 * Motor de juego tipo Space Invaders con soporte para 1 o 2 jugadores
 * Incluye: sistema de enemigos, items, colisiones, puntuación y múltiples niveles
 */

// --- REDIRECCIÓN Y VALIDACIÓN INICIAL ---
// Verifica que el juego se inicie desde la página de inicio con parámetros válidos
const params = new URLSearchParams(window.location.search);
if (params.get('start') !== 'true') {
    window.location.href = 'pages/inicio.html'; // Redirige si falta parámetro 'start'
}

// Lee los parámetros de la URL: modo multijugador y color de nave seleccionado
const isMultiplayer = params.get('players') === '2'; // true si es modo 2 jugadores
const selectedShipColor = params.get('shipColor') || 'aqua'; // Color por defecto: aqua

// --- SISTEMA DE COLORES DE NAVES ---
// Define los colores disponibles para personalizar la nave del jugador
const SHIP_TINTS = {
    aqua: '#3cf4ff',     // Azul claro cian
    magenta: '#ff2df4',  // Rosa/Magenta
    gold: '#f4d166'      // Dorado/Amarillo
};

// Orden de rotación de colores (para jugador 2 en modo coop)
const SHIP_COLOR_ORDER = ['aqua', 'magenta', 'gold'];

/**
 * Normaliza el color ingresado, asegurándose de que sea válido
 * Si no existe, devuelve el color por defecto (aqua)
 * @param {string} color - Color a validar
 * @returns {string} Color normalizado
 */
function normalizeShipColor(color) {
    return SHIP_TINTS[color] ? color : 'aqua';
}

/**
 * Obtiene el código hexadecimal del color de la nave
 * @param {string} color - Nombre del color
 * @returns {string} Código hexadecimal del color
 */
function getShipTint(color) {
    return SHIP_TINTS[normalizeShipColor(color)];
}

/**
 * Retorna un color alterno para el jugador 2 en modo multijugador
 * Salta 2 colores en la lista para asegurar contraste visual
 * @param {string} color - Color del jugador 1
 * @returns {string} Color diferente para el jugador 2
 */
function getAlternateShipColor(color) {
    const normalized = normalizeShipColor(color);
    const currentIndex = SHIP_COLOR_ORDER.indexOf(normalized);
    return SHIP_COLOR_ORDER[(currentIndex + 2) % SHIP_COLOR_ORDER.length];
}

// --- CONFIGURACIÓN DEL CANVAS Y CONTEXTO DE DIBUJO ---
// Canvas de 1000x750px para mantener resolución consistente
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const countdownEl = document.getElementById("countdown");

canvas.width = 1000;
canvas.height = 750;

// --- CONFIGURACIÓN GENERAL DEL JUEGO ---
const CONFIG = {
    // Velocidad de movimiento del jugador (píxeles por frame)
    PLAYER_SPEED: 9,
    // Velocidad de los disparos del jugador (píxeles por frame)
    LASER_SPEED: 15,
    // Tamaño del paso de movimiento de la formación de enemigos
    STEP_SIZE: 19,
    // Intervalo (en frames) entre movimientos de la formación
    STEP_INTERVAL: 25,
    // Frames de enfriamiento entre disparos del jugador
    LASER_COOLDOWN: 15,
    // Tamaño de sprites en píxeles
    SIZES: { PLAYER: 94, ENEMY: 82 },
    // Configuración de niveles (cantidad de enemigos, filas, columnas y música)
    LEVELS: {
        1: { kirk: 17, trump: 5, epstein: 2, rows: 4, cols: 6, music: '7R5ncn93KT4' },
        2: { kirk: 5, trump: 14, epstein: 5, rows: 4, cols: 6, music: 'SQk6UTdbRO0' },
        3: { kirk: 7, trump: 7, epstein: 10, rows: 4, cols: 6, music: 'nFSs4Q7MyaY' }
    },
    // Probabilidad de soltar un item al destruir un enemigo (15%)
    ITEM_DROP_CHANCE: 0.15,
    // Velocidad de caída de items (píxeles por frame)
    ITEM_SPEED: 3
};

// --- ESTADO DEL JUEGO ---
// Objeto central que almacena todos los datos dinámicos del juego
const state = {
    // Control de flujo del juego
    active: false,              // ¿El juego está en curso?
    countingDown: false,        // ¿Se está mostrando la cuenta regresiva?

    // Puntuación y progreso
    score: 0,                   // Puntuación acumulada del jugador
    level: 1,                   // Nivel actual (1-3)
    lives: 3,                   // Vidas del jugador

    // Input del jugador
    keys: {},                   // Estado de todas las teclas presionadas

    // Entidades del juego
    player: null,               // Referencia al jugador principal (para compatibilidad)
    players: [],                // Array de todos los jugadores activos
    isMultiplayer,              // true si es modo 2 jugadores

    // Entidades de combate
    enemies: [],                // Array de enemigos activos
    lasers: [],                 // Array de disparos del jugador
    enemyLasers: [],            // Array de disparos de enemigos
    activeItems: [],            // Array de items cayendo en pantalla

    // Control de movimiento de enemigos
    formationX: 60,             // Posición X de la formación enemiga
    formationDirection: 1,      // Dirección de movimiento (-1 izq, 1 derecha)
    formationStepCounter: 0,    // Contador para regular velocidad de movimiento
    rowsState: [],              // Estado de cada fila de enemigos

    // Audio
    ytPlayer: null              // Reproductor de YouTube para música de fondo
};

// --- CARGA DE ACTIVOS (IMÁGENES) ---
// Objeto con todas las imágenes del juego
const images = {
    player: new Image(),        // Sprite de la nave del jugador
    kirk: new Image(),          // Enemigo tipo Kirk (1 vida)
    trump: new Image(),         // Enemigo tipo Trump (2 vidas)
    epstein: new Image(),       // Enemigo tipo Epstein (2 vidas, dispara)
    heart: new Image(),         // Icono de vida
    itemDouble: new Image(),    // Power-up de disparo doble
    itemShield: new Image(),    // Power-up de escudo
    itemRecovery: new Image()   // Power-up de recuperación de vida
};

// Asigna las rutas de las imágenes
images.player.src = "assets/images/1player.png";
images.kirk.src = "assets/images/charlieKirk1.png";
images.trump.src = "assets/images/trump2.png";
images.epstein.src = "assets/images/epstein3.png";
images.heart.src = "assets/images/recovery.png";
images.itemDouble.src = "assets/images/double_shot.png";
images.itemShield.src = "assets/images/shield.png";
images.itemRecovery.src = "assets/images/recovery.png";

// --- INICIALIZACIÓN DE API DE YOUTUBE ---
/**
 * Callback automático que se ejecuta cuando la API de YouTube está cargada
 * Crea un reproductor invisible para la música de fondo del juego
 */
function onYouTubeIframeAPIReady() {
    state.ytPlayer = new YT.Player('ytplayer', {
        height: '0', width: '0',                                      // Reproductor invisible
        videoId: CONFIG.LEVELS[1].music,                             // Video de música del nivel 1
        playerVars: { 'autoplay': 1, 'loop': 1, 'playlist': CONFIG.LEVELS[1].music, 'controls': 0 },
        events: { 'onReady': (e) => { e.target.setVolume(30); e.target.playVideo(); } }
    });
}

// --- FUNCIONES DE UTILIDAD ---

/**
 * Verifica si una tecla o conjunto de teclas está presionada
 * Soporta tanto una tecla individual como un array de opciones alternativas
 * @param {string|string[]} control - Código de tecla o array de códigos
 * @returns {boolean} true si la tecla está presionada
 */
function isControlPressed(control) {
    if (Array.isArray(control)) {
        // Si es un array, devuelve true si cualquiera de las opciones está presionada
        return control.some(keyCode => state.keys[keyCode]);
    }
    return !!state.keys[control];
}

/**
 * Calcula la posición X inicial de un jugador basado en el número total de jugadores
 * En modo 1 jugador: centrado
 * En modo 2 jugadores: a los lados con cierto espaciamiento
 * @param {number} index - Índice del jugador (0 o 1)
 * @param {number} totalPlayers - Número total de jugadores (1 o 2)
 * @returns {number} Posición X inicial en píxeles
 */
function getPlayerStartPosition(index, totalPlayers) {
    if (totalPlayers <= 1) {
        // Modo 1 jugador: centrado horizontalmente
        return canvas.width / 2 - CONFIG.SIZES.PLAYER / 2;
    }

    // Modo 2 jugadores: posiciones laterales
    const positions = [
        canvas.width / 2 - CONFIG.SIZES.PLAYER - 28,  // Jugador 1: a la izquierda del centro
        canvas.width / 2 + 28                          // Jugador 2: a la derecha del centro
    ];

    return positions[index] ?? (canvas.width / 2 - CONFIG.SIZES.PLAYER / 2);
}

// --- CLASES DEL JUEGO ---

/**
 * CLASE PLAYER - Representa al jugador en el juego
 * Maneja movimiento, disparo, colisiones y visualización
 */
class Player {
    /**
     * Constructor del jugador
     * @param {number} id - Identificador único (1 o 2)
     * @param {Object} controls - Objeto con teclas de control {left, right, shoot}
     * @param {number} xPos - Posición X inicial
     * @param {string} shipColor - Color de la nave (aqua, magenta, gold)
     */
    constructor(id, controls, xPos, shipColor) {
        this.id = id;                              // ID del jugador (1=P1, 2=P2)
        this.controls = controls;                  // Mapeo de controles
        this.width = CONFIG.SIZES.PLAYER;          // Ancho del sprite
        this.height = CONFIG.SIZES.PLAYER;         // Alto del sprite
        this.x = xPos;                             // Posición X actual
        this.y = canvas.height - this.height - 30; // Posición Y fija (cerca del borde inferior)
        this.cooldown = 0;                         // Contador de enfriamiento entre disparos
        this.color = getShipTint(shipColor);       // Color hexadecimal de la nave
        this.lives = 3;                            // Vidas actuales
        this.maxLives = 5;                         // Máximo de vidas posibles
        this.alive = true;                         // ¿Jugador activo?
        this.hasDoubleShot = false;                // ¿Tiene power-up de disparo doble?
        this.hasShield = false;                    // ¿Tiene escudo activo?
    }

    /**
     * Actualiza el estado del jugador cada frame
     * Procesa input, movimiento, enfriamiento de disparo
     */
    update() {
        if (!this.alive) return; // No actualiza si está destruido

        // Movimiento horizontal
        if (isControlPressed(this.controls.left)) this.x -= CONFIG.PLAYER_SPEED;
        if (isControlPressed(this.controls.right)) this.x += CONFIG.PLAYER_SPEED;

        // Limita el movimiento dentro de los bordes del canvas
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

        // Reduce el contador de enfriamiento de disparo
        if (this.cooldown > 0) this.cooldown--;

        // Dispara si presiona la tecla y el enfriamiento se acabó
        if (isControlPressed(this.controls.shoot) && this.cooldown === 0) {
            this.shoot();
            this.cooldown = CONFIG.LASER_COOLDOWN;
        }
    }

    /**
     * Genera un disparo (o dos si tiene power-up de disparo doble)
     * Los disparos heredan el color de la nave del jugador
     */
    shoot() {
        const laserColor = this.color; // Los disparos tienen el color de la nave

        if (this.hasDoubleShot) {
            // Dispara dos proyectiles a los lados
            state.lasers.push(new Laser(this.x + 20, this.y, -CONFIG.LASER_SPEED, laserColor));
            state.lasers.push(new Laser(this.x + this.width - 20, this.y, -CONFIG.LASER_SPEED, laserColor));
        } else {
            // Dispara un proyectil al centro
            state.lasers.push(new Laser(this.x + this.width / 2 - 2, this.y, -CONFIG.LASER_SPEED, laserColor));
        }
    }

    /**
     * Dibuja el jugador en el canvas con efectos visuales
     * Incluye: escudo, sombra de brillo, tinte de color
     */
    draw() {
        if (!this.alive) return; // No dibuja si está destruido

        // Dibuja el escudo si está activo
        if (this.hasShield) {
            ctx.strokeStyle = "#00d2ff";       // Color cian
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 65, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Guarda el estado del canvas antes de aplicar transformaciones
        ctx.save();

        // Efecto de brillo alrededor de la nave
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Dibuja la imagen base de la nave
        ctx.drawImage(images.player, this.x, this.y, this.width, this.height);

        // Aplica tinte de color (superposición semi-transparente)
        ctx.globalCompositeOperation = 'source-atop'; // Solo colorea donde hay contenido
        ctx.globalAlpha = 0.35;                       // 35% de opacidad del tinte
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Restaura el estado del canvas
        ctx.restore();
    }
}

/**
 * CLASE ENEMY - Representa a los enemigos del juego
 * Existen tres tipos: Kirk, Trump y Epstein con diferentes características
 */
class Enemy {
    /**
     * Constructor del enemigo
     * @param {string} type - Tipo de enemigo: 'kirk', 'trump' o 'epstein'
     * @param {number} gridX - Posición X en la grilla
     * @param {number} gridY - Posición Y (fila) en la grilla
     */
    constructor(type, gridX, gridY) {
        this.type = type;
        this.width = CONFIG.SIZES.ENEMY;
        this.height = CONFIG.SIZES.ENEMY;
        this.gridX = gridX;                    // Columna en la formación
        this.gridY = gridY;                    // Fila en la formación
        this.x = -200;                         // Posición X inicial (fuera de pantalla)
        this.y = -200;                         // Posición Y inicial (fuera de pantalla)
        // Kirk tiene 1 vida, Trump y Epstein tienen 2
        this.hp = (type === 'kirk' ? 1 : 2);
        // Asigna la imagen según el tipo
        this.img = (type === 'kirk' ? images.kirk : (type === 'trump' ? images.trump : images.epstein));
        // Solo Epstein dispara (cada 100-300 frames)
        this.shootTimer = 100 + Math.random() * 200;
    }

    /**
     * Actualiza la posición del enemigo basado en la formación
     * Solo Epstein dispara automáticamente
     * @param {number} rowX - Posición X de la fila
     * @param {number} rowY - Posición Y de la fila
     */
    update(rowX, rowY) {
        // Calcula posición en grid (columnas espaciadas a 102px)
        this.x = rowX + this.gridX * (this.width + 20);
        this.y = rowY;

        // Solo Epstein dispara
        if (this.type === 'epstein' && state.active) {
            this.shootTimer--;
            if (this.shootTimer <= 0) {
                // Dispara proyectil rojo hacia abajo
                state.enemyLasers.push(new Laser(this.x + this.width / 2, this.y + this.height, 6, '#ff2d55'));
                this.shootTimer = 150 + Math.random() * 200; // Recarga el timer
            }
        }
    }

    /**
     * Dibuja el enemigo en su posición actual
     */
    draw() {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
}

/**
 * CLASE LASER - Representa proyectiles (del jugador o enemigos)
 * Los disparos se mueven verticalmente en línea recta
 */
class Laser {
    /**
     * Constructor del láser
     * @param {number} x - Posición X inicial
     * @param {number} y - Posición Y inicial
     * @param {number} dy - Velocidad vertical (negativa = arriba, positiva = abajo)
     * @param {string} color - Color hexadecimal del láser
     */
    constructor(x, y, dy, color) {
        this.x = x;
        this.y = y;
        this.dy = dy;                  // Velocidad vertical
        this.width = 5;                // Ancho del rayo
        this.height = 25;              // Alto del rayo
        this.color = color;
    }

    /**
     * Actualiza la posición del láser cada frame
     */
    update() {
        this.y += this.dy;
    }

    /**
     * Dibuja el láser como un rectángulo vertical coloreado
     */
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// --- SISTEMA DE ITEMS ---

/**
 * Genera un item aleatorio cuando se destruye un enemigo
 * 15% de probabilidad de que caiga un item
 * @param {number} x - Posición X del enemigo destruido
 * @param {number} y - Posición Y del enemigo destruido
 */
function dropItem(x, y) {
    if (Math.random() <= CONFIG.ITEM_DROP_CHANCE) {
        const types = ['DOUBLE_SHOT', 'SHIELD', 'RECOVERY'];
        const type = types[Math.floor(Math.random() * types.length)];
        state.activeItems.push({ x: x, y: y, type: type, width: 45, height: 45 });
    }
}

/**
 * Actualiza la posición de todos los items cayendo
 * Verifica colisiones con jugadores y elimina items que salieron de pantalla
 */
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

/**
 * Aplica el efecto del item recolectado al jugador específico
 * @param {string} type - Tipo de item: 'DOUBLE_SHOT', 'SHIELD' o 'RECOVERY'
 * @param {Player} player - Jugador que recogió el item
 */
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

/**
 * Dibuja todos los items activos en pantalla
 * Usa imágenes si están cargadas, sino dibuja círculos de colores
 */
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

/**
 * Dibuja un corazón rojo (representa una vida)
 * @param {number} x - Posición X del corazón
 * @param {number} y - Posición Y del corazón
 * @param {number} size - Tamaño del corazón
 */
function drawHeart(x, y, size) {
    ctx.fillStyle = "#ff2d55";
    ctx.beginPath();
    // Mitad izquierda del corazón
    ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    // Mitad derecha del corazón
    ctx.arc(x + size * 0.25, y - size * 0.25, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    // Triángulo inferior
    ctx.moveTo(x - size * 0.4, y - size * 0.1);
    ctx.lineTo(x + size * 0.4, y - size * 0.1);
    ctx.lineTo(x, y + size * 0.4);
    ctx.fill();
}

// --- LÓGICA PRINCIPAL DEL JUEGO ---

/**
 * Genera una nueva ola de enemigos para el nivel actual
 * Crea una formación ordenada que entra en pantalla desde arriba
 * Los enemigos están distribuidos en filas y columnas
 */
function spawnWave() {
    const config = CONFIG.LEVELS[state.level];
    state.enemies = [];
    state.rowsState = [];
    state.formationX = 60;              // Posición X inicial de la formación
    state.formationDirection = 1;       // Dirección inicial (1 = derecha)
    state.formationStepCounter = 0;     // Contador para movimiento

    // Crea pool de enemigos según configuración del nivel
    let enemyPool = [];
    for (let i = 0; i < config.kirk; i++) enemyPool.push('kirk');       // Enemigos débiles
    for (let i = 0; i < config.trump; i++) enemyPool.push('trump');     // Enemigos medios
    for (let i = 0; i < config.epstein; i++) enemyPool.push('epstein'); // Enemigos fuertes

    // Mezcla el pool de enemigos aleatoriamente
    enemyPool.sort(() => Math.random() - 0.5);

    // Crea la formación en filas y columnas
    for (let row = 0; row < config.rows; row++) {
        const reversedRowIndex = (config.rows - 1) - row;
        // Cada fila entra desde arriba progresivamente
        state.rowsState.push({
            y: -150 - (row * 150),                                     // Posición Y inicial (fuera de pantalla)
            targetY: 110 + (reversedRowIndex * (CONFIG.SIZES.ENEMY + 25)), // Posición Y final
            isEntering: true                                            // Flag de entrada
        });

        // Crea enemigos para esta fila
        for (let col = 0; col < config.cols; col++) {
            const type = enemyPool.pop() || 'kirk';
            state.enemies.push(new Enemy(type, col, row));
        }
    }
}

/**
 * Encuentra el jugador vivo más cercano a un enemigo (en eje X)
 * Usado para determinar a quién apuntar cuando un enemigo cae fuera de pantalla
 * @param {Enemy} enemy - Enemigo a evaluar
 * @returns {Player} Jugador vivo más cercano o null
 */
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

/**
 * Actualiza el movimiento de las filas de enemigos
 * Maneja: entrada de enemigos, movimiento formación, detección de colisiones y fin de nivel
 */
function updateRows() {
    // Verifica si todos los enemigos fueron destruidos (ola completa)
    if (state.enemies.length === 0) {
        if (state.level < 3) {
            state.level++;  // Avanza al siguiente nivel
            spawnWave();    // Genera nueva ola
        } else {
            handleGameOver(true); // Ganó el juego (completó los 3 niveles)
        }
        return;
    }

    // Mueve las filas que aún están entrando
    const allEntered = state.rowsState.every(row => !row.isEntering);
    state.rowsState.forEach(row => {
        if (row.isEntering) {
            if (row.y < row.targetY) {
                row.y += 4; // Mueve fila hacia su posición final
            } else {
                row.isEntering = false; // Fila completó entrada
            }
        }
    });

    // Movimiento lateral de la formación (después de que todas entren)
    if (allEntered) {
        state.formationStepCounter++;
        if (state.formationStepCounter >= CONFIG.STEP_INTERVAL) {
            state.formationStepCounter = 0;

            // Calcula limites de la formación
            let minX = Math.min(...state.enemies.map(e => e.x));
            let maxX = Math.max(...state.enemies.map(e => e.x + e.width));

            // Cambia dirección si toca los bordes o desciende una fila
            if ((state.formationDirection === 1 && maxX + CONFIG.STEP_SIZE > canvas.width - 20) ||
                (state.formationDirection === -1 && minX - CONFIG.STEP_SIZE < 20)) {
                state.rowsState.forEach(row => row.y += 35); // Baja todas las filas
                state.formationDirection *= -1;             // Invierte dirección
            } else {
                state.formationX += CONFIG.STEP_SIZE * state.formationDirection; // Mueve formación
            }
        }
    }

    // Actualiza cada enemigo y verifica colisiones
    state.enemies.forEach(enemy => {
        enemy.update(state.formationX, state.rowsState[enemy.gridY].y);

        // Verifica colisión con jugadores
        state.players.forEach(player => {
            if (player.alive && checkCollision(enemy, player)) {
                handlePlayerHit(player);
            }
        });

        // Si un enemigo sale de pantalla por abajo, daña al jugador más cercano
        if (enemy.y + enemy.height > canvas.height) {
            const fallbackPlayer = getClosestAlivePlayer(enemy);
            if (fallbackPlayer) handlePlayerHit(fallbackPlayer);
            spawnWave(); // Reinicia la ola
        }
    });
}

/**
 * Actualiza el estado del juego cada frame
 * Procesa: movimiento de jugadores, enemigos, disparos y colisiones
 */
function update() {
    if (!state.active) return; // No actualiza si el juego está pausado

    // Actualiza todos los jugadores
    state.players.forEach(player => player.update());

    // Actualiza formación de enemigos
    updateRows();

    // Actualiza items cayendo
    updateItems();

    // --- Procesa disparos del jugador ---
    // Itera hacia atrás para permitir eliminar items sin problemas
    for (let i = state.lasers.length - 1; i >= 0; i--) {
        const l = state.lasers[i];
        l.update();

        // Elimina disparos que salieron de pantalla
        if (l.y < -50) {
            state.lasers.splice(i, 1);
            continue;
        }

        let hit = false;
        // Verifica colisión con enemigos
        for (let j = state.enemies.length - 1; j >= 0; j--) {
            const e = state.enemies[j];
            if (checkCollision(l, e)) {
                // Genera item al destruir enemigo
                dropItem(e.x, e.y);
                e.hp--;

                // Si enemigo muere, lo elimina y suma puntos
                if (e.hp <= 0) {
                    state.enemies.splice(j, 1);
                    // Puntuación: Kirk=10, Trump=20, Epstein=30
                    state.score += (e.type === 'kirk' ? 10 : (e.type === 'trump' ? 20 : 30));
                }
                hit = true;
                break;
            }
        }

        // Elimina disparo si ya golpeó
        if (hit) state.lasers.splice(i, 1);
    }

    // --- Procesa disparos de enemigos ---
    for (let i = state.enemyLasers.length - 1; i >= 0; i--) {
        const el = state.enemyLasers[i];
        el.update();

        // Elimina disparos que salieron de pantalla
        if (el.y > canvas.height + 50) {
            state.enemyLasers.splice(i, 1);
            continue;
        }

        // Verifica colisión con jugadores vivos
        const hitPlayer = state.players.find(player => player.alive && checkCollision(el, player));
        if (hitPlayer) {
            state.enemyLasers.splice(i, 1);
            handlePlayerHit(hitPlayer);
        }
    }
}

/**
 * Detecta colisión entre dos rectángulos
 * Usa un margen pequeño (padding) para evitar colisiones en los bordes
 * @param {Object} a - Objeto con propiedades x, y, width, height
 * @param {Object} b - Objeto con propiedades x, y, width, height
 * @returns {boolean} true si hay colisión
 */
function checkCollision(a, b) {
    if (!a || !b) return false;

    const p = 5;              // Padding (margen de 5px)
    const aW = a.width || 5;  // Ancho de A (defaul 5 para disparos)
    const aH = a.height || 25; // Alto de A (default 25 para disparos)

    // Verifica si los rectángulos se solapan
    return a.x + p < b.x + b.width - p &&
           a.x + aW - p > b.x + p &&
           a.y + p < b.y + b.height - p &&
           a.y + aH - p > b.y + p;
}

/**
 * Maneja el impacto de un proyectil enemigo en un jugador
 * Reduce vida del jugador, puede activar escudo, o marcar como muerto
 * @param {Player} player - Jugador que recibió impacto
 */
function handlePlayerHit(player) {
    if (!player || !player.alive) return;

    // Si tiene escudo, lo consume sin daño
    if (player.hasShield) {
        player.hasShield = false;
        return;
    }

    // Reduce vida
    player.lives--;

    // Marca como muerto si no tiene vidas
    if (player.lives <= 0) {
        player.lives = 0;
        player.alive = false;
    }

    // Verifica si todos los jugadores murieron (game over)
    if (state.players.every(entry => !entry.alive)) {
        handleGameOver(false);
    }
}

/**
 * Finaliza el juego: guarda resultado en localStorage y redirige a pantalla final
 * @param {boolean} won - true si ganó, false si perdió
 */
function handleGameOver(won) {
    state.active = false;
    localStorage.setItem('finalScore', state.score);
    localStorage.setItem('gameResult', won ? 'WIN' : 'LOSS');
    window.location.href = 'pages/final.html';
}

/**
 * Dibuja los corazones (vidas) de un jugador
 * @param {Player} player - Jugador del que dibujar vidas
 * @param {number} x - Posición X base
 * @param {string} align - 'left' (de izq a derecha) o 'right' (de derecha a izquierda)
 */
function drawPlayerLives(player, x, align = 'left') {
    const liveCount = Math.max(0, player.lives);
    for (let i = 0; i < liveCount; i++) {
        const offset = align === 'right' ? -(i * 50) : (i * 50);
        drawHeart(x + offset, 90, 18);
    }
}

/**
 * Renderiza todos los elementos del juego en el canvas
 * Dibuja: jugadores, enemigos, disparos, items, UI (nivel, puntos, vidas)
 */
function draw() {
    // Limpia el canvas completamente
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibuja todas las entidades
    state.players.forEach(player => player.draw());  // Dibuja jugadores
    state.enemies.forEach(e => e.draw());             // Dibuja enemigos
    state.lasers.forEach(l => l.draw());              // Dibuja disparos del jugador
    state.enemyLasers.forEach(el => el.draw());       // Dibuja disparos de enemigos
    drawItems();                                       // Dibuja items cayendo

    // Dibuja UI (nivel y puntuación)
    ctx.fillStyle = "#f4d166";
    ctx.font = "20px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.fillText(`LEVEL: ${state.level}`, 40, 55);

    ctx.textAlign = "right";
    ctx.fillText(`SCORE: ${state.score}`, canvas.width - 40, 55);

    // Dibuja vidas de jugadores
    if (state.players.length === 1) {
        // Modo 1 jugador: vidas a la izquierda
        drawPlayerLives(state.players[0], 65, 'left');
    } else if (state.players.length > 1) {
        // Modo 2 jugadores: vidas de P1 a izq, de P2 a derecha
        drawPlayerLives(state.players[0], 65, 'left');
        drawPlayerLives(state.players[1], canvas.width - 65, 'right');
    }
}

/**
 * Muestra la cuenta regresiva (3, 2, 1, GO!) antes de iniciar el juego
 * Se ejecuta después de que el jugador presiona "Start"
 */
function startCountdown() {
    state.countingDown = true;
    countdownEl.classList.remove('hidden'); // Muestra elemento de cuenta
    let count = 3;

    const timer = setInterval(() => {
        if (count > 0) {
            countdownEl.textContent = count; // Muestra 3, 2, 1
        } else if (count === 0) {
            countdownEl.textContent = "GO!";  // Muestra GO!
        } else {
            // Cuenta finalizada
            clearInterval(timer);
            countdownEl.classList.add('hidden');  // Oculta elemento
            state.countingDown = false;
            state.active = true;                  // Inicia el juego
            spawnWave();                          // Genera primera ola de enemigos
            gameLoop();                           // Inicia el loop principal
            return;
        }
        count--;
    }, 1000); // Intervalo de 1 segundo
}

/**
 * Loop principal del juego
 * Se ejecuta continuamente (60 FPS) mientras el juego está activo
 * Actualiza el estado y renderiza la pantalla
 */
function gameLoop() {
    if (state.active) {
        update();                        // Actualiza lógica del juego
        draw();                          // Renderiza todo
        requestAnimationFrame(gameLoop); // Siguiente frame
    }
}

// --- EVENT LISTENERS GLOBALES ---

// Detecta teclas presionadas y actualiza el estado
window.addEventListener('keydown', e => state.keys[e.code] = true);

// Detecta teclas soltadas y actualiza el estado
window.addEventListener('keyup', e => state.keys[e.code] = false);

// --- INICIALIZACIÓN DEL JUEGO ---

/**
 * Se ejecuta cuando el documento está completamente cargado
 * Verifica que initGame exista y la ejecuta
 */
window.onload = () => {
    if (typeof initGame === 'function') {
        initGame(); // Inicializa el juego
    } else {
        console.error("initGame function is missing!");
    }
};

/**
 * Inicializa todos los parámetros del juego
 * Configura: jugadores, controles, colores, resetea estado
 * También inicia la cuenta regresiva si los parámetros son válidos
 */
function initGame() {
    // Resetea puntuación y nivel
    state.score = 0;
    state.level = 1;
    state.lives = 3;

    // Resetea estados del juego
    state.active = false;
    state.countingDown = false;
    state.activeItems = [];
    state.lasers = [];
    state.enemyLasers = [];
    state.enemies = [];
    state.rowsState = [];

    // --- Configuración de controles ---
    // Jugador 1: Flechas y espacio para disparar
    const primaryControls = {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        shoot: ['ArrowUp', 'Space']  // Puede usar flecha arriba O espacio
    };

    // Jugador 2: WASD para movimiento, W para disparar
    const secondaryControls = {
        left: 'KeyA',
        right: 'KeyD',
        shoot: 'KeyW'
    };

    // Obtiene colores de los parámetros de URL
    const primaryColor = normalizeShipColor(selectedShipColor);   // Color P1 (del menú)
    const secondaryColor = getAlternateShipColor(primaryColor);   // Color P2 (alterno automático)

    // Crea el jugador 1
    state.players = [
        new Player(1, primaryControls, getPlayerStartPosition(0, 1), primaryColor)
    ];

    // Si es modo multijugador, añade jugador 2
    if (state.isMultiplayer) {
        state.players[0].x = getPlayerStartPosition(0, 2); // Reposiciona P1 a la izquierda
        state.players.push(new Player(2, secondaryControls, getPlayerStartPosition(1, 2), secondaryColor));
    }

    // Referencia del jugador principal (para compatibilidad)
    state.player = state.players[0];

    // Verifica que el juego fue iniciado desde la pantalla de inicio
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('start') === 'true') {
        startCountdown(); // Inicia la cuenta regresiva
    }
}
