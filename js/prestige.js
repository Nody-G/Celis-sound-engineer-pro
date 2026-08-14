/**
 * prestige.js - Système de Prestige 2.0 & Empire Musical
 * 
 * Permet de refondre le studio pour gagner des points de prestige permanents
 * et les dépenser dans 3 arbres de spécialisation majeurs :
 * 1. Maîtrise du Son (Production passive & équipements)
 * 2. Empire Business (Réduction des coûts & Royalties)
 * 3. Hype & Overdrive (Durée Frenzy & Gains manuels)
 */

// Seuil minimum de renommée pour déclencher le prestige
const PRESTIGE_MIN_FAME = 100;

/**
 * Calcule les NOUVEAUX points de prestige à gagner.
 * Formule : max(0, floor(sqrt(lifetimeFame / 100)) - pointsDéjàRéclamés)
 */
function calculatePrestigePoints() {
    if (!GameState.prestige) return 0;
    const lifetimeFame = GameState.prestige.lifetimeFame || 0;
    if (lifetimeFame < PRESTIGE_MIN_FAME) return 0;

    const totalEarnable = Math.floor(Math.sqrt(lifetimeFame / 100));
    const alreadyClaimed = (GameState.prestige.points || 0) + (GameState.prestige.spentPoints || 0);

    return Math.max(0, totalEarnable - alreadyClaimed);
}

/**
 * Vérifie si le prestige est disponible (au moins 1 nouveau point à débloquer).
 */
function isPrestigeAvailable() {
    return calculatePrestigePoints() > 0;
}

/**
 * Alias de isPrestigeAvailable pour l'interface.
 */
function canPerformPrestige() {
    return isPrestigeAvailable();
}

/**
 * Effectue un prestige complet.
 */
function performPrestige() {
    if (!isPrestigeAvailable()) return null;

    const pointsEarned = calculatePrestigePoints();
    if (pointsEarned <= 0) return null;

    GameState.prestige.points += pointsEarned;
    GameState.prestige.totalPrestiges++;

    // Réinitialise tout le jeu tout en conservant les points et compétences
    resetForPrestige();

    return {
        pointsEarned: pointsEarned,
        totalPoints: GameState.prestige.points,
    };
}

/**
 * Dépense 1 point de prestige dans une compétence de l'arbre.
 */
function upgradePrestigeSkill(skillKey) {
    if (!GameState.prestige || GameState.prestige.points <= 0) return false;
    if (!GameState.prestige.tree || GameState.prestige.tree[skillKey] === undefined) return false;

    GameState.prestige.points--;
    GameState.prestige.spentPoints = (GameState.prestige.spentPoints || 0) + 1;
    GameState.prestige.tree[skillKey]++;

    return true;
}

function getPrestigePoints() {
    return GameState.prestige.points;
}

function getPrestigeCount() {
    return GameState.prestige.totalPrestiges;
}

function getPendingPrestigePoints() {
    return calculatePrestigePoints();
}
