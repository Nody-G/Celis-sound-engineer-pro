/**
 * minigame.js - Mini-jeux interactifs, Beat Pads et Vinyles Dorés volants
 * 
 * Ajoute des mécaniques actives ultra stimulantes :
 * - Beat Pads jouables (Kick, Snare, Hi-Hat, Synth) générant combos et micro-cash
 * - Mastering EQ Lab (curseurs Basses/Médiums/Aigus avec sweet spot)
 * - Vinyles Dorés Flottants (événements surprises interactifs sur l'écran)
 */

// Intervalle d'apparition des vinyles dorés (en ms)
let goldenVinylTimer = null;

/**
 * Initialise les mini-jeux et lance le timer des vinyles dorés.
 */
function initMinigames() {
    scheduleNextGoldenVinyl();
}

// Presets de gammes musicales pour les 8 boutons
const SCALE_PRESETS = {
    synthwave: {
        name: '🌆 Synthwave (La Pentatonique)',
        notes: ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'E5'],
        bass:  ['A1', 'C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'E3'],
        pad:   ['Am', 'Cmaj', 'Dm', 'Em', 'Gmaj', 'Fmaj', 'Dm7', 'Am7']
    },
    french_touch: {
        name: '🥖 French Touch (Dorien)',
        notes: ['A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4', 'A4'],
        bass:  ['A1', 'B1', 'C2', 'D2', 'E2', 'F#2', 'G2', 'A2'],
        pad:   ['Am7', 'Bm7', 'Cmaj7', 'D7', 'Em7', 'Fmaj7', 'Gmaj7', 'Am9']
    },
    trap: {
        name: '🔥 Dark Trap (Phrygien)',
        notes: ['C3', 'Db3', 'Eb3', 'F3', 'G3', 'Ab3', 'Bb3', 'C4'],
        bass:  ['C1', 'Db1', 'Eb1', 'F1', 'G1', 'Ab1', 'Bb1', 'C2'],
        pad:   ['Am', 'Fmaj', 'Dm', 'Em', 'Cmaj', 'Fmaj7', 'Dm7', 'Am7']
    },
    lofi: {
        name: '☕ Lo-Fi (Neo-Soul)',
        notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'Eb5', 'G5'],
        bass:  ['C2', 'Eb2', 'F2', 'G2', 'Bb2', 'C3', 'Eb3', 'G3'],
        pad:   ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bdim', 'Cmaj9']
    },
    japanese: {
        name: '🌸 Gamme Japonaise (Insen)',
        notes: ['D3', 'Eb3', 'G3', 'A3', 'C4', 'D4', 'Eb4', 'G4'],
        bass:  ['D1', 'Eb1', 'G1', 'A1', 'C2', 'D2', 'Eb2', 'G2'],
        pad:   ['Dm', 'Fmaj', 'Gm', 'Am', 'Cmaj', 'Dm7', 'Fmaj7', 'Gm7']
    },
    major: {
        name: '☀️ Majeure Pop Énergique',
        notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        bass:  ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3'],
        pad:   ['Cmaj', 'Dm', 'Em', 'Fmaj', 'Gmaj', 'Am', 'Bdim', 'Cmaj7']
    }
};

/**
 * Récupère ou initialise l'état du contrôleur de pads.
 */
function getPadControllerState() {
    if (!GameState.padController) {
        GameState.padController = {
            mode: 'drumkit',
            scale: 'synthwave',
            customNotes: {
                synth:   ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'E5'],
                bass:    ['A1', 'C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'E3'],
                pad:     ['Am', 'Cmaj', 'Dm', 'Em', 'Gmaj', 'Fmaj', 'Dm7', 'Am7'],
                piano:   ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
                pluck:   ['A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'E6'],
                acid:    ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4'],
                strings: ['A3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5'],
                brass:   ['A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4', 'A4'],
                cosmic:  ['A3', 'C4', 'E4', 'G4', 'B4', 'D5', 'F#5', 'A5']
            }
        };
    }
    return GameState.padController;
}

/**
 * Récupère les 8 notes de l'instrument spécifié.
 */
function getCurrentPadNotes(instId) {
    const ctrl = getPadControllerState();
    if (ctrl.customNotes && ctrl.customNotes[instId]) {
        return ctrl.customNotes[instId];
    }
    return ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
}

/**
 * Applique un preset de gamme à un instrument ou à tous les instruments.
 */
function setPadScale(scaleKey, targetInst = null) {
    const ctrl = getPadControllerState();
    const preset = SCALE_PRESETS[scaleKey];
    if (!preset) return;

    ctrl.scale = scaleKey;
    const instruments = targetInst ? [targetInst] : Object.keys(ctrl.customNotes);

    instruments.forEach(inst => {
        if (inst === 'bass') {
            ctrl.customNotes[inst] = [...preset.bass];
        } else if (inst === 'pad') {
            ctrl.customNotes[inst] = [...preset.pad];
        } else {
            ctrl.customNotes[inst] = [...preset.notes];
        }
    });

    if (typeof renderBeatPadsUI === 'function') {
        renderBeatPadsUI();
    }
}

/**
 * Personnalise une note précise sur l'un des 8 pads.
 */
function setPadCustomNote(instId, padIdx, noteStr) {
    const ctrl = getPadControllerState();
    if (!ctrl.customNotes[instId]) {
        ctrl.customNotes[instId] = getCurrentPadNotes(instId);
    }
    if (padIdx >= 0 && padIdx < 8) {
        ctrl.customNotes[instId][padIdx] = noteStr;
    }
    ctrl.scale = 'custom';

    if (typeof renderBeatPadsUI === 'function') {
        renderBeatPadsUI();
    }
}

/**
 * Transpose toutes les notes d'un instrument de N demi-tons.
 */
function transposePadNotes(instId, semitoneDelta) {
    const notes = getCurrentPadNotes(instId);
    const SEMIS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const transposed = notes.map(note => {
        const match = note.match(/^([A-Ga-g][#b]?)(-?\d+)?$/);
        if (!match) return note;
        const p = match[1].charAt(0).toUpperCase() + (match[1].length > 1 ? match[1].charAt(1) : '');
        let oct = match[2] !== undefined ? parseInt(match[2], 10) : 4;
        
        let semiIdx = NOTE_BASE_SEMITONES[p];
        if (semiIdx === undefined) return note;
        
        let totalSemi = semiIdx + semitoneDelta;
        while (totalSemi < 0) {
            totalSemi += 12;
            oct--;
        }
        while (totalSemi >= 12) {
            totalSemi -= 12;
            oct++;
        }
        return SEMIS[totalSemi] + oct;
    });

    const ctrl = getPadControllerState();
    ctrl.customNotes[instId] = transposed;
    ctrl.scale = 'custom';

    if (typeof renderBeatPadsUI === 'function') {
        renderBeatPadsUI();
    }
}

/**
 * Change le mode actif des Beat Pads (Drum Kit ou Instrument Solo).
 */
function setPadMode(newMode) {
    const ctrl = getPadControllerState();
    ctrl.mode = newMode;
    if (typeof renderBeatPadsUI === 'function') {
        renderBeatPadsUI();
    }
}

/**
 * Joue un beat pad interactif (Mode Drum Kit ou Mode Instrument Mélodique).
 */
function triggerBeatPad(padIdentifier, padElement) {
    initAudio();

    const ctrl = getPadControllerState();
    const mode = ctrl.mode || 'drumkit';
    let reward = 0;
    const manualBase = typeof applyPrestigeProduction === 'function' ? applyPrestigeProduction(MIX_REWARD) : 5;

    // Détermine l'index du pad (0 à 7)
    let padIndex = 0;
    if (padElement && padElement.dataset.padIndex !== undefined) {
        padIndex = parseInt(padElement.dataset.padIndex, 10);
    } else if (typeof padIdentifier === 'number') {
        padIndex = padIdentifier;
    }

    if (mode === 'drumkit') {
        // Mode 1 : Drum Kit Multi-one-shots
        const padType = (typeof padIdentifier === 'string') ? padIdentifier : (padElement ? padElement.dataset.pad : 'kick');
        switch (padType) {
            case 'kick':
                playKickSound(160);
                reward = manualBase * 0.12;
                break;
            case 'snare':
                playSnareSound();
                reward = manualBase * 0.12;
                break;
            case 'hihat':
                playHiHatSound(false);
                reward = manualBase * 0.08;
                break;
            case 'synth':
                playSynthLeadSound(Math.floor(Math.random() * 8));
                reward = manualBase * 0.15;
                break;
            case 'bass':
                playSubBassSound(Math.floor(Math.random() * 8));
                reward = manualBase * 0.15;
                break;
            case 'clap':
                playClapSound();
                reward = manualBase * 0.10;
                break;
            case 'pad':
                playChordPadSound(Math.floor(Math.random() * 4));
                reward = manualBase * 0.18;
                break;
            case 'acid':
                playAcidSound(Math.floor(Math.random() * 8));
                reward = manualBase * 0.20;
                break;
            default:
                playKickSound(140);
                reward = manualBase * 0.10;
                break;
        }
    } else {
        // Mode 2 : Instrument Solo Mélodique avec Notes Personnalisées
        const notes = getCurrentPadNotes(mode);
        const assignedNote = notes[padIndex % notes.length] || 'C4';

        switch (mode) {
            case 'synth':
                playSynthLeadSound(assignedNote);
                reward = manualBase * 0.15;
                break;
            case 'bass':
                playSubBassSound(assignedNote);
                reward = manualBase * 0.15;
                break;
            case 'pad':
                playChordPadSound(assignedNote);
                reward = manualBase * 0.18;
                break;
            case 'piano':
                playPianoSound(assignedNote);
                reward = manualBase * 0.18;
                break;
            case 'pluck':
                playPluckSound(assignedNote);
                reward = manualBase * 0.18;
                break;
            case 'acid':
                playAcidSound(assignedNote);
                reward = manualBase * 0.20;
                break;
            case 'strings':
                playStringsSound(assignedNote);
                reward = manualBase * 0.22;
                break;
            case 'brass':
                playBrassSound(assignedNote);
                reward = manualBase * 0.22;
                break;
            case 'cosmic':
                playCosmicSound(assignedNote);
                reward = manualBase * 0.25;
                break;
            default:
                playSynthLeadSound(assignedNote);
                reward = manualBase * 0.15;
                break;
        }
    }

    // Incrémente la Hype de façon rythmée
    increaseHype(1.5);

    // Ajoute un micro-gain équilibré
    addMoney(reward);
    addFame(0.005);

    // Feedback visuel sur le pad
    if (padElement) {
        padElement.classList.add('pad-hit');
        setTimeout(() => padElement.classList.remove('pad-hit'), 150);

        if (typeof spawnParticleBurst === 'function') {
            const rect = padElement.getBoundingClientRect();
            spawnParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 4);
        }

        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(`+${formatNumber(reward)} $`, padElement, false);
        }
    }

    updateResourceDisplay();
    updateProductionDisplay();
}

/**
 * Augmente la jauge de Hype lors des mixages ou actions en rythme.
 */
function increaseHype(amount = 5) {
    if (!GameState.hype) {
        GameState.hype = { value: 0, max: 100, combo: 1, isFrenzy: false, frenzyDuration: 15, frenzyTimeLeft: 0, lastMixTime: Date.now() };
    }

    // Si on est déjà en Frenzy, rien à faire
    if (GameState.hype.isFrenzy) return;

    const upgradeHypeMult = (typeof isUpgradeBought === 'function' && isUpgradeBought('dsp_overclock')) ? 1.5 : 1.0;
    GameState.hype.value = Math.min(GameState.hype.max, GameState.hype.value + amount * upgradeHypeMult);
    GameState.hype.lastMixTime = Date.now();

    // Calcul du multiplicateur de combo progressif (1x à 3x)
    const ratio = GameState.hype.value / GameState.hype.max;
    if (ratio < 0.25) GameState.hype.combo = 1.0;
    else if (ratio < 0.50) GameState.hype.combo = 1.5;
    else if (ratio < 0.75) GameState.hype.combo = 2.0;
    else if (ratio < 1.00) GameState.hype.combo = 3.0;

    // Déclenchement du Mode FRENZY à 100% !
    if (GameState.hype.value >= GameState.hype.max) {
        triggerFrenzyMode();
    }
}

/**
 * Déclenche le mode FRENZY (Drop The Bass).
 */
function triggerFrenzyMode() {
    GameState.hype.isFrenzy = true;
    const prestigeBonus = (typeof getPrestigeBonuses === 'function') ? getPrestigeBonuses().frenzyDurationBonus : 0;
    GameState.hype.frenzyTimeLeft = GameState.hype.frenzyDuration + prestigeBonus;

    // Multiplicateur x10 ou x15 si caisson subwoofer
    const frenzyMultBonus = (typeof isUpgradeBought === 'function' && isUpgradeBought('sub_bass_subwoofer')) ? 15.0 : 10.0;
    GameState.hype.combo = frenzyMultBonus;

    // Effet sonore explosif
    if (typeof playFrenzySound === 'function') {
        playFrenzySound();
    }

    // Effet de secousse et particules
    if (typeof triggerScreenShake === 'function') {
        triggerScreenShake();
    }
    if (typeof spawnParticleBurst === 'function') {
        spawnParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 20);
    }

    // Animation spéciale sur le conteneur du jeu
    const container = document.getElementById('game-container');
    if (container) {
        container.classList.add('frenzy-active');
    }

    if (typeof spawnFloatingText === 'function') {
        const mixBtn = document.getElementById('mix-button');
        spawnFloatingText('🔥 DROP THE BASS ! FRENZY x' + frenzyMultBonus + ' ! 🔥', mixBtn, true);
    }
}

/**
 * Met à jour l'état de la Hype et du mode Frenzy à chaque frame.
 */
function updateHype(deltaTime) {
    if (!GameState.hype) return;

    const now = Date.now();

    if (GameState.hype.isFrenzy) {
        GameState.hype.frenzyTimeLeft -= deltaTime;
        if (GameState.hype.frenzyTimeLeft <= 0) {
            GameState.hype.isFrenzy = false;
            GameState.hype.value = 0;
            GameState.hype.combo = 1.0;
            GameState.hype.frenzyTimeLeft = 0;

            const container = document.getElementById('game-container');
            if (container) {
                container.classList.remove('frenzy-active');
            }
        }
    } else {
        // Décroissance naturelle de la hype après 3 secondes sans mixer
        if (now - GameState.hype.lastMixTime > 3000) {
            GameState.hype.value = Math.max(0, GameState.hype.value - (8 * deltaTime));
            const ratio = GameState.hype.value / GameState.hype.max;
            if (ratio < 0.25) GameState.hype.combo = 1.0;
            else if (ratio < 0.50) GameState.hype.combo = 1.5;
            else if (ratio < 0.75) GameState.hype.combo = 2.0;
            else if (ratio < 1.00) GameState.hype.combo = 3.0;
        }
    }
}

/**
 * Mini-Jeu Mastering EQ : Calcule l'alignement et applique le bonus (coût : 20 ⚡).
 */
function testMasteringEQ() {
    const MASTERING_ENERGY_COST = 20;
    if (!hasEnoughEnergy(MASTERING_ENERGY_COST)) {
        return { success: false, reason: `Énergie insuffisante (${MASTERING_ENERGY_COST} ⚡ requis)` };
    }

    spendEnergy(MASTERING_ENERGY_COST);

    if (!GameState.mastering) {
        GameState.mastering = { targetLow: 60, targetMid: 40, targetHigh: 75, currentLow: 50, currentMid: 50, currentHigh: 50, activeBonus: 1.0, bonusTimeLeft: 0 };
    }

    const m = GameState.mastering;
    const diffLow = Math.abs(m.targetLow - m.currentLow);
    const diffMid = Math.abs(m.targetMid - m.currentMid);
    const diffHigh = Math.abs(m.targetHigh - m.currentHigh);
    const totalDiff = diffLow + diffMid + diffHigh; // 0 (parfait) à 300 (terrible)

    let accuracy = Math.max(0, Math.min(100, Math.round(100 - (totalDiff / 1.5))));
    let bonusMult = 1.0;

    if (accuracy >= 90) {
        bonusMult = 2.5; // +150% production
    } else if (accuracy >= 70) {
        bonusMult = 1.8; // +80% production
    } else if (accuracy >= 50) {
        bonusMult = 1.3; // +30% production
    } else {
        bonusMult = 1.1;
    }

    const duration = (typeof isUpgradeBought === 'function' && isUpgradeBought('mastering_ai')) ? 120 : 60;
    m.activeBonus = bonusMult;
    m.bonusTimeLeft = duration;

    // Génère de nouvelles cibles aléatoires pour le prochain essai
    m.targetLow = Math.floor(Math.random() * 80) + 10;
    m.targetMid = Math.floor(Math.random() * 80) + 10;
    m.targetHigh = Math.floor(Math.random() * 80) + 10;

    if (typeof playContractSound === 'function') {
        playContractSound();
    }
    return {
        success: true,
        accuracy: accuracy,
        multiplier: bonusMult,
        duration: duration
    };
}

/**
 * Met à jour le timer du bonus de Mastering.
 */
function updateMasteringBonus(deltaTime) {
    if (!GameState.mastering) return;
    if (GameState.mastering.bonusTimeLeft > 0) {
        GameState.mastering.bonusTimeLeft -= deltaTime;
        if (GameState.mastering.bonusTimeLeft <= 0) {
            GameState.mastering.activeBonus = 1.0;
            GameState.mastering.bonusTimeLeft = 0;
        }
    }
}

/**
 * Planifie l'apparition du prochain Vinyle Doré flottant (entre 45s et 90s, ou 22s-45s avec Aimant Doré).
 */
function scheduleNextGoldenVinyl() {
    const magnetMult = (GameState.quests && GameState.quests.perks && GameState.quests.perks.golden_magnet) ? 0.5 : 1.0;
    const delay = (Math.random() * 45 + 45) * 1000 * magnetMult;
    if (goldenVinylTimer) clearTimeout(goldenVinylTimer);
    goldenVinylTimer = setTimeout(() => {
        spawnGoldenVinyl();
        scheduleNextGoldenVinyl();
    }, delay);
}

/**
 * Fait apparaître un Vinyle Doré animé flottant sur l'écran.
 */
function spawnGoldenVinyl() {
    const vinyl = document.createElement('div');
    vinyl.className = 'flying-golden-vinyl';
    vinyl.innerHTML = '✨💿✨';
    vinyl.title = 'Clique vite sur le Vinyle Doré !';

    // Position verticale aléatoire (entre 15% et 75% de la hauteur)
    const topPos = Math.random() * (window.innerHeight * 0.6) + (window.innerHeight * 0.15);
    vinyl.style.top = topPos + 'px';
    vinyl.style.left = '-80px';

    document.body.appendChild(vinyl);

    // Vitesse de traversée de l'écran (8 secondes)
    const anim = vinyl.animate([
        { transform: 'translateX(0px) rotate(0deg)' },
        { transform: `translateX(${window.innerWidth + 150}px) rotate(1440deg)` }
    ], {
        duration: 8000,
        easing: 'linear'
    });

    let isClicked = false;

    vinyl.addEventListener('click', () => {
        if (isClicked) return;
        isClicked = true;

        if (typeof playGoldenVinylSound === 'function') {
            playGoldenVinylSound();
        }

        // Récompense aléatoire : Cash Rush, Énergie Max, ou Frenzy Instantanée
        const rand = Math.random();
        let msg = '';

        if (rand < 0.4) {
            // Cash Rush : 30 secondes de production passive instantanée
            const rushCash = Math.max(500, getPassiveProduction() * 45);
            addMoney(rushCash);
            msg = `💰 Cash Rush Doré : +${formatNumber(rushCash)} $ !`;
        } else if (rand < 0.7) {
            // Recharge Énergie Complète + Bonus Renommée
            addEnergy(GameState.resources.maxEnergy);
            addFame(10);
            msg = '⚡ Overdrive Énergie : Énergie 100% restaurée + 10 ⭐ !';
        } else {
            // Frenzy Instantanée !
            triggerFrenzyMode();
            msg = '🔥 FRENZY INSTANTANÉE ACTIVÉE !';
        }

        GameState.stats.goldenVinylsClicked = (GameState.stats.goldenVinylsClicked || 0) + 1;
        if (typeof advanceQuestProgress === 'function') {
            advanceQuestProgress('golden_hunt', 1);
        }

        if (typeof spawnParticleBurst === 'function') {
            const rect = vinyl.getBoundingClientRect();
            spawnParticleBurst(rect.left + 30, rect.top + 30, 20);
        }

        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(msg, vinyl, true);
        }

        vinyl.remove();
        updateResourceDisplay();
        updateProductionDisplay();
    });

    anim.onfinish = () => {
        if (!isClicked) vinyl.remove();
    };
}
