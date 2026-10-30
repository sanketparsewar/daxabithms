// Pure accounting maths, separate from the database code so it can be tested.

export const round2 = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export interface GstLine {
  /** Tax-inclusive line total as stored on the order item. */
  lineTotal: number;
  taxRatePercent: number;
}

export interface GstRow {
  ratePercent: number;
  taxableValue: number;
  tax: number;
  total: number;
}

export interface GstSummaryResult {
  rows: GstRow[];
  totalTaxable: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  igst: number;
}

/**
 * Groups order lines by tax rate. Prices are stored tax-inclusive, so a
 * line's tax is lineTotal x r / (100 + r). `factor` scales every line by
 * the share of the order that was actually charged after discounts
 * (1 = no discount), so the report reflects what was really collected.
 */
export function gstSummary(
  lines: (GstLine & { factor: number; isInterState?: boolean })[],
): GstSummaryResult {
  const byRate = new Map<
    number,
    { total: number; tax: number; isInterState: boolean }
  >();

  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  for (const l of lines) {
    const charged = l.lineTotal * l.factor;
    const tax = (charged * l.taxRatePercent) / (100 + l.taxRatePercent);
    const row = byRate.get(l.taxRatePercent) ?? {
      total: 0,
      tax: 0,
      isInterState: Boolean(l.isInterState),
    };
    row.total += charged;
    row.tax += tax;
    row.isInterState = row.isInterState || Boolean(l.isInterState);
    byRate.set(l.taxRatePercent, row);
  }

  const rows: GstRow[] = [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ratePercent, v]) => {
      const roundedTax = round2(v.tax);
      const roundedTotal = round2(v.total);
      const taxableValue = round2(roundedTotal - roundedTax);

      if (v.isInterState) {
        totalIgst = round2(totalIgst + roundedTax);
      } else {
        const cgst = round2(roundedTax / 2);
        const sgst = round2(roundedTax - cgst);
        totalCgst = round2(totalCgst + cgst);
        totalSgst = round2(totalSgst + sgst);
      }

      return {
        ratePercent,
        taxableValue,
        tax: roundedTax,
        total: roundedTotal,
      };
    });

  const totalTaxable = round2(rows.reduce((s, r) => s + r.taxableValue, 0));
  const totalTax = round2(rows.reduce((s, r) => s + r.tax, 0));

  return {
    rows,
    totalTaxable,
    totalTax,
    cgst: totalCgst,
    sgst: totalSgst,
    igst: totalIgst,
  };
}

/** Cash the till should hold at close of day. */
export function expectedCash(
  openingFloat: number,
  cashSales: number,
  cashRefunds: number,
  cashExpenses: number,
): number {
  return round2(openingFloat + cashSales - cashRefunds - cashExpenses);
}
