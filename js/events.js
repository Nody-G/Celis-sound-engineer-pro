/**
 * events.js - Événements aléatoires
 * 
 * Des événements aléatoires se produisent pendant le jeu.
 * Ils peuvent être positifs (bonus) ou négatifs (pénalités).
 */

// Définition des événements possibles
const EVENT_DEFS = [
    // Événements positifs
    {
        id: 'happy_client',
        name: '😊 Client Satisfait',
        description: 'Un client satisfait te recommande à un ami. Tu gagnes de l\'argent !',
        type: 'positive',
        icon: '😊',
        apply: () => {
            const reward = Math.max(100, GameState.resources.money * 0.05);
            addMoney(reward);
            return { money: reward };
        },
    },
    {
        id: 'found_equipment',
        name: '🔍 Équipement Trouvé',
        description: 'Tu trouves du matériel d\'occasion à un prix imbattable. Tu gagnes de l\'argent !',
        type: 'positive',
        icon: '🔍',
        apply: () => {
            const reward = Math.max(50, GameState.resources.money * 0.03);
            addMoney(reward);
            return { money: reward };
        },
    },
    {
        id: 'viral_song',
        name: '📈 Chanson Virale',
        description: 'Un de tes mixes devient viral ! Tu gagnes beaucoup de renommée !',
        type: 'positive',
        icon: '📈',
        apply: () => {
            const fameReward = Math.max(5, GameState.resources.fame * 0.02);
            addFame(fameReward);
            return { fame: fameReward };
        },
    },
    {
        id: 'free_energy',
        name: '🔋 Pause Bien Méritée',
        description: 'Tu prends une pause bien méritée. Ton énergie est restaurée !',
        type: 'positive',
        icon: '🔋',
        apply: () => {
            addEnergy(GameState.resources.maxEnergy);
            return { energy: GameState.resources.maxEnergy };
        },
    },
    {
        id: 'sponsor_deal',
        name: '🤝 Contrat de Sponsoring',
        description: 'Une marque veut sponsoriser ton studio. Tu gagnes un bonus de production !',
        type: 'positive',
        icon: '🤝',
        apply: () => {
            const reward = Math.max(200, GameState.resources.money * 0.08);
            addMoney(reward);
            return { money: reward };
        },
    },

    // Événements négatifs
    {
        id: 'broken_cable',
        name: '🔌 Câble Cassé',
        description: 'Un câble important s\'est cassé. Tu dois payer les réparations !',
        type: 'negative',
        icon: '🔌',
        apply: () => {
            const cost = Math.min(GameState.resources.money * 0.05, 100000);
            spendMoney(cost);
            return { cost: cost };
        },
    },
    {
        id: 'client_complaint',
        name: '😠 Client Mécontent',
        description: 'Un client n\'est pas satisfait du résultat. Tu perds de la renommée !',
        type: 'negative',
        icon: '😠',
        apply: () => {
            const fameLoss = Math.min(GameState.resources.fame * 0.03, 100);
            spendFame(fameLoss);
            return { fameLoss: fameLoss };
        },
    },
    {
        id: 'power_outage',
        name: '⚡ Panne de Courant',
        description: 'Une panne de courant interrompt ta session. Tu perds de l\'argent !',
        type: 'negative',
        icon: '⚡',
        apply: () => {
            const cost = Math.min(GameState.resources.money * 0.03, 50000);
            spendMoney(cost);
            return { cost: cost };
        },
    },
    {
        id: 'equipment_failure',
        name: '💥 Panne d\'Équipement',
        description: 'Un de tes équipements tombe en panne. Tu dois payer les réparations !',
        type: 'negative',
        icon: '💥',
        apply: () => {
            const cost = Math.min(GameState.resources.money * 0.08, 200000);
            spendMoney(cost);
            return { cost: cost };
        },
    },
];

// Intervalle minimum entre deux événements (en secondes)
const EVENT_MIN_INTERVAL = 60; // 1 minute

// Dernier événement déclenché
let lastEventTime = 0;

/**
 * Récupère la définition d'un événement par son ID.
 * @param {string} id - ID de l'événement
 * @returns {Object|null} La définition de l'événement ou null
 */
function getEventDef(id) {
    return EVENT_DEFS.find(e => e.id === id) || null;
}

/**
 * Vérifie si un événement peut se déclencher.
 * @returns {boolean} true si un événement peut se déclencher
 */
function canTriggerEvent() {
    const now = Date.now();
    const elapsed = (now - lastEventTime) / 1000;
    return elapsed >= EVENT_MIN_INTERVAL;
}

/**
 * Tente de déclencher un événement aléatoire.
 * @returns {Object|null} L'événement déclenché ou null
 */
function tryTriggerEvent() {
    // Vérifie si un événement peut se déclencher
    if (!canTriggerEvent()) return null;

    // 10% de chance de déclencher un événement
    if (Math.random() > 0.10) return null;

    // Choisit un événement aléatoire
    const eventDef = EVENT_DEFS[Math.floor(Math.random() * EVENT_DEFS.length)];

    // Applique l'événement
    const result = eventDef.apply();

    // Met à jour les statistiques
    GameState.stats.eventsEncountered = (GameState.stats.eventsEncountered || 0) + 1;

    // Met à jour le timestamp du dernier événement
    lastEventTime = Date.now();

    return {
        id: eventDef.id,
        name: eventDef.name,
        description: eventDef.description,
        type: eventDef.type,
        icon: eventDef.icon,
        result: result,
    };
}

/**
 * Récupère le nombre d'événements rencontrés.
 * @returns {number} Nombre d'événements rencontrés
 */
function getEventsEncountered() {
    return GameState.stats.eventsEncountered || 0;
}

/**
 * Affiche une notification visuelle stylée pour un événement aléatoire.
 */
function showEventNotification(event) {
    if (!event) return;

    let toastContainer = document.getElementById('event-toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'event-toast-container';
        toastContainer.className = 'event-toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `event-toast ${event.type === 'positive' ? 'positive' : 'negative'}`;

    let resultDetail = '';
    if (event.result) {
        if (event.result.money) resultDetail = `<span class="toast-result green">+${formatNumber(event.result.money)} $</span>`;
        else if (event.result.cost) resultDetail = `<span class="toast-result red">-${formatNumber(event.result.cost)} $</span>`;
        else if (event.result.fame) resultDetail = `<span class="toast-result gold">+${formatNumber(event.result.fame)} ⭐</span>`;
        else if (event.result.fameLoss) resultDetail = `<span class="toast-result red">-${formatNumber(event.result.fameLoss)} ⭐</span>`;
        else if (event.result.energy) resultDetail = `<span class="toast-result cyan">⚡ Énergie Restaurée à 100%</span>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${event.icon}</div>
        <div class="toast-content">
            <h4 class="toast-title">${event.name}</h4>
            <p class="toast-desc">${event.description}</p>
            ${resultDetail}
        </div>
        <button class="toast-close" title="Fermer">✖</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 5000);

    toastContainer.appendChild(toast);
}

