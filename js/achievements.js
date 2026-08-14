/**
 * achievements.js - Système étendu de succès et récompenses
 */

// Définition des succès disponibles
const ACHIEVEMENT_DEFS = [
    {
        id: 'first_mix',
        name: '🎵 Premier Mix',
        description: 'Mixe ton premier morceau au studio.',
        icon: '🎵',
        reward: 50,
        check: () => GameState.stats.tracksMixed >= 1,
    },
    {
        id: 'ten_mixes',
        name: '🎶 Beatmaker Débutant',
        description: 'Mixe 10 morceaux.',
        icon: '🎶',
        reward: 250,
        check: () => GameState.stats.tracksMixed >= 10,
    },
    {
        id: 'hundred_mixes',
        name: '🎼 Virtuose de la Table',
        description: 'Mixe 100 morceaux.',
        icon: '🎼',
        reward: 2500,
        check: () => GameState.stats.tracksMixed >= 100,
    },
    {
        id: 'thousand_mixes',
        name: '🏆 Maître du Mixage',
        description: 'Mixe 1 000 morceaux.',
        icon: '🏆',
        reward: 35000,
        check: () => GameState.stats.tracksMixed >= 1000,
    },
    {
        id: 'first_frenzy',
        name: '🔥 Drop The Bass !',
        description: 'Déclenche ton premier mode FRENZY.',
        icon: '🔥',
        reward: 1000,
        check: () => GameState.hype && GameState.hype.isFrenzy,
    },
    {
        id: 'first_equipment',
        name: '🎤 Premier Micro',
        description: 'Achète ton tout premier équipement de studio.',
        icon: '🎤',
        reward: 100,
        check: () => getTotalEquipmentCount() >= 1,
    },
    {
        id: 'twenty_equipment',
        name: '🏗️ Studio en Pleine Expansion',
        description: 'Possède au total 20 équipements.',
        icon: '🏗️',
        reward: 5000,
        check: () => getTotalEquipmentCount() >= 20,
    },
    {
        id: 'hundred_equipment',
        name: '🏢 Usine à Tubes',
        description: 'Possède au total 100 équipements.',
        icon: '🏢',
        reward: 100000,
        check: () => getTotalEquipmentCount() >= 100,
    },
    {
        id: 'first_upgrade',
        name: '🔬 Chercheur Acoustique',
        description: 'Débloque ta première amélioration de R&D.',
        icon: '🔬',
        reward: 500,
        check: () => GameState.stats.upgradesUnlocked >= 1,
    },
    {
        id: 'five_upgrades',
        name: '🧠 Ingénieur Haute Technologie',
        description: 'Débloque 5 améliorations de R&D.',
        icon: '🧠',
        reward: 10000,
        check: () => GameState.stats.upgradesUnlocked >= 5,
    },
    {
        id: 'first_quest',
        name: '🎯 Premier Défi Relevé',
        description: 'Valide ta première quête quotidienne.',
        icon: '🎯',
        reward: 1000,
        check: () => (GameState.stats.questsCompleted || 0) >= 1,
    },
    {
        id: 'five_quests',
        name: '🌟 Maître des Objectifs',
        description: 'Valide au moins 5 quêtes quotidiennes.',
        icon: '🌟',
        reward: 20000,
        check: () => (GameState.stats.questsCompleted || 0) >= 5,
    },
    {
        id: 'golden_vinyl',
        name: '✨ Collectionneur Doré',
        description: 'Attrape un Vinyle Doré volant.',
        icon: '✨',
        reward: 2000,
        check: () => GameState.stats.goldenVinylsClicked >= 1,
    },
    {
        id: 'first_booster',
        name: '⚡ Coup de Boost',
        description: 'Active ton premier booster de production.',
        icon: '⚡',
        reward: 500,
        check: () => GameState.stats.boostersUsed >= 1,
    },
    {
        id: 'perk_collector',
        name: '📼 Passion Cassettes',
        description: 'Débloque un avantage permanent dans la Boutique de Cassettes.',
        icon: '📼',
        reward: 25000,
        check: () => GameState.quests && GameState.quests.perks && Object.keys(GameState.quests.perks).length >= 1,
    },
    {
        id: 'first_prestige',
        name: '🏆 Nouveau Chapitre',
        description: 'Effectue une refonte de studio (Prestige).',
        icon: '🏆',
        reward: 25000,
        check: () => GameState.prestige.totalPrestiges >= 1,
    },
    {
        id: 'millionaire',
        name: '💰 Millionnaire du Son',
        description: 'Gagne 1 000 000 $ au total.',
        icon: '💰',
        reward: 15000,
        check: () => GameState.stats.totalMoneyEarned >= 1000000,
    },
    {
        id: 'billionaire',
        name: '💎 Milliardaire Musical',
        description: 'Gagne 1 000 000 000 $ au total.',
        icon: '💎',
        reward: 1000000,
        check: () => GameState.stats.totalMoneyEarned >= 1000000000,
    },
];

function getAchievementDef(id) {
    return ACHIEVEMENT_DEFS.find(a => a.id === id) || null;
}

function isAchievementUnlocked(id) {
    return GameState.achievementsUnlocked[id] === true;
}

function checkAchievements() {
    if (!GameState.achievementsUnlocked) GameState.achievementsUnlocked = {};
    const newlyUnlocked = [];

    for (const def of ACHIEVEMENT_DEFS) {
        if (!isAchievementUnlocked(def.id) && typeof def.check === 'function' && def.check()) {
            GameState.achievementsUnlocked[def.id] = true;
            addMoney(def.reward);
            newlyUnlocked.push(def);
        }
    }

    return newlyUnlocked;
}

/**
 * Vérifie et notifie les succès nouvellement débloqués.
 */
function checkAndNotifyAchievements() {
    const newlyUnlocked = checkAchievements();

    if (newlyUnlocked && newlyUnlocked.length > 0) {
        if (typeof playAchievementSound === 'function') {
            playAchievementSound();
        }

        const header = document.getElementById('header') || document.body;

        newlyUnlocked.forEach(ach => {
            if (typeof spawnFloatingText === 'function') {
                spawnFloatingText(`🏆 SUCCÈS DÉBLOQUÉ : ${ach.name} (+${formatNumber(ach.reward)} $) !`, header, true);
            }
        });

        if (typeof updateAchievementsDisplay === 'function') {
            updateAchievementsDisplay();
        }
        if (typeof updateResourceDisplay === 'function') {
            updateResourceDisplay();
        }
    }

    return newlyUnlocked;
}

function getUnlockedAchievementsCount() {
    return Object.keys(GameState.achievementsUnlocked || {}).length;
}

function getTotalAchievementsCount() {
    return ACHIEVEMENT_DEFS.length;
}

