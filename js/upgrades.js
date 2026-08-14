/**
 * upgrades.js - Système d'améliorations de studio (R&D / Talents)
 * 
 * Permet d'acheter des améliorations permanentes qui boostent
 * le clic manuel, la production passive, la régénération d'énergie,
 * les chances de critique et les gains de renommée.
 */

// Définition des améliorations de R&D Studio
const UPGRADE_DEFS = [
    {
        id: 'gold_cables',
        name: '🔌 Câbles Plaqué Or',
        category: 'Qualité Audio',
        description: 'Améliore la clarté du signal. +50% de gains par mixage manuel.',
        cost: 250,
        icon: '🔌',
        unlocked: () => GameState.stats.tracksMixed >= 5,
        effect: { manualMixMult: 1.5 },
    },
    {
        id: 'espresso_machine',
        name: '☕ Machine à Expresso Pro',
        category: 'Studio Confort',
        description: 'Double la vitesse de régénération naturelle d\'énergie (+2 ⚡/s supplémentaire).',
        cost: 750,
        icon: '☕',
        unlocked: () => GameState.stats.totalMoneyEarned >= 500,
        effect: { energyRegenBonus: 2 },
    },
    {
        id: 'acoustic_foam',
        name: '🧱 Mousse Acoustique Studio',
        category: 'Acoustique',
        description: '+25% de production passive pour tous les équipements.',
        cost: 2500,
        icon: '🧱',
        unlocked: () => getTotalEquipmentCount() >= 5,
        effect: { passiveMult: 1.25 },
    },
    {
        id: 'dsp_overclock',
        name: '⚡ Processeur DSP Surcadencé',
        category: 'Technologie',
        description: 'La jauge de Hype monte 50% plus vite lors des mixages.',
        cost: 8000,
        icon: '⚡',
        unlocked: () => GameState.stats.tracksMixed >= 30,
        effect: { hypeGainMult: 1.5 },
    },
    {
        id: 'vinyl_press',
        name: '💿 Presseuse à Vinyles',
        category: 'Production',
        description: 'Gravure haute précision : +30% de gains par mixage manuel.',
        cost: 25000,
        icon: '💿',
        unlocked: () => GameState.resources.fame >= 25,
        effect: { manualMixMult: 1.30 },
    },
    {
        id: 'tube_preamp',
        name: '📻 Préamplificateur à Lampes Vintage',
        category: 'Qualité Audio',
        description: 'Donne une chaleur incomparable. +40% de production passive totale.',
        cost: 80000,
        icon: '📻',
        unlocked: () => getTotalEquipmentCount() >= 15,
        effect: { passiveMult: 1.40 },
    },
    {
        id: 'viral_bot',
        name: '🤖 Algorithme Streaming Viral',
        category: 'Marketing',
        description: '+100% de renommée ⭐ gagnée sur toutes les actions du studio.',
        cost: 250000,
        icon: '🤖',
        unlocked: () => GameState.resources.fame >= 50,
        effect: { fameMult: 2.0 },
    },
    {
        id: 'energy_storage',
        name: '🔋 Batterie Stationnaire Studio',
        category: 'Technologie',
        description: 'Augmente l\'énergie maximale à 250 ⚡ (au lieu de 100).',
        cost: 600000,
        icon: '🔋',
        unlocked: () => GameState.stats.totalMoneyEarned >= 500000,
        effect: { maxEnergyBonus: 150 },
    },
    {
        id: 'sub_bass_subwoofer',
        name: '🔊 Caisson Subwoofer 18 Pouces',
        category: 'Acoustique',
        description: 'Pendant le mode FRENZY, le multiplicateur passe de 10x à 15x !',
        cost: 2000000,
        icon: '🔊',
        unlocked: () => GameState.stats.tracksMixed >= 100,
        effect: { frenzyMultBonus: 5.0 },
    },
    {
        id: 'dolby_spatial',
        name: '🛰️ Spatialisation Audio Dolby 3D',
        category: 'Technologie',
        description: 'Immersion acoustique totale : +50% de production passive pour tous les équipements.',
        cost: 10000000,
        icon: '🛰️',
        unlocked: () => GameState.resources.fame >= 500,
        effect: { passiveMult: 1.5 },
    },
    {
        id: 'platinum_club',
        name: '💎 Club Privé des Producteurs Diamant',
        category: 'Business',
        description: 'Réduit tous les coûts d\'équipements et d\'améliorations de -20%.',
        cost: 50000000,
        icon: '💎',
        unlocked: () => GameState.resources.fame >= 2000,
        effect: { globalCostDiscount: 0.20 },
    },
    {
        id: 'quantum_dsp',
        name: '🌌 Mixeur Quantique Multidimensionnel',
        category: 'Technologie',
        description: 'Triple (x3) la production globale de tout le studio.',
        cost: 500000000,
        icon: '🌌',
        unlocked: () => getTotalEquipmentCount() >= 40,
        effect: { passiveMult: 3.0 },
    },
];

/**
 * Récupère la définition d'une amélioration par son ID.
 */
function getUpgradeDef(id) {
    return UPGRADE_DEFS.find(u => u.id === id) || null;
}

/**
 * Vérifie si une amélioration est déjà achetée.
 */
function isUpgradeBought(id) {
    return GameState.upgrades && GameState.upgrades[id] === true;
}

/**
 * Vérifie si une amélioration est débloquée et visible.
 */
function isUpgradeUnlocked(id) {
    const def = getUpgradeDef(id);
    if (!def) return false;
    if (isUpgradeBought(id)) return true;
    return typeof def.unlocked === 'function' ? def.unlocked() : true;
}

/**
 * Achète une amélioration R&D.
 */
function buyUpgrade(id) {
    const def = getUpgradeDef(id);
    if (!def) return false;
    if (isUpgradeBought(id)) return false;

    const finalCost = applyPrestigeCost(def.cost);
    if (!hasEnoughMoney(finalCost)) return false;

    spendMoney(finalCost);
    GameState.upgrades[id] = true;
    GameState.stats.upgradesUnlocked = (GameState.stats.upgradesUnlocked || 0) + 1;

    // Recalcule immédiatement les capacités d'énergie
    if (typeof recalculateMaxEnergy === 'function') {
        recalculateMaxEnergy();
    }

    return true;
}

/**
 * Calcule le multiplicateur passif total octroyé par tous les upgrades R&D.
 */
function getUpgradePassiveMultiplier() {
    let mult = 1.0;
    for (const def of UPGRADE_DEFS) {
        if (isUpgradeBought(def.id) && def.effect && def.effect.passiveMult) {
            mult *= def.effect.passiveMult;
        }
    }
    return mult;
}

/**
 * Calcule le bonus de régénération d'énergie conféré par la R&D.
 */
function getUpgradeEnergyRegenBonus() {
    let bonus = 0;
    for (const def of UPGRADE_DEFS) {
        if (isUpgradeBought(def.id) && def.effect && def.effect.energyRegenBonus) {
            bonus += def.effect.energyRegenBonus;
        }
    }
    return bonus;
}

/**
 * Calcule le multiplicateur de renommée conféré par la R&D.
 */
function getUpgradeFameMultiplier() {
    let mult = 1.0;
    for (const def of UPGRADE_DEFS) {
        if (isUpgradeBought(def.id) && def.effect && def.effect.fameMult) {
            mult *= def.effect.fameMult;
        }
    }
    return mult;
}

/**
 * Calcule le multiplicateur de clic manuel conféré par la R&D.
 */
function getUpgradeManualMixMultiplier() {
    let mult = 1.0;
    for (const def of UPGRADE_DEFS) {
        if (isUpgradeBought(def.id) && def.effect && def.effect.manualMixMult) {
            mult *= def.effect.manualMixMult;
        }
    }
    return mult;
}

/**
 * Calcule le multiplicateur de royalties conféré par la R&D.
 */
function getUpgradeRoyaltiesMultiplier() {
    let mult = 1.0;
    for (const def of UPGRADE_DEFS) {
        if (isUpgradeBought(def.id) && def.effect && def.effect.royaltiesMult) {
            mult *= def.effect.royaltiesMult;
        }
    }
    return mult;
}
