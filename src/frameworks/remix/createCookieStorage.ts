import type { Cookie } from "@remix-run/node";
import type { PersistStorage } from "../../persist/types";
import { debug } from "../../utils/debug";

interface CookieStorageOptions {
  /**
   * Remix Cookie instance
   * @see https://remix.run/docs/en/main/utils/cookies
   */
  cookie: Cookie;

  /**
   * Current request - used for reading cookie value
   */
  request?: Request;

  /**
   * Limits for cookie storage to avoid browser limits
   */
  limits?: {
    /** Max cookie value length in bytes (default: 4000) */
    maxBytes?: number;
  };
}

/**
 * Creates a Remix-compatible cookie storage adapter.
 * This adapter needs to be created per-request since cookies are tied to request/response.
 *
 * @example
 * ```ts
 * // Create a cookie
 * const userCookie = createCookie("user-prefs", {
 *   maxAge: 60 * 60 * 24 * 7, // 1 week
 *   secure: process.env.NODE_ENV === "production",
 *   httpOnly: true,
 * });
 *
 * // In a loader function
 * export async function loader({ request }) {
 *   const cookieStorage = createCookieStorage({
 *     cookie: userCookie,
 *     request
 *   });
 *
 *   // Load from cookie
 *   const state = await getPersisted(cookieStorage);
 *
 *   return json({ state });
 * }
 *
 * // In an action function
 * export async function action({ request }) {
 *   const formData = await request.formData();
 *   const values = Object.fromEntries(formData);
 *
 *   const cookieStorage = createCookieStorage({
 *     cookie: userCookie,
 *     request,
 *   });
 *
 *   // Persist to cookie
 *   await persist(cookieStorage, userStore);
 *
 *   // Create response with cookie
 *   const headers = new Headers();
 *   await cookieStorage.commitToHeaders(headers);
 *
 *   return redirect("/account", { headers });
 * }
 * ```
 */
export function createCookieStorage(
  options: CookieStorageOptions
): PersistStorage & {
  commitToHeaders: (headers: Headers) => Promise<void>;
  commitToResponse: (response: Response) => Promise<Response>;
} {
  const { cookie, request } = options;
  const maxBytes = options.limits?.maxBytes ?? 4000;
  let pendingValue: string | null = null;

  debug.log("persist", "Creating Remix cookie storage adapter");

  return {
    async getItem(key: string): Promise<string | null> {
      if (!request) {
        debug.warn("persist", "No request provided to cookie storage adapter");
        return null;
      }

      const cookieHeader = request.headers.get("Cookie");
      const parsedCookie = await cookie.parse(cookieHeader || "");

      if (!parsedCookie) {
        return null;
      }

      debug.log("persist", `Retrieved value from cookie for key: ${key}`);
      return typeof parsedCookie === "string"
        ? parsedCookie
        : JSON.stringify(parsedCookie);
    },

    async setItem(key: string, value: string): Promise<void> {
      if (value.length > maxBytes) {
        debug.warn(
          "persist",
          `Cookie value exceeds size limit of ${maxBytes} bytes (${value.length} bytes). Data may be truncated.`
        );
      }

      pendingValue = value;
      debug.log("persist", `Set pending cookie value for key: ${key}`);
    },

    async removeItem(key: string): Promise<void> {
      pendingValue = null;
      debug.log("persist", `Removed pending cookie value for key: ${key}`);
    },

    async commitToHeaders(headers: Headers): Promise<void> {
      const cookieHeader =
        pendingValue === null
          ? await cookie.serialize(null)
          : await cookie.serialize(pendingValue);

      headers.append("Set-Cookie", cookieHeader);
      debug.log("persist", "Committed cookie value to headers");
    },

    async commitToResponse(response: Response): Promise<Response> {
      const cookieHeader =
        pendingValue === null
          ? await cookie.serialize(null)
          : await cookie.serialize(pendingValue);

      const newResponse = new Response(response.body, response);
      newResponse.headers.append("Set-Cookie", cookieHeader);

      debug.log("persist", "Committed cookie value to response");
      return newResponse;
    },
  };
}
