/**
 * contracts.js - Système de contrats
 * 
 * Gère les contrats (missions) que le joueur peut accepter.
 * Chaque contrat a des prérequis de renommée et des récompenses.
 */

// Définition des contrats disponibles
const CONTRACT_DEFS = [
    {
        id: 'mix_single',
        name: '🎵 Mixer un Single',
        description: 'Un artiste local te demande de mixer son nouveau single.',
        fameRequirement: 10,
        requiredFame: 10,
        moneyReward: 1000,
        rewardMoney: 1000,
        fameReward: 5,
        rewardFame: 5,
        icon: '🎵',
    },
    {
        id: 'produce_ep',
        name: '💿 Produire un EP',
        description: 'Un groupe émergent veut produire un EP de 4 titres.',
        fameRequirement: 50,
        requiredFame: 50,
        moneyReward: 10000,
        rewardMoney: 10000,
        fameReward: 25,
        rewardFame: 25,
        icon: '💿',
    },
    {
        id: 'album_local',
        name: '🎼 Album pour Artiste Local',
        description: 'Un artiste local reconnu veut un album complet.',
        fameRequirement: 200,
        requiredFame: 200,
        moneyReward: 100000,
        rewardMoney: 100000,
        fameReward: 100,
        rewardFame: 100,
        icon: '🎼',
    },
    {
        id: 'master_star',
        name: '🌟 Masteriser pour une Star',
        description: 'Une star internationale veut que tu masterises son album.',
        fameRequirement: 1000,
        requiredFame: 1000,
        moneyReward: 1000000,
        rewardMoney: 1000000,
        fameReward: 500,
        rewardFame: 500,
        icon: '🌟',
    },
    {
        id: 'film_score',
        name: '🎬 Bande Originale de Film',
        description: 'Un réalisateur veut une bande originale pour son film.',
        fameRequirement: 5000,
        requiredFame: 5000,
        moneyReward: 10000000,
        rewardMoney: 10000000,
        fameReward: 2000,
        rewardFame: 2000,
        icon: '🎬',
    },
    {
        id: 'world_tour',
        name: '🌍 Tournée Mondiale',
        description: 'Un artiste mondial veut que tu sonorises sa tournée.',
        fameRequirement: 20000,
        requiredFame: 20000,
        moneyReward: 100000000,
        rewardMoney: 100000000,
        fameReward: 10000,
        rewardFame: 10000,
        icon: '🌍',
    },
    {
        id: 'legendary_album',
        name: '👑 Album Légendaire',
        description: 'Un album qui marquera l\'histoire de la musique.',
        fameRequirement: 100000,
        requiredFame: 100000,
        moneyReward: 1000000000,
        rewardMoney: 1000000000,
        fameReward: 50000,
        rewardFame: 50000,
        icon: '👑',
    },
    {
        id: 'music_empire',
        name: '🏛️ Empire Musical',
        description: 'Produis la bande originale d\'un empire médiatique.',
        fameRequirement: 500000,
        requiredFame: 500000,
        moneyReward: 10000000000,
        rewardMoney: 10000000000,
        fameReward: 250000,
        rewardFame: 250000,
        icon: '🏛️',
    },
];

/**
 * Récupère la définition d'un contrat par son ID.
 */
function getContractDef(id) {
    return CONTRACT_DEFS.find(c => c.id === id) || null;
}

/**
 * Vérifie si un contrat est débloqué (prérequis de renommée atteint).
 */
function isContractUnlocked(id) {
    const def = getContractDef(id);
    if (!def) return false;
    return GameState.resources.fame >= (def.fameRequirement || def.requiredFame || 0);
}

/**
 * Vérifie si le joueur peut accepter un contrat (débloqué et non encore complété).
 */
function canAcceptContract(id) {
    return isContractUnlocked(id) && !isContractCompleted(id);
}

/**
 * Vérifie si un contrat a déjà été complété.
 */
function isContractCompleted(id) {
    return GameState.contractsCompleted && GameState.contractsCompleted[id] === true;
}

/**
 * Accepte et complète un contrat.
 */
function completeContract(id) {
    const def = getContractDef(id);
    if (!def) return { success: false, reason: 'Contrat introuvable' };

    // Vérifie si le contrat est débloqué et pas déjà complété
    if (!isContractUnlocked(id)) return { success: false, reason: 'Renommée insuffisante' };
    if (isContractCompleted(id)) return { success: false, reason: 'Contrat déjà complété' };

    // Applique les récompenses
    const finalMoney = def.moneyReward || def.rewardMoney;
    const finalFame = applyPrestigeFame(def.fameReward || def.rewardFame);

    addMoney(finalMoney);
    addFame(finalFame);

    // Marque le contrat comme complété
    if (!GameState.contractsCompleted) GameState.contractsCompleted = {};
    GameState.contractsCompleted[id] = true;
    GameState.stats.contractsCompleted = (GameState.stats.contractsCompleted || 0) + 1;

    return {
        success: true,
        contract: def,
        moneyReward: finalMoney,
        fameReward: finalFame
    };
}

/**
 * Récupère le nombre de contrats complétés.
 */
function getCompletedContractsCount() {
    return GameState.stats.contractsCompleted || 0;
}

