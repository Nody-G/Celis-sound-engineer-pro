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
 * Initialise le contexte audio après interaction de l'utilisateur.
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

        // Analyser Node pour le visualiseur visuel de fréquences
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 128;
        analyserNode.smoothingTimeConstant = 0.8;

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

        // Seul le beat du séquenceur créé par le joueur est joué (pas de musique de fond parasite)
        stopDynamicMusic();
    } catch (e) {
        console.warn('Web Audio API non supportée ou bloquée :', e);
    }
}

/**
 * Récupère le nœud d'analyse pour le visualiseur Canvas.
 */
function getAudioAnalyser() {
    return analyserNode;
}

/**
 * Joue un coup de Kick percutant (Grosse caisse 808).
 */
function playKickSound(pitch = 150) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    gain.gain.setValueAtTime(0.7 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
}

/**
 * Joue un coup de Caisse Claire (Snare percutant avec bruit blanc).
 */
function playSnareSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    // Composante tonale
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
    oscGain.gain.setValueAtTime(0.4 * soundVolume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(oscGain);
    oscGain.connect(sfxGain);
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
    noiseGain.connect(sfxGain);

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
    gain.connect(sfxGain);

    noise.start(now);
    noise.stop(now + duration);
}

/**
 * Joue une note de synthétiseur lead mélodique.
 */
function playSynthLeadSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    let freq = 440;
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 440);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 30) {
        freq = noteOrStep;
    } else {
        freq = LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 440;
    }

    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.1, now + 0.3);

    gain.gain.setValueAtTime(0.25 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
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

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.35, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.07);

    gain.gain.setValueAtTime(0.75 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
}

/**
 * Joue un Clap 909 percutant multi-burst.
 */
function playClapSound() {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

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
        gain.connect(sfxGain);

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
    tailGain.connect(sfxGain);

    tailNoise.start(now + 0.03);
    tailNoise.stop(now + 0.22);
}

/**
 * Joue une nappe d'accords célestes (Chord Pad).
 */
function playChordPadSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;

    let chord = CHORD_FREQS[0];
    if (typeof noteOrStep === 'string') {
        const res = noteToFreq(noteOrStep);
        if (Array.isArray(res)) {
            chord = res;
        } else if (typeof res === 'number') {
            // Construit un accord majeur/mineur doux à partir de la fondamentale
            chord = [res, res * 1.2599, res * 1.4983];
        }
    } else if (Array.isArray(noteOrStep)) {
        chord = noteOrStep;
    } else if (typeof noteOrStep === 'number') {
        chord = CHORD_FREQS[Math.abs(noteOrStep) % CHORD_FREQS.length] || CHORD_FREQS[0];
    }

    chord.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq * 0.5, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.12 * soundVolume, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);

        osc.start(now);
        osc.stop(now + 0.65);
    });
}

/**
 * Joue un synthé résonant Acid 303 (Roland TB-303).
 */
function playAcidSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    const notes = [110, 130.81, 146.83, 164.81, 220, 196, 164.81, 130.81];
    let freq = 110;
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 110);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = notes[Math.abs(noteOrStep) % notes.length] || 110;
    }

    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.Q.value = 12; // Résonance acide prononcée
    filter.frequency.setValueAtTime(freq * 8, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.25);

    gain.gain.setValueAtTime(0.28 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
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

    // Oscillateur fondamental
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Harmonique 2 pour la richesse du timbre feutré
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const masterPianoGain = audioCtx.createGain();

    gain1.gain.setValueAtTime(0.35 * soundVolume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    gain2.gain.setValueAtTime(0.12 * soundVolume, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterPianoGain);
    gain2.connect(masterPianoGain);
    masterPianoGain.connect(sfxGain);

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
    const now = audioCtx.currentTime;
    let freq = 523.25; // C5
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 523.25);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = (LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 261.63) * 1.5;
    }

    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 2.5, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.15);
    filter.Q.value = 5.0;

    gain.gain.setValueAtTime(0.3 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
}

/**
 * Joue une nappe de Cordes Symphoniques amples avec chœur stéréo.
 */
function playStringsSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    let freq = 220; // A3
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 220);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 220;
    }

    // Deux oscillateurs désaccordés pour un effet de violons d'ensemble
    [-4, 4].forEach(detuneCents => {
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detuneCents, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 2.2, now);

        // Attaque douce crescendo
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.15 * soundVolume, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);

        osc.start(now);
        osc.stop(now + 0.75);
    });
}

/**
 * Joue un Brass Synth Funky / 80s punchy.
 */
function playBrassSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    let freq = 220; // A3
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 220);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 220;
    }

    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.Q.value = 3.5;
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.linearRampToValueAtTime(freq * 4.0, now + 0.05);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.3);

    gain.gain.setValueAtTime(0.28 * soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
}

/**
 * Joue une texture spatiale orbitale Cosmic Atmos Drone.
 */
function playCosmicSound(noteOrStep = 0) {
    if (!audioCtx || !isSoundEnabled) return;
    const now = audioCtx.currentTime;
    let freq = 164.81; // E3
    if (typeof noteOrStep === 'string') {
        freq = noteToFreq(noteOrStep, 164.81);
    } else if (typeof noteOrStep === 'number' && noteOrStep > 20) {
        freq = noteOrStep;
    } else {
        freq = LEAD_NOTES[Math.abs(noteOrStep) % LEAD_NOTES.length] || 164.81;
    }

    // Oscillateur porteur + modulateur FM spatial
    const carrier = audioCtx.createOscillator();
    const modulator = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(freq * 1.5, now);
    modGain.gain.setValueAtTime(freq * 0.4, now);

    carrier.type = 'triangle';
    carrier.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(2400, now + 0.2);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.8);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22 * soundVolume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 0.85);
    carrier.stop(now + 0.85);
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


