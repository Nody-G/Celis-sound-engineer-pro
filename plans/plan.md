# 🎵 Plan du jeu incrémental : "Sound Engineer Idle"

## Concept

Le joueur incarne un ingénieur son qui mixe et produit des morceaux de musique pour gagner de l'argent, débloquer du matériel professionnel, et bâtir sa renommée dans l'industrie musicale.

## Boucle de gameplay

```
Mixer des morceaux → Gagner de l'argent → Acheter du matériel
        ↑                                        ↓
    Production automatisée ←── Revenus passifs ←──┘
        ↓
    Gagner de la renommée → Débloquer des contrats lucratifs
        ↓
    Activer des boosters / Débloquer des succès
        ↓
    Prestige (recommencer avec bonus permanents)
```

## Ressources

| Ressource | Description | Gain |
|-----------|-------------|------|
| 💰 Argent | Monnaie principale | Mixage manuel, production passive, contrats |
| ⭐ Renommée | Progression sociale | Production, contrats, prestige |
| ⚡ Énergie | Limite l'action manuelle | Se régénère avec le temps |

## Équipements (générateurs passifs)

| Équipement | Coût | Revenu passif |
|------------|------|---------------|
| Micro dynamique | 50 | 1/s |
| Interface audio | 500 | 10/s |
| Moniteurs studio | 5 000 | 50/s |
| Plugins premium | 50 000 | 250/s |
| Console de mixage | 500 000 | 1 500/s |
| Salle insonorisée | 5 000 000 | 10 000/s |
| Studio pro complet | 50 000 000 | 75 000/s |
| Suite de mastering | 500 000 000 | 500 000/s |
| Équipement analogique vintage | 5 000 000 000 | 3 500 000/s |
| Complexe d'enregistrement | 50 000 000 000 | 25 000 000/s |
| Réseau de studios mondial | 500 000 000 000 | 200 000 000/s |

*Les coûts augmentent avec la quantité possédée (formule de coût croissant).*

## Contrats (missions)

| Contrat | Prérequis | Récompense |
|---------|-----------|------------|
| Mixer un single | Renommée 10 | 1 000 + 5 renommée |
| Produire un EP | Renommée 50 | 10 000 + 25 renommée |
| Album pour artiste local | Renommée 200 | 100 000 + 100 renommée |
| Masteriser pour une star | Renommée 1 000 | 1 000 000 + 500 renommée |
| Bande originale de film | Renommée 5 000 | 10 000 000 + 2 000 renommée |
| Tournée mondiale | Renommée 20 000 | 100 000 000 + 10 000 renommée |
| Album légendaire | Renommée 100 000 | 1 000 000 000 + 50 000 renommée |
| Empire musical | Renommée 500 000 | 10 000 000 000 + 250 000 renommée |

## Boosters (améliorations temporaires)

| Booster | Coût | Bonus | Durée |
|---------|------|-------|-------|
| Café express | 100 | +50% production | 30 s |
| Boisson énergisante | 1 000 | +100% production | 60 s |
| Session studio intense | 10 000 | +200% production | 2 min |
| Boost de producteur | 100 000 | +500% production | 5 min |

## Succès

20 succès récompensant les jalons : mixage, équipement, contrats, prestige, argent. Chaque succès donne une récompense en argent.

## Événements aléatoires

- **Positifs** : client satisfait, équipement trouvé, chanson virale, pause bien méritée, contrat de sponsoring
- **Négatifs** : câble cassé, client mécontent, panne de courant, panne d'équipement

## Prestige

- **Action** : "Refondre le studio" (disponible à partir de 100 ⭐ de renommée à vie)
- **Gain** : Points de prestige = `floor(sqrt(lifetimeFame / 100))`
- **Bonus permanents** :
  - Multiplicateur de production (+10% par point)
  - Réduction des coûts d'équipement (-5% par point, max -50%)
  - Bonus de renommée (+5% par point)

## Architecture technique

```
Incremental game/
├── index.html          # Page principale du jeu
├── css/
│   └── style.css       # Styles et animations (thèmes sombre/clair)
├── js/
│   ├── main.js         # Point d'entrée, boucle de jeu
│   ├── state.js        # Gestion de l'état du jeu
│   ├── resources.js    # Système de ressources
│   ├── production.js   # Mécanique de production (mixage)
│   ├── equipment.js    # Système d'équipement
│   ├── contracts.js    # Système de clients/contrats
│   ├── boosters.js     # Améliorations temporaires
│   ├── achievements.js # Système de succès
│   ├── events.js       # Événements aléatoires
│   ├── prestige.js     # Mécanique de prestige
│   ├── audio.js        # Effets sonores et musique (Web Audio API)
│   ├── charts.js       # Graphiques de progression (SVG)
│   ├── stats.js        # Statistiques détaillées
│   ├── save.js         # Sauvegarde localStorage
│   └── ui.js           # Interface utilisateur
└── README.md           # Documentation
```

## Interface utilisateur

- **Panneau principal** : Ressources (argent, renommée, énergie) en haut
- **Barre de contrôles** : Bascule du son, de la musique et du thème (sombre/clair)
- **Zone de mixage** : Bouton d'action manuelle + indicateur de production passive
- **Onglet Équipement** : Liste des équipements achetable
- **Onglet Boosters** : Liste des boosters activables
- **Onglet Contrats** : Liste des contrats disponibles
- **Onglet Succès** : Liste des succès débloqués/verrouillés
- **Onglet Statistiques** : Statistiques détaillées + graphiques de progression
- **Onglet Prestige** : Bouton de prestige + bonus actuels
- **Sauvegarde** : Sauvegarde automatique toutes les 30 secondes + bouton manuel

## Étapes d'implémentation

1. **Structure de base** : index.html, style.css, main.js (boucle de jeu)
2. **Ressources** : Système de ressources (argent, renommée, énergie)
3. **Production** : Mécanique de mixage manuel + production passive
4. **Équipement** : Achat de matériel avec coûts croissants
5. **Contrats** : Missions avec prérequis et récompenses
6. **Prestige** : Recommencer avec bonus permanents
7. **Sauvegarde** : localStorage avec sauvegarde automatique
8. **UI** : Panneaux, onglets, feedback visuel
9. **Équilibrage** : Ajustement des valeurs de progression
10. **Documentation** : README et guide de jeu
11. **Audio** : Effets sonores et musique (Web Audio API)
12. **Boosters** : Améliorations temporaires
13. **Succès** : Système de succès avec récompenses
14. **Statistiques** : Statistiques détaillées
15. **Thème** : Mode sombre/clair
16. **Graphiques** : Graphiques de progression (SVG)
17. **Contenu étendu** : Plus d'équipements et de contrats
18. **Événements** : Événements aléatoires
19. **Intégration** : Intégration de tous les modules
20. **Équilibrage** : Équilibrage de toutes les nouvelles fonctionnalités
21. **Documentation** : Mise à jour du README et du plan
