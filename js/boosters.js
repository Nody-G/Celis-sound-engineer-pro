/**
 * boosters.js - Améliorations temporaires (boosters)
 * 
 * Les boosters sont des améliorations à durée limitée qui
 * augmentent temporairement la production ou d'autres aspects du jeu.
 */

// Définition des boosters disponibles
const BOOSTER_DEFS = [
    {
        id: 'coffee',
        name: '☕ Café Express',
        description: '+50% de production pendant 30 secondes.',
        cost: 100,
        duration: 30,       // Durée en secondes
        productionMultiplier: 1.5,
        icon: '☕',
    },
    {
        id: 'energy_drink',
        name: '⚡ Boisson Énergisante',
        description: '+100% de production pendant 60 secondes.',
        cost: 1000,
        duration: 60,
        productionMultiplier: 2.0,
        icon: '⚡',
    },
    {
        id: 'studio_session',
        name: '🎧 Session Studio Intense',
        description: '+200% de production pendant 2 minutes.',
        cost: 10000,
        duration: 120,
        productionMultiplier: 3.0,
        icon: '🎧',
    },
    {
        id: 'producer_boost',
        name: '🎛️ Boost de Producteur',
        description: '+500% de production pendant 5 minutes.',
        cost: 100000,
        duration: 300,
        productionMultiplier: 6.0,
        icon: '🎛️',
    },
];

// Boosters actifs (id -> { endTime, multiplier })
const activeBoosters = {};

/**
 * Récupère la définition d'un booster par son ID.
 * @param {string} id - ID du booster
 * @returns {Object|null} La définition du booster ou null
 */
function getBoosterDef(id) {
    return BOOSTER_DEFS.find(b => b.id === id) || null;
}

/**
 * Active un booster (alias direct).
 */
function activateBooster(id) {
    return buyBooster(id).success;
}

/**
 * Achète et active un booster avec prise en compte des réductions de prestige.
 */
function buyBooster(id) {
    const def = getBoosterDef(id);
    if (!def) return { success: false, reason: 'Booster introuvable' };

    const realCost = typeof applyPrestigeCost === 'function' ? applyPrestigeCost(def.cost) : def.cost;

    // Vérifie si le joueur a assez d'argent
    if (!hasEnoughMoney(realCost)) return { success: false, reason: 'Fonds insuffisants' };

    // Dépense l'argent
    spendMoney(realCost);

    // Active le booster
    const endTime = Date.now() + (def.duration * 1000);
    activeBoosters[id] = {
        endTime: endTime,
        multiplier: def.productionMultiplier,
    };

    GameState.stats.boostersUsed = (GameState.stats.boostersUsed || 0) + 1;

    return {
        success: true,
        booster: def,
        cost: realCost
    };
}

/**
 * Vérifie si un booster est actif.
 * @param {string} id - ID du booster
 * @returns {boolean} true si le booster est actif
 */
function isBoosterActive(id) {
    const booster = activeBoosters[id];
    if (!booster) return false;

    // Vérifie si le booster a expiré
    if (Date.now() > booster.endTime) {
        delete activeBoosters[id];
        return false;
    }

    return true;
}

/**
 * Récupère le temps restant d'un booster actif.
 * @param {string} id - ID du booster
 * @returns {number} Temps restant en secondes (0 si inactif)
 */
function getBoosterTimeLeft(id) {
    const booster = activeBoosters[id];
    if (!booster) return 0;

    const timeLeft = (booster.endTime - Date.now()) / 1000;
    return Math.max(0, timeLeft);
}

/**
 * Calcule le multiplicateur de production total des boosters actifs.
 * @returns {number} Multiplicateur de production
 */
function getBoosterProductionMultiplier() {
    let multiplier = 1;

    for (const def of BOOSTER_DEFS) {
        if (isBoosterActive(def.id)) {
            multiplier *= activeBoosters[def.id].multiplier;
        }
    }

    return multiplier;
}

/**
 * Nettoie les boosters expirés.
 */
function cleanupExpiredBoosters() {
    for (const id of Object.keys(activeBoosters)) {
        if (Date.now() > activeBoosters[id].endTime) {
            delete activeBoosters[id];
        }
    }
}

/**
 * Récupère la liste des boosters actifs.
 * @returns {Array} Liste des boosters actifs avec leurs infos
 */
function getActiveBoostersList() {
    cleanupExpiredBoosters();
    return Object.keys(activeBoosters).map(id => {
        const def = getBoosterDef(id);
        return {
            id: id,
            name: def ? def.name : id,
            icon: def ? def.icon : '❓',
            timeLeft: getBoosterTimeLeft(id),
            multiplier: activeBoosters[id].multiplier,
        };
    });
}
