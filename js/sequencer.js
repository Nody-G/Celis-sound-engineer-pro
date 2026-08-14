/**
 * sequencer.js - Séquenceur 16-Pas Évolutif & Mini-DAW
 * 
 * Système d'instruments déblocables avec le matériel du studio :
 * - Plus vous achetez d'équipements de studio (Micro, Interface, Moniteurs, Plugins,
 *   Console SSL, Cabine, Synthés Moog), plus vous débloquez de pistes et d'instruments !
 * - Chaque instrument débloqué enrichit la polyphonie et démultiplie le bonus de Groove (jusqu'à +120% de Production).
 */

let sequencerTimer = null;
let lastStepTime = 0;

// Registre complet des 13 instruments déblocables (1 Base + 12 Équipements de Studio)
const INSTRUMENT_DEFS = [
    {
        id: 'kick',
        name: 'Grosse Caisse 808',
        tag: 'KICK 808',
        icon: '🥁',
        reqEquip: null,
        reqName: 'Instrument de Base',
        color: 'cyan',
        type: 'beat',
        play: (stepOrNote) => playKickSound(140)
    },
    {
        id: 'snare',
        name: 'Caisse Claire Snare',
        tag: 'SNARE',
        icon: '💥',
        reqEquip: 'micro_dynamique',
        reqName: '🎤 Micro Dynamique',
        color: 'magenta',
        type: 'beat',
        play: (stepOrNote) => playSnareSound()
    },
    {
        id: 'hihat',
        name: 'Charleston Hi-Hat',
        tag: 'HI-HAT',
        icon: '✨',
        reqEquip: 'interface_audio',
        reqName: '🔌 Interface Audio',
        color: 'gold',
        type: 'beat',
        play: (stepOrNote) => playHiHatSound(false)
    },
    {
        id: 'synth',
        name: 'Synthétiseur Lead 80s',
        tag: 'SYNTH',
        icon: '🎹',
        reqEquip: 'moniteurs_studio',
        reqName: '🔊 Moniteurs Studio',
        color: 'purple',
        type: 'melodic',
        play: (stepOrNote) => {
            const note = typeof stepOrNote === 'number' ? getSequencerStepNote('synth', stepOrNote) : (stepOrNote || 'C4');
            playSynthLeadSound(note);
        }
    },
    {
        id: 'bass',
        name: 'Sub-Bass 808 Grondante',
        tag: 'SUB BASS',
        icon: '🎸',
        reqEquip: 'plugins_premium',
        reqName: '🎛️ Plugins Waves Pro',
        color: 'blue',
        type: 'melodic',
        play: (stepOrNote) => {
            const note = typeof stepOrNote === 'number' ? getSequencerStepNote('bass', stepOrNote) : (stepOrNote || 'C2');
            playSubBassSound(note);
        }
    },
    {
        id: 'clap',
        name: 'Clap Vintage 909',
        tag: 'CLAP 909',
        icon: '👏',
        reqEquip: 'console_mixage',
        reqName: '🎚️ Console SSL 4000',
        color: 'orange',
        type: 'beat',
        play: (stepOrNote) => playClapSound()
    },
    {
        id: 'pad',
        name: 'Nappe d\'Accords Céleste',
        tag: 'CHORD PAD',
        icon: '🌌',
        reqEquip: 'salle_insonorisee',
        reqName: '🏠 Cabine Insonorisée',
        color: 'cyan',
        type: 'melodic',
        play: (stepOrNote) => {
            const note = typeof stepOrNote === 'number' ? getSequencerStepNote('pad', stepOrNote) : (stepOrNote || 'Am');
            playChordPadSound(note);
        }
    },
    {
        id: 'piano',
        name: 'Piano de Concert Abbey',
        tag: 'PIANO',
        icon: '🎹',
        reqEquip: 'studio_pro',
        reqName: '🏢 Studio Abbey Road',
        color: 'gold',
        type: 'melodic',
        play: (stepOrNote) => {
            const note = typeof stepOrNote === 'number' ? getSequencerStepNote('piano', stepOrNote) : (stepOrNote || 'C4');
            playPianoSound(note);
        }
    },
    {
        id: 'pluck',
        name: 'Crystal Pluck EDM',
        tag: 'PLUCK',
        icon: '🔔',
        reqEquip: 'mastering_suite',
        reqName: '🎚️ Mastering Manley',
        color: 'magenta',
        type: 'melodic',
        play: (stepOrNote) => {
            const note = typeof stepOrNote === 'number' ? getSequencerStepNote('pluck', stepOrNote) : (stepOrNote || 'A4');
            playPluckSound(note);
        }
    },
    {
        id: 'acid',
        name: 'Acid 303 Rétro-Futuriste',
        tag: 'ACID 303',
        icon: '⚡',
        reqEquip: 'analog_gear',
        reqName: '🎛️ Synthés Moog Vintage',
        color: 'green',
        type: 'melodic',
        play: (stepOrNote) => {
            const note = typeof stepOrNote === 'number' ? getSequencerStepNote('acid', stepOrNote) : (stepOrNote || 'C3');
            playAcidSound(note);
        }
    },
    {
        id: 'strings',
        name: 'Cordes Symphoniques',
        tag: 'STRINGS',
        icon: '🎻',
        reqEquip: 'recording_complex',
        reqName: '🏗️ Mégapole Hollywood',
        color: 'purple',
        type: 'melodic',
        play: (stepOrNote) => {
            const note = typeof stepOrNote === 'number' ? getSequencerStepNote('strings', stepOrNote) : (stepOrNote || 'A3');
            playStringsSound(note);
        }
    },
    {
        id: 'brass',
        name: 'Brass Synth Funky',
        tag: 'BRASS',
        icon: '🎷',
        reqEquip: 'global_studio_network',
        reqName: '🌍 Réseau Satellites',
        color: 'orange',
        type: 'melodic',
        play: (stepOrNote) => {
            const note = typeof stepOrNote === 'number' ? getSequencerStepNote('brass', stepOrNote) : (stepOrNote || 'C4');
            playBrassSound(note);
        }
    },
    {
        id: 'cosmic',
        name: 'Cosmic Atmos Drone',
        tag: 'COSMIC',
        icon: '🛰️',
        reqEquip: 'orbital_sound_station',
        reqName: '🛰️ Station Spatiale Orbitale',
        color: 'cyan',
        type: 'melodic',
        play: (stepOrNote) => {
            const note = typeof stepOrNote === 'number' ? getSequencerStepNote('cosmic', stepOrNote) : (stepOrNote || 'C3');
            playCosmicSound(note);
        }
    }
];

// Notes mélodiques par défaut pour chaque piste (étendu à 32 pas / 2 Mesures)
const DEFAULT_TRACK_NOTES = {
    synth:   [
        'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'E5', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'E5',
        'F4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'E5', 'D5', 'C5', 'A4', 'G4', 'E4', 'D4', 'C4'
    ],
    bass:    [
        'A1', 'A1', 'C2', 'D2', 'E2', 'G2', 'A2', 'A1', 'A1', 'A1', 'C2', 'D2', 'E2', 'G2', 'A2', 'E2',
        'F1', 'F1', 'G1', 'G1', 'A1', 'C2', 'D2', 'E2', 'F2', 'E2', 'D2', 'C2', 'A1', 'G1', 'E1', 'A1'
    ],
    pad:     [
        'Am', 'Am', 'Fmaj', 'Fmaj', 'Cmaj', 'Cmaj', 'Gmaj', 'Gmaj', 'Am', 'Am', 'Fmaj', 'Fmaj', 'Cmaj', 'Cmaj', 'Em', 'Gmaj',
        'Dm', 'Dm', 'Fmaj', 'Fmaj', 'Am', 'Am', 'Gmaj', 'Gmaj', 'Fmaj', 'Gmaj', 'Am', 'Am', 'Dm7', 'Em7', 'Am7', 'Am7'
    ],
    piano:   [
        'C4', 'E4', 'G4', 'B4', 'C5', 'G4', 'E4', 'C4', 'D4', 'F4', 'A4', 'C5', 'D5', 'A4', 'F4', 'D4',
        'E4', 'G4', 'B4', 'D5', 'C5', 'A4', 'F4', 'D4', 'C4', 'E4', 'G4', 'B4', 'C5', 'E5', 'G5', 'C5'
    ],
    pluck:   [
        'A4', 'C5', 'E5', 'A5', 'G5', 'E5', 'D5', 'C5', 'A4', 'C5', 'E5', 'A5', 'G5', 'E5', 'D5', 'E5',
        'F5', 'A5', 'C6', 'E6', 'D6', 'C6', 'A5', 'G5', 'A5', 'C6', 'E6', 'G6', 'E6', 'D6', 'C6', 'A5'
    ],
    acid:    [
        'C3', 'C3', 'D#3', 'F3', 'G3', 'A#3', 'C4', 'G3', 'F3', 'D#3', 'C3', 'C3', 'D#3', 'F3', 'G3', 'C3',
        'C3', 'D#3', 'F#3', 'G3', 'A#3', 'C4', 'D#4', 'C4', 'A#3', 'G3', 'F3', 'D#3', 'C3', 'A#2', 'G2', 'C3'
    ],
    strings: [
        'A3', 'A3', 'A3', 'A3', 'F3', 'F3', 'F3', 'F3', 'C4', 'C4', 'C4', 'C4', 'G3', 'G3', 'G3', 'G3',
        'D4', 'D4', 'D4', 'D4', 'F4', 'F4', 'F4', 'F4', 'A4', 'A4', 'A4', 'A4', 'E4', 'E4', 'G4', 'A4'
    ],
    brass:   [
        'C4', 'C4', 'E4', 'G4', 'Bb4', 'C5', 'Bb4', 'G4', 'C4', 'C4', 'E4', 'G4', 'Bb4', 'C5', 'D5', 'C5',
        'F4', 'F4', 'A4', 'C5', 'Eb5', 'F5', 'Eb5', 'C5', 'G4', 'Bb4', 'D5', 'F5', 'G5', 'F5', 'D5', 'C5'
    ],
    cosmic:  [
        'C3', 'G3', 'C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C3', 'G3', 'C4', 'E4', 'G4', 'C5', 'G4', 'C4',
        'A2', 'E3', 'A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'F2', 'C3', 'F3', 'A3', 'C4', 'E4', 'G4', 'C3'
    ]
};

/**
 * Récupère le nombre de pas / temps actif pour la boucle du séquenceur (2, 4, 8, 16 ou 32).
 */
function getSequencerStepCount() {
    return (GameState.sequencer && GameState.sequencer.stepCount) ? GameState.sequencer.stepCount : 16;
}

/**
 * Modifie le nombre de pas du séquenceur (2, 4, 8, 16 ou 32 temps).
 */
function setSequencerStepCount(newCount) {
    const validCounts = [2, 4, 8, 16, 32];
    const target = parseInt(newCount, 10);
    if (!validCounts.includes(target)) return;

    if (!GameState.sequencer) initSequencer();
    GameState.sequencer.stepCount = target;
    GameState.sequencer.currentStep = GameState.sequencer.currentStep % target;

    // S'assure que toutes les pistes et notes disposent de 32 pas alloués en mémoire
    ensureSequencerCapacity();

    calculateGrooveBonus();
    if (typeof initSequencerUI === 'function') {
        initSequencerUI();
    }
}

/**
 * Assure que toutes les pistes possèdent un tableau de 32 pas complet.
 */
function ensureSequencerCapacity() {
    if (!GameState.sequencer) return;
    if (!GameState.sequencer.tracks) GameState.sequencer.tracks = {};
    if (!GameState.sequencer.stepNotes) GameState.sequencer.stepNotes = {};

    INSTRUMENT_DEFS.forEach(inst => {
        if (!GameState.sequencer.tracks[inst.id] || GameState.sequencer.tracks[inst.id].length < 32) {
            const current = GameState.sequencer.tracks[inst.id] || [];
            const extended = Array(32).fill(false);
            for (let i = 0; i < current.length && i < 32; i++) {
                extended[i] = current[i];
            }
            GameState.sequencer.tracks[inst.id] = extended;
        }

        if (inst.type === 'melodic') {
            if (!GameState.sequencer.stepNotes[inst.id] || GameState.sequencer.stepNotes[inst.id].length < 32) {
                const currentNotes = GameState.sequencer.stepNotes[inst.id] || [];
                const defs = DEFAULT_TRACK_NOTES[inst.id] || Array(32).fill('C4');
                const extendedNotes = [...defs];
                for (let i = 0; i < currentNotes.length && i < 32; i++) {
                    if (currentNotes[i]) extendedNotes[i] = currentNotes[i];
                }
                GameState.sequencer.stepNotes[inst.id] = extendedNotes;
            }
        }
    });
}

/**
 * Récupère la note assignée à un pas du séquenceur.
 */
function getSequencerStepNote(trackId, stepIndex) {
    if (GameState.sequencer && GameState.sequencer.stepNotes && GameState.sequencer.stepNotes[trackId]) {
        return GameState.sequencer.stepNotes[trackId][stepIndex] || 'C4';
    }
    const defs = DEFAULT_TRACK_NOTES[trackId];
    return (defs && defs[stepIndex]) ? defs[stepIndex] : 'C4';
}

/**
 * Définit la note d'un pas spécifique du séquenceur.
 */
function setSequencerStepNote(trackId, stepIndex, noteStr) {
    if (!GameState.sequencer) initSequencer();
    ensureSequencerCapacity();
    GameState.sequencer.stepNotes[trackId][stepIndex] = noteStr;
    calculateGrooveBonus();
    if (typeof updateSequencerUI === 'function') {
        updateSequencerUI();
    }
}

/**
 * Décale d'un demi-ton la note d'un pas du séquenceur (molette de souris ou bouton rapide).
 */
function shiftSequencerStepNote(trackId, stepIndex, semitoneDelta) {
    const currentNote = getSequencerStepNote(trackId, stepIndex);
    if (trackId === 'pad') {
        const CHORDS_LIST = ['Am', 'Cmaj', 'Dm', 'Em', 'Fmaj', 'Gmaj', 'Am7', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am9', 'Bdim'];
        const curIdx = CHORDS_LIST.indexOf(currentNote);
        const nextIdx = (curIdx === -1 ? 0 : curIdx + semitoneDelta + CHORDS_LIST.length) % CHORDS_LIST.length;
        setSequencerStepNote(trackId, stepIndex, CHORDS_LIST[nextIdx]);
        playTrackSound(trackId, stepIndex);
        return CHORDS_LIST[nextIdx];
    }

    const match = currentNote.match(/^([A-Ga-g][#b]?)(-?\d+)?$/);
    if (!match) return currentNote;

    let p = match[1].charAt(0).toUpperCase() + (match[1].length > 1 ? match[1].charAt(1) : '');
    let oct = match[2] !== undefined ? parseInt(match[2], 10) : 4;
    const SEMIS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const BASE_MAP = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11 };

    let semiIdx = BASE_MAP[p];
    if (semiIdx === undefined) semiIdx = 0;

    let totalSemi = semiIdx + semitoneDelta;
    while (totalSemi < 0) {
        totalSemi += 12;
        oct = Math.max(1, oct - 1);
    }
    while (totalSemi >= 12) {
        totalSemi -= 12;
        oct = Math.min(6, oct + 1);
    }

    const newNote = `${SEMIS[totalSemi]}${oct}`;
    setSequencerStepNote(trackId, stepIndex, newNote);
    playTrackSound(trackId, stepIndex);
    return newNote;
}

// Presets de styles de production complets sur 13 pistes (sur 32 pas / 2 Mesures avec variations)
const SEQUENCER_PRESETS = {
    house: {
        name: '🥖 French Touch (124 BPM)',
        bpm: 124,
        kick:    [
            true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false, true, false, false, false, true, false, true, false
        ],
        snare:   [
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true
        ],
        hihat:   [
            false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false, false, false, true, false, true, true, true, true
        ],
        synth:   [
            true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true,
            true, false, false, true, false, false, true, false, false, true, false, true, true, false, true, false
        ],
        bass:    [
            true, false, false, false, true, false, false, true, false, false, true, false, true, false, false, false,
            true, false, false, false, true, false, false, true, false, false, true, false, true, true, false, false
        ],
        clap:    [
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false
        ],
        pad:     [
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ],
        piano:   [
            false, false, true, false, false, false, true, false, false, false, true, false, false, true, false, false,
            false, false, true, false, false, false, true, false, false, false, true, false, false, true, true, false
        ],
        pluck:   [
            false, true, false, false, true, false, false, true, false, true, false, false, true, false, false, true,
            false, true, false, false, true, false, false, true, false, true, false, false, true, true, true, false
        ],
        acid:    [
            false, false, true, false, true, false, false, true, false, false, true, false, true, false, true, false,
            false, false, true, false, true, false, false, true, false, false, true, false, true, true, false, true
        ],
        strings: [
            true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        brass:   [
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, true, false,
            false, false, false, false, true, false, false, false, false, false, false, false, true, true, false, false
        ],
        cosmic:  [
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ]
    },
    synthwave: {
        name: '🌆 80s Outrun Synthwave (118 BPM)',
        bpm: 118,
        kick:    [
            true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false,
            true, false, false, false, false, false, true, false, true, false, false, false, false, true, true, false
        ],
        snare:   [
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true
        ],
        hihat:   [
            true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true
        ],
        synth:   [
            true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false, true, false, true, true, true, false, true, false
        ],
        bass:    [
            true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true
        ],
        clap:    [
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false
        ],
        pad:     [
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ],
        piano:   [
            true, false, false, false, false, true, false, false, true, false, false, false, false, true, false, false,
            true, false, false, false, false, true, false, false, true, false, false, false, false, true, true, false
        ],
        pluck:   [
            false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false, false, false, true, false, true, false, true, false
        ],
        acid:    [
            false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false,
            false, false, false, false, false, false, true, false, false, false, false, false, true, false, true, false
        ],
        strings: [
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ],
        brass:   [
            true, false, false, true, false, false, false, false, true, false, false, true, false, false, false, false,
            true, false, false, true, false, false, false, false, true, false, false, true, false, true, false, false
        ],
        cosmic:  [
            true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ]
    },
    trap: {
        name: '🔥 Dark Trap 808 (140 BPM)',
        bpm: 140,
        kick:    [
            true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, false, false, false, false, true, false, true, false, false, false
        ],
        snare:   [
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, true, false
        ],
        hihat:   [
            true, false, true, true, true, false, true, true, true, false, true, true, true, true, true, true,
            true, false, true, true, true, false, true, true, true, false, true, true, true, true, true, true
        ],
        synth:   [
            true, false, false, false, false, true, false, false, false, false, false, true, false, false, true, false,
            true, false, false, false, false, true, false, false, false, false, false, true, false, true, false, false
        ],
        bass:    [
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ],
        clap:    [
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ],
        pad:     [
            true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        piano:   [
            false, false, true, false, false, false, false, true, false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, false, true, false, false, true, false, false, true, false, false
        ],
        pluck:   [
            true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, false,
            true, false, false, true, false, false, true, false, false, true, false, false, true, false, true, false
        ],
        acid:    [
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        strings: [
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false
        ],
        brass:   [
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        cosmic:  [
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ]
    },
    cyberpunk: {
        name: '🤖 Cyberpunk Techno (132 BPM)',
        bpm: 132,
        kick:    [
            true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false, true, false, false, false, true, false, true, false
        ],
        snare:   [
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, true, false,
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, true, true
        ],
        hihat:   [
            true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false, true, false, true, false, true, true, true, true
        ],
        synth:   [
            true, true, false, true, true, false, true, true, false, true, true, false, true, true, false, true,
            true, true, false, true, true, false, true, true, false, true, true, false, true, true, true, false
        ],
        bass:    [
            true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false
        ],
        clap:    [
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false
        ],
        pad:     [
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ],
        piano:   [
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        pluck:   [
            false, true, true, false, false, true, true, false, false, true, true, false, false, true, true, false,
            false, true, true, false, false, true, true, false, false, true, true, false, true, true, true, false
        ],
        acid:    [
            true, false, true, true, false, true, true, false, true, false, true, true, false, true, true, false,
            true, false, true, true, false, true, true, false, true, false, true, true, true, false, true, true
        ],
        strings: [
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        brass:   [
            true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false
        ],
        cosmic:  [
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ]
    },
    lofi: {
        name: '☕ Lo-Fi Chill Beats (85 BPM)',
        bpm: 85,
        kick:    [
            true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, true, false, false, false, true, false, false, false, true, false
        ],
        snare:   [
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false
        ],
        hihat:   [
            true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false
        ],
        synth:   [
            true, false, false, false, true, false, false, false, true, false, false, false, false, false, true, false,
            true, false, false, false, true, false, false, false, true, false, false, false, false, false, false, false
        ],
        bass:    [
            true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false
        ],
        clap:    [
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        pad:     [
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ],
        piano:   [
            true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, false,
            true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, false
        ],
        pluck:   [
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        acid:    [
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        strings: [
            true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        brass:   [
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false
        ],
        cosmic:  [
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false
        ]
    }
};

/**
 * Vérifie si un instrument est débloqué par le joueur.
 */
function isInstrumentUnlocked(trackId) {
    const def = INSTRUMENT_DEFS.find(i => i.id === trackId);
    if (!def) return false;
    if (!def.reqEquip) return true; // Kick est toujours débloqué
    return (GameState.equipment && (GameState.equipment[def.reqEquip] || 0) > 0);
}

/**
 * Initialise le séquenceur avec toutes les pistes et la capacité multi-temps.
 */
function initSequencer() {
    if (!GameState.sequencer) {
        GameState.sequencer = {
            isPlaying: false,
            bpm: 124,
            currentStep: 0,
            stepCount: 16,
            tracks: {},
            stepNotes: {},
            grooveBonus: 0,
            musicalityScore: 0,
            grooveStatus: 'Équilibré',
            activePreset: 'house'
        };
    }

    if (!GameState.sequencer.stepCount) {
        GameState.sequencer.stepCount = 16;
    }

    ensureSequencerCapacity();

    if (!GameState.sequencer.activePresetLoaded) {
        loadSequencerPreset(GameState.sequencer.activePreset || 'house');
        GameState.sequencer.activePresetLoaded = true;
    } else {
        calculateGrooveBonus();
    }
}

/**
 * Charge un preset rythmique dans le séquenceur.
 */
function loadSequencerPreset(presetKey) {
    const preset = SEQUENCER_PRESETS[presetKey];
    if (!preset) return;

    GameState.sequencer.bpm = preset.bpm;
    GameState.sequencer.activePreset = presetKey;

    ensureSequencerCapacity();

    INSTRUMENT_DEFS.forEach(inst => {
        if (preset[inst.id]) {
            const arr = Array(32).fill(false);
            for (let i = 0; i < preset[inst.id].length && i < 32; i++) {
                arr[i] = preset[inst.id][i];
            }
            GameState.sequencer.tracks[inst.id] = arr;
        }
    });

    calculateGrooveBonus();
    if (typeof updateSequencerUI === 'function') {
        updateSequencerUI();
    }
}

/**
 * Bascule l'état d'un pas (active / désactive).
 */
function toggleSequencerStep(trackName, stepIndex) {
    if (!GameState.sequencer) initSequencer();
    ensureSequencerCapacity();
    if (!GameState.sequencer.tracks[trackName]) return;
    if (!isInstrumentUnlocked(trackName)) return;

    initAudio();
    GameState.sequencer.tracks[trackName][stepIndex] = !GameState.sequencer.tracks[trackName][stepIndex];

    if (GameState.sequencer.tracks[trackName][stepIndex]) {
        playTrackSound(trackName, stepIndex);
    }

    calculateGrooveBonus();
    if (typeof updateSequencerUI === 'function') {
        updateSequencerUI();
    }
}

/**
 * Efface tous les pas du séquenceur.
 */
function clearSequencer() {
    if (!GameState.sequencer) return;
    ensureSequencerCapacity();
    for (const track in GameState.sequencer.tracks) {
        GameState.sequencer.tracks[track] = Array(32).fill(false);
    }
    calculateGrooveBonus();
    if (typeof updateSequencerUI === 'function') {
        updateSequencerUI();
    }
}

/**
 * Démarre ou arrête la lecture du séquenceur.
 */
function toggleSequencerPlay() {
    initAudio();
    if (!GameState.sequencer) initSequencer();

    GameState.sequencer.isPlaying = !GameState.sequencer.isPlaying;
    if (GameState.sequencer.isPlaying) {
        lastStepTime = performance.now();
        runSequencerLoop();
    } else {
        if (sequencerTimer) {
            cancelAnimationFrame(sequencerTimer);
            sequencerTimer = null;
        }
        GameState.sequencer.currentStep = 0;
    }

    if (typeof updateSequencerPlayButton === 'function') {
        updateSequencerPlayButton();
    }
}

/**
 * Modifie le tempo (BPM) du séquenceur.
 */
function setSequencerBpm(newBpm) {
    if (!GameState.sequencer) return;
    GameState.sequencer.bpm = Math.max(60, Math.min(200, parseInt(newBpm, 10) || 120));
    const bpmDisplay = document.getElementById('seq-bpm-value') || document.getElementById('sequencer-bpm-val');
    if (bpmDisplay) bpmDisplay.textContent = GameState.sequencer.bpm + ' BPM';
    const bpmSlider = document.getElementById('seq-bpm-slider');
    if (bpmSlider) bpmSlider.value = GameState.sequencer.bpm;
}

/**
 * Calcule le bonus de Studio du Séquenceur :
 * - Dépend uniquement des instruments de studio débloqués (+10% de production par instrument).
 * - Ajoute un bonus de Session Live (+25%) lorsque le séquenceur est en lecture.
 * - Le nombre de notes n'influence pas le gain d'argent : le joueur compose librement ce qui lui plaît !
 */
function calculateGrooveBonus() {
    if (!GameState.sequencer) return 1.0;

    let unlockedCount = 0;
    INSTRUMENT_DEFS.forEach(inst => {
        if (isInstrumentUnlocked(inst.id)) unlockedCount++;
    });

    const isPlaying = !!(GameState.sequencer && GameState.sequencer.isPlaying);
    const instrumentBonus = unlockedCount * 0.10; // +10% par instrument débloqué
    const sessionBonus = isPlaying ? 0.25 : 0.0;   // +25% quand la musique tourne

    GameState.sequencer.grooveBonus = instrumentBonus + sessionBonus;
    return 1 + GameState.sequencer.grooveBonus;
}

/**
 * Boucle d'horloge du séquenceur avec Web Audio.
 */
function runSequencerLoop() {
    if (!GameState.sequencer || !GameState.sequencer.isPlaying) return;

    const now = performance.now();
    const stepDurationMs = (60 / GameState.sequencer.bpm / 4) * 1000;
    const stepCount = getSequencerStepCount();

    if (now - lastStepTime >= stepDurationMs) {
        lastStepTime = now;
        executeSequencerStep(GameState.sequencer.currentStep);
        GameState.sequencer.currentStep = (GameState.sequencer.currentStep + 1) % stepCount;
    }

    sequencerTimer = requestAnimationFrame(runSequencerLoop);
}

/**
 * Exécute un pas du séquenceur pour jouer les sons sans donner d'argent au clic/note.
 */
function executeSequencerStep(step) {
    const tracks = GameState.sequencer.tracks || {};
    let hitCount = 0;

    INSTRUMENT_DEFS.forEach(inst => {
        if (isInstrumentUnlocked(inst.id) && tracks[inst.id] && tracks[inst.id][step]) {
            inst.play(step);
            hitCount++;
        }
    });

    if (hitCount > 0) {
        GameState.stats.sequencerBeatsPlayed = (GameState.stats.sequencerBeatsPlayed || 0) + 1;

        if (typeof advanceQuestProgress === 'function') {
            advanceQuestProgress('seq_beats', 1);
        }
    }

    if (typeof highlightSequencerStep === 'function') {
        highlightSequencerStep(step);
    }
}

/**
 * Joue le son d'un instrument pour prévisualisation.
 */
function playTrackSound(trackName, noteIdx = 0) {
    const def = INSTRUMENT_DEFS.find(i => i.id === trackName);
    if (def && isInstrumentUnlocked(trackName)) {
        def.play(noteIdx);
    }
}

