export interface DateValidationResult {
  valid: boolean;
  error: string;
}

export interface TimeValidationResult {
  valid: boolean;
  error: string;
}

export type DateSchema = "iso" | "us" | "eu";

// Returns the number of days in a given month (handles leap years)
function daysInMonth(year: number, month: number): number {
  // Date(year, month, 0) → last day of month-1, i.e. the month we want
  return new Date(year, month, 0).getDate();
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (year < 1 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return true;
}

function isRealTime(hh: number, mm: number, ss: number): boolean {
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59 && ss >= 0 && ss <= 59;
}

export function validateDate(value: string, schema: DateSchema): DateValidationResult {
  if (!value || value.trim() === "") {
    return { valid: false, error: "Date field is empty" };
  }

  const v = value.trim();

  switch (schema) {
    case "iso": {
      // Accepts: YYYY-MM-DD  or  YYYY-MM-DD HH:MM:SS
      const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/;
      const withTime = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;

      const m = v.match(withTime) ?? v.match(dateOnly);
      if (!m) {
        return {
          valid: false,
          error: `"${v}" does not match ISO 8601 format — expected YYYY-MM-DD or YYYY-MM-DD HH:MM:SS`,
        };
      }

      const [, y, mo, d, hh = "0", mm = "0", ss = "0"] = m;
      if (!isRealDate(+y, +mo, +d)) {
        return { valid: false, error: `"${v}" is not a real calendar date (check day/month)` };
      }
      if (!isRealTime(+hh, +mm, +ss)) {
        return { valid: false, error: `"${v}" contains an invalid time component` };
      }
      return { valid: true, error: "" };
    }

    case "us": {
      // MM/DD/YYYY
      const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!m) {
        return {
          valid: false,
          error: `"${v}" does not match US format — expected MM/DD/YYYY`,
        };
      }
      const [, mo, d, y] = m;
      if (!isRealDate(+y, +mo, +d)) {
        return { valid: false, error: `"${v}" is not a real calendar date (check day/month)` };
      }
      return { valid: true, error: "" };
    }

    case "eu": {
      // DD/MM/YYYY  (Indian / European)
      const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!m) {
        return {
          valid: false,
          error: `"${v}" does not match Indian/EU format — expected DD/MM/YYYY`,
        };
      }
      const [, d, mo, y] = m;
      if (!isRealDate(+y, +mo, +d)) {
        return { valid: false, error: `"${v}" is not a real calendar date (check day/month)` };
      }
      return { valid: true, error: "" };
    }
  }
}

// Validates a standalone time field in HH:MM:SS format.
// Hours 0–23, minutes 0–59, seconds 0–59.
export function validateTime(value: string): TimeValidationResult {
  if (!value || value.trim() === "") {
    return { valid: false, error: "Time field is empty" };
  }

  const v = value.trim();
  const m = v.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!m) {
    return {
      valid: false,
      error: `"${v}" — Invalid time format — expected HH:MM:SS`,
    };
  }

  const [, hh, mm, ss] = m;
  if (!isRealTime(+hh, +mm, +ss)) {
    return {
      valid: false,
      error: `"${v}" — Invalid time format — expected HH:MM:SS`,
    };
  }

  return { valid: true, error: "" };
}
