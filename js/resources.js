/**
 * resources.js - Gestion des ressources et formatage
 * 
 * Gère l'argent, la renommée et l'énergie du joueur avec régénération dynamique.
 */

/**
 * Ajoute de l'argent au joueur.
 */
function addMoney(amount) {
    if (amount <= 0 || isNaN(amount)) return;
    GameState.resources.money += amount;
    GameState.stats.totalMoneyEarned += amount;
}

/**
 * Retire de l'argent au joueur (avec tolérance anti-arrondi).
 */
function spendMoney(amount) {
    if (amount <= 0) return true;
    if (!hasEnoughMoney(amount)) return false;
    GameState.resources.money = Math.max(0, GameState.resources.money - amount);
    return true;
}

/**
 * Vérifie si le joueur a assez d'argent (avec tolérance epsilon de 0.0001).
 */
function hasEnoughMoney(amount) {
    if (amount <= 0) return true;
    return (GameState.resources.money + 0.0001) >= amount;
}

/**
 * Ajoute de la renommée au joueur.
 */
function addFame(amount) {
    if (amount <= 0 || isNaN(amount)) return;
    const upgradeMult = typeof getUpgradeFameMultiplier === 'function' ? getUpgradeFameMultiplier() : 1.0;
    const finalFame = amount * upgradeMult;
    GameState.resources.fame += finalFame;
    GameState.stats.totalFameEarned += finalFame;
    GameState.prestige.lifetimeFame += finalFame;
}

/**
 * Retire de la renommée au joueur.
 */
function spendFame(amount) {
    if (amount <= 0) return true;
    if (!hasEnoughFame(amount)) return false;
    GameState.resources.fame = Math.max(0, GameState.resources.fame - amount);
    return true;
}

/**
 * Vérifie si le joueur a assez de renommée.
 */
function hasEnoughFame(amount) {
    if (amount <= 0) return true;
    return (GameState.resources.fame + 0.0001) >= amount;
}

/**
 * Ajoute de l'énergie (plafonné à maxEnergy).
 */
function addEnergy(amount) {
    if (amount <= 0 || isNaN(amount)) return;
    const max = GameState.resources.maxEnergy || 100;
    GameState.resources.energy = Math.min(
        max,
        Math.max(0, (GameState.resources.energy || 0) + amount)
    );
}

/**
 * Retire de l'énergie au joueur.
 */
function spendEnergy(amount) {
    if (amount <= 0) return true;
    if (!hasEnoughEnergy(amount)) return false;
    GameState.resources.energy = Math.max(0, (GameState.resources.energy || 0) - amount);
    return true;
}

/**
 * Alias de spendEnergy.
 */
function useEnergy(amount) {
    return spendEnergy(amount);
}

/**
 * Vérifie si le joueur a assez d'énergie.
 */
function hasEnoughEnergy(amount) {
    if (amount <= 0) return true;
    return ((GameState.resources.energy || 0) + 0.0001) >= amount;
}

/**
 * Régénère l'énergie au fil du temps (avec bonus R&D et perk Réacteur d'énergie).
 */
function regenerateEnergy(deltaTime) {
    if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0) return;
    const baseRegen = 2.5; // 2.5 ⚡ par seconde de base
    const bonusRegen = typeof getUpgradeEnergyRegenBonus === 'function' ? getUpgradeEnergyRegenBonus() : 0;
    const reactorMult = (GameState.quests && GameState.quests.perks && GameState.quests.perks.energy_reactor) ? 2.0 : 1.0;
    addEnergy((baseRegen + bonusRegen) * reactorMult * Math.min(1.0, deltaTime));
}

/**
 * Recalcule la capacité d'énergie maximale en fonction de tous les bonus permanents et améliorations.
 */
function recalculateMaxEnergy() {
    let max = 100;
    if (typeof isUpgradeBought === 'function') {
        if (isUpgradeBought('energy_storage')) max += 150;
    }
    if (GameState.quests && GameState.quests.perks && GameState.quests.perks.energy_reactor) {
        max += 50;
    }
    GameState.resources.maxEnergy = max;
    GameState.resources.energy = Math.min(GameState.resources.energy || 0, max);
    return max;
}

/**
 * Formate un nombre pour un affichage lisible et propre (Standard, Scientifique ou Ingénieur).
 */
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num < 0) return '-' + formatNumber(-num);

    const notation = (GameState && GameState.settings && GameState.settings.numberNotation) ? GameState.settings.numberNotation : 'standard';

    if (notation === 'scientific') {
        if (num < 1000) {
            return num < 10 && num % 1 !== 0 ? num.toFixed(1) : Math.floor(num).toLocaleString('fr-FR');
        }
        return num.toExponential(2).replace('e+', 'e+');
    }

    if (notation === 'engineering') {
        if (num < 1000) {
            return num < 10 && num % 1 !== 0 ? num.toFixed(1) : Math.floor(num).toLocaleString('fr-FR');
        }
        const exp = Math.floor(Math.log10(num));
        const engExp = Math.floor(exp / 3) * 3;
        const mantissa = num / Math.pow(10, engExp);
        return `${mantissa.toFixed(2)}e${engExp}`;
    }

    // Standard notation (K, M, B, T...)
    if (num < 1000) {
        return num < 10 && num % 1 !== 0 ? num.toFixed(1) : Math.floor(num).toLocaleString('fr-FR');
    }

    const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd'];
    let unitIndex = -1;
    let value = num;

    while (value >= 1000 && unitIndex < units.length - 1) {
        value /= 1000;
        unitIndex++;
    }

    if (unitIndex === -1) {
        return Math.floor(num).toLocaleString('fr-FR');
    }

    if (value >= 100) {
        return Math.floor(value) + ' ' + units[unitIndex];
    } else if (value >= 10) {
        return value.toFixed(1) + ' ' + units[unitIndex];
    } else {
        return value.toFixed(2) + ' ' + units[unitIndex];
    }
}

