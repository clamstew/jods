import { describe, it, expect, beforeEach } from "vitest";
import {
  registerStore,
  getStore,
  getAllStores,
} from "../remix/internal/registry";

describe("Store Registry", () => {
  // Clear the registry before each test to ensure test isolation
  beforeEach(() => {
    // Access the internal storeRegistry and clear it
    // This is a bit of a hack, but it's the easiest way to reset the registry between tests
    const anyRegistry = getAllStores as any;
    const registry = anyRegistry.__registry || {};
    Object.keys(registry).forEach((key) => {
      delete registry[key];
    });
  });

  it("should register and retrieve a store", () => {
    // Create a mock store
    const mockStore = { name: "testStore", data: { value: 42 } };

    // Register the store
    registerStore("testStore", mockStore);

    // Retrieve the store
    const retrievedStore = getStore("testStore");

    // Verify it's the same store
    expect(retrievedStore).toBe(mockStore);
  });

  it("should return undefined for non-existent stores", () => {
    const nonExistentStore = getStore("nonExistentStore");
    expect(nonExistentStore).toBeUndefined();
  });

  it("should overwrite existing stores with the same name", () => {
    const firstStore = { name: "duplicate", data: { value: 1 } };
    const secondStore = { name: "duplicate", data: { value: 2 } };

    registerStore("duplicate", firstStore);
    registerStore("duplicate", secondStore);

    const retrievedStore = getStore("duplicate");

    expect(retrievedStore).toBe(secondStore);
    expect(retrievedStore).not.toBe(firstStore);
  });

  it("should retrieve all registered stores", () => {
    // Register multiple stores
    const storeA = { name: "storeA", data: { a: 1 } };
    const storeB = { name: "storeB", data: { b: 2 } };
    const storeC = { name: "storeC", data: { c: 3 } };

    registerStore("storeA", storeA);
    registerStore("storeB", storeB);
    registerStore("storeC", storeC);

    // Get all stores
    const allStores = getAllStores();

    // Verify all stores are returned
    expect(allStores).toContain(storeA);
    expect(allStores).toContain(storeB);
    expect(allStores).toContain(storeC);
    expect(allStores.length).toBe(3);
  });

  it("should return an empty array when no stores are registered", () => {
    const allStores = getAllStores();
    expect(Array.isArray(allStores)).toBe(true);
    expect(allStores.length).toBe(0);
  });
});
