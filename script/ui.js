/**
 * UI & NAVIGATION CONTROLLER MODULE
 * Gestiona la navegación y control de interfaces:
 * - Pantalla de inicio (selección de modo 1/2 jugadores y color de nave)
 * - Pantalla final (mostrar resultado y puntuación)
 * - Reproducción de audio de YouTube
 */

// Se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA PÁGINA DE INICIO ---
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        // Referencias a elementos de la interfaz de inicio
        const opt1 = document.getElementById('opt1');
        const opt2 = document.getElementById('opt2');
        const howToBtn = document.getElementById('howToBtn');
        const shipColorBtn = document.getElementById('shipColorBtn');
        const howToModal = document.getElementById('howToModal');
        const shipColorModal = document.getElementById('shipColorModal');
        const closeModal = document.getElementById('closeModal');
        const cancelColorBtn = document.getElementById('cancelColorBtn');

        // Variables para almacenar la selección del usuario
        let players = 1; // Modo de juego: 1 o 2 jugadores
        let shipColor = 'aqua'; // Color de la nave seleccionado

        /**
         * Actualiza la selección de modo de juego (1 o 2 jugadores)
         * @param {number} num - Número de jugadores (1 o 2)
         */
        const updateSelector = (num) => {
            players = num;
            // Marca visualmente la opción seleccionada
            opt1.classList.toggle('active', num === 1);
            opt2.classList.toggle('active', num === 2);
            // Actualiza el texto con prefijo ">" para opción activa
            opt1.querySelector('.retro-text').textContent = num === 1 ? '> 1 PLAYER' : '  1 PLAYER';
            opt2.querySelector('.retro-text').textContent = num === 2 ? '> 2 PLAYERS' : '  2 PLAYERS';
        };

        /**
         * Actualiza la selección de color de nave
         * @param {string} color - Color seleccionado (aqua, magenta, gold)
         * @param {boolean} hideModal - Si true, cierra el modal después de seleccionar
         */
        const colorOptions = Array.from(document.querySelectorAll('.color-option'));
        const updateColor = (color, hideModal = false) => {
            shipColor = color;
            // Actualiza cada opción de color en el modal
            colorOptions.forEach(option => {
                const optionColor = option.dataset.color;
                const label = option.querySelector('.retro-text');
                // Marca la opción seleccionada con clase "active"
                option.classList.toggle('active', optionColor === color);
                if (label) label.textContent = optionColor === color ? `> ${optionColor.toUpperCase()}` : `  ${optionColor.toUpperCase()}`;
            });
            // Cierra el modal si se especifica
            if (hideModal && shipColorModal) shipColorModal.classList.add('hidden');
        };

        // --- Event Listeners para selección de modo ---
        opt1.onclick = () => updateSelector(1);
        opt2.onclick = () => updateSelector(2);

        // --- Event Listeners para selección de color ---
        colorOptions.forEach(option => {
            option.onclick = () => updateColor(option.dataset.color, true);
        });

        /**
         * Inicia el juego con los parámetros seleccionados
         * Pasa los valores por URL: players y shipColor
         */
        startBtn.onclick = () => {
            window.location.href = `../index.html?start=true&players=${players}&shipColor=${shipColor}`;
        };

        // --- Event Listeners para modales ---
        howToBtn.onclick = () => howToModal.classList.remove('hidden');
        shipColorBtn.onclick = () => shipColorModal.classList.remove('hidden');
        closeModal.onclick = () => howToModal.classList.add('hidden');
        cancelColorBtn.onclick = () => shipColorModal.classList.add('hidden');

        // Cierra modal si se hace click fuera de él
        window.onclick = (e) => {
            if (e.target === howToModal) howToModal.classList.add('hidden');
            if (e.target === shipColorModal) shipColorModal.classList.add('hidden');
        };

        // Inicializa color por defecto (aqua)
        updateColor('aqua');
    }

    // --- LÓGICA PÁGINA FINAL ---
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        // Recupera el resultado del juego y puntuación del localStorage
        const finalScore = localStorage.getItem('finalScore') || 0;
        const gameResult = localStorage.getItem('gameResult') || 'LOSS';

        // Referencias a elementos de la pantalla final
        const winTitle = document.getElementById('winTitle');
        const lossTitle = document.getElementById('lossTitle');
        const scoreDisplay = document.getElementById('finalScoreNum');

        // Muestra la puntuación final
        if (scoreDisplay) scoreDisplay.textContent = finalScore;

        // Muestra mensaje de victoria o derrota según el resultado
        if (gameResult === 'WIN') {
            winTitle?.classList.remove('hidden');
            lossTitle?.classList.add('hidden');
        } else {
            lossTitle?.classList.remove('hidden');
            winTitle?.classList.add('hidden');
        }

        // Botón para reiniciar el juego (vuelve a inicio)
        restartBtn.onclick = () => {
            window.location.href = 'inicio.html';
        };
    }
});

// --- YOUTUBE API CALLBACK ---
/**
 * Se ejecuta automáticamente cuando la API de YouTube está lista
 * Crea un reproductor de YouTube para reproducir audio de fondo
 * Detecta automáticamente si estamos en la pantalla de inicio o final
 */
function onYouTubeIframeAPIReady() {
    const ytContainer = document.getElementById('ytplayer');
    if (!ytContainer) return;

    // Detecta si estamos en pantalla final o inicio para reproducir diferente música
    const isFinalPage = !!document.getElementById('restartBtn');
    const videoId = isFinalPage ? 'Sz_kQuEM0mI' : 'XCV9kWbC31A';

    // Crea el reproductor con autoplay y loop
    new YT.Player('ytplayer', {
        height: '0', width: '0', // Player invisible (solo audio)
        videoId: videoId,
        playerVars: { 'autoplay': 1, 'loop': 1, 'playlist': videoId, 'controls': 0 },
        events: { 'onReady': (e) => { e.target.setVolume(40); e.target.playVideo(); } }
    });
}
