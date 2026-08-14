/**
 * artists.js - Label de Musique & Gestion d'Artistes
 * 
 * Permet de recruter des artistes aux profils uniques, de développer leur carrière,
 * et de les envoyer en missions (Sessions Studio, Promo Virale, Tournées Mondiales)
 * pour engranger des royalties colossales et des Cassettes Dorées.
 */

// Archétypes d'artistes
const ARTIST_ARCHETYPES = [
    {
        archetype: 'Rappeur Trap & Drill',
        avatar: '🎤',
        names: ['Lil 808', 'MC Flow', 'Young Drop', 'Kid Voltage', 'Glocko Beat'],
        baseTalent: 15,
        baseHype: 25,
        specialty: 'Gains massifs en Sessions Studio',
        genre: 'trap'
    },
    {
        archetype: 'Diva Pop & R&B',
        avatar: '🌟',
        names: ['Aura Sky', 'Velvet Gold', 'Siren Echo', 'Luna Starlight', 'Zara Queen'],
        baseTalent: 25,
        baseHype: 30,
        specialty: 'Explosion de Renommée sur les Réseaux',
        genre: 'future_bass'
    },
    {
        archetype: 'Duo Robotique Électro',
        avatar: '🤖',
        names: ['Daft Cyber 01', 'Neon Knights', 'The Synth Lords', 'Glitch & Bass'],
        baseTalent: 35,
        baseHype: 20,
        specialty: 'Revenus continus en Tournées Mondiales',
        genre: 'french_house'
    },
    {
        archetype: 'Virtuose Jazz Fusion',
        avatar: '🎷',
        names: ['Miles Groove', 'Coltrane Wave', 'Sax Legend', 'Smooth Duke'],
        baseTalent: 40,
        baseHype: 10,
        specialty: 'Bonus de production passif permanent',
        genre: 'lofi'
    },
    {
        archetype: 'Rockstar Cyberpunk',
        avatar: '⚡',
        names: ['Rave Riot', 'Johnny Synth', 'Cyber Scream', 'Overdrive Max'],
        baseTalent: 30,
        baseHype: 40,
        specialty: 'Déclencheur de Hype & Frenzy',
        genre: 'cyberpunk'
    }
];

// Types de missions
const ARTIST_MISSIONS = [
    {
        id: 'studio_session',
        name: '🎙️ Session Studio Intime',
        duration: 45, // 45s
        costEnergy: 20,
        description: 'Enregistre des refrains et couplets en cabine.',
        calculateReward: (artist) => {
            const base = typeof getPassiveProduction === 'function' ? getPassiveProduction() : 50;
            const reward = Math.max(500, base * 35 * (1 + artist.talent * 0.05));
            return {
                money: reward,
                fame: 5 + artist.level * 2,
                exp: 30,
                cassettes: 0
            };
        }
    },
    {
        id: 'viral_promo',
        name: '📱 Campagne TikTok & Streaming',
        duration: 120, // 2 min
        costEnergy: 35,
        description: 'Publie des snippets viraux et des interviews promo.',
        calculateReward: (artist) => {
            const base = typeof getPassiveProduction === 'function' ? getPassiveProduction() : 50;
            const reward = Math.max(1500, base * 60 * (1 + artist.hype * 0.06));
            return {
                money: reward,
                fame: 25 + artist.level * 8,
                exp: 60,
                cassettes: Math.random() < 0.35 ? 1 : 0
            };
        }
    },
    {
        id: 'world_tour',
        name: '🌍 Tournée des Zéniths & Festivals',
        duration: 300, // 5 min
        costEnergy: 50,
        description: 'Tournée mondiale devant des foules de 50 000 spectateurs.',
        calculateReward: (artist) => {
            const base = typeof getPassiveProduction === 'function' ? getPassiveProduction() : 50;
            const reward = Math.max(10000, base * 200 * (1 + (artist.talent + artist.hype) * 0.04));
            return {
                money: reward,
                fame: 100 + artist.level * 25,
                exp: 150,
                cassettes: 2
            };
        }
    }
];

/**
 * Initialise le système d'artistes.
 */
function initArtists() {
    if (!GameState.artists) {
        GameState.artists = {
            signed: [],
            available: [],
            lastRefresh: 0,
            maxSigned: 4
        };
    }
    refreshAvailableArtists();
}

/**
 * Génère une nouvelle liste d'artistes recrutables si nécessaire.
 */
function refreshAvailableArtists(force = false) {
    if (!GameState.artists) initArtists();

    const now = Date.now();
    if (!force && GameState.artists.available && GameState.artists.available.length > 0 && (now - GameState.artists.lastRefresh < 180000)) {
        return;
    }

    const available = [];
    const count = 3;

    for (let i = 0; i < count; i++) {
        const arch = ARTIST_ARCHETYPES[Math.floor(Math.random() * ARTIST_ARCHETYPES.length)];
        const name = arch.names[Math.floor(Math.random() * arch.names.length)];
        const talent = arch.baseTalent + Math.floor(Math.random() * 15);
        const hype = arch.baseHype + Math.floor(Math.random() * 15);

        // Coût basé sur la renommée du joueur
        const baseCost = Math.max(1000, Math.floor(1000 * Math.pow(1.8, (GameState.artists.signed || []).length)));
        const reqFame = (GameState.artists.signed || []).length * 15;

        available.push({
            id: 'artist_' + Date.now() + '_' + i,
            name: name,
            archetype: arch.archetype,
            avatar: arch.avatar,
            specialty: arch.specialty,
            genre: arch.genre,
            level: 1,
            exp: 0,
            expToNext: 100,
            talent: talent,
            hype: hype,
            costMoney: baseCost,
            reqFame: reqFame,
            isBusy: false,
            currentMission: null
        });
    }

    GameState.artists.available = available;
    GameState.artists.lastRefresh = now;
}

/**
 * Récupère la capacité maximale d'artistes du label.
 */
function getMaxSignedArtists() {
    if (!GameState.artists) return 4;
    return GameState.artists.maxSigned || 4;
}

/**
 * Signe un artiste dans le label.
 */
function signArtist(artistId) {
    if (!GameState.artists) initArtists();

    const maxCapacity = getMaxSignedArtists();
    if (GameState.artists.signed.length >= maxCapacity) {
        return { success: false, reason: `Écurie pleine ! Capacité max : ${maxCapacity} artistes.` };
    }

    const artistIndex = GameState.artists.available.findIndex(a => a.id === artistId);
    if (artistIndex === -1) return { success: false, reason: 'Artiste introuvable' };

    const artist = GameState.artists.available[artistIndex];
    if (GameState.resources.fame < artist.reqFame) {
        return { success: false, reason: `Renommée insuffisante (${artist.reqFame} ⭐ requise)` };
    }

    const realCost = applyPrestigeCost(artist.costMoney);
    if (!hasEnoughMoney(realCost)) {
        return { success: false, reason: `Fonds insuffisants (${formatNumber(realCost)} $ requis)` };
    }

    spendMoney(realCost);
    GameState.artists.signed.push(artist);
    GameState.artists.available.splice(artistIndex, 1);

    if (typeof playContractSound === 'function') {
        playContractSound();
    }

    if (typeof updateArtistsDisplay === 'function') {
        updateArtistsDisplay();
    }
    if (typeof updateResourceDisplay === 'function') {
        updateResourceDisplay();
    }

    return { success: true, artist: artist };
}

/**
 * Résilie le contrat ou transfère un artiste pour libérer une place dans l'écurie.
 */
function fireArtist(artistId) {
    if (!GameState.artists || !GameState.artists.signed) return { success: false, reason: 'Aucun artiste signé' };

    const index = GameState.artists.signed.findIndex(a => a.id === artistId);
    if (index === -1) return { success: false, reason: 'Artiste introuvable' };

    const artist = GameState.artists.signed[index];
    if (artist.isBusy) {
        return { success: false, reason: 'Impossible de libérer un artiste pendant une mission en cours !' };
    }

    // Indemnité de transfert accordée au label (50% coût de base + 500$ par niveau)
    const buyoutMoney = Math.floor((artist.costMoney * 0.4) + (artist.level * 800));
    addMoney(buyoutMoney);

    GameState.artists.signed.splice(index, 1);

    if (typeof playContractSound === 'function') {
        playContractSound();
    }

    if (typeof updateArtistsDisplay === 'function') {
        updateArtistsDisplay();
    }
    if (typeof updateResourceDisplay === 'function') {
        updateResourceDisplay();
    }

    return { success: true, artist: artist, buyoutMoney: buyoutMoney };
}

/**
 * Lance une mission pour un artiste.
 */
function startArtistMission(artistId, missionId) {
    const artist = (GameState.artists.signed || []).find(a => a.id === artistId);
    const mission = ARTIST_MISSIONS.find(m => m.id === missionId);

    if (!artist) return { success: false, reason: 'Artiste introuvable' };
    if (!mission) return { success: false, reason: 'Mission introuvable' };
    if (artist.isBusy) return { success: false, reason: 'Cet artiste est déjà en mission !' };

    if (!hasEnoughEnergy(mission.costEnergy)) {
        return { success: false, reason: `Énergie insuffisante (${mission.costEnergy} ⚡)` };
    }

    spendEnergy(mission.costEnergy);
    artist.isBusy = true;
    artist.currentMission = {
        missionId: mission.id,
        name: mission.name,
        duration: mission.duration,
        timeLeft: mission.duration,
        startedAt: Date.now()
    };

    if (typeof updateArtistsDisplay === 'function') {
        updateArtistsDisplay();
    }
    if (typeof updateResourceDisplay === 'function') {
        updateResourceDisplay();
    }

    return { success: true };
}

/**
 * Met à jour le temps restant des missions d'artistes.
 */
function updateArtists(deltaTime) {
    if (!GameState.artists || !GameState.artists.signed) return;

    for (const artist of GameState.artists.signed) {
        if (artist.isBusy && artist.currentMission) {
            artist.currentMission.timeLeft -= deltaTime;
            if (artist.currentMission.timeLeft <= 0) {
                completeArtistMission(artist);
            }
        }
    }
}

/**
 * Finalise une mission d'artiste et attribue les récompenses.
 */
function completeArtistMission(artist) {
    const missionDef = ARTIST_MISSIONS.find(m => m.id === artist.currentMission.missionId);
    if (!missionDef) {
        artist.isBusy = false;
        artist.currentMission = null;
        return;
    }

    const reward = missionDef.calculateReward(artist);
    addMoney(reward.money);
    addFame(reward.fame);
    if (reward.cassettes > 0) {
        GameState.resources.goldenCassettes = (GameState.resources.goldenCassettes || 0) + reward.cassettes;
    }

    // EXP et Level-up
    artist.exp += reward.exp;
    if (artist.exp >= artist.expToNext) {
        artist.level++;
        artist.exp -= artist.expToNext;
        artist.expToNext = Math.floor(artist.expToNext * 1.5);
        artist.talent += 5;
        artist.hype += 5;
    }

    artist.isBusy = false;
    artist.currentMission = null;

    GameState.stats.artistMissionsDone = (GameState.stats.artistMissionsDone || 0) + 1;

    if (typeof playMissionSuccessSound === 'function') {
        playMissionSuccessSound();
    }

    if (typeof advanceQuestProgress === 'function') {
        advanceQuestProgress('artist_missions', 1);
    }

    // Message flottant de succès
    const artistCard = document.getElementById(`artist-card-${artist.id}`);
    if (artistCard && typeof spawnFloatingText === 'function') {
        let text = `🎉 +${formatNumber(reward.money)} $ • +${formatNumber(reward.fame)} ⭐`;
        if (reward.cassettes > 0) text += ` • +${reward.cassettes} 📼`;
        spawnFloatingText(text, artistCard, true);
    }

    if (typeof updateArtistsDisplay === 'function') {
        updateArtistsDisplay();
    }
    if (typeof updateResourceDisplay === 'function') {
        updateResourceDisplay();
    }
}

/**
 * Calcule le multiplicateur passif conféré par tous les artistes signés (+5% par niveau global).
 */
function getArtistsPassiveBonus() {
    if (!GameState.artists || !GameState.artists.signed) return 1.0;
    let totalLevels = 0;
    for (const a of GameState.artists.signed) {
        totalLevels += (a.level || 1);
    }
    return 1 + (totalLevels * 0.05); // Ex: 4 artistes lvl 3 = +60%
}
