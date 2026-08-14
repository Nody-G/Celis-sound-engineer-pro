/**
 * stats.js - Statistiques détaillées étendues
 */

function getDetailedStats() {
    const bonuses = getPrestigeBonuses();
    const passiveProduction = getPassiveProduction();
    const activeBoosters = getActiveBoostersList();

    return {
        resources: {
            money: GameState.resources.money,
            fame: GameState.resources.fame,
            energy: GameState.resources.energy,
            maxEnergy: GameState.resources.maxEnergy,
        },
        production: {
            passivePerSecond: passiveProduction,
            boosterMultiplier: getBoosterProductionMultiplier(),
            upgradeMultiplier: typeof getUpgradePassiveMultiplier === 'function' ? getUpgradePassiveMultiplier() : 1.0,
            hypeMultiplier: (GameState.hype && GameState.hype.combo) ? GameState.hype.combo : 1.0,
            activeBoosters: activeBoosters,
        },
        stats: {
            tracksMixed: GameState.stats.tracksMixed,
            totalMoneyEarned: GameState.stats.totalMoneyEarned,
            totalFameEarned: GameState.stats.totalFameEarned,
            boostersUsed: GameState.stats.boostersUsed || 0,
            eventsEncountered: GameState.stats.eventsEncountered || 0,
            upgradesUnlocked: GameState.stats.upgradesUnlocked || 0,
            goldenVinylsClicked: GameState.stats.goldenVinylsClicked || 0,
        },
        equipment: {
            totalCount: getTotalEquipmentCount(),
            typesOwned: Object.keys(GameState.equipment).length,
            totalTypes: EQUIPMENT_DEFS.length,
        },
        achievements: {
            unlocked: getUnlockedAchievementsCount(),
            total: getTotalAchievementsCount(),
        },
        prestige: {
            points: GameState.prestige.points,
            spentPoints: GameState.prestige.spentPoints || 0,
            totalPrestiges: GameState.prestige.totalPrestiges,
            lifetimeFame: GameState.prestige.lifetimeFame,
            productionMultiplier: bonuses.productionMultiplier,
            costReduction: bonuses.costReduction,
            fameMultiplier: bonuses.fameMultiplier,
            clickMultiplier: bonuses.clickMultiplier,
        },
        playtime: {
            totalSeconds: GameState.stats.playtimeSeconds || 0,
        },
    };
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function getOverallProgress() {
    let progress = 0;

    // Équipements (40%)
    const equipmentProgress = getTotalEquipmentCount() / 150;
    progress += Math.min(equipmentProgress, 1) * 40;

    // R&D (25%)
    const upgradeProgress = (GameState.stats.upgradesUnlocked || 0) / (typeof UPGRADE_DEFS !== 'undefined' ? UPGRADE_DEFS.length : 12);
    progress += Math.min(upgradeProgress, 1) * 25;

    // Succès (20%)
    const achievementProgress = getUnlockedAchievementsCount() / getTotalAchievementsCount();
    progress += Math.min(achievementProgress, 1) * 20;

    // Prestige (15%)
    const prestigeProgress = GameState.prestige.totalPrestiges / 5;
    progress += Math.min(prestigeProgress, 1) * 15;

    return Math.min(progress, 100);
}
