# 🌱 OpenFarm - Encyclopédie des Plantes

Une application web moderne et élégante pour rechercher et découvrir des informations sur les plantes via l'API Wikipedia.

![OpenFarm](icone.png)

## ✨ Fonctionnalités

### 🔍 Recherche Avancée
- **Recherche en temps réel** avec suggestions automatiques
- **Navigation au clavier** dans les suggestions (↑↓ Enter)
- **Recherche intelligente** via l'API Wikipedia
- **Tags populaires** pour recherches rapides

### 🎨 Interface Utilisateur
- **Design moderne** avec animations fluides
- **Mode sombre/clair** avec changement instantané
- **Responsive** - fonctionne sur tous les appareils
- **Barre de progression** de lecture d'articles
- **Notifications toast** pour les actions

### ❤️ Système de Favoris
- Ajoutez vos plantes préférées en favoris
- Consultez votre liste de favoris
- Sauvegarde locale (LocalStorage)
- Suppression facile des favoris

### 📖 Lecture d'Articles
- **Affichage enrichi** des articles Wikipedia
- **Navigation interne** entre articles
- **Synthèse vocale** (lecture audio des articles en français)
- **Impression** des articles
- **Images** chargées dynamiquement

### ⌨️ Raccourcis Clavier
- `Ctrl/Cmd + K` : Focus sur la recherche
- `Ctrl/Cmd + D` : Basculer le thème
- `Ctrl/Cmd + H` : Afficher l'aide
- `Escape` : Fermer les suggestions / Revenir en arrière
- `↑ ↓` : Naviguer dans les suggestions
- `Enter` : Sélectionner une suggestion

## 🚀 Installation et Utilisation

### Prérequis
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Connexion Internet (pour l'API Wikipedia)

### Installation

1. **Téléchargez le projet**
   ```bash
   git clone https://github.com/votre-username/openfarm.git
   cd openfarm
   ```

2. **Ouvrez le fichier**
   - Double-cliquez sur `index.html`
   - Ou utilisez un serveur local :
     ```bash
     # Avec Python 3
     python -m http.server 8000
     
     # Avec Node.js (http-server)
     npx http-server
     ```

3. **Accédez à l'application**
   - Ouvrez votre navigateur à `http://localhost:8000`

## 📁 Structure du Projet

```
educati/
│
├── index.html          # Page principale de l'application
├── style.css           # Styles CSS (thèmes clair/sombre)
├── script.js           # Logique JavaScript
├── icone.png           # Logo de l'application
├── README.md           # Ce fichier
└── .gitattributes      # Configuration Git
```

## 🎨 Personnalisation

### Couleurs du Thème

Modifiez les variables CSS dans `style.css` :

```css
:root {
    --primary-color: #2ecc71;     /* Couleur principale */
    --primary-dark: #27ae60;      /* Couleur principale foncée */
    --secondary-color: #3498db;   /* Couleur secondaire */
    --bg-light: #f8fafb;          /* Fond clair */
    --text-dark: #2c3e50;         /* Texte foncé */
}
```

### Tags Populaires

Modifiez les tags dans `index.html` :

```html
<span class="popular-tag" data-search="tomate">🍅 Tomate</span>
<span class="popular-tag" data-search="rose">🌹 Rose</span>
<!-- Ajoutez vos propres tags -->
```

## 🔧 Technologies Utilisées

- **HTML5** - Structure sémantique
- **CSS3** - Styles modernes avec variables CSS et animations
- **JavaScript (ES6+)** - Logique applicative
- **Wikipedia API** - Données sur les plantes
- **LocalStorage** - Sauvegarde locale des favoris et préférences
- **Web Speech API** - Synthèse vocale

## 🌐 API Utilisée

L'application utilise l'[API Wikipédia](https://www.mediawiki.org/wiki/API:Main_page) pour :
- Rechercher des articles
- Récupérer le contenu des articles
- Charger les images
- Obtenir des suggestions de recherche

## 📱 Compatibilité

| Navigateur | Version Minimale | Support |
|-----------|------------------|---------|
| Chrome    | 90+             | ✅ Complet |
| Firefox   | 88+             | ✅ Complet |
| Safari    | 14+             | ✅ Complet |
| Edge      | 90+             | ✅ Complet |

**Note** : La synthèse vocale peut ne pas être disponible sur tous les navigateurs/systèmes.

## 🎯 Fonctionnalités Futures

- [ ] Export des articles en PDF
- [ ] Partage sur les réseaux sociaux
- [ ] Mode hors-ligne avec Service Workers
- [ ] Comparaison de plantes côte à côte
- [ ] Graphique de croissance des plantes
- [ ] Calendrier de plantation
- [ ] Système de notes et commentaires personnels
- [ ] Intégration avec d'autres APIs botaniques

## 🐛 Résolution de Problèmes

### Les suggestions ne s'affichent pas
- Vérifiez votre connexion Internet
- Assurez-vous que JavaScript est activé

### La synthèse vocale ne fonctionne pas
- Vérifiez que votre navigateur supporte l'API Web Speech
- Chrome et Edge ont le meilleur support
- Sur iOS, utilisez Safari

### Les images ne se chargent pas
- Certains articles Wikipedia n'ont pas d'images
- Vérifiez votre connexion Internet
- Les bloqueurs de publicités peuvent interférer

## 📄 Licence

Ce projet est sous licence MIT. Vous êtes libre de :
- Utiliser le code
- Modifier le code
- Distribuer le code
- Utiliser commercialement

## 👤 Auteur

Créé avec ❤️ pour les amoureux des plantes

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add: Amazing Feature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📞 Support

Pour toute question ou problème :
- Ouvrez une [issue](https://github.com/votre-username/openfarm/issues)
- Consultez la [documentation Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page)

## 🙏 Remerciements

- [Wikipedia](https://www.wikipedia.org/) pour l'API et les données
- [Google Fonts](https://fonts.google.com/) pour la police Poppins
- La communauté open source

---

**Bonne exploration du monde des plantes ! 🌿**
