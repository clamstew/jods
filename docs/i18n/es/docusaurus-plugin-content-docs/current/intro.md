---
sidebar_position: 1
---

# 🐿️ 🦆 Introducción a jods

> "¿Estado para rastrear? Simplemente anótalo con jods"

**jods (JavaScript Object Dynamics System)** es una biblioteca de estado reactiva, divertida e intuitiva que da vida a los objetos JavaScript. Crea almacenes ligeros que reaccionan a los cambios, calculan valores derivados y mantienen sincronizado el estado de tu aplicación.

## 🤔 ¿Qué es jods?

jods es una pequeña biblioteca de gestión de estado diseñada para ser simple, flexible y potente. Es perfecta para:

- 🔄 Sincronizar el estado de la aplicación
- 🚀 Alimentar APIs
- 🎨 Construir interfaces de usuario reactivas sin frameworks pesados

## ✨ Características clave

- ☁️ Cero dependencias
- 🧠 Valores calculados integrados
- ⚡ Funciona con React/Preact a través de useSyncExternalStore
- 📷 Clonación profunda integrada con json()
- 🧬 API mínima, sin acciones o reductores complejos
- 🧪 Detección de diferencias integrada
- 🧩 Independiente de frameworks, pero se integra bien con React/Preact

## 📦 Instalación

```bash
npm install jods
```

## 💻 Uso básico

```js
import { store, json, onUpdate, computed } from "jods";

const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
});

// Suscribirse a los cambios
onUpdate(user, (newUserState) => {
  console.log("Estado de usuario actualizado:", json(newUserState));
});

// Modificar campos existentes
user.firstName = "Burt Macklin";
user.mood = "sneaky";

// Añadir un nuevo campo calculado
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

console.log(json(user));
// { firstName: "Burt Macklin", lastName: "Macklin", mood: "sneaky", fullName: "Burt Macklin Macklin" }
```

## 🌟 ¿Por qué elegir jods?

jods lleva la gestión de estado a lo esencial. Ofrece una API simple e intuitiva que da la sensación de trabajar con objetos JavaScript ordinarios, a la vez que añade potentes capacidades reactivas.

¿Listo para saber más? Exploremos jods en profundidad. 🚀 🐿️ 🦆
