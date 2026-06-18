export interface PhoneValidationResult {
  valid: boolean;
  error: string;
}

type Region = "in" | "sg" | "us" | "global";
type ResolvedRegion = Exclude<Region, "global">;

const COUNTRY_TO_REGION: Record<string, ResolvedRegion> = {
  india: "in", ind: "in", in: "in",
  singapore: "sg", sgp: "sg", sg: "sg",
  "united states": "us", "united states of america": "us",
  usa: "us", america: "us", us: "us",
};

// Allowed phone characters: digits, +, -, (, ), whitespace.
// Anything else (letters, @, #, *, …) is rejected.
function hasInvalidChars(phone: string): boolean {
  return /[^0-9+\-()\s]/.test(phone);
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function validateByRegion(raw: string, region: ResolvedRegion): PhoneValidationResult {
  let digits = digitsOnly(raw);

  switch (region) {
    case "in": {
      if ((digits.length === 12 || digits.length === 13) && digits.startsWith("91")) {
        digits = digits.slice(2);
      }
      if (digits.length !== 10) {
        return {
          valid: false,
          error: `Indian phone number must be exactly 10 digits (got ${digits.length})`,
        };
      }
      return { valid: true, error: "" };
    }

    case "sg": {
      if (digits.length === 10 && digits.startsWith("65")) {
        digits = digits.slice(2);
      }
      if (digits.length !== 8) {
        return {
          valid: false,
          error: `Singapore phone number must be exactly 8 digits (got ${digits.length})`,
        };
      }
      return { valid: true, error: "" };
    }

    case "us": {
      if (digits.length === 11 && digits.startsWith("1")) {
        digits = digits.slice(1);
      }
      if (digits.length !== 10) {
        return {
          valid: false,
          error: `US phone number must be exactly 10 digits (got ${digits.length})`,
        };
      }
      return { valid: true, error: "" };
    }
  }
}

export function validatePhone(
  phone: string,
  region: Region,
  countryHint?: string,
): PhoneValidationResult {
  // ── 1. Empty check ────────────────────────────────────────────
  if (!phone || phone.trim() === "") {
    return { valid: false, error: "Phone number is empty" };
  }

  // ── 2. Character check ────────────────────────────────────────
  // Must only contain digits and standard formatting characters.
  if (hasInvalidChars(phone.trim())) {
    return { valid: false, error: "Phone number contains invalid characters" };
  }

  // ── 3. Region / digit-count check ────────────────────────────
  if (region === "global") {
    if (!countryHint || countryHint.trim() === "") {
      return {
        valid: false,
        error: "Global ruleset requires a Country column — no country value found in this row",
      };
    }
    const resolved = COUNTRY_TO_REGION[countryHint.trim().toLowerCase()];
    if (!resolved) {
      return {
        valid: false,
        error: `Unknown country "${countryHint}" — no phone rule defined for this country`,
      };
    }
    return validateByRegion(phone, resolved);
  }

  return validateByRegion(phone, region);
}
