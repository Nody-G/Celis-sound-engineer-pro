/**
 * equipment.js - Système d'équipements étendu avec Paliers & Achats Multiples
 * 
 * Gère les équipements du studio qui produisent des revenus passifs.
 * Supporte les modes d'achat x1, x10, x25, x100, MAX, ainsi que
 * les multiplicateurs de paliers (Niveau 10, 25, 50, 100, 200, 500).
 */

// Définition des paliers de niveau et leurs multiplicateurs
const EQUIPMENT_MILESTONES = [
    { level: 10, mult: 2, badge: '🥉 Bronze' },
    { level: 25, mult: 2, badge: '🥈 Argent' },
    { level: 50, mult: 2, badge: '🥇 Or' },
    { level: 100, mult: 2, badge: '💎 Platine' },
    { level: 200, mult: 3, badge: '👑 Master' },
    { level: 500, mult: 5, badge: '🌌 Galactique' },
];

// Définition des équipements disponibles
const EQUIPMENT_DEFS = [
    {
        id: 'micro_dynamique',
        name: '🎤 Micro Dynamique Shure',
        description: 'Un micro de base pour capturer les premières prises de voix.',
        baseCost: 50,
        baseProduction: 1,      // 1 $/s par unité
        costMultiplier: 1.15,
        icon: '🎤',
        image: 'assets/equipment/micro_dynamique.jpg',
    },
    {
        id: 'interface_audio',
        name: '🔌 Interface Audio Focusrite',
        description: 'Convertit les signaux analogiques en haute résolution 24-bit.',
        baseCost: 500,
        baseProduction: 10,
        costMultiplier: 1.15,
        icon: '🔌',
        image: 'assets/equipment/interface_audio.jpg',
    },
    {
        id: 'moniteurs_studio',
        name: '🔊 Moniteurs Studio Yamaha HS8',
        description: 'Enceintes de monitoring de précision pour un mixage fidèle.',
        baseCost: 5000,
        baseProduction: 50,
        costMultiplier: 1.15,
        icon: '🔊',
        image: 'assets/equipment/moniteurs_studio.jpg',
    },
    {
        id: 'plugins_premium',
        name: '🎛️ Bundle Plugins Waves Pro',
        description: 'Compresseurs, égaliseurs et réverbes de standard industriel.',
        baseCost: 50000,
        baseProduction: 250,
        costMultiplier: 1.15,
        icon: '🎛️',
        image: 'assets/equipment/plugins_premium.jpg',
    },
    {
        id: 'console_mixage',
        name: '🎚️ Console SSL 4000 Analogue',
        description: 'Une console de légende pour sculpter les plus grands tubes.',
        baseCost: 500000,
        baseProduction: 1500,
        costMultiplier: 1.15,
        icon: '🎚️',
        image: 'assets/equipment/console_mixage.jpg',
    },
    {
        id: 'salle_insonorisee',
        name: '🏠 Cabine Insonorisée Flottante',
        description: 'Un espace acoustiquement isolé sans aucune résonance parasite.',
        baseCost: 5000000,
        baseProduction: 10000,
        costMultiplier: 1.15,
        icon: '🏠',
        image: 'assets/equipment/salle_insonorisee.jpg',
    },
    {
        id: 'studio_pro',
        name: '🏢 Complexe Studio Abbey Road Pro',
        description: 'Le studio mythique avec microphones vintage Neumann U47.',
        baseCost: 50000000,
        baseProduction: 75000,
        costMultiplier: 1.15,
        icon: '🏢',
        image: 'assets/equipment/studio_pro.jpg',
    },
    {
        id: 'mastering_suite',
        name: '🎚️ Suite de Mastering Analogique Manley',
        description: 'Matériel à lampes haut de gamme pour une dynamique et clarté ultimes.',
        baseCost: 500000000,
        baseProduction: 500000,
        costMultiplier: 1.15,
        icon: '🎚️',
        image: 'assets/equipment/mastering_suite.jpg',
    },
    {
        id: 'analog_gear',
        name: '🎛️ Synthétiseurs Moog & Roland Vintage',
        description: 'Une collection inestimable de synthétiseurs modulaires analogiques.',
        baseCost: 5000000000,
        baseProduction: 3500000,
        costMultiplier: 1.15,
        icon: '🎛️',
        image: 'assets/equipment/analog_gear.jpg',
    },
    {
        id: 'recording_complex',
        name: '🏗️ Mégapole Musicale Hollywoodienne',
        description: '10 studios simultanés produisant les bandes originales de blockbusters.',
        baseCost: 50000000000,
        baseProduction: 25000000,
        costMultiplier: 1.15,
        icon: '🏗️',
        image: 'assets/equipment/recording_complex.jpg',
    },
    {
        id: 'global_studio_network',
        name: '🌍 Réseau Mondial de Studios Satellites',
        description: 'Des sessions live connectées en direct entre Tokyo, Londres et LA.',
        baseCost: 500000000000,
        baseProduction: 200000000,
        costMultiplier: 1.15,
        icon: '🌍',
        image: 'assets/equipment/global_studio_network.svg',
    },
    {
        id: 'orbital_sound_station',
        name: '🛰️ Station Spatiale Sonore Orbitale',
        description: 'Acoustique en gravité zéro pour une spatialisation Dolby Atmos infinie.',
        baseCost: 5000000000000,
        baseProduction: 1500000000,
        costMultiplier: 1.15,
        icon: '🛰️',
        image: 'assets/equipment/orbital_sound_station.svg',
    },
];

/**
 * Récupère la définition d'un équipement par son ID.
 */
function getEquipmentDef(id) {
    return EQUIPMENT_DEFS.find(e => e.id === id) || null;
}

/**
 * Récupère la quantité possédée d'un équipement.
 */
function getEquipmentCount(id) {
    return GameState.equipment[id] || 0;
}

/**
 * Calcule le multiplicateur de palier d'un équipement selon son niveau.
 */
function getEquipmentMilestoneMultiplier(count) {
    let mult = 1;
    for (const milestone of EQUIPMENT_MILESTONES) {
        if (count >= milestone.level) {
            mult *= milestone.mult;
        }
    }
    return mult;
}

/**
 * Trouve le prochain palier pour un équipement donné.
 */
function getNextEquipmentMilestone(count) {
    for (const milestone of EQUIPMENT_MILESTONES) {
        if (count < milestone.level) {
            return milestone;
        }
    }
    return null;
}

/**
 * Trouve le niveau du palier précédent.
 */
function getPrevEquipmentMilestoneLevel(count) {
    let prev = 0;
    for (const milestone of EQUIPMENT_MILESTONES) {
        if (count >= milestone.level) {
            prev = milestone.level;
        } else {
            break;
        }
    }
    return prev;
}

/**
 * Calcule la production totale d'une ligne d'équipement avec prestige.
 */
function getEquipmentItemTotalProduction(id) {
    const def = getEquipmentDef(id);
    if (!def) return 0;
    const count = getEquipmentCount(id);
    const milestoneMult = getEquipmentMilestoneMultiplier(count);
    return applyPrestigeProduction(def.baseProduction * count * milestoneMult);
}

/**
 * Calcule le coût et la quantité pour l'achat groupé d'équipements.
 */
/**
 * Calcule le coût et la quantité pour l'achat groupé d'équipements.
 */
function calculateEquipmentBuyCost(id, mult = 1) {
    const def = getEquipmentDef(id);
    if (!def) return { cost: Infinity, quantity: 1, canAfford: false };

    if (mult === 'max') {
        const maxAffordable = getMaxAffordableCount(id);
        if (maxAffordable <= 0) {
            const unitCost = getEquipmentCostForAmount(id, 1);
            return {
                cost: unitCost,
                quantity: 1,
                canAfford: false
            };
        }
        const totalCost = getEquipmentCostForAmount(id, maxAffordable);
        return {
            cost: totalCost,
            quantity: maxAffordable,
            canAfford: hasEnoughMoney(totalCost)
        };
    }

    const qty = parseInt(mult, 10) || 1;
    const cost = getEquipmentCostForAmount(id, qty);
    return {
        cost: cost,
        quantity: qty,
        canAfford: hasEnoughMoney(cost)
    };
}

/**
 * Calcule le coût unitaire du prochain équipement.
 */
function getEquipmentCost(id) {
    return getEquipmentCostForAmount(id, 1);
}

/**
 * Calcule le coût total pour acheter un nombre spécifique d'exemplaires.
 */
function getEquipmentCostForAmount(id, amount) {
    const def = getEquipmentDef(id);
    if (!def || amount <= 0) return 0;

    const count = getEquipmentCount(id);
    let baseCost = typeof applyPrestigeCost === 'function' ? applyPrestigeCost(def.baseCost) : def.baseCost;
    if (typeof isUpgradeBought === 'function' && isUpgradeBought('platinum_club')) {
        baseCost *= 0.8;
    }

    if (amount === 1) {
        return Math.floor(baseCost * Math.pow(def.costMultiplier, count));
    }

    // Somme géométrique : S = base * r^count * (r^n - 1) / (r - 1)
    const r = def.costMultiplier;
    const startCost = baseCost * Math.pow(r, count);
    const total = startCost * (Math.pow(r, amount) - 1) / (r - 1);
    return Math.floor(total);
}

/**
 * Calcule le nombre maximal d'unités que le joueur peut s'offrir immédiatement.
 */
function getMaxAffordableCount(id) {
    const def = getEquipmentDef(id);
    if (!def) return 0;

    const currentMoney = GameState.resources.money;
    const count = getEquipmentCount(id);
    let baseCost = typeof applyPrestigeCost === 'function' ? applyPrestigeCost(def.baseCost) : def.baseCost;
    if (typeof isUpgradeBought === 'function' && isUpgradeBought('platinum_club')) {
        baseCost *= 0.8;
    }

    const r = def.costMultiplier;
    const unitCost = Math.floor(baseCost * Math.pow(r, count));

    if (currentMoney < unitCost) return 0;

    // n = floor( log( (money * (r - 1) / (baseCost * r^count)) + 1 ) / log(r) )
    const startCost = baseCost * Math.pow(r, count);
    let maxN = Math.floor(Math.log((currentMoney * (r - 1) / startCost) + 1) / Math.log(r));
    if (maxN < 1) maxN = 1;

    // Ajustement de sécurité si dépassement d'arrondi
    while (maxN > 1 && getEquipmentCostForAmount(id, maxN) > currentMoney) {
        maxN--;
    }

    return maxN;
}

/**
 * Calcule la quantité effective à acheter selon le buyMultiplier ('max' ou chiffre).
 */
function getTargetBuyAmount(id, mult = null) {
    const activeMult = mult !== null ? mult : (GameState.buyMultiplier || 1);
    if (activeMult === 'max') {
        return getMaxAffordableCount(id);
    }
    return parseInt(activeMult, 10) || 1;
}

/**
 * Calcule la production passive totale de tous les équipements en tenant compte des paliers.
 */
function getTotalPassiveProduction() {
    let total = 0;

    for (const def of EQUIPMENT_DEFS) {
        const count = getEquipmentCount(def.id);
        if (count > 0) {
            const milestoneMult = getEquipmentMilestoneMultiplier(count);
            total += (def.baseProduction * count * milestoneMult);
        }
    }

    // Applique le bonus de prestige
    return applyPrestigeProduction(total);
}

/**
 * Calcule la production passive unitaire d'un équipement spécifique avec ses paliers.
 */
function getSingleEquipmentTotalProduction(id) {
    const def = getEquipmentDef(id);
    if (!def) return 0;
    const count = getEquipmentCount(id);
    const milestoneMult = getEquipmentMilestoneMultiplier(count);
    return def.baseProduction * count * milestoneMult;
}

/**
 * Achète un équipement selon le multiplicateur actuel.
 */
function buyEquipment(id, mult = null) {
    const def = getEquipmentDef(id);
    if (!def) return { success: false, reason: 'Équipement introuvable' };

    const amount = getTargetBuyAmount(id, mult);
    if (amount <= 0) return { success: false, reason: 'Fonds insuffisants' };

    const cost = getEquipmentCostForAmount(id, amount);
    if (!hasEnoughMoney(cost)) return { success: false, reason: 'Fonds insuffisants' };

    const prevCount = getEquipmentCount(id);
    spendMoney(cost);
    GameState.equipment[id] = prevCount + amount;

    // Détection de déblocage d'instrument de musique pour le Séquenceur
    if (prevCount === 0 && typeof INSTRUMENT_DEFS !== 'undefined') {
        const unlockedInst = INSTRUMENT_DEFS.find(inst => inst.reqEquip === id);
        if (unlockedInst) {
            if (typeof playTrophySound === 'function') {
                playTrophySound();
            }
            if (typeof spawnFloatingText === 'function') {
                const header = document.getElementById('header');
                spawnFloatingText(`🎹 NOUVEL INSTRUMENT DÉBLOQUÉ : ${unlockedInst.icon} ${unlockedInst.name} !`, header, true);
            }
            if (typeof initSequencerUI === 'function') {
                initSequencerUI();
            }
            if (typeof renderBeatPadsUI === 'function') {
                renderBeatPadsUI();
            }
        }
    }

    return { success: true, count: GameState.equipment[id], amountBought: amount, cost: cost };
}

/**
 * Vérifie si le joueur peut acheter l'équipement sélectionné.
 */
function canBuyEquipment(id, mult = null) {
    const def = getEquipmentDef(id);
    if (!def) return false;

    const amount = getTargetBuyAmount(id, mult);
    if (amount <= 0) return false;

    const cost = getEquipmentCostForAmount(id, amount);
    return hasEnoughMoney(cost);
}

/**
 * Compte le nombre total d'équipements possédés (toutes catégories confondues).
 */
function getTotalEquipmentCount() {
    let sum = 0;
    for (const id in GameState.equipment) {
        sum += GameState.equipment[id] || 0;
    }
    return sum;
}
