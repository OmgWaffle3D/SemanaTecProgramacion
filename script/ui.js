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
        const shipColorBtn = document.getElementById('shipColorBtn');
        const howToModal = document.getElementById('howToModal');
        const shipColorModal = document.getElementById('shipColorModal');
        const closeModal = document.getElementById('closeModal');
        const cancelColorBtn = document.getElementById('cancelColorBtn');
        
        let players = 1;
        let shipColor = 'aqua';

        const updateSelector = (num) => {
            players = num;
            opt1.classList.toggle('active', num === 1);
            opt2.classList.toggle('active', num === 2);
            opt1.querySelector('.retro-text').textContent = num === 1 ? '> 1 PLAYER' : '  1 PLAYER';
            opt2.querySelector('.retro-text').textContent = num === 2 ? '> 2 PLAYERS' : '  2 PLAYERS';
        };

        const colorOptions = Array.from(document.querySelectorAll('.color-option'));
        const updateColor = (color, hideModal = false) => {
            shipColor = color;
            colorOptions.forEach(option => {
                const optionColor = option.dataset.color;
                const label = option.querySelector('.retro-text');
                option.classList.toggle('active', optionColor === color);
                if (label) label.textContent = optionColor === color ? `> ${optionColor.toUpperCase()}` : `  ${optionColor.toUpperCase()}`;
            });
            if (hideModal && shipColorModal) shipColorModal.classList.add('hidden');
        };

        opt1.onclick = () => updateSelector(1);
        opt2.onclick = () => updateSelector(2);

        colorOptions.forEach(option => {
            option.onclick = () => updateColor(option.dataset.color, true);
        });
        
        startBtn.onclick = () => {
            window.location.href = `../index.html?start=true&players=${players}&shipColor=${shipColor}`;
        };

        howToBtn.onclick = () => howToModal.classList.remove('hidden');
        shipColorBtn.onclick = () => shipColorModal.classList.remove('hidden');
        closeModal.onclick = () => howToModal.classList.add('hidden');
        cancelColorBtn.onclick = () => shipColorModal.classList.add('hidden');
        
        window.onclick = (e) => {
            if (e.target === howToModal) howToModal.classList.add('hidden');
            if (e.target === shipColorModal) shipColorModal.classList.add('hidden');
        };

        updateColor('aqua');
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
const MAX_HIGH_SCORES = 5;

function saveAndDisplayHighScore(currentScore) {
    const highScores = JSON.parse(localStorage.getItem('spaceShooterScores')) || [];

    const newScoreObj = {
        score: currentScore,
        name: 'Player' 
    };
    highScores.push(newScoreObj);

    highScores.sort((a, b) => b.score - a.score);

    highScores.splice(MAX_HIGH_SCORES);

    localStorage.setItem('spaceShooterScores', JSON.stringify(highScores));

    updateHighScoreUI(highScores);
}

function updateHighScoreUI(highScores) {
    const listElement = document.getElementById('highScoresList');

    listElement.innerHTML = highScores
        .map(scoreObj => {
            return `<li class="score-item">
                        <span>${scoreObj.name}</span>
                        <span>${scoreObj.score}</span>
                    </li>`;
        })
        .join('');
}

let puntajeFinalDelJugador = 1500; 
document.getElementById('finalScoreNum').innerText = puntajeFinalDelJugador;
saveAndDisplayHighScore(puntajeFinalDelJugador);
