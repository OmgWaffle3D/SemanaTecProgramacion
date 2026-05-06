// --- US-8: Item System Configuration ---
const ITEM_SETTINGS = {
    DROP_CHANCE: 0.15, // 15% probability
    TYPES: {
        DOUBLE_SHOT: { name: 'DOUBLE_SHOT', color: '#FF00FF', duration: 10000 }, // 10s duration
        SHIELD: { name: 'SHIELD', color: '#00FFFF' }, // Protects against 1 impact
        RECOVERY: { name: 'RECOVERY', color: '#00FF00' } // Restores 1 life
    }
};

let activeItems = []; // Array to store items currently falling on screen

// Function to drop an item when an enemy is destroyed
function dropItem(x, y) {
    if (Math.random() <= ITEM_SETTINGS.DROP_CHANCE) {
        const types = Object.values(ITEM_SETTINGS.TYPES);
        const selected = types[Math.floor(Math.random() * types.length)];
        activeItems.push({ x, y, ...selected, speed: 2 });
    }
}

// Function to apply effects when player collects an item
function collectItem(item) {
    if (item.name === 'DOUBLE_SHOT') {
        playerState.hasDoubleShot = true;
        setTimeout(() => { playerState.hasDoubleShot = false; }, item.duration);
    } else if (item.name === 'SHIELD') {
        playerState.hasShield = true;
    } else if (item.name === 'RECOVERY') {
        playerState.lives += 1; // Restore 1 life
    }
}
