/**
 * audio.js - Moteur audio procédural et effets sonores avancés
 * 
 * Utilise la Web Audio API pour générer de la musique dynamique (Lo-Fi / Synthwave)
 * et des bruitages percutants (basses 808, scratchs, caisses claires, jingles)
 * sans aucun fichier audio externe requis.
 */

// Contexte audio et nœuds globaux
let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let analyserNode = null;

// État audio
let isSoundEnabled = true;
let isMusicEnabled = true;
let soundVolume = 0.8;
let musicVolume = 0.5;
let isMusicPlaying = false;
let musicStep = 0;
let musicInterval = null;

// Échelles et gammes pour la musique procédurale (Synthwave en La mineur / Pentatonique)
const BASS_NOTES = [110, 110, 130.81, 146.83, 164.81, 130.81, 110, 98]; // A2, C3, D3, E3, etc.
const LEAD_NOTES = [220, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 659.25]; // A3..E5
const CHORD_FREQS = [
    [220, 261.63, 329.63], // Am
    [174.61, 220, 261.63], // F
    [196.00, 246.94, 293.66], // G
    [164.81, 196.00, 246.94]  // Em
];

// Table de demi-tons pour la conversion de notes
const NOTE_BASE_SEMITONES = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4, 'E#': 5,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11, 'B#': 12
};

// Dictionnaire d'accords pour nappes et pads polyphoniques
const CHORD_DICTIONARY = {
    'Am': [220, 261.63, 329.63],
    'Cmaj': [261.63, 329.63, 392.00],
    'Dm': [293.66, 349.23, 440.00],
    'Em': [164.81, 196.00, 246.94],
    'Fmaj': [174.61, 220.00, 261.63],
    'Gmaj': [196.00, 246.94, 293.66],
    'Am7': [220, 261.63, 329.63, 392.00],
    'Cmaj7': [261.63, 329.63, 392.00, 493.88],
    'Dm7': [293.66, 349.23, 440.00, 523.25],
    'Em7': [164.81, 196.00, 246.94, 293.66],
    'Fmaj7': [174.61, 220.00, 261.63, 329.63],
    'G7': [196.00, 246.94, 293.66, 349.23],
    'Bdim': [246.94, 293.66, 349.23],
    'Am9': [220, 261.63, 329.63, 392.00, 493.88],
    'Cosmic1': [110, 164.81, 220, 329.63],
    'Cosmic2': [130.81, 196.00, 261.63, 392.00]
};

/**
 * Convertit un nom de note (ex: "A3", "C#4", "Eb2") ou un nombre en fréquence Hz.
 */
function noteToFreq(noteInput, defaultFreq = 440) {
    if (typeof noteInput === 'number') return noteInput;
    if (!noteInput || typeof noteInput !== 'string') return defaultFreq;

    const trimmed = noteInput.trim();
    if (CHORD_DICTIONARY && CHORD_DICTIONARY[trimmed]) {
        return CHORD_DICTIONARY[trimmed];
    }

    const match = trimmed.match(/^([A-Ga-g][#b]?)(-?\d+)?$/);
    if (!match) return defaultFreq;

    const rawPitch = match[1];
    const pitch = rawPitch.charAt(0).toUpperCase() + (rawPitch.length > 1 ? rawPitch.charAt(1) : '');
    const octave = match[2] !== undefined ? parseInt(match[2], 10) : 4;

    if (typeof NOTE_BASE_SEMITONES[pitch] === 'undefined') return defaultFreq;

    const semiFromC0 = NOTE_BASE_SEMITONES[pitch] + (octave * 12);
    const midi = semiFromC0 + 12; // A4 = MIDI 69 = 440 Hz
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Initialise le contexte Web Audio au premier clic utilisateur.
 */
function initAudio() {
    if (audioCtx) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return;
    }

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();

        // Master Gain
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 1.0;

        // Analyser Node pour le visualiseur visuel de fréquences principal
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 128;
        analyserNode.smoothingTimeConstant = 0.8;

        // Analyser Node dédié pour l'oscilloscope temps réel de la modale Sound Design
        trackAnalyserNode = audioCtx.createAnalyser();
        trackAnalyserNode.fftSize = 512;
        trackAnalyserNode.smoothingTimeConstant = 0.75;

        // Music & SFX Gain
        musicGain = audioCtx.createGain();
        musicGain.gain.value = musicVolume;

        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = soundVolume;

        // Connexions
        musicGain.connect(masterGain);
        sfxGain.connect(masterGain);
        masterGain.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);

        // Seul le beat du séquenceur créé par le joueur est joué
        stopDynamicMusic();
    } catch (e) {
        console.warn('Web Audio API non supportée ou bloquée :', e);
    }
}

/**
 * Récupère le nœud d'analyse principal pour le visualiseur Canvas.
 */
function getAudioAnalyser() {
    return analyserNode;
}

/**
 * Récupère le nœud d'analyse dédié pour l'oscilloscope de la modale Sound Design.
 */
function getTrackAnalyser() {
    return trackAnalyserNode;
}

// ============================================================================
// MODULE DSP & CHAÎNE DE TRAITEMENT D'EFFETS AUDIO TEMPS RÉEL (PRO STUDIO)
// ============================================================================

/**
 * Génère une table de distorsion multi-modes (Tube analogique, Fuzz mordant, Bitcrusher 8-bit).
 */
function makeDistortionCurve(amount = 20, mode = 'tube') {
    const k = typeof amount === 'number' ? Math.max(1, amount) : 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    if (mode === 'fuzz') {
        // Fuzz agressif avec asymétrie et clipping franc
        for (let i = 0; i < n_samples; ++i) {
            let x = (i * 2) / n_samples - 1;
            let y = x * (1 + k * 0.15);
            if (y > 0.6) y = 0.6 + (y - 0.6) * 0.1;
            if (y < -0.4) y = -0.4 - (Math.abs(y) - 0.4) * 0.05;
            curve[i] = Math.max(-1, Math.min(1, y));
        }
    } else if (mode === 'crush') {
        // Bitcrusher / Réducteur de résolution lo-fi 8-bit
        const bits = Math.max(3, Math.min(12, 14 - Math.floor(k * 0.2)));
        const step = Math.pow(0.5, bits);
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = Math.max(-1, Math.min(1, Math.round(x / step) * step));
        }
    } else {
        // Mode par défaut : Saturation analogique à lampe chaleureuse (Tube)
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
    }
    return curve;
}

/**
 * Crée la chaîne de traitement DSP temps réel pour un instrument donné :
 * Volume, Panoramique, Filtre/EQ (Passe-bas/haut/bande + Cutoff + Résonance),
 * Modulation LFO dynamique, Saturation Multi-Modes, Delay Stéréo Ping-Pong synchro BPM,
 * Réverbération Spatiale (Hall/Plate/Shimmer/Space) et retour Oscilloscope.
 */
function createTrackDspChain(trackId, now, duration = 0.5) {
    if (!audioCtx) return sfxGain;

    const settings = (typeof getInstrumentTrackSettings === 'function') 
        ? getInstrumentTrackSettings(trackId) 
        : null;

    if (!settings) return sfxGain;

    // Gestion Mute & Solo
    const isAnySolo = (typeof isAnyTrackSoloed === 'function') && isAnyTrackSoloed();
    const isMuted = settings.mute || (isAnySolo && !settings.solo);
    if (isMuted) {
        const silentNode = audioCtx.createGain();
        silentNode.gain.setValueAtTime(0, now);
        silentNode.connect(sfxGain);
        return silentNode;
    }

    const inputNode = audioCtx.createGain();
    inputNode.gain.setValueAtTime(1.0, now);
    let currentNode = inputNode;

    // 1. Saturation Multi-Modes / Overdrive (WaveShaper)
    if (settings.drive && settings.drive > 0.01) {
        const driveAmount = settings.drive * 50;
        const shaper = audioCtx.createWaveShaper();
        shaper.curve = makeDistortionCurve(driveAmount, settings.distMode || 'tube');
        shaper.oversample = '4x';
        currentNode.connect(shaper);
        currentNode = shaper;
    }

    // 2. Égaliseur & Filtre Biquad (Low-Pass, High-Pass, Band-Pass, Notch, Peaking)
    let filterNode = null;
    if (settings.cutoff && (settings.cutoff < 19800 || settings.filterType !== 'lowpass' || (settings.resonance && settings.resonance > 1.1))) {
        filterNode = audioCtx.createBiquadFilter();
        filterNode.type = settings.filterType || 'lowpass';
        const baseCutoff = Math.max(20, Math.min(20000, settings.cutoff || 20000));
        filterNode.frequency.setValueAtTime(baseCutoff, now);
        filterNode.Q.setValueAtTime(Math.max(0.1, Math.min(20, settings.resonance || 1.0)), now);
        currentNode.connect(filterNode);
        currentNode = filterNode;
    }

    // 3. Modulation LFO Dynamique (Auto-Wah, Tremolo, Auto-Pan, Vibrato)
    if (settings.lfoDepth && settings.lfoDepth > 0.02) {
        try {
            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();
            const lfoRate = Math.max(0.1, Math.min(25, settings.lfoRate || 2.0));
            lfo.type = settings.lfoWave || 'sine';
            lfo.frequency.setValueAtTime(lfoRate, now);

            const target = settings.lfoTarget || 'cutoff';
            if (target === 'cutoff' && filterNode) {
                const maxMod = (settings.cutoff || 20000) * 0.75 * settings.lfoDepth;
                lfoGain.gain.setValueAtTime(maxMod, now);
                lfo.connect(lfoGain);
                lfoGain.connect(filterNode.frequency);
                lfo.start(now);
                lfo.stop(now + duration + 1.0);
            } else if (target === 'volume') {
                const tremoloGain = audioCtx.createGain();
                tremoloGain.gain.setValueAtTime(1.0 - (settings.lfoDepth * 0.4), now);
                lfoGain.gain.setValueAtTime(settings.lfoDepth * 0.4, now);
                lfo.connect(lfoGain);
                lfoGain.connect(tremoloGain.gain);
                currentNode.connect(tremoloGain);
                currentNode = tremoloGain;
                lfo.start(now);
                lfo.stop(now + duration + 1.0);
            }
        } catch (e) {
            console.warn('LFO modulation setup error:', e);
        }
    }

    // 4. Panoramique Stéréo (StereoPannerNode)
    let pannerNode = null;
    if (audioCtx.createStereoPanner) {
        const basePan = Math.max(-1, Math.min(1, settings.pan || 0));
        pannerNode = audioCtx.createStereoPanner();
        pannerNode.pan.setValueAtTime(basePan, now);

        if (settings.lfoDepth && settings.lfoDepth > 0.02 && settings.lfoTarget === 'pan') {
            try {
                const panLfo = audioCtx.createOscillator();
                const panLfoGain = audioCtx.createGain();
                panLfo.type = settings.lfoWave || 'sine';
                panLfo.frequency.setValueAtTime(settings.lfoRate || 2.0, now);
                panLfoGain.gain.setValueAtTime(settings.lfoDepth * 0.8, now);
                panLfo.connect(panLfoGain);
                panLfoGain.connect(pannerNode.pan);
                panLfo.start(now);
                panLfo.stop(now + duration + 1.0);
            } catch (e) {}
        }

        currentNode.connect(pannerNode);
        currentNode = pannerNode;
    }

    // 5. Send Delay / Écho Stéréo avec Synchronisation BPM & Ping-Pong
    if (settings.delay && settings.delay > 0.02) {
        let delayTime = settings.delayTime || 0.25;
        const currentBpm = (typeof GameState !== 'undefined' && GameState.sequencer && GameState.sequencer.tempo) ? GameState.sequencer.tempo : 120;
        
        if (settings.delaySync === '1/4') delayTime = 60 / currentBpm;
        else if (settings.delaySync === '1/8') delayTime = 30 / currentBpm;
        else if (settings.delaySync === '1/8d') delayTime = 45 / currentBpm;
        else if (settings.delaySync === '1/16') delayTime = 15 / currentBpm;
        delayTime = Math.max(0.04, Math.min(1.2, delayTime));

        const delayFeedbackVal = Math.min(0.88, settings.delayFeedback !== undefined ? settings.delayFeedback : 0.45);
        const delayWetGain = settings.delay * 0.75 * soundVolume;

        if (settings.delayPingPong && audioCtx.createStereoPanner) {
            // Ping-Pong stereo delay : rebonds gauche -> droite
            const delayL = audioCtx.createDelay(1.5);
            const delayR = audioCtx.createDelay(1.5);
            delayL.delayTime.setValueAtTime(delayTime, now);
            delayR.delayTime.setValueAtTime(delayTime * 1.5, now);

            const fbL = audioCtx.createGain();
            const fbR = audioCtx.createGain();
            fbL.gain.setValueAtTime(delayFeedbackVal, now);
            fbR.gain.setValueAtTime(delayFeedbackVal, now);

            const pannerL = audioCtx.createStereoPanner();
            const pannerR = audioCtx.createStereoPanner();
            pannerL.pan.setValueAtTime(-0.85, now);
            pannerR.pan.setValueAtTime(0.85, now);

            const wetMix = audioCtx.createGain();
            wetMix.gain.setValueAtTime(delayWetGain, now);

            currentNode.connect(delayL);
            delayL.connect(fbL);
            fbL.connect(delayR);
            delayR.connect(fbR);
            fbR.connect(delayL);

            delayL.connect(pannerL);
            delayR.connect(pannerR);
            pannerL.connect(wetMix);
            pannerR.connect(wetMix);
            wetMix.connect(sfxGain);
        } else {
            const delayNode = audioCtx.createDelay(1.5);
            delayNode.delayTime.setValueAtTime(delayTime, now);

            const feedback = audioCtx.createGain();
            feedback.gain.setValueAtTime(delayFeedbackVal, now);

            const delayWet = audioCtx.createGain();
            delayWet.gain.setValueAtTime(delayWetGain, now);

            currentNode.connect(delayNode);
            delayNode.connect(feedback);
            feedback.connect(delayNode);
            delayNode.connect(delayWet);
            delayWet.connect(sfxGain);
        }
    }

    // 6. Send Reverb / Espace Multi-Modes (Hall, Plate, Shimmer, Space)
    if (settings.reverb && settings.reverb > 0.02) {
        const reverbWet = audioCtx.createGain();
        reverbWet.gain.setValueAtTime(settings.reverb * 0.70 * soundVolume, now);
        const mode = settings.reverbMode || 'hall';

        let tapDelays = [0.031, 0.053, 0.079, 0.113, 0.167];
        let decayBase = 0.68;

        if (mode === 'plate') {
            tapDelays = [0.015, 0.027, 0.041, 0.059, 0.082, 0.115];
            decayBase = 0.55;
        } else if (mode === 'shimmer') {
            tapDelays = [0.038, 0.072, 0.115, 0.175, 0.245, 0.330];
            decayBase = 0.78;
        } else if (mode === 'space') {
            tapDelays = [0.045, 0.092, 0.155, 0.235, 0.340, 0.480];
            decayBase = 0.85;
        }

        tapDelays.forEach((dt, i) => {
            const tap = audioCtx.createDelay(1.0);
            tap.delayTime.setValueAtTime(dt, now);
            const tapGain = audioCtx.createGain();
            tapGain.gain.setValueAtTime(Math.pow(decayBase, i + 1), now);
            currentNode.connect(tap);
            tap.connect(tapGain);
            tapGain.connect(reverbWet);
        });

        reverbWet.connect(sfxGain);
    }

    // 7. Master Volume de la piste & Connexions
    const outGain = audioCtx.createGain();
    const trackVol = (typeof settings.volume === 'number') ? settings.volume : 1.0;
    outGain.gain.setValueAtTime(trackVol, now);
    currentNode.connect(outGain);
    outGain.connect(sfxGain);

    // Connexion à l'oscilloscope de la modale Sound Design pour le retour visuel
    if (trackAnalyserNode) {
        outGain.connect(trackAnalyserNode);
    }

    return inputNode;
}

/**
 * Applique une enveloppe ADSR (Attack, Decay, Sustain, Release) à un nœud de gain.
 */
function applyAdsrEnvelope(gainNode, now, peakGain, settings, defaultParams = {}) {
    const attack = Math.max(0.002, Math.min(2.0, (settings && settings.attack !== undefined) ? settings.attack : (defaultParams.attack || 0.01)));
    const decay = Math.max(0.01, Math.min(2.5, (settings && settings.decay !== undefined) ? settings.decay : (defaultParams.decay || 0.15)));
    const sustain = Math.max(0.0, Math.min(1.0, (settings && settings.sustain !== undefined) ? settings.sustain : (defaultParams.sustain !== undefined ? defaultParams.sustain : 0.6)));
    const release = Math.max(0.02, Math.min(3.5, (settings && settings.release !== undefined) ? settings.release : (defaultParams.release || 0.25)));

    const sustainLevel = Math.max(0.001, peakGain * sustain);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(peakGain, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(sustainLevel, now + attack + decay);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay + release);

    return attack + decay + release;
}

function getTrackTransposedPitch(trackId, basePitch) {
    if (typeof getInstrumentTrackSettings === 'function') {
        const settings = getInstrumentTrackSettings(trackId);
        if (settings && typeof settings.pitch === 'number' && settings.pitch !== 0) {
            return basePitch * Math.pow(2, settings.pitch / 12);
        }
    }
    return basePitch;
}

function getTrackOscillatorWaveform(trackId, defaultWave = 'sawtooth') {
    if (typeof getInstrumentTrackSettings === 'function') {
        const settings = getInstrumentTrackSettings(trackId);
        if (settings && settings.waveform && settings.waveform !== 'default') {
            return settings.waveform;
        }
    }
    return defaultWave;
}

/**
 * Joue une voix de synthétiseur mélodique avec ADSR, Unison/Detune multi-voix et Sub-Oscillateur.
 */
function playMelodicSynthVoice(trackId, freq, defaultWave = 'sawtooth', defaultEnvelope = {}, baseFilterMultiplier = 2.5) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const settings = (typeof getInstrumentTrackSettings === 'function') ? getInstrumentTrackSettings(trackId) : {};
    const realFreq = getTrackTransposedPitch(trackId, freq);

    // Calcul de la durée totale ADSR
    const attack = Math.max(0.002, (settings && settings.attack !== undefined) ? settings.attack : (defaultEnvelope.attack || 0.01));
    const decay = Math.max(0.01, (settings && settings.decay !== undefined) ? settings.decay : (defaultEnvelope.decay || 0.15));
    const release = Math.max(0.02, (settings && settings.release !== undefined) ? settings.release : (defaultEnvelope.release || 0.25));
    const totalDuration = attack + decay + release;

    const dspDest = createTrackDspChain(trackId, now, totalDuration);
    const masterVoiceGain = audioCtx.createGain();
    applyAdsrEnvelope(masterVoiceGain, now, 0.28 * soundVolume, settings, defaultEnvelope);

    // Unison & Désaccordage (1, 2 ou 3 oscillateurs)
    const unisonCount = Math.max(1, Math.min(3, settings.unison || defaultEnvelope.unison || 1));
    const detuneCents = settings.detune !== undefined ? settings.detune : (defaultEnvelope.detune || 0);
    const wave = getTrackOscillatorWaveform(trackId, defaultWave);

    const detuneOffsets = (unisonCount === 1) 
        ? [0] 
        : (unisonCount === 2) 
            ? [-detuneCents || -7, detuneCents || 7] 
            : [0, -detuneCents || -10, detuneCents || 10];

    detuneOffsets.forEach(detuneVal => {
        const osc = audioCtx.createOscillator();
        osc.type = wave;
        osc.frequency.setValueAtTime(realFreq, now);
        if (detuneVal !== 0) {
            osc.detune.setValueAtTime(detuneVal, now);
        }
        osc.connect(masterVoiceGain);
        osc.start(now);
        osc.stop(now + totalDuration + 0.05);
    });

    // Sub-Oscillateur optionnel (-1 octave)
    if (settings.subOsc) {
        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(realFreq * 0.5, now);
        subGain.gain.setValueAtTime(0.18 * soundVolume, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + totalDuration);
        subOsc.connect(subGain);
        subGain.connect(dspDest);
        subOsc.start(now);
        subOsc.stop(now + totalDuration);
    }

    masterVoiceGain.connect(dspDest);
}

/**
 * Joue un coup de Kick percutant (Grosse caisse 808).
 */
function playKickSound(pitch = 150) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const realPitch = getTrackTransposedPitch('kick', pitch);
    const dspDest = createTrackDspChain('kick', now, 0.22);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = getTrackOscillatorWaveform('kick', 'sine');
    osc.frequency.setValueAtTime(realPitch, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    gain.gain.setValueAtTime(0.7 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(dspDest);

    osc.start(now);
    osc.stop(now + 0.22);
}

/**
 * Joue un coup de Caisse Claire (Snare percutant avec bruit blanc).
 */
function playSnareSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const dspDest = createTrackDspChain('snare', now, 0.15);

    // Composante tonale
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    const baseFreq = getTrackTransposedPitch('snare', 240);
    osc.type = getTrackOscillatorWaveform('snare', 'triangle');
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
    oscGain.gain.setValueAtTime(0.4 * soundVolume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(oscGain);
    oscGain.connect(dspDest);
    osc.start(now);
    osc.stop(now + 0.12);

    // Composante bruit (bruit blanc synthétisé)
    const bufferSize = audioCtx.sampleRate * 0.15;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.5 * soundVolume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(dspDest);

    noise.start(now);
    noise.stop(now + 0.15);
}

/**
 * Joue une cymbale Hi-Hat nette et métallique.
 */
function playHiHatSound(open = false) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const duration = open ? 0.25 : 0.05;
    const dspDest = createTrackDspChain('hihat', now, duration);

    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1);
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dspDest);

    noise.start(now);
    noise.stop(now + duration);
}

/**
 * Joue une note de synthétiseur lead mélodique (SuperSaw / Lead Analogique).
 */
function playSynthLeadSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    let freq = 440;
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 440);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 30) {
        freq = noteOrStep;
    } else {
        freq = LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 440;
    }

    playMelodicSynthVoice('synth', freq, 'sawtooth', { attack: 0.01, decay: 0.18, sustain: 0.45, release: 0.22, unison: 1, detune: 0 }, 3.5);
}

/**
 * Son de scratch vinyle réaliste sur clic / mixage manuel.
 */
function playScratchSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.14);

    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.4 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
}

/**
 * Joue une ligne de Sub-Bass 808 grondante.
 */
function playSubBassSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const notes = [55, 55, 65.41, 73.42, 82.41, 65.41, 55, 49]; // A1..G1
    let freq = 55;
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 55);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = notes[Math.abs(noteOrStep) % notes.length] || 55;
    }

    const realFreq = getTrackTransposedPitch('bass', freq);
    const dspDest = createTrackDspChain('bass', now, 0.45);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = getTrackOscillatorWaveform('bass', 'sine');
    osc.frequency.setValueAtTime(realFreq * 1.35, now);
    osc.frequency.exponentialRampToValueAtTime(realFreq, now + 0.07);

    gain.gain.setValueAtTime(0.75 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(dspDest);

    osc.start(now);
    osc.stop(now + 0.45);
}

/**
 * Joue un Clap 909 percutant multi-burst.
 */
function playClapSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const dspDest = createTrackDspChain('clap', now, 0.22);

    // 3 micro-rafales de bruit + déclin réverbéré
    [0, 0.012, 0.024].forEach((offset, idx) => {
        const bufferSize = audioCtx.sampleRate * 0.02;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1100;
        filter.Q.value = 2.5;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.4 * soundVolume, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.02);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dspDest);

        noise.start(now + offset);
        noise.stop(now + offset + 0.02);
    });

    // Corps principal du clap
    const tailBufferSize = audioCtx.sampleRate * 0.18;
    const tailBuffer = audioCtx.createBuffer(1, tailBufferSize, audioCtx.sampleRate);
    const tailData = tailBuffer.getChannelData(0);
    for (let i = 0; i < tailBufferSize; i++) {
        tailData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (tailBufferSize * 0.3));
    }
    const tailNoise = audioCtx.createBufferSource();
    tailNoise.buffer = tailBuffer;

    const tailFilter = audioCtx.createBiquadFilter();
    tailFilter.type = 'bandpass';
    tailFilter.frequency.value = 1200;

    const tailGain = audioCtx.createGain();
    tailGain.gain.setValueAtTime(0.5 * soundVolume, now + 0.03);
    tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    tailNoise.connect(tailFilter);
    tailFilter.connect(tailGain);
    tailGain.connect(dspDest);

    tailNoise.start(now + 0.03);
    tailNoise.stop(now + 0.22);
}

/**
 * Joue une nappe d'accords célestes (Chord Pad).
 */
function playChordPadSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const dspDest = createTrackDspChain('pad', now, 0.65);

    let chord = CHORD_FREQS[0];
    if (typeof noteOrStep === 'string') {
        const res = noteToFreq(noteOrStep);
        if (Array.isArray(res)) {
            chord = res;
        } else if (typeof res === 'number') {
            chord = [res, res * 1.2599, res * 1.4983];
        }
    } else if (Array.isArray(noteOrStep)) {
        chord = noteOrStep;
    } else if (typeof noteOrStep === 'number') {
        chord = CHORD_FREQS[Math.abs(noteOrStep) % CHORD_FREQS.length] || CHORD_FREQS[0];
    }

    chord.forEach((freq, idx) => {
        const realFreq = getTrackTransposedPitch('pad', freq * 0.5);
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = getTrackOscillatorWaveform('pad', idx % 2 === 0 ? 'sine' : 'triangle');
        osc.frequency.setValueAtTime(realFreq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.12 * soundVolume, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dspDest);

        osc.start(now);
        osc.stop(now + 0.65);
    });
}

/**
 * Joue un synthé résonant Acid 303 (Roland TB-303 squelch).
 */
function playAcidSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    const notes = [110, 130.81, 146.83, 164.81, 220, 196, 164.81, 130.81];
    let freq = 110;
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 110);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = notes[Math.abs(noteOrStep) % notes.length] || 110;
    }

    playMelodicSynthVoice('acid', freq, 'sawtooth', { attack: 0.005, decay: 0.15, sustain: 0.3, release: 0.18, unison: 1, detune: 0 }, 6.0);
}

/**
 * Joue un Piano de Concert Acoustique / FM feutré.
 */
function playPianoSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    let freq = 261.63; // C4
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 261.63);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 261.63;
    }

    const realFreq = getTrackTransposedPitch('piano', freq);
    const dspDest = createTrackDspChain('piano', now, 0.65);

    // Oscillateur fondamental
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = getTrackOscillatorWaveform('piano', 'sine');
    osc1.frequency.setValueAtTime(realFreq, now);

    // Harmonique 2 pour la richesse du timbre feutré
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(realFreq * 2, now);

    const masterPianoGain = audioCtx.createGain();

    gain1.gain.setValueAtTime(0.35 * soundVolume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    gain2.gain.setValueAtTime(0.12 * soundVolume, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterPianoGain);
    gain2.connect(masterPianoGain);
    masterPianoGain.connect(dspDest);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
}

/**
 * Joue un Pluck EDM cristallin (attaque rapide et brillante).
 */
function playPluckSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    let freq = 523.25; // C5
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 523.25);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = (LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 261.63) * 1.5;
    }

    playMelodicSynthVoice('pluck', freq, 'square', { attack: 0.002, decay: 0.08, sustain: 0.1, release: 0.15, unison: 1, detune: 0 }, 2.0);
}

/**
 * Joue une nappe de Cordes Symphoniques amples avec chœur stéréo.
 */
function playStringsSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    let freq = 220; // A3
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 220);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 220;
    }

    playMelodicSynthVoice('strings', freq, 'sawtooth', { attack: 0.12, decay: 0.35, sustain: 0.8, release: 0.45, unison: 2, detune: 8 }, 2.2);
}

/**
 * Joue un Brass Synth Funky / 80s punchy.
 */
function playBrassSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    let freq = 220; // A3
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 220);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 220;
    }

    playMelodicSynthVoice('brass', freq, 'sawtooth', { attack: 0.04, decay: 0.22, sustain: 0.55, release: 0.25, unison: 2, detune: 6 }, 4.0);
}

/**
 * Joue une texture spatiale orbitale Cosmic Atmos Drone.
 */
function playCosmicSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    let freq = 164.81; // E3
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 164.81);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = (LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 164.81) * 1.5;
    }

    playMelodicSynthVoice('cosmic', freq, 'sine', { attack: 0.01, decay: 0.45, sustain: 0.4, release: 0.65, unison: 3, detune: 12 }, 3.0);
}


/**
 * Son de mixage manuel standard.
 */
function playMixSound() {
    playScratchSound();
    setTimeout(() => playKickSound(110), 30);
}

/**
 * Son d'achat réussi (pièces de monnaie tintantes).
 */
function playBuySound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    [1046.50, 1318.51, 1567.98].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.06);

        gain.gain.setValueAtTime(0.2 * soundVolume, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);

        osc.connect(gain);
        gain.connect(sfxGain);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.2);
    });
}

/**
 * Son de contrat validé (accord majestueux).
 */
function playContractSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0.25 * soundVolume, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.6);

        osc.connect(gain);
        gain.connect(sfxGain);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.6);
    });
}

/**
 * Son de succès débloqué (arpège scintillant).
 */
function playAchievementSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.22 * soundVolume, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(sfxGain);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.4);
    });
}

/**
 * Son de Frenzy déclenchée (Drop The Bass explosion).
 */
function playFrenzySound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    // Riser rapide
    const riser = audioCtx.createOscillator();
    const riserGain = audioCtx.createGain();
    riser.type = 'sawtooth';
    riser.frequency.setValueAtTime(100, now);
    riser.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
    riserGain.gain.setValueAtTime(0.3 * soundVolume, now);
    riserGain.gain.linearRampToValueAtTime(0.5 * soundVolume, now + 0.35);
    riserGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    riser.connect(riserGain);
    riserGain.connect(sfxGain);
    riser.start(now);
    riser.stop(now + 0.45);

    // Boom sub-bass drop
    setTimeout(() => {
        playKickSound(280);
        if (audioCtx) {
            const sub = audioCtx.createOscillator();
            const subGain = audioCtx.createGain();
            sub.type = 'sine';
            sub.frequency.setValueAtTime(90, audioCtx.currentTime);
            sub.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.8);
            subGain.gain.setValueAtTime(0.8 * soundVolume, audioCtx.currentTime);
            subGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            sub.connect(subGain);
            subGain.connect(sfxGain);
            sub.start(audioCtx.currentTime);
            sub.stop(audioCtx.currentTime + 0.8);
        }
    }, 400);
}

/**
 * Son de vinyle doré cliqué (gains bonus).
 */
function playGoldenVinylSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    [880, 1108.73, 1318.51, 1760].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.3 * soundVolume, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.4);

        osc.connect(gain);
        gain.connect(sfxGain);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.4);
    });
}

/**
 * Son d'événement aléatoire.
 */
function playEventSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.25);

    gain.gain.setValueAtTime(0.2 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
}

/**
 * Son de prestige épique.
 */
function playPrestigeSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    [130.81, 164.81, 196.00, 261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0.25 * soundVolume, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.8);

        osc.connect(gain);
        gain.connect(sfxGain);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.8);
    });
}

/**
 * Boucle musicale dynamique multi-pistes (Synthwave / Lo-Fi Groove).
 */
function playMusicStep() {
    if (!audioCtx || !isMusicEnabled || !isMusicPlaying) return;

    const now = audioCtx.currentTime;
    const isFrenzy = GameState && GameState.hype && GameState.hype.isFrenzy;
    const tempoStep = musicStep % 16;
    const chordIndex = Math.floor(tempoStep / 4);

    // 1. Basse
    if (tempoStep % 2 === 0) {
        const bassFreq = BASS_NOTES[tempoStep % BASS_NOTES.length];
        const bassOsc = audioCtx.createOscillator();
        const bassGain = audioCtx.createGain();
        const bassFilter = audioCtx.createBiquadFilter();

        bassOsc.type = isFrenzy ? 'sawtooth' : 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = isFrenzy ? 800 : 350;

        bassGain.gain.setValueAtTime(0.18 * musicVolume, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(musicGain);

        bassOsc.start(now);
        bassOsc.stop(now + 0.36);
    }

    // 2. Nappe d'accords (pads doux)
    if (tempoStep % 4 === 0) {
        const chord = CHORD_FREQS[chordIndex % CHORD_FREQS.length];
        chord.forEach(f => {
            const padOsc = audioCtx.createOscillator();
            const padGain = audioCtx.createGain();
            padOsc.type = 'sine';
            padOsc.frequency.setValueAtTime(f, now);
            padGain.gain.setValueAtTime(0.001, now);
            padGain.gain.linearRampToValueAtTime(0.04 * musicVolume, now + 0.3);
            padGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            padOsc.connect(padGain);
            padGain.connect(musicGain);
            padOsc.start(now);
            padOsc.stop(now + 1.25);
        });
    }

    // 3. Batterie d'ambiance Lo-Fi / Synthwave
    if (tempoStep % 4 === 0) {
        playKickSound(100);
    } else if (tempoStep % 4 === 2) {
        playSnareSound();
    }

    // 4. Arpèges rapides en mode FRENZY
    if (isFrenzy && tempoStep % 1 === 0) {
        const arpFreq = LEAD_NOTES[(tempoStep * 2) % LEAD_NOTES.length];
        const arpOsc = audioCtx.createOscillator();
        const arpGain = audioCtx.createGain();
        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(arpFreq, now);
        arpGain.gain.setValueAtTime(0.12 * musicVolume, now);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        arpOsc.connect(arpGain);
        arpGain.connect(musicGain);
        arpOsc.start(now);
        arpOsc.stop(now + 0.2);
    }

    musicStep++;
}

/**
 * Démarre la musique dynamique (désactivée au profit du séquenceur de beatmaker).
 */
function startDynamicMusic() {
    stopDynamicMusic();
}

/**
 * Arrête toute musique générative.
 */
function stopMusic() {
    stopDynamicMusic();
}

function stopDynamicMusic() {
    isMusicPlaying = false;
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
}

/**
 * Bascule les bruitages.
 */
function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    return isSoundEnabled;
}

/**
 * Bascule la musique (active/coupe la lecture du séquenceur).
 */
function toggleMusic() {
    isMusicEnabled = !isMusicEnabled;
    if (!isMusicEnabled) {
        if (typeof GameState !== 'undefined' && GameState.sequencer && GameState.sequencer.isPlaying) {
            toggleSequencerPlay();
        }
    }
    return isMusicEnabled;
}

/**
 * Modifie le volume des bruitages (0.0 à 1.0).
 */
function setSoundVolume(val) {
    soundVolume = Math.max(0, Math.min(1, val));
    if (sfxGain) {
        sfxGain.gain.value = soundVolume;
    }
}

/**
 * Modifie le volume de la musique (0.0 à 1.0).
 */
function setMusicVolume(val) {
    musicVolume = Math.max(0, Math.min(1, val));
    if (musicGain) {
        musicGain.gain.value = musicVolume;
    }
}

function isSoundOn() {
    return isSoundEnabled;
}

function isMusicOn() {
    return isMusicEnabled;
}

/**
 * Joue une fanfare éclatante pour les Trophées et Disques d'Or Billboard.
 */
function playTrophySound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.3 * soundVolume, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.5);
    });
}

/**
 * Joue un carillon de récompense pour la complétion d'une quête.
 */
function playQuestCompleteSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const chord = [440, 554.37, 659.25, 880]; // A Major arpeggio
    chord.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.25 * soundVolume, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
    });
}

/**
 * Joue un son rétro 8-bit lors de l'activation d'un code secret de producteur.
 */
function playSecretCodeSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.setValueAtTime(440, now + 0.08);
    osc.frequency.setValueAtTime(550, now + 0.16);
    osc.frequency.setValueAtTime(880, now + 0.24);
    gain.gain.setValueAtTime(0.25 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
}

/**
 * Joue un son de validation de mission d'artiste.
 */
function playMissionSuccessSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2); // A5
    gain.gain.setValueAtTime(0.35 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
}

/**
 * Joue un son d'amélioration technologique R&D ou Maîtrise.
 */
function playUpgradeSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.25 * soundVolume, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.3);
    });
}

/**
 * Joue un son d'activation de Booster énergisant.
 */
function playBoosterSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
    gain.gain.setValueAtTime(0.3 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);
}

/**
 * Définit le volume Master (Général).
 */
function setMasterVolume(val) {
    const vol = Math.max(0, Math.min(1, parseFloat(val) || 0));
    if (GameState && GameState.settings) GameState.settings.masterVolume = vol;
    if (masterGain) masterGain.gain.value = vol;
    return vol;
}

/**
 * Définit le volume des Effets Sonores (SFX).
 */
function setSfxVolume(val) {
    const vol = Math.max(0, Math.min(1, parseFloat(val) || 0));
    soundVolume = vol;
    if (GameState && GameState.settings) GameState.settings.sfxVolume = vol;
    if (sfxGain) sfxGain.gain.value = vol;
    return vol;
}

/**
 * Définit le volume de la Musique d'Ambiance.
 */
function setMusicVolume(val) {
    const vol = Math.max(0, Math.min(1, parseFloat(val) || 0));
    musicVolume = vol;
    if (GameState && GameState.settings) GameState.settings.musicVolume = vol;
    if (musicGain) musicGain.gain.value = vol;
    return vol;
}

/**
 * Définit le volume du Séquenceur 16-Pas.
 */
function setSeqVolume(val) {
    const vol = Math.max(0, Math.min(1, parseFloat(val) || 0));
    if (GameState && GameState.settings) GameState.settings.seqVolume = vol;
    return vol;
}

/**
 * Active ou coupe le son général.
 */
function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    if (masterGain) {
        masterGain.gain.value = isSoundEnabled ? (GameState.settings ? GameState.settings.masterVolume || 0.8 : 0.8) : 0;
    }
    return isSoundEnabled;
}

/**
 * Active ou coupe la musique.
 */
function toggleMusic() {
    isMusicEnabled = !isMusicEnabled;
    if (musicGain) {
        musicGain.gain.value = isMusicEnabled ? (GameState.settings ? GameState.settings.musicVolume || 0.5 : 0.5) : 0;
    }
    return isMusicEnabled;
}


