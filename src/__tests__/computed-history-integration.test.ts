/**
 * Tests for computed property restoration during history time-travel.
 * 
 * This tests the fix for the issue where computed properties become undefined
 * after using history() to time-travel, because JSON serialization loses the
 * computed functions.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { store, computed, history, json } from "../index";
import { ComputedValue } from "../core/computed";

describe("Computed Properties + History Integration", () => {
  describe("basic computed restoration after time-travel", () => {
    interface AppState {
      count: number;
      doubled?: ComputedValue<number>;
    }

    it("should restore computed properties after goBack()", () => {
      const appState = store<AppState>({ count: 5 });
      appState.doubled = computed(() => appState.count * 2);

      const appHistory = history(appState);

      // Initial state: count=5, doubled=10
      expect(appState.doubled).toBe(10);

      // Make some changes
      appState.count = 10; // doubled should be 20
      expect(appState.doubled).toBe(20);

      appState.count = 15; // doubled should be 30
      expect(appState.doubled).toBe(30);

      // Go back in history
      appHistory.back();
      expect(appState.count).toBe(10);
      // This was the bug: doubled would be undefined after time-travel
      expect(appState.doubled).toBe(20);

      // Go back again
      appHistory.back();
      expect(appState.count).toBe(5);
      expect(appState.doubled).toBe(10);

      // Go forward
      appHistory.forward();
      expect(appState.count).toBe(10);
      expect(appState.doubled).toBe(20);

      appHistory.destroy();
    });

    it("should restore computed properties after travelTo()", () => {
      const appState = store<AppState>({ count: 1 });
      appState.doubled = computed(() => appState.count * 2);

      const appHistory = history(appState);

      // Make changes
      appState.count = 2;
      appState.count = 3;
      appState.count = 4;

      // Travel to index 1 (count=2)
      appHistory.travelTo(1);
      expect(appState.count).toBe(2);
      expect(appState.doubled).toBe(4);

      // Travel to index 0 (count=1)
      appHistory.travelTo(0);
      expect(appState.count).toBe(1);
      expect(appState.doubled).toBe(2);

      appHistory.destroy();
    });
  });

  describe("multiple computed properties", () => {
    interface TodoState {
      todos: Array<{ text: string; completed: boolean }>;
      total?: ComputedValue<number>;
      completed?: ComputedValue<number>;
      pending?: ComputedValue<number>;
    }

    it("should restore multiple computed properties after time-travel", () => {
      const todoState = store<TodoState>({
        todos: [],
      });

      todoState.total = computed(() => todoState.todos.length);
      todoState.completed = computed(
        () => todoState.todos.filter((t) => t.completed).length
      );
      todoState.pending = computed(
        () => todoState.todos.filter((t) => !t.completed).length
      );

      const todoHistory = history(todoState);

      // Initial: empty
      expect(todoState.total).toBe(0);
      expect(todoState.completed).toBe(0);
      expect(todoState.pending).toBe(0);

      // Add a todo
      todoState.todos = [{ text: "Task 1", completed: false }];
      expect(todoState.total).toBe(1);
      expect(todoState.pending).toBe(1);

      // Complete it
      todoState.todos = [{ text: "Task 1", completed: true }];
      expect(todoState.completed).toBe(1);
      expect(todoState.pending).toBe(0);

      // Go back - should restore computed properties
      todoHistory.back();
      expect(todoState.total).toBe(1);
      expect(todoState.completed).toBe(0);
      expect(todoState.pending).toBe(1);

      // Go back to empty
      todoHistory.back();
      expect(todoState.total).toBe(0);
      expect(todoState.completed).toBe(0);
      expect(todoState.pending).toBe(0);

      todoHistory.destroy();
    });
  });

  describe("nested computed properties", () => {
    interface StatsState {
      values: number[];
      sum?: ComputedValue<number>;
      average?: ComputedValue<number>;
    }

    it("should handle computed properties that depend on other computed", () => {
      const statsState = store<StatsState>({
        values: [1, 2, 3],
      });

      statsState.sum = computed(() =>
        statsState.values.reduce((a, b) => a + b, 0)
      );
      // average depends on sum (another computed)
      statsState.average = computed(() =>
        statsState.values.length > 0
          ? statsState.sum! / statsState.values.length
          : 0
      );

      const statsHistory = history(statsState);

      expect(statsState.sum).toBe(6);
      expect(statsState.average).toBe(2);

      // Add a value
      statsState.values = [1, 2, 3, 4];
      expect(statsState.sum).toBe(10);
      expect(statsState.average).toBe(2.5);

      // Go back
      statsHistory.back();
      expect(statsState.sum).toBe(6);
      expect(statsState.average).toBe(2);

      statsHistory.destroy();
    });
  });

  describe("computed with array methods", () => {
    interface TagState {
      items: Array<{ tags: string[] }>;
      allTags?: ComputedValue<string[]>;
    }

    it("should allow array methods on restored computed arrays", () => {
      const tagState = store<TagState>({
        items: [{ tags: ["a", "b"] }, { tags: ["c"] }],
      });

      tagState.allTags = computed(() =>
        tagState.items.flatMap((item) => item.tags)
      );

      const tagHistory = history(tagState);

      // Initial state
      expect(tagState.allTags!.join(", ")).toBe("a, b, c");
      expect(tagState.allTags!.length).toBe(3);

      // Modify
      tagState.items = [{ tags: ["x", "y", "z"] }];
      expect(tagState.allTags!.join(", ")).toBe("x, y, z");

      // Go back - array methods should still work
      tagHistory.back();
      expect(tagState.allTags!.join(", ")).toBe("a, b, c");
      expect(tagState.allTags!.length).toBe(3);
      expect(tagState.allTags!.map((t) => t.toUpperCase())).toEqual([
        "A",
        "B",
        "C",
      ]);

      tagHistory.destroy();
    });
  });

  describe("nested object computed properties (like store.stats.total)", () => {
    interface TodoStats {
      total?: ComputedValue<number>;
      completed?: ComputedValue<number>;
      pending?: ComputedValue<number>;
    }

    interface AppState {
      todos: Array<{ text: string; completed: boolean }>;
      stats: TodoStats;
    }

    it("should restore computed properties on nested objects after time-travel", () => {
      const appState = store<AppState>({
        todos: [],
        stats: {},
      });

      // Set up nested computed properties (like in the todo-app)
      appState.stats.total = computed(() => appState.todos.length);
      appState.stats.completed = computed(
        () => appState.todos.filter((t) => t.completed).length
      );
      appState.stats.pending = computed(
        () => appState.todos.filter((t) => !t.completed).length
      );

      const appHistory = history(appState);

      // Initial state
      expect(appState.stats.total).toBe(0);
      expect(appState.stats.completed).toBe(0);
      expect(appState.stats.pending).toBe(0);

      // Add todos
      appState.todos = [
        { text: "Task 1", completed: false },
        { text: "Task 2", completed: true },
      ];
      expect(appState.stats.total).toBe(2);
      expect(appState.stats.completed).toBe(1);
      expect(appState.stats.pending).toBe(1);

      // Add more
      appState.todos = [
        { text: "Task 1", completed: false },
        { text: "Task 2", completed: true },
        { text: "Task 3", completed: true },
      ];
      expect(appState.stats.total).toBe(3);
      expect(appState.stats.completed).toBe(2);
      expect(appState.stats.pending).toBe(1);

      // Time-travel back - THIS was the bug!
      appHistory.back();
      expect(appState.stats.total).toBe(2);
      expect(appState.stats.completed).toBe(1);
      expect(appState.stats.pending).toBe(1);

      // Time-travel to beginning
      appHistory.travelTo(0);
      expect(appState.stats.total).toBe(0);
      expect(appState.stats.completed).toBe(0);
      expect(appState.stats.pending).toBe(0);

      // Time-travel forward to latest
      const latestIndex = appHistory.getEntries().length - 1;
      appHistory.travelTo(latestIndex);
      expect(appState.stats.total).toBe(3);
      expect(appState.stats.completed).toBe(2);
      expect(appState.stats.pending).toBe(1);

      appHistory.destroy();
    });

    it("should handle deeply nested computed properties", () => {
      interface DeepState {
        level1: {
          level2: {
            computed?: ComputedValue<number>;
          };
        };
        count: number;
      }

      const deepState = store<DeepState>({
        level1: { level2: {} },
        count: 5,
      });

      deepState.level1.level2.computed = computed(() => deepState.count * 10);

      const deepHistory = history(deepState);

      expect(deepState.level1.level2.computed).toBe(50);

      deepState.count = 10;
      expect(deepState.level1.level2.computed).toBe(100);

      // Time-travel back
      deepHistory.back();
      expect(deepState.level1.level2.computed).toBe(50);

      deepHistory.destroy();
    });
  });
});

