/**
 * albums.js - Système de Discographie & Sorties Musicales
 * 
 * Permet de produire des Singles, EPs et Albums dans divers genres.
 * Les morceaux génèrent des revenus passifs de streaming (Royalties) continus,
 * des gains de renommée et peuvent obtenir des certifications (Disque d'Or, Platine, Diamant).
 */

// Définition des formats de sortie
const RELEASE_FORMATS = [
    {
        id: 'single',
        name: '🎵 Single Hit (1 Titre)',
        costEnergy: 30,
        costMoney: 500,
        minFame: 5,
        baseStreamsPerSec: 10,
        baseRoyaltiesPerSec: 5,
        fameReward: 3,
        description: 'Idéal pour se faire connaître sur les plateformes de streaming.'
    },
    {
        id: 'ep',
        name: '💿 EP Studio (4 Titres)',
        costEnergy: 60,
        costMoney: 10000,
        minFame: 50,
        baseStreamsPerSec: 80,
        baseRoyaltiesPerSec: 50,
        fameReward: 25,
        description: 'Un mini-album pour consolider votre communauté de fans.'
    },
    {
        id: 'album',
        name: '🎼 Album Studio Complet (12 Titres)',
        costEnergy: 90,
        costMoney: 250000,
        minFame: 300,
        baseStreamsPerSec: 800,
        baseRoyaltiesPerSec: 600,
        fameReward: 200,
        description: 'Une œuvre majeure qui tourne en boucle sur les radios mondiales.'
    },
    {
        id: 'world_tour_record',
        name: '👑 Album Live Tournée Mondiale',
        costEnergy: 100,
        costMoney: 10000000,
        minFame: 2500,
        baseStreamsPerSec: 15000,
        baseRoyaltiesPerSec: 12000,
        fameReward: 2500,
        description: 'Enregistré devant 80 000 personnes en délire.'
    }
];

// Genres musicaux disponibles
const MUSIC_GENRES = [
    { id: 'synthwave', name: '🌆 Synthwave 80s', icon: '🕶️', royaltyBonus: 1.2 },
    { id: 'lofi', name: '☕ Lo-Fi Hip Hop', icon: '🎧', royaltyBonus: 1.0 },
    { id: 'french_house', name: '🥖 French Touch', icon: '🎛️', royaltyBonus: 1.35 },
    { id: 'cyberpunk', name: '🤖 Cyberpunk Techno', icon: '⚡', royaltyBonus: 1.5 },
    { id: 'trap', name: '🔥 Trap / Hip-Hop', icon: '💎', royaltyBonus: 1.4 },
    { id: 'future_bass', name: '🌌 Future Bass EDM', icon: '🚀', royaltyBonus: 1.6 }
];

// Banques de mots thématiques par genre pour la génération procédurale
const GENRE_LEXICONS = {
    synthwave: {
        adjs: ['Neon', 'Outrun', 'Cyber', 'Midnight', 'Retro', 'Electric', 'Chrome', 'Hyper', 'Sunset', 'Laser', 'Turbo', 'Analog'],
        nouns: ['Overdrive', 'Highway', 'Rider', 'Dreams', 'Horizon', 'Cruise', 'Arcade', 'Velocity', 'Grid', 'Frequency', 'Nightfall', 'Mirage']
    },
    lofi: {
        adjs: ['Rainy', 'Cozy', 'Coffee', 'Warm', 'Dusty', 'Vintage', 'Autumn', 'Lazy', 'Midnight', 'Chill', 'Silent', 'Golden'],
        nouns: ['Memories', 'Breeze', 'Thoughts', 'Corner', 'Window', 'Lo-Fi Tape', 'Nostalgia', 'Afternoon', 'Study Session', 'Vibes', 'Echoes', 'Blanket']
    },
    french_house: {
        adjs: ['Disco', 'Funky', 'French', 'Filter', 'Stardust', 'Rouge', 'Velvet', 'Groovy', 'Touch', 'Modjo', 'Solar', 'Club'],
        nouns: ['Sensation', 'Nightclub', 'Paradiso', 'Voyage', 'Feelings', 'Bassline', 'Elegance', 'Rhythm', 'Euphoria', 'Alliance', 'Affair', 'Passion']
    },
    cyberpunk: {
        adjs: ['Neural', 'Matrix', 'Glitch', 'Acid', 'Sub-Zero', 'Synthetic', 'Dark', 'Bio-Mech', 'Augmented', 'Dystopian', 'Quantum', 'Terminal'],
        nouns: ['Protocol', 'Rebellion', 'Cyberdeck', 'Overload', 'Syndicate', 'Corridor', 'Sub-Bass', 'Signal', 'Network', 'Breach', 'System', 'Invasion']
    },
    trap: {
        adjs: ['Savage', '808', 'Drip', 'Golden', 'Diamond', 'Heavy', 'Strictly', 'No Cap', 'Platinum', 'Underground', 'Loaded', 'Flex'],
        nouns: ['Empire', 'Mafia', 'Season', 'Drop', 'Zone', 'Banger', 'Legacy', 'Streets', 'Crown', 'Anthem', 'Heat', 'Dynasty']
    },
    future_bass: {
        adjs: ['Starlight', 'Galactic', 'Kawaii', 'Cosmic', 'Aura', 'Celestial', 'Supernova', 'Infinite', 'Prism', 'Crystal', 'Euphoric', 'Astral'],
        nouns: ['Dimension', 'Odyssey', 'Explosion', 'Fantasy', 'Vibrations', 'Universe', 'Melody', 'Spectrum', 'Gravity', 'Eclipse', 'Sanctuary', 'Journey']
    }
};

/**
 * Génère un titre aléatoire percutant adapté au genre sélectionné.
 */
function generateRandomAlbumTitle(genreId = 'synthwave') {
    const lex = GENRE_LEXICONS[genreId] || GENRE_LEXICONS.synthwave;
    const adj = lex.adjs[Math.floor(Math.random() * lex.adjs.length)];
    const noun = lex.nouns[Math.floor(Math.random() * lex.nouns.length)];
    return `${adj} ${noun}`;
}

/**
 * Enregistre et publie un album ou single avec support de titre personnalisé.
 */
function releaseRecord(formatId, genreId, customTitle = '') {
    const format = RELEASE_FORMATS.find(f => f.id === formatId);
    const genre = MUSIC_GENRES.find(g => g.id === genreId) || MUSIC_GENRES[0];

    if (!format) return { success: false, reason: 'Format introuvable' };

    // Vérifie les prérequis
    if (GameState.resources.fame < format.minFame) {
        return { success: false, reason: `Renommée insuffisante (${format.minFame} ⭐ requise)` };
    }
    if (!hasEnoughEnergy(format.costEnergy)) {
        return { success: false, reason: `Énergie insuffisante (${format.costEnergy} ⚡ requis)` };
    }
    const realCost = applyPrestigeCost(format.costMoney);
    if (!hasEnoughMoney(realCost)) {
        return { success: false, reason: `Fonds insuffisants (${formatNumber(realCost)} $ requis)` };
    }

    // Dépense
    spendEnergy(format.costEnergy);
    spendMoney(realCost);

    // Calcul de la note critique (entre 7.0 et 10.0)
    const reviewScore = (7.0 + Math.random() * 2.9 + (GameState.resources.fame > 1000 ? 0.1 : 0)).toFixed(1);

    // Calcul des royalties de base de ce projet
    const fameMult = 1 + Math.log10(Math.max(1, GameState.resources.fame)) * 0.5;
    const masteringBonus = (GameState.mastering && GameState.mastering.activeBonus) ? GameState.mastering.activeBonus : 1.0;
    const baseProjectRoyalties = format.baseRoyaltiesPerSec * genre.royaltyBonus * fameMult * masteringBonus;

    // Détermination de la certification
    let plaque = '💿 Standard';
    if (reviewScore >= 9.5) plaque = '💎 Disque de Diamant';
    else if (reviewScore >= 9.0) plaque = '👑 Disque de Platine';
    else if (reviewScore >= 8.2) plaque = '🥇 Disque d\'Or';

    const finalTitle = (customTitle && customTitle.trim().length > 0) ? customTitle.trim() : generateRandomAlbumTitle(genre.id);

    const album = {
        id: 'album_' + Date.now(),
        title: finalTitle,
        formatName: format.name,
        genreName: `${genre.icon} ${genre.name}`,
        reviewScore: reviewScore,
        plaque: plaque,
        masteringBonus: masteringBonus,
        baseRoyaltiesPerSec: baseProjectRoyalties,
        royaltiesPerSec: baseProjectRoyalties,
        releaseDate: new Date().toLocaleTimeString(),
    };

    if (!GameState.discography) {
        GameState.discography = { albums: [], totalStreams: 0, royaltiesPerSec: 0 };
    }

    GameState.discography.albums.unshift(album);
    // Limite l'historique affiché à 30 albums
    if (GameState.discography.albums.length > 30) {
        GameState.discography.albums.pop();
    }

    // Récompense en renommée
    addFame(applyPrestigeFame(format.fameReward));
    GameState.stats.albumsReleased = (GameState.stats.albumsReleased || 0) + 1;

    // Ajoute des streams cumulés
    const newStreams = format.baseStreamsPerSec * 25000 * (1 + parseFloat(reviewScore) * 0.1);
    GameState.discography.totalStreams = (GameState.discography.totalStreams || 0) + newStreams;

    // Enregistrement dans le Billboard Top 50 mondial
    if (typeof registerTrackInBillboard === 'function') {
        registerTrackInBillboard(album.title, genre.name, newStreams);
    }

    // Progression de quête
    if (typeof advanceQuestProgress === 'function') {
        advanceQuestProgress('release_hit', 1);
    }

    // Recalcule le total des royalties passives
    recalculateTotalRoyalties();

    return {
        success: true,
        album: album
    };
}

/**
 * Recalcule la somme des royalties générées par la discographie.
 */
function recalculateTotalRoyalties() {
    if (!GameState.discography) return 0;
    if (!GameState.discography.albums) GameState.discography.albums = [];

    const upgradeMult = typeof getUpgradeRoyaltiesMultiplier === 'function' ? getUpgradeRoyaltiesMultiplier() : 1.0;
    const prestigeBonuses = typeof getPrestigeBonuses === 'function' ? getPrestigeBonuses() : null;
    const prestigeRoyaltyMult = (prestigeBonuses && prestigeBonuses.royaltiesMultiplier) ? prestigeBonuses.royaltiesMultiplier : 1.0;
    const totalMult = upgradeMult * prestigeRoyaltyMult;

    let totalBase = 0;
    for (const alb of GameState.discography.albums) {
        if (!alb.baseRoyaltiesPerSec && alb.royaltiesPerSec) {
            alb.baseRoyaltiesPerSec = alb.royaltiesPerSec;
        }
        totalBase += (alb.baseRoyaltiesPerSec || 0);
        alb.royaltiesPerSec = (alb.baseRoyaltiesPerSec || 0) * totalMult;
    }

    GameState.discography.royaltiesPerSec = totalBase * totalMult;
    return GameState.discography.royaltiesPerSec;
}

/**
 * Récupère le total des royalties passives par seconde.
 */
function getTotalAlbumRoyalties() {
    return recalculateTotalRoyalties();
}
