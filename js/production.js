/**
 * production.js - Mécanique de production et mixage manuel étendu (Sound Engineer Idle Hit Edition)
 * 
 * Intègre :
 * - Production des équipements & paliers
 * - Multiplicateurs de R&D et Boosters
 * - Jauge de Hype & Mode Frenzy
 * - Royalties de streaming d'albums
 * - Mastering EQ bonus
 * - Groove bonus du Séquenceur 16-Pas
 * - Bonus d'expérience des Artistes signés
 * - Avantages de Cassettes Dorées & Trophées
 */

// Constantes de mixage manuel
const MIX_COST = 10;            // Énergie consommée par mixage manuel
const MIX_REWARD = 5;           // Argent de base
const MIX_FAME_REWARD = 0.1;    // Renommée de base

/**
 * Effectue un mixage manuel (clic sur le vinyle / bouton principal).
 */
function manualMix() {
    if (!hasEnoughEnergy(MIX_COST)) {
        return null;
    }

    // Consomme l'énergie
    spendEnergy(MIX_COST);

    // Multiplicateurs de mixage
    const hypeCombo = (GameState.hype && GameState.hype.combo) ? GameState.hype.combo : 1.0;
    const upgradeMixMult = typeof getUpgradeManualMixMultiplier === 'function' ? getUpgradeManualMixMultiplier() : 1.0;
    const prestigeBonus = typeof getPrestigeBonuses === 'function' ? getPrestigeBonuses().clickMultiplier : 1.0;

    // Calcul d'un coup critique aléatoire (15% de chance pour un Critical Hit x3)
    const isCrit = Math.random() < 0.15;
    const critMult = isCrit ? 3.0 : 1.0;

    // Récompenses calculées
    const baseMoney = MIX_REWARD + (getTotalPassiveProduction() * 0.05); // 5% de la production passive ajoutée au clic
    const moneyReward = applyPrestigeProduction(baseMoney) * hypeCombo * upgradeMixMult * prestigeBonus * critMult;
    const fameReward = applyPrestigeFame(MIX_FAME_REWARD * (isCrit ? 2.0 : 1.0));

    // Applique les gains
    addMoney(moneyReward);
    addFame(fameReward);

    // Fait grimper la jauge de Hype
    if (typeof increaseHype === 'function') {
        increaseHype(8);
    }

    // Statistiques
    GameState.stats.tracksMixed++;

    // Progression de quête
    if (typeof advanceQuestProgress === 'function') {
        advanceQuestProgress('mix_tracks', 1);
    }

    return {
        money: moneyReward,
        fame: fameReward,
        isCrit: isCrit,
        combo: hypeCombo
    };
}

/**
 * Met à jour la production passive par seconde et la régénération.
 */
function updateProduction(deltaTime) {
    // 1. Production des équipements & bonus
    const equipmentBase = getTotalPassiveProduction();
    const boosterMultiplier = getBoosterProductionMultiplier();
    const upgradeMultiplier = typeof getUpgradePassiveMultiplier === 'function' ? getUpgradePassiveMultiplier() : 1.0;
    const hypeMultiplier = (GameState.hype && GameState.hype.combo) ? GameState.hype.combo : 1.0;
    const grooveBonus = typeof calculateGrooveBonus === 'function' ? calculateGrooveBonus() : 1.0;
    const acousticBonus = (GameState.quests && GameState.quests.perks && GameState.quests.perks.acoustic_mastery) ? 1.25 : 1.0;
    const tapePerkBonus = ((GameState.quests && GameState.quests.perks && GameState.quests.perks.master_tape) ? 1.2 : 1.0) * acousticBonus;

    // Production totale des machines
    const totalEffectiveProduction = equipmentBase * boosterMultiplier * upgradeMultiplier * hypeMultiplier * grooveBonus * tapePerkBonus;

    if (totalEffectiveProduction > 0) {
        addMoney(totalEffectiveProduction * deltaTime);
    }

    // 2. Régénération d'énergie (Base + bonus R&D)
    regenerateEnergy(deltaTime);

    // Auto-Mixer : Si l'énergie est pleine à 100% et que le perk est actif
    if (GameState.quests && GameState.quests.perks && GameState.quests.perks.auto_mixer) {
        if (!GameState.settings || GameState.settings.autoMixer !== false) {
            if (GameState.resources.energy >= (GameState.resources.maxEnergy - 0.5)) {
                manualMix();
            }
        }
    }

    // 3. Sous-systèmes temps réel
    if (typeof updateHype === 'function') updateHype(deltaTime);
}

/**
 * Calcule le flux total d'argent généré par seconde en temps réel.
 */
function getPassiveProduction() {
    const equipmentBase = getTotalPassiveProduction();
    const boosterMultiplier = getBoosterProductionMultiplier();
    const upgradeMultiplier = typeof getUpgradePassiveMultiplier === 'function' ? getUpgradePassiveMultiplier() : 1.0;
    const hypeMultiplier = (GameState.hype && GameState.hype.combo) ? GameState.hype.combo : 1.0;
    const grooveBonus = typeof calculateGrooveBonus === 'function' ? calculateGrooveBonus() : 1.0;
    const acousticBonus = (GameState.quests && GameState.quests.perks && GameState.quests.perks.acoustic_mastery) ? 1.25 : 1.0;
    const tapePerkBonus = ((GameState.quests && GameState.quests.perks && GameState.quests.perks.master_tape) ? 1.2 : 1.0) * acousticBonus;

    return equipmentBase * boosterMultiplier * upgradeMultiplier * hypeMultiplier * grooveBonus * tapePerkBonus;
}

/**
 * Vérifie si le mixage manuel est possible.
 */
function canManualMix() {
    return hasEnoughEnergy(MIX_COST);
}
