// Decimal-safe financial and GST calculation primitives.
// Server-authoritative, exact cents/paise arithmetic avoiding floating-point drift.

export const GST_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Valid GST state codes in India (01 to 38, plus 97 for other territory) */
export const VALID_GST_STATE_CODES = new Set([
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
  "31", "32", "33", "34", "35", "36", "37", "38", "97",
]);

/** Standard SAC (Services Accounting Code) for food and beverage services */
export const STANDARD_RESTAURANT_SAC = "996331";
export const STANDARD_TAKEAWAY_SAC = "996332";

/** Converts a currency amount to integer minor units (cents / paise) */
export function toCents(amount: number): number {
  return Math.round((Number(amount) + Number.EPSILON) * 100);
}

/** Converts integer minor units back to 2-decimal currency amount */
export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

/** Standard 2-decimal half-up rounding */
export function round2(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/** 4-decimal rounding for unit costs and tax factors */
export function round4(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 10000) / 10000;
}

/** Decimal-safe addition across multiple amounts */
export function safeAdd(...amounts: number[]): number {
  const cents = amounts.reduce((sum, a) => sum + toCents(a), 0);
  return fromCents(cents);
}

/** Decimal-safe subtraction (a - b) */
export function safeSub(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

/** Decimal-safe multiplication with rounding */
export function safeMul(amount: number, factor: number): number {
  return round2(amount * factor);
}

/** Decimal-safe division with rounding */
export function safeDiv(amount: number, divisor: number): number {
  if (divisor === 0) return 0;
  return round2(amount / divisor);
}

/** Computes percentage of a base amount: (base * percent) / 100 */
export function safePercent(base: number, percent: number): number {
  if (base <= 0 || percent <= 0) return 0;
  return round2((base * percent) / 100);
}

/**
 * Extracts tax from a tax-inclusive amount:
 * tax = amount - amount / (1 + rate / 100)
 */
export function extractInclusiveTax(inclusiveTotal: number, taxRatePercent: number): {
  taxableAmount: number;
  taxAmount: number;
} {
  const total = round2(inclusiveTotal);
  if (total <= 0 || taxRatePercent <= 0) {
    return { taxableAmount: total, taxAmount: 0 };
  }
  const tax = round2(total - (total * 100) / (100 + taxRatePercent));
  const taxable = round2(total - tax);
  return { taxableAmount: taxable, taxAmount: tax };
}

/**
 * Grosses up a pre-tax amount with exclusive tax:
 * tax = amount * (rate / 100)
 */
export function addExclusiveTax(preTaxAmount: number, taxRatePercent: number): {
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
} {
  const taxable = round2(preTaxAmount);
  if (taxable <= 0 || taxRatePercent <= 0) {
    return { taxableAmount: taxable, taxAmount: 0, totalAmount: taxable };
  }
  const tax = round2((taxable * taxRatePercent) / 100);
  const total = round2(taxable + tax);
  return { taxableAmount: taxable, taxAmount: tax, totalAmount: total };
}

export interface GstSplit {
  taxableAmount: number;
  totalTax: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  isInterState: boolean;
}

/**
 * Calculates CGST/SGST or IGST split with exact penny/paisa reconciliation:
 * For intra-state supplies, splits totalTax into equal halves.
 * If totalTax is an odd cent (e.g. 0.05), allocating 0.02 and 0.03 guarantees
 * that cgstAmount + sgstAmount === totalTax exactly.
 */
export function calculateGstSplit(
  taxableAmount: number,
  taxRatePercent: number,
  isInterState = false,
): GstSplit {
  const taxable = round2(taxableAmount);
  const rate = round2(taxRatePercent);
  const totalTax = round2((taxable * rate) / 100);

  if (isInterState) {
    return {
      taxableAmount: taxable,
      totalTax,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: rate,
      igstAmount: totalTax,
      isInterState: true,
    };
  }

  const halfRate = round2(rate / 2);
  const totalTaxCents = toCents(totalTax);
  const cgstCents = Math.floor(totalTaxCents / 2);
  const sgstCents = totalTaxCents - cgstCents;

  const cgstAmount = fromCents(cgstCents);
  const sgstAmount = fromCents(sgstCents);

  return {
    taxableAmount: taxable,
    totalTax,
    cgstRate: halfRate,
    cgstAmount,
    sgstRate: halfRate,
    sgstAmount,
    igstRate: 0,
    igstAmount: 0,
    isInterState: false,
  };
}

export interface GstinValidationResult {
  valid: boolean;
  stateCode?: string;
  pan?: string;
  error?: string;
}

/**
 * Validates an Indian Goods and Services Tax Identification Number (GSTIN)
 * Format: 2-digit state code + 10-char PAN + 1-char entity number + 'Z' + 1-char check digit
 * Verifies format, state code validity (01-38, 97), and Luhn mod 36 check digit.
 */
export function validateGstin(gstinRaw: string | null | undefined): GstinValidationResult {
  if (!gstinRaw) {
    return { valid: false, error: "GSTIN is required" };
  }
  const gstin = gstinRaw.trim().toUpperCase();
  if (gstin.length !== 15) {
    return { valid: false, error: "GSTIN must be exactly 15 characters" };
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(gstin)) {
    return { valid: false, error: "Invalid GSTIN format structure" };
  }

  const stateCode = gstin.slice(0, 2);
  if (!VALID_GST_STATE_CODES.has(stateCode)) {
    return { valid: false, error: `Invalid GST state code: ${stateCode}` };
  }

  const pan = gstin.slice(2, 12);

  // Luhn mod-36 checksum algorithm for 15th character
  const inputChars = gstin.slice(0, 14);
  let factor = 1;
  let sum = 0;

  for (let i = 0; i < inputChars.length; i++) {
    const codePoint = GST_CHARS.indexOf(inputChars[i]);
    if (codePoint === -1) {
      return { valid: false, error: "Invalid character in GSTIN" };
    }
    const digit = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    sum += Math.floor(digit / 36) + (digit % 36);
  }

  const remainder = sum % 36;
  const checkDigitIndex = (36 - remainder) % 36;
  const expectedCheckDigit = GST_CHARS[checkDigitIndex];

  if (gstin[14] !== expectedCheckDigit) {
    return {
      valid: false,
      stateCode,
      pan,
      error: `Invalid GSTIN check digit (expected ${expectedCheckDigit}, got ${gstin[14]})`,
    };
  }

  return { valid: true, stateCode, pan };
}

/**
 * Returns India Financial Year string for a given date (April 1 to March 31).
 * E.g., for 2026-10-30 -> "2026-27"
 * E.g., for 2027-02-15 -> "2026-27"
 * E.g., for 2027-04-01 -> "2027-28"
 */
export function getFinancialYear(date: Date = new Date()): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed: 0 = Jan, 2 = Mar, 3 = Apr

  if (month < 3) {
    const startYear = year - 1;
    const endYearShort = String(year).slice(-2);
    return `${startYear}-${endYearShort}`;
  } else {
    const endYearShort = String(year + 1).slice(-2);
    return `${year}-${endYearShort}`;
  }
}

export interface CreditNoteDetails {
  creditNoteNumber: string;
  originalOrderNumber: string;
  financialYear: string;
  issueDate: string;
  refundAmount: number;
  taxReversal: GstSplit;
  reason: string;
  method: string;
}

/**
 * Generates structured credit note documentation for a refund
 */
export function generateCreditNoteDetails(args: {
  refundId: string;
  orderNumber: string;
  refundAmount: number;
  originalTaxRatePercent: number;
  reason?: string | null;
  method: string;
  isInterState?: boolean;
  date?: Date;
}): CreditNoteDetails {
  const date = args.date ?? new Date();
  const fy = getFinancialYear(date);
  const shortId = args.refundId.slice(-4).toUpperCase();
  const creditNoteNumber = `CN/${fy}/${args.orderNumber}-${shortId}`;

  const { taxableAmount, taxAmount } = extractInclusiveTax(
    args.refundAmount,
    args.originalTaxRatePercent,
  );

  const taxReversal = calculateGstSplit(
    taxableAmount,
    args.originalTaxRatePercent,
    args.isInterState ?? false,
  );

  return {
    creditNoteNumber,
    originalOrderNumber: args.orderNumber,
    financialYear: fy,
    issueDate: date.toISOString().slice(0, 10),
    refundAmount: round2(args.refundAmount),
    taxReversal,
    reason: args.reason ?? "Customer refund / return",
    method: args.method,
  };
}
