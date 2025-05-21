---
sidebar_position: 1
---

# 🐿️ 🦆 Introduction à jods

> "De l'état à suivre ? Il suffit de le noter avec jods"

**jods (JavaScript Object Dynamics System)** est une bibliothèque d'état réactive, amusante et intuitive qui donne vie aux objets JavaScript. Créez des stores légers qui réagissent aux changements, calculent des valeurs dérivées et maintiennent l'état de votre application synchronisé.

## 🤔 Qu'est-ce que jods ?

jods est une petite bibliothèque de gestion d'état conçue pour être simple, flexible et puissante. Elle est parfaite pour :

- 🔄 Synchroniser l'état de l'application
- 🚀 Alimenter des APIs
- 🎨 Construire des interfaces utilisateur réactives sans frameworks lourds

## ✨ Fonctionnalités clés

- ☁️ Zéro dépendance
- 🧠 Valeurs calculées intégrées
- ⚡ Fonctionne avec React/Preact via useSyncExternalStore
- 📷 Clonage profond intégré avec json()
- 🧬 API minimale, pas d'actions ou de reducers complexes
- 🧪 Détection de différences intégrée
- 🧩 Indépendant des frameworks, mais s'intègre bien avec React/Preact

## 📦 Installation

```bash
npm install jods
```

## 💻 Utilisation de base

```js
import { store, json, onUpdate, computed } from "jods";

const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
});

// S'abonner aux changements
onUpdate(user, (newUserState) => {
  console.log("État utilisateur mis à jour :", json(newUserState));
});

// Modifier les champs existants
user.firstName = "Burt Macklin";
user.mood = "sneaky";

// Ajouter un nouveau champ calculé
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

console.log(json(user));
// { firstName: "Burt Macklin", lastName: "Macklin", mood: "sneaky", fullName: "Burt Macklin Macklin" }
```

## 🌟 Pourquoi choisir jods ?

jods ramène la gestion d'état à l'essentiel. Il offre une API simple et intuitive qui donne l'impression de travailler avec des objets JavaScript ordinaires, tout en ajoutant de puissantes capacités réactives.

Prêt à en savoir plus ? Explorons jods en profondeur. 🚀 🐿️ 🦆
