// THE phone normalizer. Every ingestion point — CSV upload, streaming
// events, webhooks, opt-outs — must call normalizePhone and store its
// output. Never reimplement per adapter: inconsistent normalization is
// the #1 source of duplicate-profile bugs.

/**
 * Normalize a raw phone string to E.164. Returns null if the input can't
 * be a valid phone number.
 *
 * Handles the formats Indian POS exports actually contain:
 *   "98100 12345", "+91-98100-12345", "09810012345", "919810012345",
 *   "+91 9810012345", "9810012345"
 *
 * defaultCountryCode is applied when the number has no country prefix
 * (default "91" — India). Non-Indian numbers with an explicit +CC pass
 * through with basic length validation.
 */
export function normalizePhone(raw: string, defaultCountryCode = "91"): string | null {
  if (!raw) return null;
  const hasPlus = raw.trim().startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;

  if (hasPlus) {
    // Explicit country code: minimal validation, pass through.
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  // Strip a single leading trunk zero ("09810012345" → "9810012345").
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);

  if (defaultCountryCode === "91") {
    // "919810012345" — CC already present without the plus.
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    // Indian mobiles are exactly 10 digits starting 6-9.
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) return null;
    return `+91${digits}`;
  }

  if (digits.length < 8 || digits.length > 15) return null;
  return `+${defaultCountryCode}${digits}`;
}
