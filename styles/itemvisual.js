/* Item Visuals */
.power-up {
    filter: drop-shadow(0 0 5px white);
    animation: pulse 1s infinite alternate;
}

/* Shield Effect for Player */
.player-shield {
    border: 2px solid #00FFFF;
    box-shadow: 0 0 15px #00FFFF;
    border-radius: 50%;
}

@keyframes pulse {
    from { transform: scale(1); }
    to { transform: scale(1.2); }
}
