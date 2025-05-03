import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useJodsFetchers } from "../remix/useJodsFetchers";

// Mock the useFetchers hook from Remix
vi.mock("@remix-run/react", () => ({
  useFetchers: vi.fn(),
}));

import { useFetchers } from "@remix-run/react";

describe("useJodsFetchers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should correctly identify submitting fetchers", () => {
    const mockFetchers = [
      {
        state: "submitting",
        formData: new FormData(),
      },
      {
        state: "idle",
        formData: new FormData(),
      },
    ];

    // Add __jods_action to the form data
    mockFetchers[0].formData.append("__jods_action", "user.updateProfile");
    mockFetchers[1].formData.append("__jods_action", "user.updateProfile");

    (useFetchers as any).mockReturnValue(mockFetchers);

    const { result } = renderHook(() => useJodsFetchers("user.updateProfile"));

    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.count).toBe(2);
  });

  it("should correctly filter fetchers by action id", () => {
    const mockFetchers = [
      {
        state: "submitting",
        formData: new FormData(),
      },
      {
        state: "idle",
        formData: new FormData(),
      },
    ];

    mockFetchers[0].formData.append("__jods_action", "user.updateProfile");
    mockFetchers[1].formData.append("__jods_action", "cart.addItem");

    (useFetchers as any).mockReturnValue(mockFetchers);

    const { result } = renderHook(() => useJodsFetchers("user.updateProfile"));

    expect(result.current.count).toBe(1);
    expect(result.current.fetchers.length).toBe(1);
  });

  it("should correctly report isComplete status", () => {
    const mockFetchers = [
      {
        state: "idle",
        formData: new FormData(),
      },
      {
        state: "idle",
        formData: new FormData(),
      },
    ];

    mockFetchers[0].formData.append("__jods_action", "user.updateProfile");
    mockFetchers[1].formData.append("__jods_action", "user.updateProfile");

    (useFetchers as any).mockReturnValue(mockFetchers);

    const { result } = renderHook(() => useJodsFetchers("user.updateProfile"));

    expect(result.current.isComplete).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("should handle empty fetchers array", () => {
    (useFetchers as any).mockReturnValue([]);

    const { result } = renderHook(() => useJodsFetchers("user.updateProfile"));

    expect(result.current.count).toBe(0);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.fetchers).toEqual([]);
  });
});
