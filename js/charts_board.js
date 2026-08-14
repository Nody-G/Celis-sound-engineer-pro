/**
 * charts_board.js - Hit-Parade Billboard Top 50 & Galerie des Trophées
 * 
 * Simule le classement musical mondial hebdomadaire.
 * Vos albums et singles se battent pour la 1ère place contre des artistes rivaux.
 * Débloquez de véritables Disques d'Or, de Platine et de Diamant accrochés
 * au mur du studio pour décupler votre empire musical.
 */

// Définition des Trophées et Certifications
const TROPHIES_DEFS = [
    {
        id: 'silver_disc',
        name: '🥈 Disque d\'Argent (Top 20)',
        icon: '🥈',
        description: 'Classer un single ou album dans le Top 20 mondial.',
        bonusText: '+15% Production studio permanente',
        check: () => (GameState.billboard && GameState.billboard.myPeakRank <= 20)
    },
    {
        id: 'gold_disc',
        name: '🥇 Disque d\'Or (Top 10)',
        icon: '🥇',
        description: 'Atteindre le Top 10 mondial du Billboard.',
        bonusText: '+30% Production studio permanente',
        check: () => (GameState.billboard && GameState.billboard.myPeakRank <= 10)
    },
    {
        id: 'plat_disc',
        name: '💿 Disque de Platine (Top 3)',
        icon: '💿',
        description: 'Atteindre le podium (Top 3) mondial.',
        bonusText: '+50% Production studio permanente',
        check: () => (GameState.billboard && GameState.billboard.myPeakRank <= 3)
    },
    {
        id: 'diam_disc',
        name: '💎 Disque de Diamant (#1 Mondial)',
        icon: '💎',
        description: 'Conquérir la 1ère place absolue du Billboard Top 50 !',
        bonusText: '+100% Production studio permanente (x2)',
        check: () => (GameState.billboard && GameState.billboard.myPeakRank === 1)
    },
    {
        id: 'streaming_billion',
        name: '🌌 Club des 100M Streams',
        icon: '🎧',
        description: 'Cumuler plus de 100 millions d\'écoutes sur vos albums.',
        bonusText: '+50% Royalties de streaming permanentes',
        check: () => (GameState.discography && GameState.discography.totalStreams >= 100000000)
    },
    {
        id: 'grammy_win',
        name: '🏆 Grammy Award de l\'Ingé Son de l\'Année',
        icon: '🏆',
        description: 'Sortir un album avec plus de 90% d\'alignement de mastering.',
        bonusText: '+150% Production globale permanente',
        check: () => {
            if (!GameState.discography || !GameState.discography.albums) return false;
            return GameState.discography.albums.some(a => (a.masteringBonus || 1) >= 2.0);
        }
    }
];

// Noms de hits rivaux pour peupler le Billboard
const RIVAL_HITS = [
    { title: 'Cyber Highway', artist: 'The Synth Lords', streams: 85000000 },
    { title: 'Neural Drop', artist: 'Lil Algorithm', streams: 72000000 },
    { title: 'Around The Grid', artist: 'Daft Unit 01', streams: 64000000 },
    { title: 'Midnight Starlight', artist: 'Aura Diva', streams: 58000000 },
    { title: '808 Overkill', artist: 'Metro Trap', streams: 51000000 },
    { title: 'French Touch Love', artist: 'Cassius Beat', streams: 47000000 },
    { title: 'Analog Sunrise', artist: 'Moog Master', streams: 42000000 },
    { title: 'Drift in Tokyo', artist: 'Kavinsky Vibe', streams: 38000000 },
    { title: 'Neon Reflections', artist: 'Chvrches Clone', streams: 33000000 },
    { title: 'Drop The Voltage', artist: 'Skrillex Bot', streams: 29000000 },
    { title: 'Coffee & Rain', artist: 'Lo-Fi Chill Hop', streams: 25000000 },
    { title: 'Solar Flare', artist: 'Space Disco', streams: 21000000 },
    { title: 'Bassline Monster', artist: 'Subwoofer King', streams: 18000000 },
    { title: 'Velvet Dream', artist: 'Sade Soul AI', streams: 15000000 },
    { title: 'Virtual Hug', artist: 'Vaporwave 95', streams: 12000000 },
    { title: 'Hyperpop Chaos', artist: '1000 Gecs', streams: 9500000 },
    { title: 'Acoustic Soul', artist: 'Ed Sheeran AI', streams: 8000000 },
    { title: 'Acid Techno Night', artist: 'Berghain Resident', streams: 6500000 },
    { title: 'Deep Ocean Sub', artist: 'Ambient Chill', streams: 5000000 },
    { title: 'Future Funk Party', artist: 'Yung Bae Jr', streams: 4000000 }
];

let billboardSimTimer = 0;

/**
 * Initialise le système de Billboard.
 */
function initBillboard() {
    if (!GameState.billboard) {
        GameState.billboard = {
            chart: [],
            week: 1,
            myPeakRank: 50,
            trophies: {}
        };
    }
    if (!GameState.billboard.chart || GameState.billboard.chart.length === 0) {
        generateInitialChart();
    }
}

/**
 * Génère le classement initial.
 */
function generateInitialChart() {
    const chart = [];
    RIVAL_HITS.forEach((h, idx) => {
        chart.push({
            rank: idx + 1,
            lastRank: idx + 1,
            title: h.title,
            artist: h.artist,
            streams: h.streams,
            isPlayer: false
        });
    });
    GameState.billboard.chart = chart;
}

/**
 * Insère un nouvel album/single du joueur dans le Billboard.
 */
function registerTrackInBillboard(albumTitle, genreName, streamsInitial) {
    if (!GameState.billboard) initBillboard();

    const chart = GameState.billboard.chart;
    // Score d'impact basé sur la renommée actuelle
    const impactStreams = streamsInitial * (1 + (GameState.resources.fame / 100));

    const playerEntry = {
        rank: 50,
        lastRank: 50,
        title: albumTitle,
        artist: '⭐ VOTRE STUDIO',
        streams: impactStreams,
        isPlayer: true
    };

    chart.push(playerEntry);
    sortAndRankBillboard();
}

/**
 * Trie et recalcule les rangs du Billboard.
 */
function sortAndRankBillboard() {
    if (!GameState.billboard || !GameState.billboard.chart) return;

    // Simulation de légères fluctuations des streams rivaux
    GameState.billboard.chart.forEach(item => {
        if (!item.isPlayer) {
            item.streams += Math.floor(Math.random() * 200000 - 80000);
        } else {
            // Le joueur gagne des streams selon sa renommée
            item.streams += Math.floor(GameState.resources.fame * 1000 + 50000);
        }
    });

    // Tri par streams décroissants
    GameState.billboard.chart.sort((a, b) => b.streams - a.streams);

    // Limitation au Top 20 pour la clarté
    GameState.billboard.chart = GameState.billboard.chart.slice(0, 20);

    // Attribution des rangs
    let bestPlayerRank = 50;
    GameState.billboard.chart.forEach((item, idx) => {
        item.lastRank = item.rank || (idx + 1);
        item.rank = idx + 1;
        if (item.isPlayer && item.rank < bestPlayerRank) {
            bestPlayerRank = item.rank;
        }
    });

    if (bestPlayerRank < GameState.billboard.myPeakRank) {
        GameState.billboard.myPeakRank = bestPlayerRank;
    }

    GameState.billboard.week = (GameState.billboard.week || 1) + 1;
    checkTrophies();
}

/**
 * Vérifie et débloque les nouveaux trophées de certification.
 */
function checkTrophies() {
    if (!GameState.billboard) return;
    if (!GameState.billboard.trophies) GameState.billboard.trophies = {};

    TROPHIES_DEFS.forEach(t => {
        if (!GameState.billboard.trophies[t.id] && t.check()) {
            GameState.billboard.trophies[t.id] = Date.now();

            if (typeof playTrophySound === 'function') {
                playTrophySound();
            }

            if (typeof spawnFloatingText === 'function') {
                const header = document.getElementById('header');
                spawnFloatingText(`🏆 NOUVEAU TROPHÉE DÉBLOQUÉ : ${t.name} ! 🏆`, header, true);
            }

            if (typeof updateTrophiesDisplay === 'function') {
                updateTrophiesDisplay();
            }
        }
    });
}

/**
 * Met à jour la simulation périodique du Billboard (toutes les 15 secondes).
 */
function updateBillboardSimulation(deltaTime) {
    billboardSimTimer += deltaTime;
    if (billboardSimTimer >= 15) {
        billboardSimTimer = 0;
        sortAndRankBillboard();
        if (typeof updateBillboardDisplay === 'function') {
            updateBillboardDisplay();
        }
    }
}
