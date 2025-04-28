import React from "react";
import { store, computed } from "jods";
import { useJods, createDebugger } from "jods/react";

// Define a counter store
const counterStore = store({
  count: 0,
  steps: [] as string[],
});

// Add a computed property
counterStore.doubleCount = computed(() => counterStore.count * 2);

// Create a debugger component for our store
const CounterDebugger = createDebugger(counterStore, {
  showDiff: true,
  position: "bottom",
  maxEntries: 20,
});

// A simple counter component
function Counter() {
  // Use the store with React
  const state = useJods(counterStore);

  // Functions to modify the store
  const increment = () => {
    state.count += 1;
    state.steps.push(`Incremented to ${state.count}`);
  };

  const decrement = () => {
    state.count -= 1;
    state.steps.push(`Decremented to ${state.count}`);
  };

  const reset = () => {
    state.count = 0;
    state.steps.push("Reset to 0");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>JODS Time Travel Example</h1>

      <div style={{ marginBottom: "20px" }}>
        <p>Count: {state.count}</p>
        <p>Double Count: {state.doubleCount}</p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={increment} style={{ marginRight: "10px" }}>
          Increment
        </button>
        <button onClick={decrement} style={{ marginRight: "10px" }}>
          Decrement
        </button>
        <button onClick={reset}>Reset</button>
      </div>

      <div>
        <h3>History:</h3>
        <ul>
          {state.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      </div>

      {/* The debugger will appear at the bottom of the page */}
      <CounterDebugger />
    </div>
  );
}

// Main app component
export function App() {
  return <Counter />;
}

// If you're using this in a standalone app:
// ReactDOM.render(<App />, document.getElementById('root'));
