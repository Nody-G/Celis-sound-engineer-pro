/**
 * visualizer.js - Visualiseur spectral Canvas, VU-Mètres et effets de particules
 * 
 * Anime en temps réel le spectre audio, les aiguilles/barres des VU-mètres stéréo,
 * et gère les explosions de particules (notes de musique, pièces dorées, textes critiques).
 */

// Canvas & contexte
let visualizerCanvas = null;
let visualizerCtx = null;
let particles = [];
let animFrameId = null;

// Données d'analyse
let frequencyData = new Uint8Array(64);

/**
 * Initialise le visualiseur Canvas et les effets visuels.
 */
function initVisualizer() {
    visualizerCanvas = document.getElementById('audio-visualizer');
    if (visualizerCanvas) {
        visualizerCtx = visualizerCanvas.getContext('2d');
        resizeVisualizer();
        window.addEventListener('resize', resizeVisualizer);
    }

    // Lance la boucle d'animation graphique
    if (!animFrameId) {
        renderVisualizerLoop();
    }
}

/**
 * Redimensionne le canvas selon la largeur de son conteneur.
 */
function resizeVisualizer() {
    if (!visualizerCanvas) return;
    visualizerCanvas.width = visualizerCanvas.parentElement ? visualizerCanvas.parentElement.clientWidth : 600;
    visualizerCanvas.height = 100;
}

/**
 * Boucle principale de rendu du visualiseur (60 FPS).
 */
function renderVisualizerLoop() {
    animFrameId = requestAnimationFrame(renderVisualizerLoop);

    if (!visualizerCtx || !visualizerCanvas) return;
    const width = visualizerCanvas.width;
    const height = visualizerCanvas.height;

    // Effacement avec traînée de flou (effet phosphor / neon glow)
    visualizerCtx.fillStyle = 'rgba(10, 10, 26, 0.25)';
    visualizerCtx.fillRect(0, 0, width, height);

    // Récupère les données de fréquence si le Web Audio est actif
    const analyser = typeof getAudioAnalyser === 'function' ? getAudioAnalyser() : null;
    if (analyser) {
        if (frequencyData.length !== analyser.frequencyBinCount) {
            frequencyData = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(frequencyData);
    } else {
        // Mode simulation si l'audio n'est pas encore débloqué par le joueur
        const time = Date.now() * 0.003;
        for (let i = 0; i < frequencyData.length; i++) {
            const base = Math.sin(time + i * 0.2) * 40 + 50;
            const boost = (GameState && GameState.hype && GameState.hype.isFrenzy) ? 70 : 20;
            frequencyData[i] = Math.max(10, Math.min(255, base + boost));
        }
    }

    const isFrenzy = GameState && GameState.hype && GameState.hype.isFrenzy;
    const mode = (GameState && GameState.settings && GameState.settings.visualizerMode) ? GameState.settings.visualizerMode : 'bars';

    if (mode === 'wave') {
        // MODE 2 : Oscilloscope Analogique Vintage (Onde sinusoïdale continue)
        visualizerCtx.beginPath();
        visualizerCtx.lineWidth = isFrenzy ? 4 : 2.5;
        visualizerCtx.strokeStyle = isFrenzy ? '#ff007f' : '#00f2fe';
        visualizerCtx.shadowBlur = isFrenzy ? 16 : 10;
        visualizerCtx.shadowColor = isFrenzy ? '#ffd700' : '#00f2fe';

        const sliceWidth = width / (frequencyData.length / 2);
        let x = 0;

        for (let i = 0; i < frequencyData.length / 2; i++) {
            const v = frequencyData[i] / 255.0;
            const y = (height / 2) + ((v - 0.5) * (height * 0.8));

            if (i === 0) {
                visualizerCtx.moveTo(x, y);
            } else {
                visualizerCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        visualizerCtx.stroke();
        visualizerCtx.shadowBlur = 0;

    } else if (mode === 'radial') {
        // MODE 3 : Cercle Spectral Radial Cyberpunk
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.45;
        const barCount = 36;

        visualizerCtx.save();
        visualizerCtx.translate(centerX, centerY);

        for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2;
            const dataIndex = Math.floor((i / barCount) * (frequencyData.length / 2));
            const value = frequencyData[dataIndex] || 10;
            const barLen = Math.max(3, (value / 255) * (radius * 1.2));

            const x1 = Math.cos(angle) * radius;
            const y1 = Math.sin(angle) * radius;
            const x2 = Math.cos(angle) * (radius + barLen);
            const y2 = Math.sin(angle) * (radius + barLen);

            visualizerCtx.beginPath();
            visualizerCtx.moveTo(x1, y1);
            visualizerCtx.lineTo(x2, y2);
            visualizerCtx.lineWidth = 3;
            visualizerCtx.strokeStyle = isFrenzy ? '#ffd700' : (i % 2 === 0 ? '#00f2fe' : '#ff007f');
            visualizerCtx.shadowBlur = isFrenzy ? 12 : 6;
            visualizerCtx.shadowColor = isFrenzy ? '#ff007f' : '#00f2fe';
            visualizerCtx.stroke();
        }

        visualizerCtx.restore();
        visualizerCtx.shadowBlur = 0;

    } else {
        // MODE 1 : Barres Égaliseur Néon Standard (DSP 32-bandes)
        const barCount = 32;
        const barWidth = (width / barCount) - 3;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * (frequencyData.length / 2));
            const value = frequencyData[dataIndex] || 10;
            const percent = value / 255;
            const barHeight = Math.max(4, percent * (height - 10));

            const x = i * (barWidth + 3) + 2;
            const y = height - barHeight;

            // Dégradé de couleur selon l'intensité (Cyan -> Magenta -> Gold en Frenzy)
            const gradient = visualizerCtx.createLinearGradient(0, height, 0, y);
            if (isFrenzy) {
                gradient.addColorStop(0, '#ff007f');
                gradient.addColorStop(0.5, '#ffd700');
                gradient.addColorStop(1, '#ffffff');
            } else {
                gradient.addColorStop(0, '#00f2fe');
                gradient.addColorStop(0.6, '#4facfe');
                gradient.addColorStop(1, '#e94560');
            }

            visualizerCtx.fillStyle = gradient;
            visualizerCtx.shadowBlur = isFrenzy ? 15 : 8;
            visualizerCtx.shadowColor = isFrenzy ? '#ffd700' : '#00f2fe';

            visualizerCtx.fillRect(x, y, barWidth, barHeight);

            // Petit capuchon flottant au sommet
            visualizerCtx.fillStyle = isFrenzy ? '#ffffff' : '#ffd700';
            visualizerCtx.fillRect(x, Math.max(0, y - 4), barWidth, 2);
        }

        visualizerCtx.shadowBlur = 0;
    }

    // 2. Rendu et mise à jour des particules
    renderParticles(visualizerCtx);

    // 3. Mise à jour des VU-mètres stéréo
    updateVUMeters(frequencyData);
}

/**
 * Change le mode de visualisation actif ('bars', 'wave', 'radial').
 */
function setVisualizerMode(mode) {
    if (!GameState.settings) GameState.settings = {};
    GameState.settings.visualizerMode = mode;
    saveGame();
}

/**
 * Met à jour les barres LED des VU-Mètres stéréophoniques.
 */
function updateVUMeters(freqData) {
    const leftBar = document.getElementById('vu-meter-left-fill');
    const rightBar = document.getElementById('vu-meter-right-fill');
    if (!leftBar || !rightBar) return;

    let avg = 0;
    const len = Math.min(16, freqData.length);
    for (let i = 0; i < len; i++) {
        avg += freqData[i];
    }
    avg = (avg / len) / 255;

    // Ajoute un léger déphasage stéréo L/R
    const leftVal = Math.min(100, Math.max(5, (avg * 110 + Math.sin(Date.now() * 0.01) * 8)));
    const rightVal = Math.min(100, Math.max(5, (avg * 105 + Math.cos(Date.now() * 0.012) * 8)));

    leftBar.style.width = leftVal + '%';
    rightBar.style.width = rightVal + '%';
}

/**
 * Crée une explosion de particules visuelles à une position écran.
 */
function spawnParticleBurst(x, y, count = 10, type = 'note') {
    const icons = ['🎵', '🎶', '✨', '⚡', '💰', '⭐'];

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        particles.push({
            x: x || (visualizerCanvas ? visualizerCanvas.width / 2 : 200),
            y: y || (visualizerCanvas ? visualizerCanvas.height / 2 : 50),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: Math.random() * 14 + 12,
            icon: icons[Math.floor(Math.random() * icons.length)],
            alpha: 1.0,
            decay: Math.random() * 0.02 + 0.02,
            rotation: Math.random() * 360,
            vRot: (Math.random() - 0.5) * 10
        });
    }
}

/**
 * Dessine et met à jour toutes les particules actives.
 */
function renderParticles(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Gravité
        p.alpha -= p.decay;
        p.rotation += p.vRot;

        if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillText(p.icon, 0, 0);
        ctx.restore();
    }
}

/**
 * Affiche un texte flottant dynamique, lisible et juteux (Clics, Achats, Déblocages, Alertes).
 */
function spawnFloatingText(text, targetEl, isCrit = false, customDurationMs = null) {
    if (typeof document === 'undefined' || !text) return;

    const strText = String(text);
    const isWarning = strText.includes('⚠️') || strText.includes('❌');
    const isSimpleClick = !isCrit && !isWarning && (/^[+-\s]*[\d.,\s]+[$⭐⚡📼]/.test(strText.trim()) || strText.startsWith('Combo'));

    // Durée d'affichage : courte pour les micro-clics, confortable pour les messages lisibles
    let duration = customDurationMs;
    if (!duration) {
        if (isSimpleClick) duration = 1400;
        else if (isCrit || strText.includes('🏆') || strText.includes('🎉') || strText.includes('🎹') || strText.includes('👑')) duration = 3800;
        else if (isWarning) duration = 3200;
        else duration = 2800;
    }

    const floatEl = document.createElement('div');
    floatEl.className = 'floating-text' +
        (isSimpleClick ? ' simple-click' : '') +
        (isCrit ? ' crit special' : '') +
        (isWarning ? ' warning' : '');
    
    floatEl.textContent = text;
    floatEl.style.animationDuration = `${(duration / 1000).toFixed(2)}s`;

    let posX = window.innerWidth / 2;
    let posY = window.innerHeight / 2;

    if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
        const rect = targetEl.getBoundingClientRect();
        const offsetX = (Math.random() - 0.5) * 30;
        posX = Math.max(120, Math.min(window.innerWidth - 120, rect.left + rect.width / 2 + offsetX));
        posY = Math.max(80, rect.top + (rect.height ? rect.height / 2 : 0) - 15);
    }

    floatEl.style.left = `${posX}px`;
    floatEl.style.top = `${posY}px`;

    document.body.appendChild(floatEl);

    setTimeout(() => {
        if (floatEl.parentNode) floatEl.remove();
    }, duration);

    return floatEl;
}

/**
 * Déclenche un effet visuel dynamique sur la platine sans bouger la fenêtre.
 */
function triggerScreenShake() {
    const turntable = document.getElementById('studio-turntable');
    if (turntable) {
        turntable.classList.add('turntable-scratch');
        setTimeout(() => turntable.classList.remove('turntable-scratch'), 200);
    }
}
