/**
 * quests.js - Quêtes Quotidiennes, Boutique de Cassettes Dorées & Terminal de Codes Secrets
 * 
 * Offre des objectifs stimulants renouvelés, une devise rare (Cassettes Dorées 📼)
 * pour des avantages permanents, et une console de codes secrets de producteur.
 */

// Définition des modèles de quêtes
const QUEST_TEMPLATES = [
    {
        id: 'mix_tracks',
        title: '🎛️ Session de Mixage Intensive',
        description: 'Mixez 25 morceaux manuellement à la platine.',
        target: 25,
        unit: 'morceaux',
        reward: { moneyMult: 30, fame: 15, cassettes: 1 }
    },
    {
        id: 'seq_beats',
        title: '🎹 Beatmaker en Action',
        description: 'Jouez 40 pas sur le séquenceur 16-Pas.',
        target: 40,
        unit: 'pas',
        reward: { moneyMult: 25, fame: 10, cassettes: 1 }
    },
    {
        id: 'artist_missions',
        title: '🎤 Manager de Choc',
        description: 'Complétez 2 missions avec vos artistes signés.',
        target: 2,
        unit: 'missions',
        reward: { moneyMult: 40, fame: 20, cassettes: 1 }
    },
    {
        id: 'frenzy_mode',
        title: '🔥 Drop The Bass',
        description: 'Déclenchez 1 mode FRENZY à 100% de Hype.',
        target: 1,
        unit: 'frenzy',
        reward: { moneyMult: 50, fame: 30, cassettes: 2 }
    },
    {
        id: 'release_hit',
        title: '💿 Producteur Prolifique',
        description: 'Enregistrez et distribuez 1 nouveau projet musical.',
        target: 1,
        unit: 'projet',
        reward: { moneyMult: 35, fame: 25, cassettes: 1 }
    }
];

// Avantages déblocables dans la Boutique de Cassettes Dorées
const CASSETTE_PERKS = [
    {
        id: 'auto_mixer',
        name: '🎧 DJ Virtuel Auto-Mixer IA',
        cost: 4,
        icon: '🎧',
        description: 'Automatisation de studio : effectue un **mixage automatique** dès que votre énergie est pleine (100%).',
        apply: () => {
            if (!GameState.settings) GameState.settings = {};
            GameState.settings.autoMixer = true;
        }
    },
    {
        id: 'label_expansion',
        name: '🏢 Extension de Label Major',
        cost: 5,
        icon: '🏢',
        description: 'Agrandit votre label : permet de signer jusqu\'à **6 artistes simultanés** (au lieu de 4).',
        apply: () => {
            if (!GameState.artists) initArtists();
            GameState.artists.maxSigned = 6;
        }
    },
    {
        id: 'master_tape',
        name: '📼 Bande Master 2 Pouces Studer',
        cost: 3,
        icon: '📼',
        description: 'Qualité sonore analogique incomparable : **+20% de Production globale permanente**.',
        apply: () => {}
    },
    {
        id: 'energy_reactor',
        name: '⚡ Générateur Haute Tension',
        cost: 5,
        icon: '⚡',
        description: '**+50 Énergie Max** et régénération d\'énergie 2x plus rapide.',
        apply: () => {
            if (typeof recalculateMaxEnergy === 'function') {
                recalculateMaxEnergy();
            }
        }
    },
    {
        id: 'golden_magnet',
        name: '🧲 Aimant à Vinyles Dorés',
        cost: 6,
        icon: '🧲',
        description: 'Les Vinyles Dorés flottants apparaissent **deux fois plus souvent**.',
        apply: () => {}
    },
    {
        id: 'neon_deluxe',
        name: '🌈 Éclairage Studio Ambilight RGB',
        cost: 2,
        icon: '🌈',
        description: 'Ambiance visuelle ultra stylée avec reflets lumineux animés au tempo.',
        apply: () => {
            if (typeof document !== 'undefined' && document.body) {
                document.body.classList.add('neon-deluxe-active');
            }
        }
    }
];

// Codes Secrets de Producteur (Équilibrés pour rester des easter eggs stimulants)
const SECRET_CODES = {
    '808MAFIA': {
        name: '808 Mafia Drop',
        description: 'Pack de samples 808 : 2 min de production passive (min. 150 $) + 1 Cassette Dorée !',
        action: () => {
            const passive = typeof getTotalPassiveProduction === 'function' ? getTotalPassiveProduction() : 0;
            const reward = Math.max(150, Math.floor(passive * 120));
            addMoney(reward);
            GameState.resources.goldenCassettes = (GameState.resources.goldenCassettes || 0) + 1;
        }
    },
    'DAFT': {
        name: 'French Touch Revolution',
        description: 'Mode FRENZY immédiat + 5 ⭐ de Renommée !',
        action: () => {
            addFame(5);
            if (typeof triggerFrenzyMode === 'function') triggerFrenzyMode();
        }
    },
    'ANALOG': {
        name: 'Chaleur des Lampes Vintage',
        description: 'Énergie restaurée à 100% + Boost Mastering x1.5 pendant 60s !',
        action: () => {
            addEnergy(GameState.resources.maxEnergy || 100);
            if (GameState.mastering) {
                GameState.mastering.activeBonus = 1.5;
                GameState.mastering.bonusTimeLeft = 60;
            }
        }
    },
    'GRAMMY': {
        name: 'Golden Trophy Winner',
        description: 'Trophée d\'Honneur : +10 ⭐ de Renommée et 1 Cassette Dorée !',
        action: () => {
            addFame(10);
            GameState.resources.goldenCassettes = (GameState.resources.goldenCassettes || 0) + 1;
        }
    },
    'KONAMI': {
        name: 'Retro 8-Bit Power',
        description: 'Easter Egg rétro : 1 min de production (min. 50 $) + 50 ⚡ Énergie !',
        action: () => {
            const passive = typeof getTotalPassiveProduction === 'function' ? getTotalPassiveProduction() : 0;
            const reward = Math.max(50, Math.floor(passive * 60));
            addMoney(reward);
            addEnergy(50);
        }
    }
};

/**
 * Initialise les quêtes quotidiennes.
 */
function initQuests() {
    if (!GameState.quests) {
        GameState.quests = {
            daily: [],
            lastResetDay: 0,
            perks: {}
        };
    }

    if (GameState.quests.perks && GameState.quests.perks.neon_deluxe) {
        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.add('neon-deluxe-active');
        }
    }

    const currentDay = Math.floor(Date.now() / (24 * 3600 * 1000));
    if (GameState.quests.lastResetDay !== currentDay || !GameState.quests.daily || GameState.quests.daily.length === 0) {
        generateDailyQuests();
        GameState.quests.lastResetDay = currentDay;
    }
}

/**
 * Génère 3 quêtes du jour.
 */
function generateDailyQuests() {
    const shuffled = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    GameState.quests.daily = selected.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        target: q.target,
        current: 0,
        unit: q.unit,
        completed: false,
        reward: q.reward
    }));
}

/**
 * Fait progresser une quête.
 */
function advanceQuestProgress(questId, amount = 1) {
    if (!GameState.quests || !GameState.quests.daily) return;

    for (const q of GameState.quests.daily) {
        if (q.id === questId && !q.completed) {
            q.current = Math.min(q.target, q.current + amount);
            if (q.current >= q.target) {
                completeQuest(q);
            }
            if (typeof updateQuestsDisplay === 'function') {
                updateQuestsDisplay();
            }
        }
    }
}

/**
 * Valide et attribue les récompenses d'une quête.
 */
function completeQuest(quest) {
    quest.completed = true;

    const passive = typeof getPassiveProduction === 'function' ? getPassiveProduction() : 50;
    const rewardMoney = Math.max(500, passive * (quest.reward.moneyMult || 30));
    const rewardFame = quest.reward.fame || 10;
    const rewardCassettes = quest.reward.cassettes || 1;

    addMoney(rewardMoney);
    addFame(rewardFame);
    GameState.resources.goldenCassettes = (GameState.resources.goldenCassettes || 0) + rewardCassettes;
    GameState.stats.questsCompleted = (GameState.stats.questsCompleted || 0) + 1;

    if (typeof playQuestCompleteSound === 'function') {
        playQuestCompleteSound();
    }

    if (typeof spawnFloatingText === 'function') {
        const header = document.getElementById('header');
        spawnFloatingText(`🎯 QUÊTE ACCOMPLIE : ${quest.title} (+${formatNumber(rewardMoney)} $ • +${rewardCassettes} 📼) !`, header, true);
    }

    updateResourceDisplay();
}

/**
 * Achète un avantage avec des Cassettes Dorées.
 */
function buyCassettePerk(perkId) {
    const perk = CASSETTE_PERKS.find(p => p.id === perkId);
    if (!perk) return { success: false, reason: 'Avantage introuvable' };

    if (!GameState.quests.perks) GameState.quests.perks = {};
    if (GameState.quests.perks[perkId]) {
        return { success: false, reason: 'Cet avantage est déjà débloqué !' };
    }

    const availableCassettes = GameState.resources.goldenCassettes || 0;
    if (availableCassettes < perk.cost) {
        return { success: false, reason: `Cassettes Dorées insuffisantes (${perk.cost} 📼 requises)` };
    }

    GameState.resources.goldenCassettes -= perk.cost;
    GameState.quests.perks[perkId] = true;
    perk.apply();

    if (typeof playTrophySound === 'function') {
        playTrophySound();
    }

    if (typeof updateQuestsDisplay === 'function') {
        updateQuestsDisplay();
    }
    updateResourceDisplay();

    return { success: true };
}

/**
 * Tente d'utiliser un code secret de producteur.
 */
function redeemSecretCode(inputCode) {
    if (!inputCode) return { success: false, reason: 'Veuillez saisir un code' };
    const code = inputCode.trim().toUpperCase();

    if (!SECRET_CODES[code]) {
        return { success: false, reason: 'Code secret inconnu ou expiré !' };
    }

    if (!GameState.secretCodes) GameState.secretCodes = { redeemed: {} };
    if (GameState.secretCodes.redeemed[code]) {
        return { success: false, reason: 'Ce code a déjà été utilisé sur cette sauvegarde !' };
    }

    GameState.secretCodes.redeemed[code] = Date.now();
    const entry = SECRET_CODES[code];
    entry.action();

    if (typeof playSecretCodeSound === 'function') {
        playSecretCodeSound();
    }

    if (typeof spawnFloatingText === 'function') {
        const header = document.getElementById('header');
        spawnFloatingText(`🎁 CODE ACTIVÉ : ${entry.name} !`, header, true);
    }

    updateResourceDisplay();
    updateProductionDisplay();

    return { success: true, name: entry.name, description: entry.description };
}
