/**
 * state.js - Gestion de l'état global du jeu étendu (Sound Engineer Idle Hit Edition)
 * 
 * Gère l'état complet du jeu :
 * - Ressources & jauge de Hype
 * - Paliers d'équipements & R&D
 * - Discographie & Mini-Jeu Mastering
 * - Séquenceur 16-Pas Mini-DAW
 * - Label & Roster d'Artistes
 * - Hit-Parade Billboard Top 50 & Trophées
 * - Quêtes Quotidiennes & Codes Secrets
 * - Arbre de Prestige 2.0
 */

// État global du jeu
const GameState = {
    // Ressources principales
    resources: {
        money: 0,           // Argent en dollars
        fame: 0,            // Renommée
        energy: 100,        // Énergie actuelle
        maxEnergy: 100,     // Énergie maximale
        goldenCassettes: 0, // Devise rare pour avantages de studio
    },

    // Système de Hype & Mode Frenzy
    hype: {
        value: 0,           // 0 à 100
        max: 100,
        combo: 1,           // Multiplicateur actif (1x à 10x)
        isFrenzy: false,    // Mode FRENZY actif ?
        frenzyDuration: 15, // 15 secondes de Frenzy
        frenzyTimeLeft: 0,
        lastMixTime: 0,
    },

    // Mode d'achat d'équipement actif (1, 10, 25, 100, 'max')
    buyMultiplier: 1,

    // Statistiques globales
    stats: {
        tracksMixed: 0,        // Nombre total de morceaux mixés manuellement
        totalMoneyEarned: 0,   // Argent cumulé gagné à vie
        totalFameEarned: 0,    // Renommée cumulée gagnée à vie
        contractsCompleted: 0, // Nombre de contrats réussis
        boostersUsed: 0,       // Nombre de boosters activés
        eventsEncountered: 0,  // Événements aléatoires rencontrés
        upgradesUnlocked: 0,   // Talents R&D débloqués
        albumsReleased: 0,     // Albums & Hits publiés
        goldenVinylsClicked: 0,// Vinyles dorés attrapés
        playtimeSeconds: 0,    // Temps de jeu total en secondes
        artistMissionsDone: 0, // Missions d'artistes accomplies
        questsCompleted: 0,    // Quêtes complétées
        sequencerBeatsPlayed: 0,// Pas joués au séquenceur
    },

    // Équipements possédés (id -> quantité)
    equipment: {},

    // Améliorations de Studio / R&D achetées (id -> true)
    upgrades: {},

    // Contrats complétés (id -> true)
    contractsCompleted: {},

    // Succès débloqués (id -> true)
    achievementsUnlocked: {},

    // Discographie (liste des albums / morceaux sortis)
    discography: {
        albums: [],         // Liste des albums produits
        totalStreams: 0,
        royaltiesPerSec: 0,
    },

    // Mini-Jeu Mastering EQ Lab
    mastering: {
        targetLow: 60,
        targetMid: 40,
        targetHigh: 75,
        currentLow: 50,
        currentMid: 50,
        currentHigh: 50,
        activeBonus: 1.0,   // Multiplicateur actif (ex: 1.5x)
        bonusTimeLeft: 0,   // Durée restante en secondes
    },

    // Séquenceur 16-Pas (Mini-DAW)
    sequencer: {
        isPlaying: false,
        bpm: 124,
        currentStep: 0,
        tracks: {
            kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
            synth: [false, false, true, false, false, false, true, false, false, false, true, false, false, true, false, true]
        },
        grooveBonus: 0,
        activePreset: 'house'
    },

    // Contrôleur de Beat Pads & Accordage Mélodique 8 Boutons
    padController: {
        mode: 'drumkit',       // 'drumkit' | 'synth' | 'bass' | 'pad' | 'piano' | 'pluck' | 'acid' | 'strings' | 'brass' | 'cosmic'
        scale: 'synthwave',    // 'synthwave' | 'french_touch' | 'trap' | 'lofi' | 'japanese' | 'major' | 'custom'
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
    },

    // Label & Gestion d'Artistes
    artists: {
        signed: [],         // Artistes sous contrat
        available: [],      // Artistes disponibles au recrutement
        lastRefresh: 0,     // Heure du dernier rafraîchissement
        maxSigned: 4,       // Capacité max de l'écurie
    },

    // Billboard Top 50 & Galerie des Trophées
    billboard: {
        chart: [],          // Top 50 mondial
        week: 1,
        myPeakRank: 50,
        trophies: {},       // id -> boolean / date
    },

    // Quêtes Quotidiennes & Défis
    quests: {
        daily: [],
        lastResetDay: 0,
        perks: {},          // Avantages débloqués avec les cassettes dorées
    },

    // Codes Secrets de Producteur
    secretCodes: {
        redeemed: {},       // code -> timestamp
    },

    // Prestige 2.0
    prestige: {
        points: 0,          // Points de prestige disponibles
        spentPoints: 0,     // Points dépensés dans l'arbre
        totalPrestiges: 0,  // Nombre total de prestiges effectués
        lifetimeFame: 0,    // Renommée totale (jamais réinitialisée)
        tree: {
            soundMastery: 0,    // +15% prod par point
            businessEmpire: 0,  // -8% coût & +20% royalties par point
            hypeOverdrive: 0,   // +30% durée Frenzy & +25% gains clics par point
        }
    },

    // Paramètres & Préférences d'Interface et Audio
    settings: {
        visualizerMode: 'bars',     // 'bars' | 'wave' | 'radial'
        autoMixer: false,           // Auto-mixer débloquable via Cassettes
        masterVolume: 0.8,          // Volume Général (0 à 1)
        sfxVolume: 0.8,             // Volume Effets Sonores (0 à 1)
        musicVolume: 0.5,           // Volume Musique d'Ambiance (0 à 1)
        seqVolume: 0.7,             // Volume Séquenceur 16-Pas (0 à 1)
        soundVolume: 0.8,           // Rétrocompatibilité
        numberNotation: 'standard', // 'standard' | 'scientific' | 'engineering'
        particleEffects: true,      // Particules flottantes
        screenShake: true,          // Effet de scratch platine
        powerSave: false,           // Mode éco d'énergie
        autoSaveInterval: 20,       // Intervalle en secondes
    },

    // Timestamp de la dernière mise à jour
    lastUpdate: Date.now(),

    // Version de sauvegarde
    version: 4,
};

/**
 * Réinitialise l'état du jeu pour une nouvelle partie.
 */
function resetGameState() {
    GameState.resources = {
        money: 0,
        fame: 0,
        energy: 100,
        maxEnergy: 100,
        goldenCassettes: 0,
    };

    GameState.hype = {
        value: 0,
        max: 100,
        combo: 1,
        isFrenzy: false,
        frenzyDuration: 15,
        frenzyTimeLeft: 0,
        lastMixTime: 0,
    };

    GameState.stats = {
        tracksMixed: 0,
        totalMoneyEarned: 0,
        totalFameEarned: 0,
        contractsCompleted: 0,
        boostersUsed: 0,
        eventsEncountered: 0,
        upgradesUnlocked: 0,
        albumsReleased: 0,
        goldenVinylsClicked: 0,
        playtimeSeconds: 0,
        artistMissionsDone: 0,
        questsCompleted: 0,
        sequencerBeatsPlayed: 0,
    };

    GameState.equipment = {};
    GameState.upgrades = {};
    GameState.contractsCompleted = {};
    GameState.achievementsUnlocked = {};
    GameState.discography = {
        albums: [],
        totalStreams: 0,
        royaltiesPerSec: 0,
    };
    GameState.mastering = {
        targetLow: 60,
        targetMid: 40,
        targetHigh: 75,
        currentLow: 50,
        currentMid: 50,
        currentHigh: 50,
        activeBonus: 1.0,
        bonusTimeLeft: 0,
    };
    GameState.sequencer = {
        isPlaying: false,
        bpm: 124,
        currentStep: 0,
        tracks: {
            kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
            synth: [false, false, true, false, false, false, true, false, false, false, true, false, false, true, false, true]
        },
        grooveBonus: 0,
        activePreset: 'house'
    };
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
    GameState.artists = {
        signed: [],
        available: [],
        lastRefresh: 0,
        maxSigned: 4,
    };
    GameState.billboard = {
        chart: [],
        week: 1,
        myPeakRank: 50,
        trophies: {},
    };
    GameState.quests = {
        daily: [],
        lastResetDay: 0,
        perks: {},
    };
    GameState.secretCodes = {
        redeemed: {},
    };
    if (!GameState.settings) {
        GameState.settings = {
            visualizerMode: 'bars',
            autoMixer: false,
            masterVolume: 0.8,
            sfxVolume: 0.8,
            musicVolume: 0.5,
            seqVolume: 0.7,
            soundVolume: 0.8,
            numberNotation: 'standard',
            particleEffects: true,
            screenShake: true,
            powerSave: false,
            autoSaveInterval: 20,
        };
    }
    GameState.lastUpdate = Date.now();
}

/**
 * Réinitialise l'état du jeu pour un Prestige (conserve points, trophées & arbre de prestige).
 */
function resetForPrestige() {
    const lifetimeFame = GameState.prestige.lifetimeFame;
    const points = GameState.prestige.points;
    const spentPoints = GameState.prestige.spentPoints || 0;
    const totalPrestiges = GameState.prestige.totalPrestiges;
    const tree = { ...GameState.prestige.tree };
    const trophies = { ...(GameState.billboard ? GameState.billboard.trophies : {}) };
    const goldenCassettes = GameState.resources ? (GameState.resources.goldenCassettes || 0) : 0;
    const perks = { ...(GameState.quests ? GameState.quests.perks : {}) };
    const redeemedCodes = { ...(GameState.secretCodes ? GameState.secretCodes.redeemed : {}) };
    const settings = { ...(GameState.settings || {}) };

    resetGameState();

    GameState.prestige = {
        points: points,
        spentPoints: spentPoints,
        totalPrestiges: totalPrestiges,
        lifetimeFame: lifetimeFame,
        tree: tree,
    };
    GameState.resources.goldenCassettes = goldenCassettes;
    if (GameState.quests) GameState.quests.perks = perks;
    if (GameState.billboard) GameState.billboard.trophies = trophies;
    if (GameState.secretCodes) GameState.secretCodes.redeemed = redeemedCodes;
    GameState.settings = settings;

    // Recalcule l'énergie maximale en fonction des perks conservés
    if (typeof recalculateMaxEnergy === 'function') {
        recalculateMaxEnergy();
    }
}

/**
 * Calcule tous les bonus passifs du Prestige, de l'arbre de spécialisation et des trophées de disques.
 */
function getPrestigeBonuses() {
    const tree = GameState.prestige.tree || { soundMastery: 0, businessEmpire: 0, hypeOverdrive: 0 };
    const unspentPoints = GameState.prestige.points || 0;

    // Bonus de base des points non dépensés (+5% prod par point)
    const baseMult = 1 + (unspentPoints * 0.05);

    // Multiplicateurs issus des Trophées Billboard débloqués
    let trophyProductionMult = 1.0;
    let trophyRoyaltiesMult = 1.0;
    if (GameState.billboard && GameState.billboard.trophies) {
        if (GameState.billboard.trophies['silver_disc']) trophyProductionMult *= 1.15; // +15%
        if (GameState.billboard.trophies['gold_disc']) trophyProductionMult *= 1.30;   // +30%
        if (GameState.billboard.trophies['plat_disc']) trophyProductionMult *= 1.50;   // +50%
        if (GameState.billboard.trophies['diam_disc']) trophyProductionMult *= 2.00;   // +100%
        if (GameState.billboard.trophies['grammy_win']) trophyProductionMult *= 2.50;  // +150%
        if (GameState.billboard.trophies['streaming_billion']) trophyRoyaltiesMult *= 1.50; // +50% royalties
    }

    return {
        productionMultiplier: baseMult * (1 + (tree.soundMastery || 0) * 0.20) * trophyProductionMult,
        costReduction: Math.max(0.3, 1 - ((tree.businessEmpire || 0) * 0.08)),
        fameMultiplier: 1 + (unspentPoints * 0.05) + ((tree.businessEmpire || 0) * 0.15),
        clickMultiplier: 1 + ((tree.hypeOverdrive || 0) * 0.25),
        frenzyDurationBonus: (tree.hypeOverdrive || 0) * 3, // +3s par point
        royaltiesMultiplier: (1 + ((tree.businessEmpire || 0) * 0.20)) * trophyRoyaltiesMult,
    };
}

/**
 * Applique le multiplicateur de production de prestige.
 */
function applyPrestigeProduction(baseProduction) {
    const bonuses = getPrestigeBonuses();
    return baseProduction * bonuses.productionMultiplier;
}

/**
 * Applique la réduction de coût de prestige.
 */
function applyPrestigeCost(baseCost) {
    const bonuses = getPrestigeBonuses();
    return baseCost * bonuses.costReduction;
}

/**
 * Applique le multiplicateur de renommée de prestige.
 */
function applyPrestigeFame(baseFame) {
    const bonuses = getPrestigeBonuses();
    return baseFame * bonuses.fameMultiplier;
}
