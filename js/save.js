/**
 * save.js - Sauvegarde, chargement, export/import Base64 et gains hors-ligne étendus
 */

const SAVE_KEY = 'sound_engineer_idle_save_v4';
const AUTO_SAVE_INTERVAL = 20000; // 20 secondes

/**
 * Sauvegarde l'état du jeu dans localStorage.
 */
function saveGame() {
    try {
        GameState.lastUpdate = Date.now();
        const saveData = JSON.stringify(GameState);
        localStorage.setItem(SAVE_KEY, saveData);
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return false;
    }
}

/**
 * Charge l'état du jeu depuis localStorage.
 */
function loadGame() {
    try {
        let saveData = localStorage.getItem(SAVE_KEY);
        if (!saveData) saveData = localStorage.getItem('sound_engineer_idle_save_v3');
        if (!saveData) saveData = localStorage.getItem('sound_engineer_idle_save');
        if (!saveData) return false;

        const parsed = JSON.parse(saveData);
        mergeGameState(parsed);
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        return false;
    }
}

/**
 * Exporte la sauvegarde actuelle en chaîne de caractères Base64.
 */
function exportSaveString() {
    GameState.lastUpdate = Date.now();
    const jsonStr = JSON.stringify(GameState);
    return btoa(unescape(encodeURIComponent(jsonStr)));
}

/**
 * Importe une sauvegarde depuis une chaîne de caractères Base64.
 */
function importSaveString(base64Str) {
    try {
        if (!base64Str || typeof base64Str !== 'string') {
            return { success: false, reason: 'Chaîne de sauvegarde invalide.' };
        }
        const jsonStr = decodeURIComponent(escape(atob(base64Str.trim())));
        const parsed = JSON.parse(jsonStr);

        if (!parsed.resources || typeof parsed.resources.money === 'undefined') {
            return { success: false, reason: 'Format de sauvegarde incompatible.' };
        }

        mergeGameState(parsed);
        saveGame();
        updateAllDisplay();
        return { success: true };
    } catch (e) {
        console.error('Erreur import sauvegarde:', e);
        return { success: false, reason: 'Impossible de décoder cette clé de sauvegarde.' };
    }
}

/**
 * Fusionne les données chargées avec l'état actuel.
 */
function mergeGameState(loaded) {
    if (loaded.resources) {
        GameState.resources = { ...GameState.resources, ...loaded.resources };
    }
    if (loaded.stats) {
        GameState.stats = { ...GameState.stats, ...loaded.stats };
    }
    if (loaded.equipment) {
        GameState.equipment = loaded.equipment;
    }
    if (loaded.upgrades) {
        GameState.upgrades = loaded.upgrades;
    }
    if (loaded.achievementsUnlocked) {
        GameState.achievementsUnlocked = loaded.achievementsUnlocked;
    }
    if (loaded.sequencer) {
        GameState.sequencer = {
            ...GameState.sequencer,
            ...loaded.sequencer,
            tracks: { ...(GameState.sequencer ? GameState.sequencer.tracks : {}), ...(loaded.sequencer.tracks || {}) },
            stepNotes: { ...(GameState.sequencer ? GameState.sequencer.stepNotes : {}), ...(loaded.sequencer.stepNotes || {}) },
            trackSettings: { ...(GameState.sequencer ? GameState.sequencer.trackSettings : {}), ...(loaded.sequencer.trackSettings || {}) }
        };
    }
    if (loaded.padController) {
        GameState.padController = {
            ...GameState.padController,
            ...loaded.padController,
            customNotes: {
                ...(GameState.padController ? GameState.padController.customNotes : {}),
                ...(loaded.padController.customNotes || {})
            }
        };
    }
    if (loaded.quests) {
        GameState.quests = {
            ...GameState.quests,
            ...loaded.quests,
            perks: { ...(GameState.quests.perks || {}), ...(loaded.quests.perks || {}) }
        };
    }
    if (loaded.secretCodes) {
        GameState.secretCodes = {
            ...GameState.secretCodes,
            ...loaded.secretCodes,
            redeemed: { ...(GameState.secretCodes.redeemed || {}), ...(loaded.secretCodes.redeemed || {}) }
        };
    }
    if (loaded.prestige) {
        GameState.prestige = {
            ...GameState.prestige,
            ...loaded.prestige,
            tree: { ...GameState.prestige.tree, ...(loaded.prestige.tree || {}) }
        };
    }
    if (loaded.settings) {
        GameState.settings = {
            ...GameState.settings,
            ...loaded.settings
        };
    }
    if (loaded.lastUpdate) {
        GameState.lastUpdate = loaded.lastUpdate;
    }
    if (loaded.buyMultiplier) {
        GameState.buyMultiplier = loaded.buyMultiplier;
    }

    if (typeof recalculateMaxEnergy === 'function') {
        recalculateMaxEnergy();
    }
}

/**
 * Supprime la sauvegarde locale.
 */
function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('sound_engineer_idle_save_v3');
    localStorage.removeItem('sound_engineer_idle_save');
}

/**
 * Calcule les gains hors-ligne (jusqu'à 12 heures).
 */
function calculateOfflineGains() {
    const now = Date.now();
    const elapsed = (now - (GameState.lastUpdate || now)) / 1000;
    const maxOfflineTime = 12 * 3600; // 12 heures
    const effectiveTime = Math.min(elapsed, maxOfflineTime);

    if (effectiveTime < 5) return null;

    const passiveRate = getPassiveProduction();
    const moneyGained = passiveRate * effectiveTime;

    return {
        time: effectiveTime,
        money: moneyGained,
    };
}

/**
 * Applique les gains hors-ligne au démarrage.
 */
function applyOfflineGains() {
    const gains = calculateOfflineGains();
    if (gains && gains.money > 0) {
        addMoney(gains.money);
        return gains;
    }
    return null;
}

/**
 * Démarre la boucle de sauvegarde automatique.
 */
function startAutoSave() {
    setInterval(() => {
        saveGame();
        if (typeof updateSaveStatus === 'function') {
            updateSaveStatus('💾 Sauvegarde auto : ' + new Date().toLocaleTimeString());
        }
    }, AUTO_SAVE_INTERVAL);
}
