/**
 * main.js - Point d'entrée principal du jeu Célis Sound Engineer PRO
 */

const CHART_UPDATE_INTERVAL = 1000; // 1 seconde
const EVENT_CHECK_INTERVAL = 8000;  // 8 secondes

let lastTimestamp = Date.now();
let lastChartUpdate = Date.now();
let lastEventCheck = Date.now();

/**
 * Boucle de jeu principale (Game Loop 60 FPS).
 */
function gameLoop(timestamp) {
    const currentMs = Date.now();
    const deltaTime = Math.min(1.0, (currentMs - lastTimestamp) / 1000);
    lastTimestamp = currentMs;

    // 1. Mise à jour de la production, de l'énergie et des timers
    updateProduction(deltaTime);

    // 2. Temps de jeu cumulé
    GameState.stats.playtimeSeconds = (GameState.stats.playtimeSeconds || 0) + deltaTime;

    // 3. Mise à jour des affichages temps réel
    updateResourceDisplay();
    updateProductionDisplay();
    if (typeof updateActiveTabDisplay === 'function') {
        updateActiveTabDisplay();
    }

    // 4. Échantillonnage pour graphiques (1x/sec)
    if (currentMs - lastChartUpdate >= CHART_UPDATE_INTERVAL) {
        if (typeof recordProductionSample === 'function') recordProductionSample();
        if (typeof recordFameSample === 'function') recordFameSample();
        lastChartUpdate = currentMs;
    }

    // 5. Vérification des événements aléatoires
    if (currentMs - lastEventCheck >= EVENT_CHECK_INTERVAL) {
        lastEventCheck = currentMs;
        const event = tryTriggerEvent();
        if (event) {
            playEventSound();
            showEventNotification(event);
            updateResourceDisplay();
            checkAndNotifyAchievements();
        }
    }

    // 6. Vérification périodique des succès
    checkAndNotifyAchievements();

    requestAnimationFrame(gameLoop);
}

/**
 * Initialisation au chargement de la page.
 */
function initGame() {
    console.log('🎛️ Célis Sound Engineer PRO - Démarrage du studio...');

    // Charge la sauvegarde existante
    loadGame();

    // Initialise les sous-systèmes
    if (typeof initSequencer === 'function') initSequencer();
    if (typeof initQuests === 'function') initQuests();

    initUI();
    if (typeof initVisualizer === 'function') initVisualizer();
    if (typeof initMinigames === 'function') initMinigames();

    // Applique les gains accumulés hors-ligne avec la modale stylée
    const offlineGains = applyOfflineGains();
    if (offlineGains && offlineGains.money > 0) {
        setTimeout(() => {
            if (typeof showOfflineGainsModal === 'function') {
                showOfflineGainsModal(offlineGains.time, offlineGains.money);
            }
        }, 500);
    }

    // Affiche l'ensemble de l'interface
    updateAllDisplay();

    // Vérifie les succès
    checkAndNotifyAchievements();

    // Démarre la sauvegarde automatique
    startAutoSave();

    // Lance la boucle de jeu
    lastTimestamp = Date.now();
    requestAnimationFrame(gameLoop);

    console.log('✅ Studio audio entièrement opérationnel !');
}

function formatOfflineTime(seconds) {
    if (seconds < 60) return Math.floor(seconds) + ' secondes';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes';
    return Math.floor(seconds / 3600) + ' heures ' + Math.floor((seconds % 3600) / 60) + ' min';
}

document.addEventListener('DOMContentLoaded', initGame);
