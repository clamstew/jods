/**
 * Utility to set cache control headers for jods store loaders
 *
 * @param headers The headers object from the loader
 * @param options Cache configuration options
 */
export function setJodsCacheControl(
  headers: Headers,
  options: {
    maxAge?: number;
    staleWhileRevalidate?: number;
    private?: boolean;
  } = {}
) {
  const {
    maxAge = 0,
    staleWhileRevalidate = 0,
    private: isPrivate = true,
  } = options;

  const directives = [isPrivate ? "private" : "public", `max-age=${maxAge}`];

  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  headers.set("Cache-Control", directives.join(", "));
}
