---
sidebar_position: 3
---

# Examples

Here are some practical examples showing how to use jods in different contexts.

## Basic Usage

This example demonstrates the core features of jods, including store creation, computed properties, change tracking, and JSON snapshots.

```ts
import { store, json, onUpdate, computed, diff } from "jods";

// Define the User interface
interface User {
  firstName: string;
  lastName: string;
  email: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  favorites: string[];
  // Don't specify the type for fullName, let TypeScript infer it
}

// Create a user store
const user = store<User>({
  firstName: "Burt",
  lastName: "Macklin",
  email: "Burt.Macklin@FBI.confidential",
  notifications: {
    email: true,
    push: false,
  },
  favorites: [],
});

// Add a computed property
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

// Get a JSON snapshot
console.log("Initial state:", json(user));

// Create a reference to previous state
let oldState = json(user);

// Track update count to demonstrate granular updates
let updateCount = 0;

// Subscribe to changes - onUpdate fires ONCE for EACH property change
onUpdate(user, (newState) => {
  updateCount++;
  console.log(`User updated! (Update #${updateCount})`);
  console.log("Changes:", diff(oldState, newState));
  console.log("New state:", json(newState));

  oldState = json(newState); // Update oldState for next change
});

// Make some changes - each one triggers a separate onUpdate callback
user.firstName = "Burt Macklin";
user.notifications.push = true;
user.favorites.push("undercover missions");

// Show the final state
console.log(`Total updates triggered: ${updateCount}`);
console.log("Final state with computed values:", json(user));
```

## React Integration

This example shows how to use jods with React components using the `useJods` hook.

```tsx
import React, { ChangeEvent } from "react";
import { store, computed } from "jods";
import { useJods } from "jods/react";

// Define the User interface
interface User {
  firstName: string;
  lastName: string;
  occupation: string;
  isUndercover: boolean;
  skills: string[];
}

// Create a shared store
const userStore = store<User>({
  firstName: "Burt",
  lastName: "Macklin",
  occupation: "FBI",
  isUndercover: false,
  skills: ["investigation", "disguise"],
});

// Add computed properties
userStore.fullName = computed(
  () => `${userStore.firstName} ${userStore.lastName}`
);
userStore.displayTitle = computed(
  () =>
    `${userStore.fullName}, ${
      userStore.isUndercover ? "Undercover Agent" : userStore.occupation
    }`
);

// A component that displays user info
function UserProfile(): React.ReactElement {
  // Use the hook to get the latest state
  const user = useJods(userStore);

  return (
    <div className="user-profile">
      <h2>{user.displayTitle}</h2>

      <div className="user-skills">
        <h3>Skills:</h3>
        <ul>
          {user.skills.map((skill, index) => (
            <li key={index}>{skill}</li>
          ))}
        </ul>
        <button onClick={() => userStore.skills.push("surveillance")}>
          Add Surveillance Skill
        </button>
      </div>

      <div className="user-actions">
        <button onClick={() => (userStore.isUndercover = !user.isUndercover)}>
          {user.isUndercover ? "Blow Cover" : "Go Undercover"}
        </button>
      </div>
    </div>
  );
}

// A component that edits user info
function UserEditor(): React.ReactElement {
  const user = useJods(userStore);

  const handleFirstNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    userStore.firstName = e.target.value;
  };

  const handleLastNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    userStore.lastName = e.target.value;
  };

  return (
    <div className="user-editor">
      <h3>Edit Agent Profile</h3>
      <div>
        <label>
          First Name:
          <input
            type="text"
            value={user.firstName}
            onChange={handleFirstNameChange}
          />
        </label>
      </div>
      <div>
        <label>
          Last Name:
          <input
            type="text"
            value={user.lastName}
            onChange={handleLastNameChange}
          />
        </label>
      </div>
    </div>
  );
}

// Main app component
function App(): React.ReactElement {
  return (
    <div className="app">
      <h1>JODS React Example</h1>
      <UserProfile />
      <UserEditor />
    </div>
  );
}
```

## Preact Integration

jods includes native Preact support through a dedicated entry point. The API is identical to the React integration, making it easy to use in Preact applications.

```tsx
import { h } from "preact";
import { useState } from "preact/hooks";
import { store, computed } from "jods";
import { useJods } from "jods/preact";

// Define a cart store
const cart = store({
  items: [],
  couponCode: "",
});

// Add computed properties
cart.itemCount = computed(() => cart.items.length);
cart.subtotal = computed(() =>
  cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);
cart.discount = computed(() =>
  cart.couponCode === "SAVE20" ? cart.subtotal * 0.2 : 0
);
cart.total = computed(() => cart.subtotal - cart.discount);

// Product list component
function ProductList() {
  const products = [
    { id: 1, name: "Widget", price: 9.99 },
    { id: 2, name: "Gadget", price: 14.99 },
    { id: 3, name: "Doohickey", price: 19.99 },
  ];

  function addToCart(product) {
    const existingItem = cart.items.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    }
  }

  return (
    <div class="products">
      <h2>Products</h2>
      {products.map((product) => (
        <div key={product.id} class="product">
          <h3>{product.name}</h3>
          <p>${product.price.toFixed(2)}</p>
          <button onClick={() => addToCart(product)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
}

// Shopping cart component
function ShoppingCart() {
  const cartState = useJods(cart);
  const [coupon, setCoupon] = useState("");

  function applyCoupon() {
    cart.couponCode = coupon;
  }

  function removeItem(itemId) {
    cart.items = cart.items.filter((item) => item.id !== itemId);
  }

  return (
    <div class="cart">
      <h2>Shopping Cart ({cartState.itemCount} items)</h2>

      {cartState.items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <ul>
            {cartState.items.map((item) => (
              <li key={item.id}>
                {item.name} - ${item.price.toFixed(2)} x {item.quantity}
                <button onClick={() => removeItem(item.id)}>Remove</button>
              </li>
            ))}
          </ul>

          <div class="coupon">
            <input
              type="text"
              value={coupon}
              onInput={(e) => setCoupon(e.target.value)}
              placeholder="Coupon code"
            />
            <button onClick={applyCoupon}>Apply</button>
          </div>

          <div class="summary">
            <p>Subtotal: ${cartState.subtotal.toFixed(2)}</p>
            {cartState.discount > 0 && (
              <p>Discount: -${cartState.discount.toFixed(2)}</p>
            )}
            <p class="total">Total: ${cartState.total.toFixed(2)}</p>
          </div>
        </>
      )}
    </div>
  );
}

// Main app component
export function App() {
  return (
    <div class="app">
      <h1>JODS Preact Shopping Cart Example</h1>
      <div class="container">
        <ProductList />
        <ShoppingCart />
      </div>
    </div>
  );
}
```

## Using onUpdate for Event Handling

This example shows how to use the `onUpdate` function to track state changes.

```js
import { store, onUpdate } from "jods";

// Create a store
const todoStore = store({
  items: [],
  filter: "all",
});

// Add a task to the store
function addTask(title) {
  todoStore.items.push({
    id: Date.now(),
    title,
    completed: false,
  });
}

// Track changes and perform side effects
onUpdate(todoStore, (newState) => {
  // Save to localStorage whenever state changes
  localStorage.setItem("todos", JSON.stringify(newState.items));

  // You could also sync with a server, log changes, etc.
  console.log("Todo state updated:", newState);
});

// Add some tasks
addTask("Learn jods");
addTask("Build an app");
```

## Remix Integration

jods provides a first-class integration with Remix that simplifies state management across server and client. The integration combines loaders, actions, schema validation, and reactive client state.

Check out the [Remix Integration](/remix) section for detailed examples and documentation, including:

- Defining stores with server-side data loading
- Creating form handlers with automatic validation
- Implementing optimistic UI updates
- Integrating with Remix's routing system

For more examples, check out the [GitHub repository](https://github.com/clamstew/jods/tree/main/examples).
