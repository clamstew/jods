import { describe, it, expect, vi } from "vitest";
import {
  createSignal,
  getCurrentSubscriber,
  setCurrentSubscriber,
} from "../../../core/store/signal";

describe("Signal Management (signal.ts)", () => {
  describe("createSignal", () => {
    it("should return a pair of functions (read, write)", () => {
      const [read, write] = createSignal(0);
      expect(typeof read).toBe("function");
      expect(typeof write).toBe("function");
    });

    it("read function should return the current value", () => {
      const [read] = createSignal(10);
      expect(read()).toBe(10);
    });

    it("write function should update the value", () => {
      const [read, write] = createSignal(0);
      write(20);
      expect(read()).toBe(20);
    });

    it("write function should not update if value is the same (Object.is)", () => {
      const initialValue = { a: 1 };
      const [read, write] = createSignal(initialValue);
      const result = write(initialValue); // Write same object instance
      expect(read()).toBe(initialValue);
      expect(result).toBe(false); // Should indicate no change was made

      const numSignal = createSignal(0);
      const numResult1 = numSignal[1](0); // write 0 when it's already 0
      expect(numResult1).toBe(false);

      // Test NaN
      const nanSignal = createSignal(NaN);
      const nanResult = nanSignal[1](NaN);
      expect(nanResult).toBe(false);
      expect(isNaN(nanSignal[0]())).toBe(true);

      // Test +0 and -0 (Object.is considers them different)
      const zeroSignal = createSignal(+0);
      const zeroResult = zeroSignal[1](-0);
      expect(zeroResult).toBe(true); // Change should happen
      expect(Object.is(zeroSignal[0](), -0)).toBe(true);
    });

    it("read function should add current subscriber (a () => void callback) to its subscribers list", () => {
      const [read] = createSignal(0);
      const mockCb = vi.fn();
      setCurrentSubscriber(mockCb);
      read(); // Access to subscribe
      setCurrentSubscriber(null);
      expect((read as any).subscribers.has(mockCb)).toBe(true);
    });

    it("write function should call subscribed ( () => void ) callbacks if value changes", () => {
      const [read, write] = createSignal(0);
      const mockCb1 = vi.fn();
      const mockCb2 = vi.fn();

      setCurrentSubscriber(mockCb1);
      read(); // mockCb1 subscribes
      setCurrentSubscriber(mockCb2);
      read(); // mockCb2 subscribes
      setCurrentSubscriber(null);

      write(5);

      expect(mockCb1).toHaveBeenCalledTimes(1);
      expect(mockCb2).toHaveBeenCalledTimes(1);
    });

    it("write function should not call ( () => void ) callbacks if value does not change", () => {
      const [read, write] = createSignal(0);
      const mockCb = vi.fn();

      setCurrentSubscriber(mockCb);
      read(); // mockCb subscribes
      setCurrentSubscriber(null);

      mockCb.mockClear();

      write(0); // Write same value

      expect(mockCb).not.toHaveBeenCalled();
    });
  });

  describe("getCurrentSubscriber and setCurrentSubscriber", () => {
    it("should get and set the current global subscriber (a () => void callback)", () => {
      expect(getCurrentSubscriber()).toBeNull();
      const mockCb = vi.fn(); // Represents a tracking callback or similar
      setCurrentSubscriber(mockCb);
      expect(getCurrentSubscriber()).toBe(mockCb);
      setCurrentSubscriber(null);
      expect(getCurrentSubscriber()).toBeNull();
    });

    it("setting to null should clear the current subscriber (a () => void callback)", () => {
      const mockCb = vi.fn();
      setCurrentSubscriber(mockCb);
      expect(getCurrentSubscriber()).not.toBeNull();
      setCurrentSubscriber(null);
      expect(getCurrentSubscriber()).toBeNull();
    });
  });
});
