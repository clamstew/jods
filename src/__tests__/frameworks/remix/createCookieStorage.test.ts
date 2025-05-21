/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCookieStorage } from "../../../frameworks/remix/createCookieStorage";
import { persist, getPersisted, clearPersisted } from "../../../persist";
import { store } from "../../../core/store";

// Mock Remix Cookie
const createMockCookie = () => {
  return {
    name: "test-cookie",
    isSigned: false,
    parse: vi.fn(async (cookieHeader: string) => {
      if (!cookieHeader) return null;
      try {
        return JSON.parse(cookieHeader);
      } catch {
        return cookieHeader;
      }
    }),
    serialize: vi.fn(async (value: any) => {
      if (value === null) {
        return "test-cookie=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax";
      }
      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);
      return `test-cookie=${serialized}; Path=/; HttpOnly; SameSite=Lax`;
    }),
  };
};

// Mock store interface
interface TestStore {
  count: number;
  name: string;
}

describe("createCookieStorage", () => {
  let warnSpy: any;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("should read values from request cookies", async () => {
    // Create request with cookie header
    const cookieData = JSON.stringify({ count: 42, name: "Cookie Test" });
    const request = new Request("https://example.com", {
      headers: {
        Cookie: cookieData,
      },
    });

    const mockCookie = createMockCookie();

    // Create cookie storage with the request
    const cookieStorage = createCookieStorage({
      cookie: mockCookie,
      request,
    });

    // Create a store to use with the cookie storage
    const testStore = store<TestStore>({ count: 0, name: "" });

    // Get persisted data from cookies
    const data = await getPersisted<TestStore>(cookieStorage);
    expect(data).toEqual({ count: 42, name: "Cookie Test" });

    // Apply data to store (manually, since getPersisted doesn't do this automatically)
    if (data) {
      Object.assign(testStore, data);
    }

    // Verify the cookie parse method was called
    expect(mockCookie.parse).toHaveBeenCalledWith(cookieData);

    // Verify store was updated with cookie data
    expect(testStore.count).toBe(42);
    expect(testStore.name).toBe("Cookie Test");
  });

  it("should write values to response headers", async () => {
    const mockCookie = createMockCookie();

    // Create cookie storage without request (for writing only)
    const cookieStorage = createCookieStorage({
      cookie: mockCookie,
    });

    // Create a store with test data
    const testStore = store<TestStore>({ count: 99, name: "New Data" });

    // Persist store to cookie storage
    await persist(cookieStorage, testStore);

    // Create headers to save cookie
    const headers = new Headers();
    await cookieStorage.commitToHeaders(headers);

    // Verify cookie serialize was called
    expect(mockCookie.serialize).toHaveBeenCalled();

    // Verify headers were set
    const setCookieHeader = headers.get("Set-Cookie");
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain("test-cookie=");
  });

  it("should write values to response object", async () => {
    const mockCookie = createMockCookie();

    // Create cookie storage
    const cookieStorage = createCookieStorage({
      cookie: mockCookie,
    });

    // Create a store with test data
    const testStore = store<TestStore>({ count: 77, name: "Response Test" });

    // Persist store to cookie storage
    await persist(cookieStorage, testStore);

    // Create a response and commit cookie
    const response = new Response("Test body");
    const newResponse = await cookieStorage.commitToResponse(response);

    // Verify cookie serialize was called
    expect(mockCookie.serialize).toHaveBeenCalled();

    // Verify response headers were set
    const setCookieHeader = newResponse.headers.get("Set-Cookie");
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain("test-cookie=");
  });

  it("should respect size limits", async () => {
    const mockCookie = createMockCookie();

    // Create a large string
    const largeString = "x".repeat(5000);

    // Create cookie storage with small limit
    const cookieStorage = createCookieStorage({
      cookie: mockCookie,
      limits: {
        maxBytes: 1000,
      },
    });

    // Create a store with large data
    const testStore = store<TestStore>({ count: 1, name: largeString });

    // Persist store to cookie storage
    await persist(cookieStorage, testStore);

    // Create headers to save cookie
    const headers = new Headers();
    await cookieStorage.commitToHeaders(headers);

    // Verify cookie was still serialized despite warning
    expect(mockCookie.serialize).toHaveBeenCalled();
  });

  it("should clear cookie when removing item", async () => {
    const mockCookie = createMockCookie();

    // Create cookie storage
    const cookieStorage = createCookieStorage({
      cookie: mockCookie,
    });

    // Remove item
    await clearPersisted(cookieStorage);

    // Create headers to save cookie
    const headers = new Headers();
    await cookieStorage.commitToHeaders(headers);

    // Verify cookie was serialized with null
    expect(mockCookie.serialize).toHaveBeenCalledWith(null);
  });
});
