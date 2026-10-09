# GénéaGed

**GénéaGed** est une application web légère, fluide et moderne conçue pour simplifier la **création, la modification et l'exportation de fichiers GEDCOM (`.ged`)**. 

Contrairement aux logiciels de généalogie complets et complexes, GénéaGed se concentre sur l'essentiel : offrir une interface intuitive pour saisir rapidement la structure d'une famille, lier les individus et produire un fichier GEDCOM standardisé.

---

## 🚀 Fonctionnalités principales

* **Éditeur GEDCOM natif** : Saisie et modification faciles des fiches individuelles (nom, prénom, sexe, dates et lieux de naissance/décès).
* **Gestion des relations** : Ajout simplifié de conjoints, de parents et d'enfants.
* **Arbre dynamique** : Visualisation instantanée de la lignée (grands-parents, parents, individu principal, conjoint, enfants et descendance) avec défilement fluide et glisser-déposer.
* **Support des unions et ruptures** : Gestion des types d'unions (civil, religieux, PACS, union libre) et des fins d'unions (divorce, séparation).
* **Tri et recherche** : Recherche rapide et tri alphabétique automatique des individus.
* **Confidentialité totale** : Fonctionne à 100 % dans le navigateur (client-side). Aucune donnée généalogique n'est envoyée vers un serveur externe.

---

## 📂 Structure du projet

text
Geneaged/
├── index.html          # Page principale de l'application
├── css/
│   └── style.css       # Feuilles de styles CSS
└── js/
    ├── app.js          # Point d'entrée de l'application
    ├── fileService.js  # Service d'import/export de fichiers GEDCOM
    ├── gedcomEngine.js # Moteur de parsing et génération GEDCOM
    ├── store.js        # Gestion de l'état des données (individus, familles)
    ├── types.js        # Définition des structures de données
    └── ui.js           # Gestion de l'interface utilisateur et rendu de l'arbre
    
## 📄 Licence & Crédits

Auteur :GeneaGed

Code source : Mis à disposition librement pour la communauté généalogique   
