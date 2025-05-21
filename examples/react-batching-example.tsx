import React, { useState } from "react";
import { store, computed } from "../src/index";
import { useJods, useJodsBatching } from "../src/frameworks/react";
import type { ComputedValue } from "../src/types";

// Define a store with multiple properties that will be updated
interface CounterStore {
  count: number;
  lastUpdate: number;
  operations: string[];
  updates: number;
  // Include computed properties with proper types
  doubleCount?: ComputedValue<number>;
  tripleCount?: ComputedValue<number>;
  countStatus?: ComputedValue<string>;
}

// Create the store
const counterStore = store<CounterStore>({
  count: 0,
  lastUpdate: Date.now(),
  operations: [],
  updates: 0,
});

// Add computed properties
counterStore.doubleCount = computed(() => counterStore.count * 2);
counterStore.tripleCount = computed(() => counterStore.count * 3);
counterStore.countStatus = computed(() => {
  if (counterStore.count === 0) return "Zero";
  else if (counterStore.count < 0) return "Negative";
  else return "Positive";
});

// Component that uses batching
function OptimizedCounter() {
  const [renderCount, setRenderCount] = useState(0);
  const counter = useJods(counterStore);

  // Enable batching optimization
  useJodsBatching();

  // Function to increment counter with batch updates
  const incrementWithBatch = () => {
    counterStore.batch(() => {
      counterStore.count += 1;
      counterStore.lastUpdate = Date.now();
      counterStore.operations.push("increment");
      counterStore.updates += 1;
    });

    // Track component renders
    setRenderCount((prev) => prev + 1);
  };

  return (
    <div className="counter-container optimized">
      <h2>Optimized Counter (with batching)</h2>
      <div className="counter-value">
        <p>Count: {counter.count}</p>
        <p>Double: {counter.doubleCount && counter.doubleCount()}</p>
        <p>Triple: {counter.tripleCount && counter.tripleCount()}</p>
        <p>Status: {counter.countStatus && counter.countStatus()}</p>
        <p>Updates: {counter.updates}</p>
      </div>
      <div className="counter-actions">
        <button onClick={incrementWithBatch}>Increment (Batched)</button>
      </div>
      <div className="counter-stats">
        <p>Component renders: {renderCount}</p>
        <p>Last update: {new Date(counter.lastUpdate).toLocaleTimeString()}</p>
        <p>Operation count: {counter.operations.length}</p>
      </div>
    </div>
  );
}

// Component that does NOT use batching - for comparison
function StandardCounter() {
  const [renderCount, setRenderCount] = useState(0);
  const counter = useJods(counterStore);

  // Function to increment counter without batching
  const incrementWithoutBatch = () => {
    // These will trigger separate updates
    counterStore.count += 1;
    counterStore.lastUpdate = Date.now();
    counterStore.operations.push("increment");
    counterStore.updates += 1;

    // Track component renders
    setRenderCount((prev) => prev + 1);
  };

  return (
    <div className="counter-container standard">
      <h2>Standard Counter (without batching)</h2>
      <div className="counter-value">
        <p>Count: {counter.count}</p>
        <p>Double: {counter.doubleCount && counter.doubleCount()}</p>
        <p>Triple: {counter.tripleCount && counter.tripleCount()}</p>
        <p>Status: {counter.countStatus && counter.countStatus()}</p>
        <p>Updates: {counter.updates}</p>
      </div>
      <div className="counter-actions">
        <button onClick={incrementWithoutBatch}>Increment (Unbatched)</button>
      </div>
      <div className="counter-stats">
        <p>Component renders: {renderCount}</p>
        <p>Last update: {new Date(counter.lastUpdate).toLocaleTimeString()}</p>
        <p>Operation count: {counter.operations.length}</p>
      </div>
    </div>
  );
}

// Reset button to clear all counters
function ResetButton() {
  const resetAll = () => {
    counterStore.batch(() => {
      counterStore.count = 0;
      counterStore.lastUpdate = Date.now();
      counterStore.operations = [];
      counterStore.updates = 0;
    });
  };

  return (
    <button className="reset-button" onClick={resetAll}>
      Reset All Counters
    </button>
  );
}

// Main application component
export function App() {
  // Apply batching optimization at the root level
  useJodsBatching();

  return (
    <div className="app">
      <h1>JODS Batching Optimization Example</h1>
      <p className="description">
        This example demonstrates how batching multiple store updates improves
        performance. Compare the render counts between the two counters - the
        batched version will re-render less frequently when multiple properties
        change.
      </p>

      <div className="counters">
        <OptimizedCounter />
        <StandardCounter />
      </div>

      <ResetButton />
    </div>
  );
}
