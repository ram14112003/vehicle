/** Robust normalizer:
 * - Accepts array
 * - Accepts CSV or newline string
 * - Accepts JSON array string: '["a@x.com","b@x.com"]'
 */
export function normalizeManagerEmails(input: unknown): string[] {
  // If it's already an array-like, normalize each item.
  if (Array.isArray(input)) {
    return input
      .map(e => String(e || "").trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof input === "string") {
    const s = input.trim();

    // If it looks like a JSON array, parse and recurse.
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        return normalizeManagerEmails(parsed);
      } catch {
        // fall through to CSV/newline split if JSON.parse fails
      }
    }

    // Fallback: split by newline or comma
    return s
      .split(/[\n,\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
  }

  // Unknown type -> empty
  return [];
}
