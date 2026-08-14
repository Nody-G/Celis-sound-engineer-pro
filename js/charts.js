/**
 * charts.js - Graphiques de progression
 * 
 * Affiche des graphiques simples en SVG pour visualiser la progression.
 * Utilise uniquement du SVG natif, sans bibliothèque externe.
 */

// Historique de production (échantillons)
const productionHistory = [];
const MAX_HISTORY_POINTS = 60; // 60 points = 1 minute à 1 point/seconde

// Historique de renommée
const fameHistory = [];

/**
 * Enregistre un échantillon de production.
 */
function recordProductionSample() {
    const passive = getPassiveProduction();
    const boosterMult = getBoosterProductionMultiplier();

    productionHistory.push({
        time: Date.now(),
        passive: passive,
        effective: passive * boosterMult,
    });

    // Limite la taille de l'historique
    if (productionHistory.length > MAX_HISTORY_POINTS) {
        productionHistory.shift();
    }
}

/**
 * Enregistre un échantillon de renommée.
 */
function recordFameSample() {
    fameHistory.push({
        time: Date.now(),
        fame: GameState.resources.fame,
    });

    // Limite la taille de l'historique
    if (fameHistory.length > MAX_HISTORY_POINTS) {
        fameHistory.shift();
    }
}

/**
 * Génère un graphique SVG de production.
 * @param {HTMLElement} container - Élément conteneur
 */
function renderProductionChart(container) {
    if (!container) return;

    const width = 300;
    const height = 100;
    const padding = 5;

    // Calcule les valeurs max
    let maxValue = 1;
    for (const sample of productionHistory) {
        maxValue = Math.max(maxValue, sample.effective);
    }

    // Génère les points du graphique
    let points = '';
    for (let i = 0; i < productionHistory.length; i++) {
        const x = padding + (i / (MAX_HISTORY_POINTS - 1)) * (width - 2 * padding);
        const y = height - padding - (productionHistory[i].effective / maxValue) * (height - 2 * padding);
        points += x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }

    // Si pas assez de points, ajoute un point de départ
    if (productionHistory.length < 2) {
        points = padding + ',' + (height - padding) + ' ' + points;
    }

    const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(0,0,0,0.2)" rx="5"/>
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#444" stroke-width="1"/>
            <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#444" stroke-width="1"/>
            <polyline points="${points.trim()}" fill="none" stroke="#4caf50" stroke-width="2"/>
            <text x="${width - 5}" y="${height - 5}" fill="#888" font-size="8" text-anchor="end">Production $/s</text>
        </svg>
    `;

    container.innerHTML = svg;
}

/**
 * Génère un graphique SVG de renommée.
 * @param {HTMLElement} container - Élément conteneur
 */
function renderFameChart(container) {
    if (!container) return;

    const width = 300;
    const height = 100;
    const padding = 5;

    // Calcule les valeurs max
    let maxValue = 1;
    for (const sample of fameHistory) {
        maxValue = Math.max(maxValue, sample.fame);
    }

    // Génère les points du graphique
    let points = '';
    for (let i = 0; i < fameHistory.length; i++) {
        const x = padding + (i / (MAX_HISTORY_POINTS - 1)) * (width - 2 * padding);
        const y = height - padding - (fameHistory[i].fame / maxValue) * (height - 2 * padding);
        points += x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }

    if (fameHistory.length < 2) {
        points = padding + ',' + (height - padding) + ' ' + points;
    }

    const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(0,0,0,0.2)" rx="5"/>
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#444" stroke-width="1"/>
            <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#444" stroke-width="1"/>
            <polyline points="${points.trim()}" fill="none" stroke="#ffd700" stroke-width="2"/>
            <text x="${width - 5}" y="${height - 5}" fill="#888" font-size="8" text-anchor="end">Renommée ⭐</text>
        </svg>
    `;

    container.innerHTML = svg;
}

/**
 * Génère une barre de progression.
 * @param {HTMLElement} container - Élément conteneur
 * @param {number} progress - Progression (0-100)
 * @param {string} color - Couleur de la barre
 */
function renderProgressBar(container, progress, color = '#ffd700') {
    if (!container) return;

    const clamped = Math.max(0, Math.min(100, progress));

    container.innerHTML = `
        <div class="progress-bar-container" style="background: rgba(0,0,0,0.3); border-radius: 8px; overflow: hidden; height: 16px; position: relative; border: 1px solid rgba(255,255,255,0.1);">
            <div class="progress-bar-fill" style="width: ${clamped}%; background: ${color}; height: 100%; transition: width 0.3s ease;"></div>
            <span class="progress-bar-label" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #fff; text-shadow: 0 1px 2px #000;">${clamped.toFixed(1)}%</span>
        </div>
    `;
}

/**
 * Met à jour l'ensemble des graphiques et barres de progression de l'onglet stats.
 */
function updateChartsDisplay() {
    const prodContainer = document.getElementById('production-chart');
    const fameContainer = document.getElementById('fame-chart');
    const overallContainer = document.getElementById('overall-progress');

    if (prodContainer) renderProductionChart(prodContainer);
    if (fameContainer) renderFameChart(fameContainer);
    if (overallContainer && typeof getOverallProgress === 'function') {
        renderProgressBar(overallContainer, getOverallProgress(), 'linear-gradient(90deg, #00f2fe, #ffd700)');
    }
}

