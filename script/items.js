/**
 * ITEMS SYSTEM MODULE
 * Gestiona la lógica de items especiales que caen cuando se destruyen enemigos
 * Incluye: DOUBLE_SHOT (disparo doble), SHIELD (escudo), RECOVERY (recuperar vida)
 */

// --- Configuración de Items ---
const ITEM_SETTINGS = {
    DROP_CHANCE: 0.15, // 15% de probabilidad de soltar un item al destruir un enemigo
    TYPES: {
        // Disparo doble: permite disparar 2 proyectiles simultáneamente por 10 segundos
        DOUBLE_SHOT: { name: 'DOUBLE_SHOT', color: '#FF00FF', duration: 10000 },
        // Escudo: protege al jugador de 1 impacto de enemigo
        SHIELD: { name: 'SHIELD', color: '#00FFFF' },
        // Recuperación: suma 1 vida al jugador (máx 5 vidas)
        RECOVERY: { name: 'RECOVERY', color: '#00FF00' }
    }
};

// Array que almacena todos los items activos (cayendo en pantalla)
let activeItems = [];

/**
 * Genera un item aleatorio cuando se destruye un enemigo
 * @param {number} x - Posición X del enemigo destruido
 * @param {number} y - Posición Y del enemigo destruido
 */
function dropItem(x, y) {
    // 15% de probabilidad de que caiga un item
    if (Math.random() <= ITEM_SETTINGS.DROP_CHANCE) {
        const types = Object.values(ITEM_SETTINGS.TYPES);
        const selected = types[Math.floor(Math.random() * types.length)];
        // Añade el item al array con posición inicial y velocidad de caída
        activeItems.push({ x, y, ...selected, speed: 2 });
    }
}

/**
 * Aplica el efecto del item recolectado al jugador
 * @param {Object} item - Objeto item con su tipo y duración
 */
function collectItem(item) {
    if (item.name === 'DOUBLE_SHOT') {
        // Activa disparo doble y lo desactiva después de su duración
        playerState.hasDoubleShot = true;
        setTimeout(() => { playerState.hasDoubleShot = false; }, item.duration);
    } else if (item.name === 'SHIELD') {
        // Activa el escudo (se desactiva al recibir un impacto)
        playerState.hasShield = true;
    } else if (item.name === 'RECOVERY') {
        // Suma 1 vida al jugador (con límite máximo)
        playerState.lives += 1;
    }
}
