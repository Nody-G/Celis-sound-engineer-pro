/**
 * ui.js - Interface Utilisateur & Interactions Riches (Hit Edition)
 * 
 * Gère le rendu dynamique :
 * - Cockpit & VU-Mètres Stéréo
 * - Évolution Visuelle du Studio & Rack d'Effets Analogique
 * - Séquenceur 16-Pas Interactif (Mini-DAW)
 * - Label & Gestion d'Artistes
 * - Hit-Parade Billboard Top 50 & Galerie des Trophées
 * - Quêtes Quotidiennes & Boutique de Cassettes Dorées
 * - Terminal de Codes Secrets & Export/Import Base64
 */

let isDarkTheme = true;

/**
 * Met à jour l'affichage des ressources principales.
 */
function updateResourceDisplay() {
    const moneyValue = document.getElementById('money-value');
    const fameValue = document.getElementById('fame-value');
    const energyValue = document.getElementById('energy-value');
    const energyBar = document.getElementById('energy-bar-fill');
    const cassettesValue = document.getElementById('cassettes-value');

    if (moneyValue) {
        moneyValue.textContent = formatNumber(GameState.resources.money) + ' $';
    }
    if (fameValue) {
        fameValue.textContent = formatNumber(GameState.resources.fame) + ' ⭐';
    }
    if (energyValue) {
        const curEnergy = Math.min(GameState.resources.maxEnergy || 100, Math.max(0, Math.floor(GameState.resources.energy || 0)));
        const maxEnergy = GameState.resources.maxEnergy || 100;
        energyValue.textContent = `${curEnergy} / ${maxEnergy} ⚡`;
    }
    if (energyBar) {
        const maxEnergy = GameState.resources.maxEnergy || 100;
        const curEnergy = Math.max(0, GameState.resources.energy || 0);
        const pct = Math.min(100, Math.max(0, (curEnergy / maxEnergy) * 100));
        energyBar.style.width = pct.toFixed(2) + '%';
    }
    if (cassettesValue) {
        cassettesValue.textContent = `${GameState.resources.goldenCassettes || 0} 📼`;
    }

    // Met à jour la bannière d'évolution du studio et le rack
    updateStudioBannerAndRack();
}

/**
 * Met à jour les indicateurs de production et la jauge de Hype.
 */
function updateProductionDisplay() {
    const passiveProduction = document.getElementById('passive-production');
    const tracksMixed = document.getElementById('tracks-mixed');
    const activeBoosters = document.getElementById('active-boosters');
    const mixButton = document.getElementById('mix-button');
    const turntable = document.getElementById('studio-turntable');

    if (passiveProduction) {
        passiveProduction.textContent = formatNumber(getPassiveProduction()) + ' $/s';
    }
    if (tracksMixed) {
        tracksMixed.textContent = formatNumber(GameState.stats.tracksMixed);
    }
    if (activeBoosters) {
        const boosters = getActiveBoostersList();
        if (boosters.length === 0) {
            activeBoosters.textContent = 'Aucun';
        } else {
            activeBoosters.innerHTML = boosters.map(b => `<span class="booster-pill">${b.icon} ${Math.ceil(b.timeLeft)}s (x${b.multiplier})</span>`).join(' ');
        }
    }

    if (mixButton) {
        mixButton.disabled = !canManualMix();
    }

    // Mise à jour de la jauge de Hype / Combo
    const hypeBar = document.getElementById('hype-bar-fill');
    const comboValue = document.getElementById('hype-combo-value');
    const hypeStatus = document.getElementById('hype-status-text');

    if (hypeBar && GameState.hype) {
        const pct = (GameState.hype.value / GameState.hype.max) * 100;
        hypeBar.style.width = pct + '%';
    }

    if (comboValue && GameState.hype) {
        if (GameState.hype.isFrenzy) {
            comboValue.textContent = `FRENZY x${GameState.hype.combo} ! (${Math.ceil(GameState.hype.frenzyTimeLeft)}s)`;
            comboValue.className = 'hype-combo-badge frenzy';
        } else {
            comboValue.textContent = `Combo x${GameState.hype.combo.toFixed(1)}`;
            comboValue.className = 'hype-combo-badge' + (GameState.hype.combo > 1 ? ' active' : '');
        }
    }

    if (hypeStatus && GameState.hype) {
        if (GameState.hype.isFrenzy) {
            hypeStatus.textContent = '🔥 DROP THE BASS ! Production décuplée ! 🔥';
        } else if (GameState.hype.value > 70) {
            hypeStatus.textContent = '⚡ Le public est bouillant ! Encore quelques mixages !';
        } else if (GameState.hype.value > 30) {
            hypeStatus.textContent = '🎵 Bonne ambiance en studio... Garde le rythme !';
        } else {
            hypeStatus.textContent = '🎧 Mixe ou active le séquenceur pour faire monter la Hype !';
        }
    }

    // Animation du vinyle selon la production passive
    if (turntable) {
        const prod = getPassiveProduction();
        if (prod > 0 || (GameState.hype && GameState.hype.isFrenzy)) {
            turntable.classList.add('spinning');
        } else {
            turntable.classList.remove('spinning');
        }
    }
}

/**
 * Met à jour la bannière d'évolution du studio et les unités de rack analogiques.
 */
function updateStudioBannerAndRack() {
    const banner = document.getElementById('studio-evolution-banner');
    const badge = document.getElementById('studio-tier-badge');
    const perk = document.getElementById('studio-tier-perk');
    const rackContainer = document.getElementById('analog-gear-rack');
    if (!banner || !badge || !perk) return;

    const totalMoney = GameState.stats.totalMoneyEarned || 0;
    let stage = 1;
    let title = '🏠 STADE 1 : HOME STUDIO EN SOUS-SOL';
    let perkText = 'Production modeste • Début de l\'aventure musicale';

    if (totalMoney >= 50000000000) {
        stage = 5;
        title = '🌌 STADE 5 : CYBER GALAXY PENTHOUSE STUDIO';
        perkText = 'Empire mondial • Vue sur la skyline & Acoustique spatiale';
    } else if (totalMoney >= 500000000) {
        stage = 4;
        title = '🏛️ STADE 4 : COMPLEXE MYTHIQUE ABBEY ROAD';
        perkText = 'Légende de l\'industrie • Microphones à lampes historiques';
    } else if (totalMoney >= 5000000) {
        stage = 3;
        title = '🏢 STADE 3 : STUDIO ACOUSTIQUE PRO COMMERCIAL';
        perkText = 'Cabines insonorisées flottantes & Console SSL analogique';
    } else if (totalMoney >= 50000) {
        stage = 2;
        title = '🎙️ STADE 2 : STUDIO INDÉPENDANT URBAIN';
        perkText = 'Monitoring de précision & Traitement acoustique dédié';
    }

    banner.className = `studio-evolution-banner stage-${stage}`;
    badge.textContent = title;
    perk.textContent = perkText;

    // Rendu du Rack d'appareils analogiques débloqués
    if (rackContainer) {
        const rackUnits = [
            { id: 'interface_audio', name: 'PREAMP 24-BIT', color: 'cyan', icon: '🔌' },
            { id: 'plugins_premium', name: 'TUBE COMPRESSOR', color: 'gold', icon: '🎛️' },
            { id: 'console_mixage', name: 'SSL MASTER BUS', color: 'magenta', icon: '🎚️' },
            { id: 'mastering_suite', name: 'VALVE LIMITER', color: 'orange', icon: '✨' },
            { id: 'analog_gear', name: 'MOOG MODULAR SYNTH', color: 'green', icon: '🎹' }
        ];

        rackContainer.innerHTML = rackUnits.map(unit => {
            const isUnlocked = (GameState.equipment[unit.id] || 0) > 0;
            return `
                <div class="rack-module ${isUnlocked ? 'active ' + unit.color : 'locked'}" title="${isUnlocked ? unit.name + ' Actif' : 'Matériel non débloqué'}">
                    <span class="rack-led ${isUnlocked ? 'lit' : ''}"></span>
                    <span class="rack-name">${unit.icon} ${unit.name}</span>
                    <div class="rack-vu-needle"><div class="needle ${isUnlocked ? 'swinging' : ''}"></div></div>
                </div>
            `;
        }).join('');
    }
}

/**
 * Initialise le rendu visuel du Séquenceur 16-Pas avec instruments déblocables (Affichage progressif pur).
 */
/**
 * Initialise le rendu visuel du Séquenceur Multi-Temps avec instruments déblocables.
 * Supporte dynamiquement les boucles de 2, 4, 8, 16 ou 32 pas / temps.
 */
let seqActivePage = 'all'; // 'all' | '1' | '2'

function initSequencerUI() {
    const matrix = document.querySelector('.sequencer-matrix') || document.getElementById('sequencer-matrix');
    if (!matrix || typeof INSTRUMENT_DEFS === 'undefined') return;

    const stepCount = typeof getSequencerStepCount === 'function' ? getSequencerStepCount() : 16;
    matrix.innerHTML = '';

    // Mise à jour des boutons de choix de temps (pills)
    const pills = document.querySelectorAll('.seq-step-pill');
    pills.forEach(pill => {
        const count = parseInt(pill.dataset.steps, 10);
        if (count === stepCount) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    // Affichage ou masquage de la navigation des mesures pour le mode 32 pas
    const measureNav = document.getElementById('seq-measure-nav');
    if (measureNav) {
        measureNav.style.display = (stepCount === 32) ? 'flex' : 'none';
        const pageBtns = measureNav.querySelectorAll('.seq-page-btn');
        pageBtns.forEach(btn => {
            if (btn.dataset.page === seqActivePage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    const unlockedInsts = INSTRUMENT_DEFS.filter(inst => isInstrumentUnlocked(inst.id));
    const nextLocked = INSTRUMENT_DEFS.find(inst => !isInstrumentUnlocked(inst.id));

    // Détermination de la plage de pas à afficher
    let startStep = 0;
    let endStep = stepCount;
    if (stepCount === 32) {
        if (seqActivePage === '1') {
            startStep = 0;
            endStep = 16;
        } else if (seqActivePage === '2') {
            startStep = 16;
            endStep = 32;
        } else {
            startStep = 0;
            endStep = 32;
        }
    }

    // Rendu exclusif des pistes d'instruments débloquées
    unlockedInsts.forEach(inst => {
        const row = document.createElement('div');
        row.className = 'seq-track-row unlocked animate-unlock';
        row.dataset.track = inst.id;

        const settings = (typeof getInstrumentTrackSettings === 'function') ? getInstrumentTrackSettings(inst.id) : {};
        const hasFx = (typeof hasTrackCustomFx === 'function') && hasTrackCustomFx(inst.id);
        const isMuted = !!settings.mute;
        const isSolo = !!settings.solo;

        row.innerHTML = `
            <div class="seq-track-header">
                <button class="track-tag ${inst.color || 'cyan'}" title="Cliquez pour écouter ${inst.name}">
                    ${inst.icon} ${inst.tag}
                </button>
                <div class="track-quick-fx-btns">
                    <button class="track-fx-btn ${hasFx ? 'has-fx' : ''}" data-track="${inst.id}" title="Ouvrir les Réglages & Effets DSP de ${inst.name}">🎛️ FX</button>
                    <button class="track-mute-btn ${isMuted ? 'active' : ''}" data-track="${inst.id}" title="Couper le son (Mute)">M</button>
                    <button class="track-solo-btn ${isSolo ? 'active' : ''}" data-track="${inst.id}" title="Écouter seul (Solo)">S</button>
                </div>
            </div>
            <div class="steps-row steps-${stepCount} view-${seqActivePage}" id="steps-${inst.id}"></div>
        `;

        const tagBtn = row.querySelector('.track-tag');
        if (tagBtn) {
            tagBtn.addEventListener('click', () => {
                initAudio();
                playTrackSound(inst.id);
            });
        }

        const fxBtn = row.querySelector('.track-fx-btn');
        if (fxBtn) {
            fxBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openInstrumentFxModal(inst.id);
            });
        }

        const muteBtn = row.querySelector('.track-mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTrackMute(inst.id);
                initSequencerUI();
            });
        }

        const soloBtn = row.querySelector('.track-solo-btn');
        if (soloBtn) {
            soloBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTrackSolo(inst.id);
                initSequencerUI();
            });
        }

        const stepsContainer = row.querySelector('.steps-row');
        for (let i = startStep; i < endStep; i++) {
            const stepBtn = document.createElement('button');
            
            // Classes musicales pour les temps forts et changements de mesure
            const isDownbeat = (i % 4 === 0);
            const isMeasureStart = (i === 16);
            stepBtn.className = `step-btn ${isDownbeat ? 'downbeat' : ''} ${isMeasureStart ? 'measure-start' : ''}`;
            stepBtn.dataset.track = inst.id;
            stepBtn.dataset.step = i;

            const isActive = GameState.sequencer && GameState.sequencer.tracks[inst.id] && GameState.sequencer.tracks[inst.id][i];
            if (isActive) {
                stepBtn.classList.add('active');
                if (inst.type === 'melodic') {
                    const note = getSequencerStepNote(inst.id, i);
                    stepBtn.innerHTML = `<span class="step-note-txt">${note}</span>`;
                }
            }

            // Calcul du repère métrique pour l'infobulle
            const measureNum = Math.floor(i / 16) + 1;
            const beatNum = Math.floor((i % 16) / 4) + 1;
            const subBeat = (i % 4) + 1;
            const timeLabel = (stepCount >= 16) 
                ? `Mesure ${measureNum} • Temps ${beatNum}.${subBeat} (Pas ${i + 1})`
                : `Temps ${beatNum}.${subBeat} (Pas ${i + 1}/${stepCount})`;

            stepBtn.title = `${inst.name} [${timeLabel}]`;

            // Clic gauche : Activer / Désactiver
            stepBtn.addEventListener('click', (e) => {
                toggleSequencerStep(inst.id, i);
            });

            // Clic droit : Ouvrir le sélecteur de note flottant et compact
            stepBtn.addEventListener('contextmenu', (e) => {
                if (inst.type === 'melodic') {
                    e.preventDefault();
                    openStepNotePicker(inst.id, i, stepBtn, e);
                }
            });

            // Molette de la souris : Transposition rapide +/- demi-ton
            stepBtn.addEventListener('wheel', (e) => {
                if (inst.type === 'melodic' && GameState.sequencer.tracks[inst.id] && GameState.sequencer.tracks[inst.id][i]) {
                    e.preventDefault();
                    const delta = e.deltaY < 0 ? 1 : -1;
                    shiftSequencerStepNote(inst.id, i, delta);
                    const newNote = getSequencerStepNote(inst.id, i);
                    stepBtn.innerHTML = `<span class="step-note-txt">${newNote}</span>`;
                }
            }, { passive: false });

            stepsContainer.appendChild(stepBtn);
        }

        matrix.appendChild(row);
    });

    // Teaser discret du prochain instrument à débloquer
    if (nextLocked) {
        const teaser = document.createElement('div');
        teaser.className = 'next-instrument-teaser';
        teaser.innerHTML = `
            <span class="teaser-icon">🔒</span>
            <span class="teaser-text">Prochain instrument à débloquer : <strong>${nextLocked.icon} ${nextLocked.name}</strong> • <em>Requis : ${nextLocked.reqName}</em></span>
        `;
        matrix.appendChild(teaser);
    } else {
        const fullBadge = document.createElement('div');
        fullBadge.className = 'next-instrument-teaser completed';
        fullBadge.innerHTML = `<span>👑 <strong>Studio Beatmaker Complet</strong> • ${INSTRUMENT_DEFS.length}/${INSTRUMENT_DEFS.length} Pistes Polyphoniques Actives !</span>`;
        matrix.appendChild(fullBadge);
    }

    updateSequencerUI();
}

/**
 * Met à jour les pas du séquenceur et l'évaluation musicale du groove.
 */
function updateSequencerUI() {
    if (!GameState.sequencer || typeof INSTRUMENT_DEFS === 'undefined') return;

    const stepCount = typeof getSequencerStepCount === 'function' ? getSequencerStepCount() : 16;

    INSTRUMENT_DEFS.forEach(inst => {
        const isUnlocked = typeof isInstrumentUnlocked === 'function' ? isInstrumentUnlocked(inst.id) : true;
        if (!isUnlocked) return;

        const row = document.getElementById(`steps-${inst.id}`);
        if (!row) return;

        const buttons = row.querySelectorAll('.step-btn');
        buttons.forEach(btn => {
            const stepIdx = parseInt(btn.dataset.step, 10);
            const isActive = GameState.sequencer.tracks[inst.id] && GameState.sequencer.tracks[inst.id][stepIdx];
            
            const measureNum = Math.floor(stepIdx / 16) + 1;
            const beatNum = Math.floor((stepIdx % 16) / 4) + 1;
            const subBeat = (stepIdx % 4) + 1;
            const timeLabel = (stepCount >= 16) 
                ? `M${measureNum} T${beatNum}.${subBeat}` 
                : `T${beatNum}.${subBeat}`;

            if (isActive) {
                btn.classList.add('active');
                if (inst.type === 'melodic') {
                    const note = getSequencerStepNote(inst.id, stepIdx);
                    btn.innerHTML = `<span class="step-note-txt">${note}</span>`;
                    btn.title = `${inst.name} [${timeLabel}] : Note ${note}\n• Clic gauche : On/Off\n• Clic droit : Changer la note\n• Molette : Transposer (±1)`;
                } else {
                    btn.innerHTML = '';
                    btn.title = `${inst.name} [${timeLabel}] : Actif`;
                }
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '';
                btn.title = inst.type === 'melodic' 
                    ? `${inst.name} [${timeLabel}]\n• Clic gauche : Activer\n• Clic droit : Choisir la note`
                    : `${inst.name} [${timeLabel}]`;
            }
        });
    });

    const grooveBadge = document.getElementById('seq-groove-badge');
    if (grooveBadge) {
        let unlockedCount = 0;
        INSTRUMENT_DEFS.forEach(inst => {
            if (isInstrumentUnlocked(inst.id)) unlockedCount++;
        });

        const bonusPct = Math.round((GameState.sequencer.grooveBonus || 0) * 100);
        const isPlaying = !!(GameState.sequencer && GameState.sequencer.isPlaying);

        grooveBadge.className = 'seq-groove-badge';
        if (isPlaying) {
            grooveBadge.classList.add('perfect');
            grooveBadge.textContent = `▶️ Session Live : +${bonusPct}% Prod (${unlockedCount}/${INSTRUMENT_DEFS.length} Instruments)`;
        } else {
            grooveBadge.classList.add('balanced');
            grooveBadge.textContent = `🎵 Polyphonie Studio : +${bonusPct}% Prod (${unlockedCount}/${INSTRUMENT_DEFS.length} Instruments)`;
        }
        grooveBadge.title = `Bonus passif de studio : +${bonusPct}% Production (+10% par instrument débloqué, +25% en lecture live).\nComposez librement le motif musical de votre choix sur 2, 4, 8, 16 ou 32 temps sans impact du nombre de notes !`;
    }

    const presetSelect = document.getElementById('seq-preset-select');
    if (presetSelect && GameState.sequencer.activePreset) {
        presetSelect.value = GameState.sequencer.activePreset;
    }
}

let activeStepPicker = null;

/**
 * Ferme le sélecteur de note flottant du séquenceur.
 */
function closeStepNotePicker() {
    const existing = document.getElementById('seq-note-popover');
    if (existing) {
        existing.remove();
    }
    activeStepPicker = null;
    document.removeEventListener('click', handleOutsideStepPickerClick);
    document.removeEventListener('keydown', handleStepPickerEscape);
}

function handleOutsideStepPickerClick(e) {
    const popover = document.getElementById('seq-note-popover');
    if (popover && !popover.contains(e.target) && !e.target.closest('.step-btn')) {
        closeStepNotePicker();
    }
}

function handleStepPickerEscape(e) {
    if (e.key === 'Escape') {
        closeStepNotePicker();
    }
}

/**
 * Ouvre le sélecteur de note flottant et compact pour un pas mélodique du séquenceur.
 */
function openStepNotePicker(trackId, stepIndex, targetBtn, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    closeStepNotePicker();

    const inst = (typeof INSTRUMENT_DEFS !== 'undefined') ? INSTRUMENT_DEFS.find(i => i.id === trackId) : null;
    if (!inst || inst.type !== 'melodic') return;

    if (typeof initAudio === 'function') initAudio();

    // S'assure que le pas est actif
    if (!GameState.sequencer.tracks[trackId][stepIndex]) {
        toggleSequencerStep(trackId, stepIndex);
    }

    let curNote = getSequencerStepNote(trackId, stepIndex);

    const popover = document.createElement('div');
    popover.id = 'seq-note-popover';
    popover.className = 'seq-note-popover';

    const SEMIS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const CHORDS = ['Am', 'Cmaj', 'Dm', 'Em', 'Fmaj', 'Gmaj', 'Am7', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7'];

    // Positionnement flottant intelligent au-dessus ou en-dessous du bouton de pas
    const rect = targetBtn.getBoundingClientRect();
    const popWidth = 230;
    const popHeight = 220;

    let left = rect.left + window.scrollX - (popWidth / 2) + (rect.width / 2);
    let top = rect.top + window.scrollY - popHeight - 8;

    if (left < 10) left = 10;
    if (left + popWidth > window.innerWidth - 10) left = window.innerWidth - popWidth - 10;
    if (top < 10) top = rect.bottom + window.scrollY + 8;

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;

    function renderPopoverContent() {
        const isPad = trackId === 'pad';
        let noteName = 'C';
        let oct = 4;

        if (!isPad) {
            const match = curNote.match(/^([A-Ga-g][#b]?)(-?\d+)?$/);
            if (match) {
                noteName = match[1].charAt(0).toUpperCase() + (match[1].length > 1 ? match[1].charAt(1) : '');
                oct = match[2] !== undefined ? parseInt(match[2], 10) : 4;
            }
        }

        popover.innerHTML = `
            <div class="seq-popover-header">
                <div class="seq-popover-title">
                    <span>${inst.icon}</span>
                    <span>${inst.tag} • Pas ${stepIndex + 1}</span>
                </div>
                <button class="seq-popover-close" id="seq-popover-close-btn" title="Fermer (Échap)">✖</button>
            </div>

            <div class="seq-popover-note-preview">
                <span class="seq-popover-note-badge" id="seq-popover-current-badge">${curNote}</span>
                <button class="seq-popover-preview-btn" id="seq-popover-play-btn" title="Écouter">🔊 Jouer</button>
            </div>

            <div class="seq-popover-notes-grid" id="seq-popover-grid">
                ${isPad ? CHORDS.map(ch => `
                    <button class="seq-note-pill ${ch === curNote ? 'active' : ''}" data-chord="${ch}">${ch}</button>
                `).join('') : SEMIS.map(s => `
                    <button class="seq-note-pill ${s === noteName ? 'active' : ''}" data-pitch="${s}">${s}</button>
                `).join('')}
            </div>

            ${!isPad ? `
            <div class="seq-popover-octaves-row">
                <span style="font-size:0.60rem; color:var(--text-muted); margin-right:2px;">Octave:</span>
                ${[1, 2, 3, 4, 5, 6].map(o => `
                    <button class="seq-octave-btn ${o === oct ? 'active' : ''}" data-oct="${o}">${o}</button>
                `).join('')}
            </div>
            ` : ''}

            <div class="seq-popover-tools-row">
                <button class="seq-shift-btn" id="seq-shift-down" title="Descendre d'un demi-ton">-♭ Demi-ton</button>
                <button class="seq-shift-btn" id="seq-shift-up" title="Monter d'un demi-ton">+♯ Demi-ton</button>
            </div>
        `;

        const closeBtn = popover.querySelector('#seq-popover-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeStepNotePicker);

        const playBtn = popover.querySelector('#seq-popover-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                playTrackSound(trackId, stepIndex);
            });
        }

        popover.querySelectorAll('.seq-note-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                if (isPad) {
                    curNote = pill.dataset.chord;
                } else {
                    const pitch = pill.dataset.pitch;
                    curNote = `${pitch}${oct}`;
                }
                setSequencerStepNote(trackId, stepIndex, curNote);
                playTrackSound(trackId, stepIndex);
                renderPopoverContent();
            });
        });

        popover.querySelectorAll('.seq-octave-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newOct = parseInt(btn.dataset.oct, 10);
                curNote = `${noteName}${newOct}`;
                setSequencerStepNote(trackId, stepIndex, curNote);
                playTrackSound(trackId, stepIndex);
                renderPopoverContent();
            });
        });

        const downBtn = popover.querySelector('#seq-shift-down');
        if (downBtn) {
            downBtn.addEventListener('click', () => {
                curNote = shiftSequencerStepNote(trackId, stepIndex, -1);
                renderPopoverContent();
            });
        }

        const upBtn = popover.querySelector('#seq-shift-up');
        if (upBtn) {
            upBtn.addEventListener('click', () => {
                curNote = shiftSequencerStepNote(trackId, stepIndex, 1);
                renderPopoverContent();
            });
        }
    }

    renderPopoverContent();
    document.body.appendChild(popover);
    activeStepPicker = { trackId, stepIndex };

    setTimeout(() => {
        document.addEventListener('click', handleOutsideStepPickerClick);
        document.addEventListener('keydown', handleStepPickerEscape);
    }, 10);
}

let activeFxTrackId = null;

/**
 * Ouvre la modale de réglages et d'effets DSP pour l'instrument sélectionné.
 */
function openInstrumentFxModal(trackId) {
    activeFxTrackId = trackId;
    const modal = document.getElementById('fx-modal');
    if (!modal || typeof INSTRUMENT_DEFS === 'undefined') return;

    const inst = INSTRUMENT_DEFS.find(i => i.id === trackId);
    if (!inst) return;

    const titleEl = document.getElementById('fx-modal-title');
    const subtitleEl = document.getElementById('fx-modal-subtitle');
    const iconEl = document.getElementById('fx-modal-icon');

    if (titleEl) titleEl.textContent = `🎛️ ${inst.name}`;
    if (subtitleEl) subtitleEl.textContent = `Piste [${inst.tag}] • Tranche de Mixage & Effets DSP`;
    if (iconEl) iconEl.textContent = inst.icon;

    // Affichage ou masquage de la carte de synthèse / forme d'onde
    const synthCard = document.getElementById('fx-synth-card');
    if (synthCard) {
        synthCard.style.display = (inst.type === 'melodic') ? 'block' : 'none';
    }

    updateFxModalControls(trackId);
    modal.classList.add('open');
}

/**
 * Met à jour les curseurs et valeurs affichées dans la modale d'effets.
 */
function updateFxModalControls(trackId) {
    if (typeof getInstrumentTrackSettings !== 'function') return;
    const s = getInstrumentTrackSettings(trackId);
    if (!s) return;

    // Volume
    const volSlider = document.getElementById('fx-volume-slider');
    const volVal = document.getElementById('fx-volume-val');
    if (volSlider) volSlider.value = Math.round((s.volume !== undefined ? s.volume : 1.0) * 100);
    if (volVal) volVal.textContent = `${Math.round((s.volume !== undefined ? s.volume : 1.0) * 100)}%`;

    // Pan
    const panSlider = document.getElementById('fx-pan-slider');
    const panVal = document.getElementById('fx-pan-val');
    const panPct = Math.round((s.pan || 0) * 100);
    if (panSlider) panSlider.value = panPct;
    if (panVal) {
        if (panPct < 0) panVal.textContent = `${Math.abs(panPct)}% G`;
        else if (panPct > 0) panVal.textContent = `${panPct}% D`;
        else panVal.textContent = 'Centre';
    }

    // Pitch
    const pitchSlider = document.getElementById('fx-pitch-slider');
    const pitchVal = document.getElementById('fx-pitch-val');
    if (pitchSlider) pitchSlider.value = s.pitch || 0;
    if (pitchVal) pitchVal.textContent = `${s.pitch > 0 ? '+' : ''}${s.pitch || 0} st`;

    // Mute & Solo
    const muteToggle = document.getElementById('fx-mute-toggle');
    const soloToggle = document.getElementById('fx-solo-toggle');
    if (muteToggle) {
        if (s.mute) muteToggle.classList.add('active');
        else muteToggle.classList.remove('active');
    }
    if (soloToggle) {
        if (s.solo) soloToggle.classList.add('active');
        else soloToggle.classList.remove('active');
    }

    // Filter Type Pills
    const filterPills = document.querySelectorAll('.fx-filter-pill');
    filterPills.forEach(pill => {
        if (pill.dataset.type === (s.filterType || 'lowpass')) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    // Cutoff
    const cutoffSlider = document.getElementById('fx-cutoff-slider');
    const cutoffVal = document.getElementById('fx-cutoff-val');
    const cutoff = s.cutoff || 20000;
    if (cutoffSlider) cutoffSlider.value = cutoff;
    if (cutoffVal) cutoffVal.textContent = cutoff >= 1000 ? `${(cutoff / 1000).toFixed(1)} kHz` : `${cutoff} Hz`;

    // Resonance
    const resSlider = document.getElementById('fx-resonance-slider');
    const resVal = document.getElementById('fx-resonance-val');
    if (resSlider) resSlider.value = s.resonance || 1.0;
    if (resVal) resVal.textContent = (s.resonance || 1.0).toFixed(1);

    // Reverb
    const revSlider = document.getElementById('fx-reverb-slider');
    const revVal = document.getElementById('fx-reverb-val');
    if (revSlider) revSlider.value = Math.round((s.reverb || 0) * 100);
    if (revVal) revVal.textContent = `${Math.round((s.reverb || 0) * 100)}%`;

    // Delay
    const delaySlider = document.getElementById('fx-delay-slider');
    const delayVal = document.getElementById('fx-delay-val');
    if (delaySlider) delaySlider.value = Math.round((s.delay || 0) * 100);
    if (delayVal) delayVal.textContent = `${Math.round((s.delay || 0) * 100)}%`;

    // Delay Time
    const dtSlider = document.getElementById('fx-delaytime-slider');
    const dtVal = document.getElementById('fx-delaytime-val');
    const dtMs = Math.round((s.delayTime || 0.25) * 1000);
    const fbPct = Math.round((s.delayFeedback || 0.4) * 100);
    if (dtSlider) dtSlider.value = dtMs;
    if (dtVal) dtVal.textContent = `${dtMs} ms (${fbPct}% FB)`;

    // Drive
    const driveSlider = document.getElementById('fx-drive-slider');
    const driveVal = document.getElementById('fx-drive-val');
    if (driveSlider) driveSlider.value = Math.round((s.drive || 0) * 100);
    if (driveVal) driveVal.textContent = `${Math.round((s.drive || 0) * 100)}%`;

    // Waveform Pills
    const wavePills = document.querySelectorAll('.fx-wave-pill');
    wavePills.forEach(pill => {
        if (pill.dataset.wave === (s.waveform || 'default')) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

/**
 * Ferme la modale d'effets DSP.
 */
function closeInstrumentFxModal() {
    const modal = document.getElementById('fx-modal');
    if (modal) modal.classList.remove('open');
    if (typeof initSequencerUI === 'function') {
        initSequencerUI();
    }
}

/**
 * Met en valeur visuelle le pas actuel lors de la lecture du séquenceur.
 */
function highlightSequencerStep(currentStep) {
    const allSteps = document.querySelectorAll('.step-btn');
    allSteps.forEach(btn => {
        if (parseInt(btn.dataset.step, 10) === currentStep) {
            btn.classList.add('step-current');
        } else {
            btn.classList.remove('step-current');
        }
    });
}

/**
 * Met à jour le bouton Play/Stop du séquenceur.
 */
function updateSequencerPlayButton() {
    const btn = document.getElementById('seq-play-btn');
    if (!btn || !GameState.sequencer) return;

    if (GameState.sequencer.isPlaying) {
        btn.textContent = '⏹ STOP';
        btn.className = 'seq-action-btn stop';
    } else {
        btn.textContent = '▶ JOUER';
        btn.className = 'seq-action-btn play';
        highlightSequencerStep(-1);
    }
}

/**
 * Initialise le contrôleur Beat Pads MPC & Clavier 8 Notes.
 */
function initBeatPadsUI() {
    const modeSelect = document.getElementById('mpc-mode-select');
    const scaleSelect = document.getElementById('mpc-scale-select');
    const melodicActions = document.getElementById('mpc-melodic-actions');
    const tuneBtn = document.getElementById('mpc-tune-btn');
    const transDownBtn = document.getElementById('mpc-trans-down');
    const transUpBtn = document.getElementById('mpc-trans-up');

    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            if (typeof setPadMode === 'function') {
                setPadMode(e.target.value);
            }
        });
    }

    if (scaleSelect) {
        scaleSelect.addEventListener('change', (e) => {
            const ctrl = typeof getPadControllerState === 'function' ? getPadControllerState() : null;
            const currentMode = ctrl ? ctrl.mode : 'synth';
            if (typeof setPadScale === 'function') {
                setPadScale(e.target.value, currentMode);
            }
        });
    }

    if (tuneBtn) {
        tuneBtn.addEventListener('click', () => {
            openTunerModal();
        });
    }

    if (transDownBtn) {
        transDownBtn.addEventListener('click', () => {
            const ctrl = typeof getPadControllerState === 'function' ? getPadControllerState() : null;
            if (ctrl && ctrl.mode !== 'drumkit' && typeof transposePadNotes === 'function') {
                transposePadNotes(ctrl.mode, -1);
                spawnFloatingText('♭ -1 Demi-ton', transDownBtn, false);
            }
        });
    }

    if (transUpBtn) {
        transUpBtn.addEventListener('click', () => {
            const ctrl = typeof getPadControllerState === 'function' ? getPadControllerState() : null;
            if (ctrl && ctrl.mode !== 'drumkit' && typeof transposePadNotes === 'function') {
                transposePadNotes(ctrl.mode, 1);
                spawnFloatingText('♯ +1 Demi-ton', transUpBtn, false);
            }
        });
    }

    // Écouteurs de la modale d'accordage
    const closeTunerBtn = document.getElementById('close-tuner-modal');
    const tunerApplyBtn = document.getElementById('tuner-apply-btn');
    const tunerModal = document.getElementById('tuner-modal');
    const tunerTransDown = document.getElementById('tuner-trans-down-btn');
    const tunerTransUp = document.getElementById('tuner-trans-up-btn');

    if (closeTunerBtn) closeTunerBtn.addEventListener('click', closeTunerModal);
    if (tunerApplyBtn) tunerApplyBtn.addEventListener('click', closeTunerModal);
    if (tunerModal) {
        tunerModal.addEventListener('click', (e) => {
            if (e.target === tunerModal) closeTunerModal();
        });
    }

    if (tunerTransDown) {
        tunerTransDown.addEventListener('click', () => {
            const ctrl = typeof getPadControllerState === 'function' ? getPadControllerState() : null;
            if (ctrl && ctrl.mode !== 'drumkit' && typeof transposePadNotes === 'function') {
                transposePadNotes(ctrl.mode, -1);
                populateTunerModalEditor(ctrl.mode);
            }
        });
    }

    if (tunerTransUp) {
        tunerTransUp.addEventListener('click', () => {
            const ctrl = typeof getPadControllerState === 'function' ? getPadControllerState() : null;
            if (ctrl && ctrl.mode !== 'drumkit' && typeof transposePadNotes === 'function') {
                transposePadNotes(ctrl.mode, 1);
                populateTunerModalEditor(ctrl.mode);
            }
        });
    }

    const presetTags = document.querySelectorAll('.tuner-preset-tag');
    presetTags.forEach(btn => {
        btn.addEventListener('click', () => {
            const scale = btn.dataset.scale;
            const ctrl = typeof getPadControllerState === 'function' ? getPadControllerState() : null;
            const inst = ctrl && ctrl.mode !== 'drumkit' ? ctrl.mode : 'synth';
            if (typeof setPadScale === 'function') {
                setPadScale(scale, inst);
                populateTunerModalEditor(inst);
            }
        });
    });

    renderBeatPadsUI();
}

/**
 * Met à jour et rafraîchit visuellement les 8 boutons Beat Pads / Clavier.
 */
function renderBeatPadsUI() {
    const grid = document.getElementById('mpc-pads-grid');
    if (!grid) return;

    const ctrl = typeof getPadControllerState === 'function' ? getPadControllerState() : { mode: 'drumkit', scale: 'synthwave' };
    const mode = ctrl.mode || 'drumkit';
    const isMelodic = mode !== 'drumkit';

    // Synchronisation du select mode
    const modeSelect = document.getElementById('mpc-mode-select');
    if (modeSelect) {
        // Met à jour les options débloquées / verrouillées
        Array.from(modeSelect.options).forEach(opt => {
            if (opt.value === 'drumkit') return;
            const def = typeof INSTRUMENT_DEFS !== 'undefined' ? INSTRUMENT_DEFS.find(i => i.id === opt.value) : null;
            const isUnlocked = typeof isInstrumentUnlocked === 'function' ? isInstrumentUnlocked(opt.value) : true;
            if (def) {
                opt.disabled = !isUnlocked;
                opt.textContent = isUnlocked ? `${def.icon} ${def.name}` : `🔒 ${def.name} (Requis: ${def.reqName})`;
            }
        });
        modeSelect.value = mode;
    }

    // Affichage des contrôles spécifiques aux instruments mélodiques
    const scaleSelect = document.getElementById('mpc-scale-select');
    const melodicActions = document.getElementById('mpc-melodic-actions');
    if (scaleSelect) {
        scaleSelect.style.display = isMelodic ? 'inline-block' : 'none';
        scaleSelect.value = ctrl.scale || 'synthwave';
    }
    if (melodicActions) {
        melodicActions.style.display = isMelodic ? 'flex' : 'none';
    }

    grid.innerHTML = '';

    const PAD_COLORS = ['cyan', 'magenta', 'gold', 'purple', 'blue', 'orange', 'green', 'red'];

    if (!isMelodic) {
        // Mode Multi Drum Kit : 8 Pads MPC Classiques (4x2)
        const DRUM_PAD_DEFS = [
            { id: 'kick', name: 'KICK', icon: '🥁', color: 'cyan', title: 'Kick 808' },
            { id: 'snare', name: 'SNARE', icon: '💥', color: 'magenta', title: 'Caisse Claire' },
            { id: 'hihat', name: 'HI-HAT', icon: '✨', color: 'gold', title: 'Charleston Hi-Hat' },
            { id: 'clap', name: 'CLAP', icon: '👏', color: 'orange', title: 'Clap 909' },
            { id: 'bass', name: 'BASS', icon: '🎸', color: 'blue', title: 'Sub-Bass 808' },
            { id: 'synth', name: 'SYNTH', icon: '🎹', color: 'purple', title: 'Synth Lead' },
            { id: 'pad', name: 'CHORD', icon: '🌌', color: 'green', title: 'Nappe Chord Pad' },
            { id: 'acid', name: 'ACID', icon: '⚡', color: 'red', title: 'Acid 303 Lead' }
        ];

        DRUM_PAD_DEFS.forEach((p, idx) => {
            const isUnlocked = typeof isInstrumentUnlocked === 'function' ? isInstrumentUnlocked(p.id) : true;
            const btn = document.createElement('button');
            btn.className = `mpc-pad ${p.color} ${!isUnlocked ? 'locked' : ''}`;
            btn.dataset.pad = p.id;
            btn.dataset.padIndex = idx;
            btn.title = isUnlocked ? `${p.title} [Touche ${idx + 1}]` : `🔒 ${p.title} (Verrouillé)`;

            btn.innerHTML = `
                <span class="pad-icon">${isUnlocked ? p.icon : '🔒'}</span>
                <span class="pad-label">${p.name} (${idx + 1})</span>
            `;

            btn.addEventListener('click', () => {
                if (typeof triggerBeatPad === 'function') {
                    triggerBeatPad(p.id, btn);
                }
            });

            grid.appendChild(btn);
        });
    } else {
        // Mode Instrument Solo Mélodique : 8 Notes personnalisées de l'instrument actif
        const notes = typeof getCurrentPadNotes === 'function' ? getCurrentPadNotes(mode) : ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        const instDef = typeof INSTRUMENT_DEFS !== 'undefined' ? INSTRUMENT_DEFS.find(i => i.id === mode) : null;
        const icon = instDef ? instDef.icon : '🎹';

        notes.forEach((note, idx) => {
            const color = PAD_COLORS[idx % PAD_COLORS.length];
            const btn = document.createElement('button');
            btn.className = `mpc-pad ${color} melodic-pad`;
            btn.dataset.pad = mode;
            btn.dataset.padIndex = idx;
            btn.dataset.note = note;
            btn.title = `${instDef ? instDef.name : 'Note'} : ${note} [Touche ${idx + 1}] (Clic droit pour accorder)`;

            btn.innerHTML = `
                <span class="pad-icon">${icon}</span>
                <span class="pad-note-tag">${note}</span>
                <span class="pad-label">(${idx + 1})</span>
            `;

            btn.addEventListener('click', () => {
                if (typeof triggerBeatPad === 'function') {
                    triggerBeatPad(idx, btn);
                }
            });

            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                openTunerModal(idx);
            });

            grid.appendChild(btn);
        });
    }
}

/**
 * Ouvre la modale d'accordage des 8 touches.
 */
function openTunerModal(focusedPadIdx = null) {
    const modal = document.getElementById('tuner-modal');
    if (!modal) return;

    const ctrl = typeof getPadControllerState === 'function' ? getPadControllerState() : null;
    let mode = ctrl ? ctrl.mode : 'synth';
    if (mode === 'drumkit') mode = 'synth';

    const instDef = typeof INSTRUMENT_DEFS !== 'undefined' ? INSTRUMENT_DEFS.find(i => i.id === mode) : null;
    const title = document.getElementById('tuner-modal-title');
    if (title && instDef) {
        title.textContent = `${instDef.icon} Accordage des 8 Boutons - ${instDef.name}`;
    }

    populateTunerModalEditor(mode, focusedPadIdx);
    modal.classList.add('open');
}

/**
 * Remplit le panneau d'accordage note par note.
 */
function populateTunerModalEditor(instId, highlightIdx = null) {
    const container = document.getElementById('tuner-pads-grid');
    if (!container) return;

    const notes = typeof getCurrentPadNotes === 'function' ? getCurrentPadNotes(instId) : [];
    container.innerHTML = '';

    const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const CHORDS_LIST = ['Am', 'Cmaj', 'Dm', 'Em', 'Fmaj', 'Gmaj', 'Am7', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am9', 'Bdim'];

    notes.forEach((noteStr, idx) => {
        const item = document.createElement('div');
        item.className = `tuner-pad-item ${highlightIdx === idx ? 'highlighted' : ''}`;

        const isChordInst = instId === 'pad';

        let pitch = 'C';
        let oct = 4;
        if (!isChordInst) {
            const match = noteStr.match(/^([A-Ga-g][#b]?)(-?\d+)?$/);
            if (match) {
                pitch = match[1].charAt(0).toUpperCase() + (match[1].length > 1 ? match[1].charAt(1) : '');
                oct = match[2] !== undefined ? parseInt(match[2], 10) : 4;
            }
        }

        let selectHtml = '';
        if (isChordInst) {
            selectHtml = `
                <select class="tuner-select tuner-chord-sel" data-pad-idx="${idx}">
                    ${CHORDS_LIST.map(ch => `<option value="${ch}" ${ch === noteStr ? 'selected' : ''}>${ch}</option>`).join('')}
                </select>
            `;
        } else {
            selectHtml = `
                <select class="tuner-select tuner-pitch-sel" data-pad-idx="${idx}">
                    ${CHROMATIC_NOTES.map(p => `<option value="${p}" ${p === pitch ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
                <select class="tuner-select tuner-oct-sel" data-pad-idx="${idx}">
                    ${[1, 2, 3, 4, 5, 6].map(o => `<option value="${o}" ${o === oct ? 'selected' : ''}>Oct. ${o}</option>`).join('')}
                </select>
            `;
        }

        item.innerHTML = `
            <div class="tuner-pad-num">Touche (${idx + 1})</div>
            <div class="tuner-selects-row">
                ${selectHtml}
            </div>
            <button class="tuner-test-btn" data-pad-idx="${idx}" title="Écouter cette note">🔊</button>
        `;

        // Écouteurs de modification
        const pitchSel = item.querySelector('.tuner-pitch-sel');
        const octSel = item.querySelector('.tuner-oct-sel');
        const chordSel = item.querySelector('.tuner-chord-sel');
        const testBtn = item.querySelector('.tuner-test-btn');

        const updateNote = () => {
            let finalNote = '';
            if (isChordInst && chordSel) {
                finalNote = chordSel.value;
            } else if (pitchSel && octSel) {
                finalNote = `${pitchSel.value}${octSel.value}`;
            }
            if (finalNote && typeof setPadCustomNote === 'function') {
                setPadCustomNote(instId, idx, finalNote);
            }
            // Pré-écoute
            initAudio();
            playSingleNoteAudition(instId, finalNote);
        };

        if (pitchSel) pitchSel.addEventListener('change', updateNote);
        if (octSel) octSel.addEventListener('change', updateNote);
        if (chordSel) chordSel.addEventListener('change', updateNote);

        if (testBtn) {
            testBtn.addEventListener('click', () => {
                let noteToPlay = isChordInst ? (chordSel ? chordSel.value : 'Am') : (`${pitchSel.value}${octSel.value}`);
                initAudio();
                playSingleNoteAudition(instId, noteToPlay);
            });
        }

        container.appendChild(item);
    });
}

/**
 * Joue une note en pré-écoute pour un instrument spécifique.
 */
function playSingleNoteAudition(instId, noteStr) {
    switch (instId) {
        case 'synth': playSynthLeadSound(noteStr); break;
        case 'bass': playSubBassSound(noteStr); break;
        case 'pad': playChordPadSound(noteStr); break;
        case 'piano': playPianoSound(noteStr); break;
        case 'pluck': playPluckSound(noteStr); break;
        case 'acid': playAcidSound(noteStr); break;
        case 'strings': playStringsSound(noteStr); break;
        case 'brass': playBrassSound(noteStr); break;
        case 'cosmic': playCosmicSound(noteStr); break;
        default: playSynthLeadSound(noteStr); break;
    }
}

/**
 * Ferme la modale d'accordage.
 */
function closeTunerModal() {
    const modal = document.getElementById('tuner-modal');
    if (modal) {
        modal.classList.remove('open');
    }
    renderBeatPadsUI();
}

/**
 * Met à jour l'affichage de la liste des équipements avec paliers et ROI.
 */
function updateEquipmentDisplay() {
    const equipmentList = document.getElementById('equipment-list');
    if (!equipmentList) return;

    equipmentList.innerHTML = '';

    const currentMultiplier = GameState.buyMultiplier || 1;
    const totalPassive = getTotalPassiveProduction();

    for (const def of EQUIPMENT_DEFS) {
        const count = getEquipmentCount(def.id);
        const milestoneMult = getEquipmentMilestoneMultiplier(count);
        const nextMilestone = getNextEquipmentMilestone(count);
        const unitProd = def.baseProduction * milestoneMult;
        const currentItemTotalProd = getEquipmentItemTotalProduction(def.id);
        const prodShare = totalPassive > 0 ? ((currentItemTotalProd / totalPassive) * 100).toFixed(1) : '0.0';

        const buyCalc = calculateEquipmentBuyCost(def.id, currentMultiplier);
        const canAfford = hasEnoughMoney(buyCalc.cost);

        const card = document.createElement('div');
        card.className = `equipment-card ${canAfford ? 'can-buy affordable' : 'unaffordable'}`;
        card.id = `equip-card-${def.id}`;

        let milestoneHtml = '';
        if (nextMilestone) {
            const prevMilestoneLevel = getPrevEquipmentMilestoneLevel(count);
            const neededInTier = nextMilestone.level - prevMilestoneLevel;
            const doneInTier = count - prevMilestoneLevel;
            const progressPct = Math.min(100, Math.max(0, (doneInTier / neededInTier) * 100));

            milestoneHtml = `
                <div class="milestone-container">
                    <div class="milestone-label-row">
                        <span class="milestone-text">Prochain palier: <strong>${nextMilestone.badge}</strong> (Nv. ${nextMilestone.level})</span>
                        <span class="milestone-mult-tag">x${nextMilestone.mult}</span>
                    </div>
                    <div class="milestone-bar-bg">
                        <div class="milestone-bar-fill" style="width: ${progressPct}%"></div>
                    </div>
                </div>
            `;
        } else {
            milestoneHtml = `
                <div class="milestone-container completed">
                    <span class="milestone-text">👑 <strong>Palier Galactique Maîtrisé (Max x120)</strong></span>
                </div>
            `;
        }

        const iconOrImg = `<div class="equip-img-thumb-wrap"><img src="${def.image}" alt="${def.name}" class="equip-img-thumb" loading="lazy"></div>`;

        card.innerHTML = `
            <div class="equip-header">
                ${iconOrImg}
                <div class="equip-title-group">
                    <h3 class="equip-name">${def.name}</h3>
                    <span class="equip-level-badge">Niveau ${count}</span>
                </div>
            </div>

            <p class="equip-desc">${def.description}</p>

            <div class="equip-stats-grid">
                <div class="equip-stat-item">
                    <span class="stat-k">Production unitaire :</span>
                    <span class="stat-v green">+${formatNumber(unitProd)} $/s</span>
                </div>
                <div class="equip-stat-item">
                    <span class="stat-k">Total de l'unité :</span>
                    <span class="stat-v cyan">${formatNumber(currentItemTotalProd)} $/s</span>
                </div>
                <div class="equip-stat-item">
                    <span class="stat-k">Part du Studio :</span>
                    <span class="stat-v gold">${prodShare}%</span>
                </div>
            </div>

            ${milestoneHtml}

            <button class="buy-button buy-equip-btn ${canAfford ? 'can-buy' : 'cannot-buy disabled'}" data-id="${def.id}" ${canAfford ? '' : 'disabled'}>
                <span class="buy-btn-label">Acheter (${buyCalc.quantity})</span>
                <span class="buy-btn-cost">${formatNumber(buyCalc.cost)} $</span>
            </button>
        `;

        const buyBtn = card.querySelector('.buy-button, .buy-equip-btn');
        buyBtn.addEventListener('click', () => {
            initAudio();
            const res = buyEquipment(def.id, currentMultiplier);
            if (res.success) {
                playBuySound();
                if (typeof spawnParticleBurst === 'function') {
                    const rect = buyBtn.getBoundingClientRect();
                    spawnParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 10);
                }
                const newCount = getEquipmentCount(def.id);
                spawnFloatingText(`+${buyCalc.quantity} ${def.name} (Nv. ${newCount})`, buyBtn, false);
                updateEquipmentDisplay();
                updateResourceDisplay();
                updateProductionDisplay();
                checkAndNotifyAchievements();
            }
        });

        equipmentList.appendChild(card);
    }
}

/**
 * Met à jour dynamiquement et sans latence l'accessibilité financière des équipements.
 */
function updateEquipmentAffordability() {
    const equipmentList = document.getElementById('equipment-list');
    if (!equipmentList || equipmentList.children.length === 0) {
        updateEquipmentDisplay();
        return;
    }

    const currentMultiplier = GameState.buyMultiplier || 1;
    const totalPassive = getTotalPassiveProduction();

    for (const def of EQUIPMENT_DEFS) {
        const card = document.getElementById(`equip-card-${def.id}`);
        if (!card) continue;

        const buyCalc = calculateEquipmentBuyCost(def.id, currentMultiplier);
        const canAfford = hasEnoughMoney(buyCalc.cost);

        const buyBtn = card.querySelector('.buy-button, .buy-equip-btn');
        if (buyBtn) {
            buyBtn.disabled = !canAfford;
            buyBtn.classList.toggle('can-buy', canAfford);
            buyBtn.classList.toggle('cannot-buy', !canAfford);
            buyBtn.classList.toggle('disabled', !canAfford);

            const labelEl = buyBtn.querySelector('.buy-btn-label');
            const costEl = buyBtn.querySelector('.buy-btn-cost');
            if (labelEl) labelEl.textContent = `Acheter (${buyCalc.quantity})`;
            if (costEl) costEl.textContent = `${formatNumber(buyCalc.cost)} $`;
        }

        card.classList.toggle('can-buy', canAfford);
        card.classList.toggle('affordable', canAfford);
        card.classList.toggle('unaffordable', !canAfford);

        // Actualisation du pourcentage de part du studio en temps réel
        const shareEl = card.querySelector('.stat-v.gold');
        if (shareEl) {
            const currentItemTotalProd = getEquipmentItemTotalProduction(def.id);
            const prodShare = totalPassive > 0 ? ((currentItemTotalProd / totalPassive) * 100).toFixed(1) : '0.0';
            shareEl.textContent = `${prodShare}%`;
        }
    }
}





/**
 * Met à jour l'onglet Quêtes Quotidiennes & Boutique de Cassettes.
 */
function updateQuestsDisplay() {
    const questsList = document.getElementById('daily-quests-list');
    const perksGrid = document.getElementById('cassette-perks-grid');
    if (!questsList || !perksGrid) return;

    if (!GameState.quests) initQuests();

    // 1. Quêtes
    const daily = GameState.quests.daily || [];
    questsList.innerHTML = daily.map(q => {
        const progPct = Math.min(100, Math.round((q.current / q.target) * 100));
        return `
            <div class="quest-card ${q.completed ? 'completed' : ''}">
                <div class="quest-info-block">
                    <h4 class="quest-title">${q.title}</h4>
                    <p class="quest-desc">${q.description}</p>
                    <div class="quest-progress-container">
                        <div class="quest-bar-bg">
                            <div class="quest-bar-fill" style="width: ${progPct}%"></div>
                        </div>
                        <span class="quest-numeric">${q.current} / ${q.target} ${q.unit}</span>
                    </div>
                </div>
                <div class="quest-reward-pill">
                    Récompense : <strong>+${q.reward.cassettes} 📼 Cassette</strong>
                    <span class="quest-status-badge ${q.completed ? 'done' : 'ongoing'}">
                        ${q.completed ? '✅ Terminé' : 'En cours'}
                    </span>
                </div>
            </div>
        `;
    }).join('');

    // 2. Avantages Boutique Cassettes
    const currentCassettes = GameState.resources.goldenCassettes || 0;
    perksGrid.innerHTML = CASSETTE_PERKS.map(p => {
        const isOwned = !!(GameState.quests.perks && GameState.quests.perks[p.id]);
        const canAfford = currentCassettes >= p.cost && !isOwned;

        return `
            <div class="perk-card ${isOwned ? 'owned' : (canAfford ? 'can-buy' : '')}" id="perk-card-${p.id}">
                <div class="perk-header">
                    <span class="perk-icon">${p.icon}</span>
                    <h4 class="perk-name">${p.name}</h4>
                </div>
                <p class="perk-desc">${p.description}</p>
                <button class="buy-perk-btn ${isOwned ? 'owned' : (canAfford ? 'can-buy' : 'disabled')}" data-id="${p.id}" ${isOwned || !canAfford ? 'disabled' : ''}>
                    ${isOwned ? '✅ ACQUIS' : `Débloquer (${p.cost} 📼)`}
                </button>
            </div>
        `;
    }).join('');

    perksGrid.querySelectorAll('.buy-perk-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            initAudio();
            const perkId = btn.dataset.id;
            const res = buyCassettePerk(perkId);
            if (res.success) {
                const perk = CASSETTE_PERKS.find(p => p.id === perkId);
                spawnFloatingText(`📼 Atout Débloqué : ${perk ? perk.name : perkId} !`, btn, true);
            } else {
                spawnFloatingText(`⚠️ ${res.reason}`, btn, false);
            }
        });
    });
}

/**
 * Met à jour dynamiquement la progression des quêtes et l'accessibilité des atouts cassettes.
 */
function updateQuestsAffordability() {
    const perksGrid = document.getElementById('cassette-perks-grid');
    if (perksGrid && typeof CASSETTE_PERKS !== 'undefined') {
        const currentCassettes = GameState.resources.goldenCassettes || 0;
        for (const p of CASSETTE_PERKS) {
            const card = document.getElementById(`perk-card-${p.id}`);
            if (!card) continue;

            const isOwned = !!(GameState.quests && GameState.quests.perks && GameState.quests.perks[p.id]);
            if (isOwned) continue;

            const canAfford = currentCassettes >= p.cost;
            const btn = card.querySelector('.buy-perk-btn');
            if (btn) {
                btn.disabled = !canAfford;
                btn.className = `buy-perk-btn ${canAfford ? 'can-buy' : 'disabled'}`;
            }
            card.classList.toggle('can-buy', canAfford);
        }
    }

    const questsList = document.getElementById('daily-quests-list');
    if (questsList && GameState.quests && GameState.quests.daily) {
        GameState.quests.daily.forEach((q, idx) => {
            const card = questsList.children[idx];
            if (!card) return;
            const progPct = Math.min(100, Math.round((q.current / q.target) * 100));
            const fill = card.querySelector('.quest-bar-fill');
            const num = card.querySelector('.quest-numeric');
            if (fill) fill.style.width = `${progPct}%`;
            if (num) num.textContent = `${q.current} / ${q.target} ${q.unit}`;
        });
    }
}

/**
 * Met à jour l'affichage des améliorations de Studio R&D.
 */
function updateUpgradesDisplay() {
    const list = document.getElementById('upgrades-list');
    if (!list || typeof UPGRADE_DEFS === 'undefined') return;

    list.innerHTML = '';
    for (const def of UPGRADE_DEFS) {
        const isBought = isUpgradeBought(def.id);
        const isUnlocked = isUpgradeUnlocked(def.id);

        if (!isUnlocked && !isBought) continue;

        const realCost = applyPrestigeCost(def.cost);
        const canAfford = hasEnoughMoney(realCost);

        const card = document.createElement('div');
        card.className = `upgrade-card ${isBought ? 'bought' : (canAfford ? 'affordable can-buy' : 'unaffordable')}`;
        card.id = `upgrade-card-${def.id}`;

        card.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-icon">${def.icon}</span>
                <div>
                    <h3 class="upgrade-name">${def.name}</h3>
                    <span class="upgrade-type-tag">${def.category || 'Recherche'}</span>
                </div>
            </div>
            <p class="upgrade-desc">${def.description}</p>
            <div class="upgrade-footer">
                ${isBought ?
                    '<span class="bought-tag">✅ Technologie Brevetée</span>' :
                    `<button class="upgrade-buy-btn buy-upgrade-btn ${canAfford ? 'can-buy' : 'disabled'}" data-id="${def.id}" ${canAfford ? '' : 'disabled'}>
                        <span>Débloquer</span>
                        <small>${formatNumber(realCost)} $</small>
                    </button>`
                }
            </div>
        `;

        if (!isBought) {
            const btn = card.querySelector('.upgrade-buy-btn, .buy-upgrade-btn');
            btn.addEventListener('click', () => {
                initAudio();
                const success = buyUpgrade(def.id);
                if (success) {
                    playUpgradeSound();
                    spawnFloatingText(`🔬 Amélioration R&D brevetée : ${def.name} !`, btn, true);
                    updateUpgradesDisplay();
                    updateResourceDisplay();
                    updateProductionDisplay();
                    checkAndNotifyAchievements();
                } else {
                    spawnFloatingText(`⚠️ Fonds insuffisants (${formatNumber(realCost)} $)`, btn, false);
                }
            });
        }

        list.appendChild(card);
    }
}

/**
 * Met à jour dynamiquement l'accessibilité des améliorations R&D en direct.
 */
function updateUpgradesAffordability() {
    const list = document.getElementById('upgrades-list');
    if (!list || typeof UPGRADE_DEFS === 'undefined') return;

    // Vérifie si une nouvelle amélioration s'est débloquée
    for (const def of UPGRADE_DEFS) {
        const isBought = isUpgradeBought(def.id);
        const isUnlocked = isUpgradeUnlocked(def.id);
        const card = document.getElementById(`upgrade-card-${def.id}`);
        if (isUnlocked && !card) {
            updateUpgradesDisplay();
            return;
        }
    }

    if (list.children.length === 0) {
        updateUpgradesDisplay();
        return;
    }

    for (const def of UPGRADE_DEFS) {
        const isBought = isUpgradeBought(def.id);
        if (isBought) continue;

        const card = document.getElementById(`upgrade-card-${def.id}`);
        if (!card) continue;

        const realCost = applyPrestigeCost(def.cost);
        const canAfford = hasEnoughMoney(realCost);

        const btn = card.querySelector('.upgrade-buy-btn, .buy-upgrade-btn');
        if (btn) {
            btn.disabled = !canAfford;
            btn.classList.toggle('can-buy', canAfford);
            btn.classList.toggle('disabled', !canAfford);
        }

        card.classList.toggle('affordable', canAfford);
        card.classList.toggle('can-buy', canAfford);
        card.classList.toggle('unaffordable', !canAfford);
    }
}



/**
 * Met à jour l'affichage des boosters.
 */
function updateBoostersDisplay() {
    const list = document.getElementById('boosters-list');
    if (!list) return;

    list.innerHTML = '';
    for (const def of BOOSTER_DEFS) {
        const active = isBoosterActive(def.id);
        const timeLeft = getBoosterTimeLeft(def.id);
        const realCost = applyPrestigeCost(def.cost);
        const canAfford = hasEnoughMoney(realCost);

        const card = document.createElement('div');
        card.className = `booster-card ${active ? 'active' : ''} ${canAfford ? 'affordable can-buy' : 'unaffordable'}`;
        card.id = `booster-card-${def.id}`;

        card.innerHTML = `
            <div class="booster-header">
                <span class="booster-icon">${def.icon}</span>
                <div>
                    <h3 class="booster-name">${def.name}</h3>
                    <span class="booster-duration">Durée: ${def.duration}s</span>
                </div>
            </div>
            <p class="booster-desc">${def.description}</p>
            <div class="booster-footer">
                ${active ?
                    `<span class="booster-active-tag">⚡ Actif (${Math.ceil(timeLeft)}s)</span>` :
                    `<button class="booster-buy-btn buy-booster-btn ${canAfford ? 'can-buy' : 'disabled'}" data-id="${def.id}" ${canAfford ? '' : 'disabled'}>
                        Activer pour ${formatNumber(realCost)} $
                    </button>`
                }
            </div>
        `;

        if (!active) {
            const btn = card.querySelector('.booster-buy-btn, .buy-booster-btn');
            btn.addEventListener('click', () => {
                initAudio();
                const res = buyBooster(def.id);
                if (res.success) {
                    playBoosterSound();
                    spawnFloatingText(`⚡ Booster activé : ${def.name} !`, btn, true);
                    updateBoostersDisplay();
                    updateResourceDisplay();
                    updateProductionDisplay();
                } else {
                    spawnFloatingText(`⚠️ ${res.reason}`, btn, false);
                }
            });
        }

        list.appendChild(card);
    }
}

/**
 * Met à jour dynamiquement les boosters sans détruire le DOM à 60 FPS.
 */
function updateBoostersAffordability() {
    const list = document.getElementById('boosters-list');
    if (!list || typeof BOOSTER_DEFS === 'undefined') return;

    if (list.children.length === 0) {
        updateBoostersDisplay();
        return;
    }

    for (const def of BOOSTER_DEFS) {
        const card = document.getElementById(`booster-card-${def.id}`);
        if (!card) continue;

        const active = isBoosterActive(def.id);

        if (active) {
            const timeLeft = getBoosterTimeLeft(def.id);
            const activeTag = card.querySelector('.booster-active-tag');
            if (activeTag) {
                activeTag.textContent = `⚡ Actif (${Math.ceil(timeLeft)}s)`;
            } else {
                updateBoostersDisplay();
                return;
            }
        } else {
            const btn = card.querySelector('.booster-buy-btn, .buy-booster-btn');
            if (!btn) {
                updateBoostersDisplay();
                return;
            }
            const realCost = applyPrestigeCost(def.cost);
            const canAfford = hasEnoughMoney(realCost);

            btn.disabled = !canAfford;
            btn.classList.toggle('can-buy', canAfford);
            btn.classList.toggle('disabled', !canAfford);

            card.classList.toggle('affordable', canAfford);
            card.classList.toggle('can-buy', canAfford);
            card.classList.toggle('unaffordable', !canAfford);
        }
    }
}



/**
 * Met à jour l'affichage des succès.
 */
function updateAchievementsDisplay() {
    const list = document.getElementById('achievements-list');
    const prog = document.getElementById('achievements-progress');
    if (!list) return;

    list.innerHTML = '';
    const unlockedCount = getUnlockedAchievementsCount();
    const totalCount = getTotalAchievementsCount();
    const pct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

    if (prog) {
        prog.innerHTML = `
            <div class="ach-prog-bar-container">
                <div class="ach-prog-label-row">
                    <span>Progression des Trophées : <strong>${unlockedCount} / ${totalCount}</strong></span>
                    <span>${pct}%</span>
                </div>
                <div class="ach-prog-bar-bg">
                    <div class="ach-prog-bar-fill" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }

    for (const def of ACHIEVEMENT_DEFS) {
        const isUnlocked = isAchievementUnlocked(def.id);
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;

        card.innerHTML = `
            <div class="ach-icon-wrap">${isUnlocked ? def.icon : '🔒'}</div>
            <div class="ach-details">
                <h4 class="ach-name">${def.name}</h4>
                <p class="ach-desc">${def.description}</p>
                <span class="ach-reward-tag">+${formatNumber(def.reward)} $</span>
            </div>
        `;
        list.appendChild(card);
    }
}

/**
 * Met à jour dynamiquement les éléments en temps réel de l'onglet actif (timers, jauges, accessibilité).
 */
function updateActiveTabDisplay() {
    const activeTab = document.querySelector('.tab-button.active');
    if (!activeTab) return;
    const tabId = activeTab.dataset.tab;

    if (tabId === 'equipment') {
        updateEquipmentAffordability();
    } else if (tabId === 'upgrades') {
        updateUpgradesAffordability();
    } else if (tabId === 'boosters') {
        updateBoostersAffordability();
    } else if (tabId === 'quests') {
        updateQuestsAffordability();
    } else if (tabId === 'prestige') {
        updatePrestigeAffordability();
    }
}

/**
 * Met à jour l'onglet Statistiques avec les métriques essentielles du studio.
 */
function updateStatsDisplay() {
    const content = document.getElementById('stats-content');
    if (!content) return;

    const stats = GameState.stats || {};
    const totalPrestiges = (GameState.prestige && GameState.prestige.totalPrestiges) ? GameState.prestige.totalPrestiges : 0;

    content.innerHTML = `
        <div class="stats-grid-dashboard">
            <div class="stat-dashboard-card">
                <span class="stat-card-icon">⏱️</span>
                <span class="stat-card-label">Temps de jeu total</span>
                <strong class="stat-card-val">${formatPlaytime(stats.playtimeSeconds)}</strong>
            </div>
            <div class="stat-dashboard-card">
                <span class="stat-card-icon">💰</span>
                <span class="stat-card-label">Trésorerie cumulée à vie</span>
                <strong class="stat-card-val green">${formatNumber(stats.totalMoneyEarned)} $</strong>
            </div>
            <div class="stat-dashboard-card">
                <span class="stat-card-icon">⭐</span>
                <span class="stat-card-label">Renommée totale à vie</span>
                <strong class="stat-card-val fame">${formatNumber(stats.totalFameEarned)} ⭐</strong>
            </div>
            <div class="stat-dashboard-card">
                <span class="stat-card-icon">🎛️</span>
                <span class="stat-card-label">Morceaux mixés manuellement</span>
                <strong class="stat-card-val cyan">${formatNumber(stats.tracksMixed)}</strong>
            </div>
            <div class="stat-dashboard-card">
                <span class="stat-card-icon">🔬</span>
                <span class="stat-card-label">Améliorations R&D débloquées</span>
                <strong class="stat-card-val gold">${stats.upgradesUnlocked || 0}</strong>
            </div>
            <div class="stat-dashboard-card">
                <span class="stat-card-icon">🎯</span>
                <span class="stat-card-label">Quêtes quotidiennes validées</span>
                <strong class="stat-card-val gold">${stats.questsCompleted || 0}</strong>
            </div>
            <div class="stat-dashboard-card">
                <span class="stat-card-icon">🎹</span>
                <span class="stat-card-label">Pas de Séquenceur joués</span>
                <strong class="stat-card-val cyan">${formatNumber(stats.sequencerBeatsPlayed || 0)}</strong>
            </div>
            <div class="stat-dashboard-card">
                <span class="stat-card-icon">✨</span>
                <span class="stat-card-label">Vinyles Dorés attrapés</span>
                <strong class="stat-card-val gold">${stats.goldenVinylsClicked || 0}</strong>
            </div>
            <div class="stat-dashboard-card">
                <span class="stat-card-icon">⚡</span>
                <span class="stat-card-label">Boosters énergétiques activés</span>
                <strong class="stat-card-val green">${stats.boostersUsed || 0}</strong>
            </div>
            <div class="stat-dashboard-card">
                <span class="stat-card-icon">👑</span>
                <span class="stat-card-label">Nombre de Refontes Studio (Prestige)</span>
                <strong class="stat-card-val gold">${totalPrestiges}</strong>
            </div>
        </div>
    `;

    if (typeof updateChartsDisplay === 'function') {
        updateChartsDisplay();
    }
}

/**
 * Met à jour l'onglet Prestige 2.0.
 */
function updatePrestigeDisplay() {
    const content = document.getElementById('prestige-content');
    if (!content) return;

    const pending = getPendingPrestigePoints();
    const canPrestige = canPerformPrestige();
    const p = GameState.prestige || { points: 0, lifetimeFame: 0 };
    const tree = p.tree || { soundMastery: 0, businessEmpire: 0, hypeOverdrive: 0 };

    content.innerHTML = `
        <div class="prestige-dashboard-card">
            <h2>👑 Refonte de Studio & Arbre de Maîtrise</h2>
            <p class="prestige-intro-text">
                Réinitialisez votre trésorerie et vos équipements pour acquérir des <strong>Points de Maîtrise</strong> permanents.
            </p>

            <div class="prestige-stats-row">
                <div class="p-stat">
                    <span>Points Disponibles</span>
                    <strong class="gold">${p.points} 👑</strong>
                </div>
                <div class="p-stat">
                    <span>Points à Gagner au Reset</span>
                    <strong class="cyan">+${pending} 👑</strong>
                </div>
                <div class="p-stat">
                    <span>Renommée à vie</span>
                    <strong class="fame">${formatNumber(p.lifetimeFame)} ⭐</strong>
                </div>
            </div>

            <button id="do-prestige-btn" class="do-prestige-btn ${canPrestige ? 'ready' : 'disabled'}" ${canPrestige ? '' : 'disabled'}>
                🏆 EXÉCUTER LA REFONTE DU STUDIO (+${pending} Points)
            </button>
        </div>

        <h3 class="section-title">🌳 Arbre de Spécialisation Sonore</h3>
        <div class="prestige-tree-grid">
            <div class="tree-node-card">
                <h4>🎛️ Maîtrise Acoustique (Nv. ${tree.soundMastery || 0})</h4>
                <p>+20% de Production globale par point investi.</p>
                <button class="upgrade-tree-btn ${p.points > 0 ? 'active' : 'disabled'}" data-node="soundMastery" ${p.points > 0 ? '' : 'disabled'}>
                    Investir 1 Point 👑
                </button>
            </div>

            <div class="tree-node-card">
                <h4>💼 Empire du Business (Nv. ${tree.businessEmpire || 0})</h4>
                <p>-8% de Réduction des Coûts & +15% de Renommée par point.</p>
                <button class="upgrade-tree-btn ${p.points > 0 ? 'active' : 'disabled'}" data-node="businessEmpire" ${p.points > 0 ? '' : 'disabled'}>
                    Investir 1 Point 👑
                </button>
            </div>

            <div class="tree-node-card">
                <h4>🔥 Overdrive de Hype (Nv. ${tree.hypeOverdrive || 0})</h4>
                <p>+3s de Durée Frenzy & +25% aux gains de clics par point.</p>
                <button class="upgrade-tree-btn ${p.points > 0 ? 'active' : 'disabled'}" data-node="hypeOverdrive" ${p.points > 0 ? '' : 'disabled'}>
                    Investir 1 Point 👑
                </button>
            </div>
        </div>
    `;

    const prestigeBtn = document.getElementById('do-prestige-btn');
    if (prestigeBtn) {
        prestigeBtn.addEventListener('click', () => {
            if (!canPerformPrestige()) {
                spawnFloatingText('⚠️ Renommée insuffisante pour débloquer de nouveaux points', prestigeBtn, false);
                return;
            }
            const currentPending = getPendingPrestigePoints();
            if (confirm(`🏆 Confirmer la refonte de studio ?\n\nVous gagnerez +${currentPending} Points de Maîtrise permanents.`)) {
                initAudio();
                const res = performPrestige();
                if (res) {
                    spawnFloatingText(`👑 Refonte accomplie : +${res.pointsEarned} Points de Maîtrise !`, document.getElementById('header'), true);
                }
                updateAllDisplay();
            }
        });
    }

    content.querySelectorAll('.upgrade-tree-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            initAudio();
            const node = btn.dataset.node;
            if (GameState.prestige && GameState.prestige.points > 0) {
                GameState.prestige.points--;
                GameState.prestige.spentPoints = (GameState.prestige.spentPoints || 0) + 1;
                if (!GameState.prestige.tree) GameState.prestige.tree = {};
                GameState.prestige.tree[node] = (GameState.prestige.tree[node] || 0) + 1;
                playUpgradeSound();
                spawnFloatingText(`👑 Compétence améliorée (+1) !`, btn, true);
                updatePrestigeDisplay();
                updateProductionDisplay();
                saveGame();
            } else {
                spawnFloatingText(`⚠️ Aucun Point de Maîtrise disponible`, btn, false);
            }
        });
    });
}

/**
 * Met à jour dynamiquement l'accessibilité du prestige et de l'arbre de maîtrise.
 */
function updatePrestigeAffordability() {
    const content = document.getElementById('prestige-content');
    if (!content) return;

    const pending = getPendingPrestigePoints();
    const canPrestige = canPerformPrestige();
    const p = GameState.prestige || { points: 0, lifetimeFame: 0 };

    const doPrestigeBtn = document.getElementById('do-prestige-btn');
    if (doPrestigeBtn) {
        doPrestigeBtn.disabled = !canPrestige;
        doPrestigeBtn.className = `do-prestige-btn ${canPrestige ? 'ready' : 'disabled'}`;
        doPrestigeBtn.textContent = `🏆 EXÉCUTER LA REFONTE DU STUDIO (+${pending} Points)`;
    }

    const pendingStat = content.querySelector('.p-stat strong.cyan');
    if (pendingStat) pendingStat.textContent = `+${pending} 👑`;

    const fameStat = content.querySelector('.p-stat strong.fame');
    if (fameStat) fameStat.textContent = `${formatNumber(p.lifetimeFame)} ⭐`;

    const pointsStat = content.querySelector('.p-stat strong.gold');
    if (pointsStat) pointsStat.textContent = `${p.points} 👑`;

    content.querySelectorAll('.upgrade-tree-btn').forEach(btn => {
        btn.disabled = p.points <= 0;
        btn.className = `upgrade-tree-btn ${p.points > 0 ? 'active' : 'disabled'}`;
    });
}

/**
 * Met à jour l'ensemble des écrans du jeu.
 */
function updateAllDisplay() {
    updateResourceDisplay();
    updateProductionDisplay();
    updateEquipmentDisplay();
    updateUpgradesDisplay();
    updateQuestsDisplay();
    updateBoostersDisplay();
    updateAchievementsDisplay();
    updateStatsDisplay();
    updatePrestigeDisplay();
}

/**
 * Initialise tous les écouteurs d'événements de l'interface.
 */
function initUI() {
    // Activer perk neon_deluxe si débloqué
    if (GameState.quests && GameState.quests.perks && GameState.quests.perks.neon_deluxe) {
        document.body.classList.add('neon-deluxe-active');
    }

    // Mixage Manuel (clic sur le vinyle et bouton principal)
    const mixButton = document.getElementById('mix-button');
    const turntable = document.getElementById('studio-turntable');

    const handleMixClick = () => {
        initAudio();
        const res = manualMix();
        if (res) {
            playMixSound();

            if (turntable) {
                turntable.classList.add('turntable-scratch');
                setTimeout(() => turntable.classList.remove('turntable-scratch'), 200);
            }

            if (typeof spawnParticleBurst === 'function') {
                const rect = mixButton ? mixButton.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
                spawnParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, res.isCrit ? 16 : 8);
            }

            if (typeof spawnFloatingText === 'function') {
                const msg = res.isCrit ? `💥 CRITIQUE +${formatNumber(res.money)} $ !` : `+${formatNumber(res.money)} $`;
                spawnFloatingText(msg, mixButton, res.isCrit);
            }

            updateResourceDisplay();
            updateProductionDisplay();
            checkAndNotifyAchievements();
        }
    };

    if (mixButton) mixButton.addEventListener('click', handleMixClick);
    if (turntable) turntable.addEventListener('click', handleMixClick);

    // Initialisation Beat Pads MPC & Accordage Mélodique
    initBeatPadsUI();

    // Initialisation du Séquenceur 16-Pas UI
    initSequencerUI();

    const seqPlayBtn = document.getElementById('seq-play-btn');
    if (seqPlayBtn) {
        seqPlayBtn.addEventListener('click', () => {
            toggleSequencerPlay();
        });
    }

    const seqClearBtn = document.getElementById('seq-clear-btn');
    if (seqClearBtn) {
        seqClearBtn.addEventListener('click', () => {
            clearSequencer();
        });
    }

    const seqPresetSelect = document.getElementById('seq-preset-select');
    if (seqPresetSelect) {
        seqPresetSelect.addEventListener('change', (e) => {
            loadSequencerPreset(e.target.value);
        });
    }

    // Curseur BPM du Séquenceur
    const seqBpmSlider = document.getElementById('seq-bpm-slider');
    if (seqBpmSlider) {
        seqBpmSlider.addEventListener('input', (e) => {
            setSequencerBpm(e.target.value);
        });
    }

    // Sélecteurs de boucle temporelle du Séquenceur (2, 4, 8, 16, 32 Pas)
    const seqStepPills = document.querySelectorAll('.seq-step-pill');
    seqStepPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const steps = parseInt(pill.dataset.steps, 10);
            if (typeof setSequencerStepCount === 'function') {
                setSequencerStepCount(steps);
            }
        });
    });

    // Sélecteurs de mesure du Séquenceur (Mesure 1, Mesure 2, Tout voir)
    const seqPageBtns = document.querySelectorAll('.seq-page-btn');
    seqPageBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            seqActivePage = btn.dataset.page || 'all';
            initSequencerUI();
        });
    });

    // Sélecteurs de mode de Visualiseur Canvas
    const visModeButtons = document.querySelectorAll('.vis-mode-btn');
    visModeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            visModeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.mode;
            setVisualizerMode(mode);
        });
    });

    // Sélecteurs de multiplicateurs d'achat (x1, x10, x25, x100, MAX)
    const multButtons = document.querySelectorAll('.buy-multiplier-btn');
    multButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            multButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const val = btn.dataset.multiplier;
            GameState.buyMultiplier = val === 'max' ? 'max' : parseInt(val, 10);
            updateEquipmentDisplay();
        });
    });

    // Navigation par Onglets
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            button.classList.add('active');
            const tabId = button.dataset.tab;
            const tabContent = document.getElementById(tabId + '-tab');
            if (tabContent) {
                tabContent.classList.add('active');
            }

            if (tabId === 'equipment') updateEquipmentDisplay();
            if (tabId === 'upgrades') updateUpgradesDisplay();
            if (tabId === 'quests') updateQuestsDisplay();
            if (tabId === 'boosters') updateBoostersDisplay();
            if (tabId === 'achievements') updateAchievementsDisplay();
            if (tabId === 'stats') updateStatsDisplay();
            if (tabId === 'prestige') updatePrestigeDisplay();
        });
    });

    // Modale Terminal de Codes Secrets
    const terminalBtn = document.getElementById('secret-terminal-btn');
    const terminalModal = document.getElementById('secret-terminal-modal');
    const closeTerminalBtn = document.getElementById('close-terminal-btn');
    const submitSecretCodeBtn = document.getElementById('submit-secret-code-btn');
    const secretCodeInput = document.getElementById('secret-code-input');
    const secretCodeFeedback = document.getElementById('secret-code-feedback');

    if (terminalBtn && terminalModal) {
        terminalBtn.addEventListener('click', () => {
            terminalModal.classList.add('open');
            if (secretCodeInput && typeof secretCodeInput.focus === 'function') secretCodeInput.focus();
        });
    }

    if (closeTerminalBtn && terminalModal) {
        closeTerminalBtn.addEventListener('click', () => {
            terminalModal.classList.remove('open');
        });
    }

    if (submitSecretCodeBtn && secretCodeInput) {
        const handleCodeSubmit = () => {
            initAudio();
            const res = redeemSecretCode(secretCodeInput.value);
            if (res.success) {
                if (secretCodeFeedback) {
                    secretCodeFeedback.innerHTML = `<span class="feedback-success">🎉 ${res.name} : ${res.description}</span>`;
                }
                secretCodeInput.value = '';
            } else {
                if (secretCodeFeedback) {
                    secretCodeFeedback.innerHTML = `<span class="feedback-error">⚠️ ${res.reason}</span>`;
                }
            }
        };
        submitSecretCodeBtn.addEventListener('click', handleCodeSubmit);
        secretCodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleCodeSubmit();
        });
    }

    // Modale Backup & Sync (Base64)
    const backupBtn = document.getElementById('export-import-btn');
    const backupModal = document.getElementById('backup-modal');
    const closeBackupBtn = document.getElementById('close-backup-btn');
    const exportTextarea = document.getElementById('export-save-textarea');
    const copySaveBtn = document.getElementById('copy-save-btn');
    const importTextarea = document.getElementById('import-save-textarea');
    const submitImportBtn = document.getElementById('submit-import-save-btn');
    const importFeedback = document.getElementById('import-save-feedback');

    if (backupBtn && backupModal) {
        backupBtn.addEventListener('click', () => {
            backupModal.classList.add('open');
            if (exportTextarea) {
                exportTextarea.value = exportSaveString();
            }
        });
    }

    if (closeBackupBtn && backupModal) {
        closeBackupBtn.addEventListener('click', () => {
            backupModal.classList.remove('open');
        });
    }

    if (copySaveBtn && exportTextarea) {
        copySaveBtn.addEventListener('click', () => {
            exportTextarea.select();
            navigator.clipboard.writeText(exportTextarea.value);
            spawnFloatingText('📋 Clé de sauvegarde copiée !', copySaveBtn, true);
        });
    }

    if (submitImportBtn && importTextarea) {
        submitImportBtn.addEventListener('click', () => {
            initAudio();
            const res = importSaveString(importTextarea.value);
            if (res.success) {
                spawnFloatingText('✅ Sauvegarde importée avec succès !', submitImportBtn, true);
                backupModal.classList.remove('open');
                importTextarea.value = '';
            } else {
                if (importFeedback) {
                    importFeedback.innerHTML = `<span class="feedback-error">⚠️ ${res.reason}</span>`;
                }
            }
        });
    }

    // Modale Rapport de Gains Hors-Ligne
    const offlineModal = document.getElementById('offline-modal');
    const closeOfflineBtn = document.getElementById('claim-offline-btn') || document.getElementById('close-offline-btn');
    if (closeOfflineBtn && offlineModal) {
        closeOfflineBtn.addEventListener('click', () => {
            offlineModal.classList.remove('open');
            if (typeof playCoinSound === 'function') playCoinSound();
        });
    }

    // =========================================================================
    // MODALE RACK D'EFFETS DSP & RÉGLAGES D'INSTRUMENT (CHANNEL STRIP)
    // =========================================================================
    const fxModal = document.getElementById('fx-modal');
    const closeFxBtn = document.getElementById('close-fx-modal');
    const fxApplyBtn = document.getElementById('fx-apply-btn');
    const fxResetBtn = document.getElementById('fx-reset-btn');
    const fxPreviewBtn = document.getElementById('fx-preview-btn');

    if (closeFxBtn) closeFxBtn.addEventListener('click', closeInstrumentFxModal);
    if (fxApplyBtn) fxApplyBtn.addEventListener('click', closeInstrumentFxModal);

    if (fxPreviewBtn) {
        fxPreviewBtn.addEventListener('click', () => {
            if (activeFxTrackId) {
                initAudio();
                playTrackSound(activeFxTrackId);
            }
        });
    }

    if (fxResetBtn) {
        fxResetBtn.addEventListener('click', () => {
            if (activeFxTrackId && typeof resetTrackSettings === 'function') {
                resetTrackSettings(activeFxTrackId);
                updateFxModalControls(activeFxTrackId);
                initAudio();
                playTrackSound(activeFxTrackId);
            }
        });
    }

    // Sliders de réglages & effets
    const fxSliders = [
        { id: 'fx-volume-slider', key: 'volume', transform: v => v / 100, labelId: 'fx-volume-val', format: v => `${v}%` },
        { id: 'fx-pan-slider', key: 'pan', transform: v => v / 100, labelId: 'fx-pan-val', format: v => v < 0 ? `${Math.abs(v)}% G` : v > 0 ? `${v}% D` : 'Centre' },
        { id: 'fx-pitch-slider', key: 'pitch', transform: v => parseInt(v, 10), labelId: 'fx-pitch-val', format: v => `${v > 0 ? '+' : ''}${v} st` },
        { id: 'fx-cutoff-slider', key: 'cutoff', transform: v => parseInt(v, 10), labelId: 'fx-cutoff-val', format: v => v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v} Hz` },
        { id: 'fx-resonance-slider', key: 'resonance', transform: v => parseFloat(v), labelId: 'fx-resonance-val', format: v => parseFloat(v).toFixed(1) },
        { id: 'fx-reverb-slider', key: 'reverb', transform: v => v / 100, labelId: 'fx-reverb-val', format: v => `${v}%` },
        { id: 'fx-delay-slider', key: 'delay', transform: v => v / 100, labelId: 'fx-delay-val', format: v => `${v}%` },
        { id: 'fx-delaytime-slider', key: 'delayTime', transform: v => v / 1000, labelId: 'fx-delaytime-val', format: (v, slider) => {
            const s = (activeFxTrackId && typeof getInstrumentTrackSettings === 'function') ? getInstrumentTrackSettings(activeFxTrackId) : {};
            return `${v} ms (${Math.round((s.delayFeedback || 0.4) * 100)}% FB)`;
        }},
        { id: 'fx-drive-slider', key: 'drive', transform: v => v / 100, labelId: 'fx-drive-val', format: v => `${v}%` }
    ];

    fxSliders.forEach(item => {
        const slider = document.getElementById(item.id);
        const label = document.getElementById(item.labelId);
        if (slider) {
            slider.addEventListener('input', (e) => {
                if (!activeFxTrackId) return;
                const val = e.target.value;
                if (label) label.textContent = item.format(val, slider);
                if (typeof updateInstrumentTrackSetting === 'function') {
                    updateInstrumentTrackSetting(activeFxTrackId, item.key, item.transform(val));
                }
            });
        }
    });

    // Filtre Type Pills
    const filterPills = document.querySelectorAll('.fx-filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            if (!activeFxTrackId) return;
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const type = pill.dataset.type;
            if (typeof updateInstrumentTrackSetting === 'function') {
                updateInstrumentTrackSetting(activeFxTrackId, 'filterType', type);
                initAudio();
                playTrackSound(activeFxTrackId);
            }
        });
    });

    // Waveform Pills
    const wavePills = document.querySelectorAll('.fx-wave-pill');
    wavePills.forEach(pill => {
        pill.addEventListener('click', () => {
            if (!activeFxTrackId) return;
            wavePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const wave = pill.dataset.wave;
            if (typeof updateInstrumentTrackSetting === 'function') {
                updateInstrumentTrackSetting(activeFxTrackId, 'waveform', wave);
                initAudio();
                playTrackSound(activeFxTrackId);
            }
        });
    });

    // Presets Rapides
    const presetTags = document.querySelectorAll('.fx-preset-tag');
    presetTags.forEach(tag => {
        tag.addEventListener('click', () => {
            if (!activeFxTrackId) return;
            const presetKey = tag.dataset.preset;
            if (typeof applyTrackFxPreset === 'function') {
                applyTrackFxPreset(activeFxTrackId, presetKey);
                updateFxModalControls(activeFxTrackId);
                initAudio();
                playTrackSound(activeFxTrackId);
            }
        });
    });

    // Mute & Solo Toggles in modal
    const muteToggle = document.getElementById('fx-mute-toggle');
    if (muteToggle) {
        muteToggle.addEventListener('click', () => {
            if (activeFxTrackId && typeof toggleTrackMute === 'function') {
                const muted = toggleTrackMute(activeFxTrackId);
                if (muted) muteToggle.classList.add('active');
                else muteToggle.classList.remove('active');
            }
        });
    }

    const soloToggle = document.getElementById('fx-solo-toggle');
    if (soloToggle) {
        soloToggle.addEventListener('click', () => {
            if (activeFxTrackId && typeof toggleTrackSolo === 'function') {
                const solo = toggleTrackSolo(activeFxTrackId);
                if (solo) soloToggle.classList.add('active');
                else soloToggle.classList.remove('active');
            }
        });
    }

    // =========================================================================
    // SECTION OPTIONS DU STUDIO
    // =========================================================================
    const optionsModal = document.getElementById('options-modal');
    const optionsBtn = document.getElementById('options-btn');
    const footerOptionsBtn = document.getElementById('footer-options-btn');
    const closeOptionsBtn = document.getElementById('close-options-btn');

    const openOptionsModal = () => {
        if (!optionsModal) return;
        // Synchroniser les valeurs avec GameState.settings
        const s = GameState.settings || {};
        const masterSlider = document.getElementById('opt-vol-master');
        const sfxSlider = document.getElementById('opt-vol-sfx');
        const musicSlider = document.getElementById('opt-vol-music');
        const seqSlider = document.getElementById('opt-vol-seq');
        const partSwitch = document.getElementById('opt-toggle-particles');
        const shakeSwitch = document.getElementById('opt-toggle-shake');
        const powerSwitch = document.getElementById('opt-toggle-powersave');
        const autoSaveSel = document.getElementById('opt-autosave-select');

        if (masterSlider) { masterSlider.value = Math.round((s.masterVolume ?? 0.8) * 100); document.getElementById('opt-val-master').textContent = masterSlider.value + '%'; }
        if (sfxSlider) { sfxSlider.value = Math.round((s.sfxVolume ?? 0.8) * 100); document.getElementById('opt-val-sfx').textContent = sfxSlider.value + '%'; }
        if (musicSlider) { musicSlider.value = Math.round((s.musicVolume ?? 0.5) * 100); document.getElementById('opt-val-music').textContent = musicSlider.value + '%'; }
        if (seqSlider) { seqSlider.value = Math.round((s.seqVolume ?? 0.7) * 100); document.getElementById('opt-val-seq').textContent = seqSlider.value + '%'; }
        if (partSwitch) partSwitch.checked = s.particleEffects !== false;
        if (shakeSwitch) shakeSwitch.checked = s.screenShake !== false;
        if (powerSwitch) powerSwitch.checked = s.powerSave === true;
        if (autoSaveSel && s.autoSaveInterval) autoSaveSel.value = s.autoSaveInterval.toString();

        // Notation active
        const notationBtns = document.querySelectorAll('#opt-notation-selector .opt-segment-btn');
        notationBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.notation === (s.numberNotation || 'standard'));
        });

        optionsModal.classList.add('open');
    };

    if (optionsBtn) optionsBtn.addEventListener('click', openOptionsModal);
    if (footerOptionsBtn) footerOptionsBtn.addEventListener('click', openOptionsModal);
    if (closeOptionsBtn && optionsModal) {
        closeOptionsBtn.addEventListener('click', () => optionsModal.classList.remove('open'));
    }

    // Sliders de volume options
    const wireVolumeSlider = (sliderId, badgeId, setterFn) => {
        const slider = document.getElementById(sliderId);
        const badge = document.getElementById(badgeId);
        if (slider && badge) {
            slider.addEventListener('input', (e) => {
                const pct = parseInt(e.target.value, 10);
                badge.textContent = pct + '%';
                setterFn(pct / 100);
            });
        }
    };
    wireVolumeSlider('opt-vol-master', 'opt-val-master', setMasterVolume);
    wireVolumeSlider('opt-vol-sfx', 'opt-val-sfx', setSfxVolume);
    wireVolumeSlider('opt-vol-music', 'opt-val-music', setMusicVolume);
    wireVolumeSlider('opt-vol-seq', 'opt-val-seq', setSeqVolume);

    // Sélecteur de notation des nombres
    const notationBtns = document.querySelectorAll('#opt-notation-selector .opt-segment-btn');
    notationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            notationBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (GameState && GameState.settings) {
                GameState.settings.numberNotation = btn.dataset.notation;
            }
            updateAllDisplay();
        });
    });

    // Switches graphiques & performances
    const partSwitch = document.getElementById('opt-toggle-particles');
    if (partSwitch) {
        partSwitch.addEventListener('change', (e) => {
            if (GameState.settings) GameState.settings.particleEffects = e.target.checked;
        });
    }

    const shakeSwitch = document.getElementById('opt-toggle-shake');
    if (shakeSwitch) {
        shakeSwitch.addEventListener('change', (e) => {
            if (GameState.settings) GameState.settings.screenShake = e.target.checked;
        });
    }

    const powerSwitch = document.getElementById('opt-toggle-powersave');
    if (powerSwitch) {
        powerSwitch.addEventListener('change', (e) => {
            if (GameState.settings) GameState.settings.powerSave = e.target.checked;
        });
    }

    const autoSaveSelect = document.getElementById('opt-autosave-select');
    if (autoSaveSelect) {
        autoSaveSelect.addEventListener('change', (e) => {
            const val = parseInt(e.target.value, 10) || 20;
            if (GameState.settings) GameState.settings.autoSaveInterval = val;
            updateSaveStatus(`Sauvegarde automatique réglée à ${val}s.`);
        });
    }

    const optOpenSyncBtn = document.getElementById('opt-open-sync-btn');
    if (optOpenSyncBtn && backupModal) {
        optOpenSyncBtn.addEventListener('click', () => {
            if (optionsModal) optionsModal.classList.remove('open');
            backupModal.classList.add('open');
            if (exportTextarea) exportTextarea.value = exportSaveString();
        });
    }

    const optHardResetBtn = document.getElementById('opt-hard-reset-btn');
    if (optHardResetBtn) {
        optHardResetBtn.addEventListener('click', () => {
            if (confirm('⚠️ CONFIRMATION : Êtes-vous ABSOLUMENT certain de vouloir effacer votre sauvegarde et recommencer à zéro ?')) {
                deleteSave();
                resetGameState();
                updateAllDisplay();
                if (optionsModal) optionsModal.classList.remove('open');
                updateSaveStatus('🔄 Sauvegarde réinitialisée avec succès.');
            }
        });
    }

    // =========================================================================
    // SECTION MANUEL & GUIDE DU PRODUCTEUR (AIDE)
    // =========================================================================
    const helpModal = document.getElementById('help-modal');
    const helpBtn = document.getElementById('help-btn');
    const footerHelpBtn = document.getElementById('footer-help-btn');
    const closeHelpBtn = document.getElementById('close-help-btn');
    const helpNavBtns = document.querySelectorAll('.help-nav-btn');
    const helpChapters = document.querySelectorAll('.help-chapter');

    const openHelpModal = () => {
        if (helpModal) helpModal.classList.add('open');
    };

    if (helpBtn) helpBtn.addEventListener('click', openHelpModal);
    if (footerHelpBtn) footerHelpBtn.addEventListener('click', openHelpModal);
    if (closeHelpBtn && helpModal) {
        closeHelpBtn.addEventListener('click', () => helpModal.classList.remove('open'));
    }

    helpNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            helpNavBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const chapter = btn.dataset.chapter;

            helpChapters.forEach(chap => {
                chap.classList.toggle('active', chap.id === `help-chapter-${chapter}`);
            });
        });
    });

    // =========================================================================
    // RACCOURCIS CLAVIER PRO (KEYBOARD SHORTCUTS)
    // =========================================================================
    window.addEventListener('keydown', (e) => {
        // Ne pas intercepter si l'utilisateur saisit dans un champ de texte
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
            if (e.key === 'Escape') {
                document.activeElement.blur();
            }
            return;
        }

        // Touche Échap : Ferme toutes les modales ouvertes
        if (e.key === 'Escape') {
            document.querySelectorAll('.studio-modal.open').forEach(m => m.classList.remove('open'));
            return;
        }

        // Touche Espace : Mixer
        if (e.code === 'Space') {
            e.preventDefault();
            handleMixClick();
            return;
        }

        // Touches 1 à 9, 0, A, Z, E : Beat Pads MPC
        const keyMap = {
            '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '0': 9,
            'a': 10, 'A': 10, 'z': 11, 'Z': 11, 'e': 12, 'E': 12
        };
        if (typeof keyMap[e.key] !== 'undefined') {
            const padIndex = keyMap[e.key];
            const pads = document.querySelectorAll('.mpc-pad');
            if (pads && pads[padIndex]) {
                pads[padIndex].click();
            }
            return;
        }

        // Touche P : Play / Pause Séquenceur
        if (e.code === 'KeyP') {
            e.preventDefault();
            toggleSequencerPlay();
            return;
        }

        // Touche M : Mute / Unmute Son
        if (e.code === 'KeyM') {
            initAudio();
            const on = toggleSound();
            if (soundToggle) soundToggle.textContent = on ? '🔊' : '🔇';
            spawnFloatingText(on ? '🔊 Son Activé' : '🔇 Son Coupé', document.body, false);
            return;
        }

        // Touche H : Ouvrir / Fermer l'Aide
        if (e.code === 'KeyH') {
            if (helpModal) helpModal.classList.toggle('open');
            return;
        }

        // Touche O : Ouvrir / Fermer les Options
        if (e.code === 'KeyO') {
            if (optionsModal) {
                if (optionsModal.classList.contains('open')) {
                    optionsModal.classList.remove('open');
                } else {
                    openOptionsModal();
                }
            }
            return;
        }
    });

    // Boutons Sauvegarde & Réinitialisation Footer
    const saveBtn = document.getElementById('save-button');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (saveGame()) {
                updateSaveStatus('💾 Sauvegarde manuelle réussie !');
            }
        });
    }

    const resetBtn = document.getElementById('reset-button');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('⚠️ Voulez-vous vraiment réinitialiser entièrement la partie ?')) {
                deleteSave();
                resetGameState();
                updateAllDisplay();
                updateSaveStatus('🔄 Progression réinitialisée.');
            }
        });
    }

    // Contrôles Audio & Thème
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            initAudio();
            const on = toggleSound();
            soundToggle.textContent = on ? '🔊' : '🔇';
        });
    }

    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle) {
        musicToggle.addEventListener('click', () => {
            initAudio();
            const on = toggleMusic();
            musicToggle.textContent = on ? '🎵' : '🎵❌';
        });
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

/**
 * Affiche le popup de retour hors-ligne estilé.
 */
function showOfflineGainsModal(timeSeconds, moneyGained) {
    const offlineModal = document.getElementById('offline-modal');
    const timeEl = document.getElementById('offline-time-text');
    const moneyEl = document.getElementById('offline-money-text');

    if (offlineModal && timeEl && moneyEl) {
        timeEl.textContent = formatPlaytime(timeSeconds);
        moneyEl.textContent = `+${formatNumber(moneyGained)} $`;
        offlineModal.classList.add('open');
    }
}

/**
 * Bascule entre le thème sombre et clair.
 */
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('light-theme', !isDarkTheme);
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.textContent = isDarkTheme ? '🌙' : '☀️';
    }
}

/**
 * Met à jour le message de statut de sauvegarde.
 */
function updateSaveStatus(msg) {
    const status = document.getElementById('save-status');
    if (status) {
        status.textContent = msg;
        status.classList.add('flash');
        setTimeout(() => status.classList.remove('flash'), 1500);
    }
}

/**
 * Formate une durée en secondes en texte lisible.
 */
function formatPlaytime(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

