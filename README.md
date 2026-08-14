# 🎛️ Célis Sound Engineer PRO

Un jeu incrémental premium sur le thème du studio de production musicale et de l'ingénieur du son. Mixez des tubes, bâtissez votre rack analogique, programmez vos rythmes sur un séquenceur 16-Pas en direct, signez des artistes dans votre label, conquérez le Billboard mondial et remportez des Disques d'Or et des Grammys !

---

## 🎮 Nouveautés Majeures de la Hit Edition

### 1. 🏢 Évolution Visuelle du Studio & Rack d'Appareils Analogiques
- **5 Stades de Studio** : Du *Home Studio en Chambre* au *Cyber Penthouse Skyline* avec baies vitrées de nuit.
- **Rack Analogique Modulaire** : Chaque matériel audio acheté allume une unité de rack rétro-éclairée avec des LEDs témoins et des VU-mètres à aiguille oscillants.

### 2. 🎹 Mini-DAW : Séquenceur 16-Pas Interactif (Groove Engine)
- Véritable boîte à rythmes 16-Pas intégrée avec 4 pistes (*Kick 808, Snare, Hi-Hat, Synth Lead/Bass*).
- Moteur Web Audio en temps réel synchronisé au BPM.
- Presets de genres en 1 clic (*French Touch, 80s Synthwave, Dark Trap, Cyberpunk, Lo-Fi*).
- Génère des revenus passifs de Groove, fait grimper la jauge de Hype et accorde jusqu'à **+35% de Production globale**.

### 3. 🎤 Label de Musique & Écurie d'Artistes
- Recrutez des artistes virtuels générés procéduralement (*Rappeur Trap, Diva Pop, Duo Électro Robotique, Virtuose Jazz, Cyber Rockstar*).
- Envoyez-les en **Sessions Studio**, **Campagnes TikTok Virales** ou en **Tournées Mondiales**.
- Système de progression par niveaux et points d'expérience (EXP) conférant des multiplicateurs permanents.

### 4. 📈 Hit-Parade Billboard Top 50 & Galerie des Trophées
- Sortez des singles et albums qui entrent dans le classement mondial face à des rivaux IA.
- Conquérez les échelons pour décrocher de véritables **Disques d'Argent, d'Or, de Platine, de Diamant (#1 Mondial)** et le prestigieux **Grammy Award**.
- Les trophées sont exposés dans une vitrine interactive et octroient des multiplicateurs cumulatifs de production jusqu'à **x5.0+**.

### 5. 🎯 Quêtes Quotidiennes, Boutique de Cassettes Dorées 📼 & Codes Secrets
- Défis du jour renouvelés pour gagner la devise rare : les **Cassettes Dorées 📼**.
- Débloquez des avantages majeurs (*Bande Master Studer, Réacteur d'Énergie, Aimant à Vinyles Dorés*).
- **Terminal de Codes Secrets** : Entrez des codes promo (`808MAFIA`, `DAFT`, `ANALOG`, `GRAMMY`, `KONAMI`) pour débloquer des récompenses immédiates.
- **Synchronisation de Sauvegarde Base64** : Exportez et importez votre partie facilement.

---

## 🛠️ Structure du Projet

```
Incremental game/
├── index.html          # Interface moderne Cyber-Studio Pro
├── css/
│   └── style.css       # Design system complet, animations néon & glassmorphism
└── js/
    ├── state.js        # État global et persistance du jeu
    ├── resources.js    # Argent, Renommée, Énergie, Cassettes Dorées
    ├── audio.js        # Moteur Web Audio procédural et synthétiseurs
    ├── visualizer.js   # Visualiseur de fréquences spectrales Canvas 60 FPS
    ├── sequencer.js    # Séquenceur 16-Pas Mini-DAW
    ├── artists.js      # Gestion de label et missions d'artistes
    ├── charts_board.js # Simulation du Billboard Top 50 & Trophées
    ├── quests.js       # Quêtes quotidiennes et codes secrets
    ├── equipment.js    # 11 équipements avec paliers & multi-achat
    ├── upgrades.js     # Arbre de R&D Acoustique
    ├── albums.js       # Système de distribution et royalties de streaming
    ├── minigame.js     # Beat pads, Mastering Lab & Vinyles Dorés
    ├── contracts.js    # Commandes de clients et labels
    ├── production.js   # Boucle de production intégrée
    ├── boosters.js     # Boosters temporaires
    ├── achievements.js # 20 succès avec récompenses
    ├── events.js       # Événements aléatoires dynamiques
    ├── prestige.js     # Refonte de studio et arbre de maîtrise
    ├── charts.js       # Graphiques SVG de progression
    ├── stats.js        # Statistiques détaillées de session
    ├── save.js         # Sauvegarde localStorage et export/import Base64
    ├── ui.js           # Rendu dynamique de l'interface
    └── main.js         # Point d'entrée et boucle de jeu 60 FPS
```

## 🚀 Lancer le Jeu

Ouvrez simplement [`index.html`](index.html) dans n'importe quel navigateur moderne (Chrome, Firefox, Edge, Safari). Aucun serveur requis !
