/**
 * UI & Navigation Controller
 * Handles start screen, final screen and game-state retrieval.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica Página Inicio ---
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        const opt1 = document.getElementById('opt1');
        const opt2 = document.getElementById('opt2');
        const howToBtn = document.getElementById('howToBtn');
        const howToModal = document.getElementById('howToModal');
        const closeModal = document.getElementById('closeModal');
        
        let players = 1;

        const updateSelector = (num) => {
            players = num;
            opt1.classList.toggle('active', num === 1);
            opt2.classList.toggle('active', num === 2);
            opt1.querySelector('.retro-text').textContent = num === 1 ? '> 1 PLAYER' : '  1 PLAYER';
            opt2.querySelector('.retro-text').textContent = num === 2 ? '> 2 PLAYERS' : '  2 PLAYERS';
        };

        opt1.onclick = () => updateSelector(1);
        opt2.onclick = () => updateSelector(2);
        
        startBtn.onclick = () => {
            window.location.href = `../index.html?start=true&players=${players}`;
        };

        howToBtn.onclick = () => howToModal.classList.remove('hidden');
        closeModal.onclick = () => howToModal.classList.add('hidden');
        
        window.onclick = (e) => { if (e.target === howToModal) howToModal.classList.add('hidden'); };
    }

    // --- Lógica Página Final ---
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        const finalScore = localStorage.getItem('finalScore') || 0;
        const gameResult = localStorage.getItem('gameResult') || 'LOSS';
        
        const winTitle = document.getElementById('winTitle');
        const lossTitle = document.getElementById('lossTitle');
        const scoreDisplay = document.getElementById('finalScoreNum');

        if (scoreDisplay) scoreDisplay.textContent = finalScore;

        if (gameResult === 'WIN') {
            winTitle?.classList.remove('hidden');
            lossTitle?.classList.add('hidden');
        } else {
            lossTitle?.classList.remove('hidden');
            winTitle?.classList.add('hidden');
        }

        restartBtn.onclick = () => {
            window.location.href = 'inicio.html';
        };
    }
});

// --- YouTube API Dinámica ---
function onYouTubeIframeAPIReady() {
    const ytContainer = document.getElementById('ytplayer');
    if (!ytContainer) return;

    // Detectamos si estamos en la pantalla final o de inicio
    const isFinalPage = !!document.getElementById('restartBtn');
    const videoId = isFinalPage ? 'Sz_kQuEM0mI' : 'XCV9kWbC31A';

    new YT.Player('ytplayer', {
        height: '0', width: '0',
        videoId: videoId,
        playerVars: { 'autoplay': 1, 'loop': 1, 'playlist': videoId, 'controls': 0 },
        events: { 'onReady': (e) => { e.target.setVolume(40); e.target.playVideo(); } }
    });
}
