import { BadRequestException } from '@nestjs/common';
import {
  calculateGstSplit,
  extractInclusiveTax,
  addExclusiveTax,
  fromCents,
  getFinancialYear,
  generateCreditNoteDetails,
  round2,
  safeAdd,
  safeDiv,
  safeMul,
  safePercent,
  safeSub,
  toCents,
  validateGstin,
  STANDARD_RESTAURANT_SAC,
} from '@daxabithms/types';
import {
  computeOrderTotals,
  priceLine,
  toEffectiveInclusiveUnitPrice,
} from './pricing';
import { computeBill, settlePayments } from './settlement';
import { expectedCash, gstSummary } from '../accounting/accounting.calc';

describe('Financial Application Audit & Reconciliation Test Suite', () => {
  describe('1. Decimal-Safe Arithmetic Primitives & Rounding Boundaries', () => {
    it('eliminates floating-point addition drift', () => {
      // Classic JS float trap: 0.1 + 0.2 === 0.30000000000000004
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(safeAdd(0.1, 0.2)).toBe(0.3);
      expect(safeAdd(19.99, 0.01, 5.5, 0.05)).toBe(25.55);
    });

    it('eliminates floating-point subtraction drift', () => {
      // Classic JS float trap: 1.0 - 0.9 === 0.09999999999999998
      expect(safeSub(1.0, 0.9)).toBe(0.1);
      expect(safeSub(100.55, 50.25)).toBe(50.3);
    });

    it('performs exact minor-unit (cents/paise) conversions', () => {
      expect(toCents(123.45)).toBe(12345);
      expect(toCents(0.01)).toBe(1);
      expect(fromCents(12345)).toBe(123.45);
      expect(fromCents(1)).toBe(0.01);
    });

    it('executes half-up rounding accurately at critical boundaries', () => {
      expect(round2(10.005)).toBe(10.01);
      expect(round2(10.0049)).toBe(10.0);
      expect(round2(10.0051)).toBe(10.01);
      expect(round2(0.005)).toBe(0.01);
    });

    it('computes percentage and divisions without divide-by-zero errors', () => {
      expect(safePercent(200, 15)).toBe(30);
      expect(safePercent(99.99, 5)).toBe(5);
      expect(safeDiv(100, 0)).toBe(0);
      expect(safeDiv(100, 3)).toBe(33.33);
      expect(safeMul(33.33, 3)).toBe(99.99);
    });

    it('extracts inclusive tax and adds exclusive tax with exact decimal precision', () => {
      const inc = extractInclusiveTax(118, 18);
      expect(inc.taxAmount).toBe(18);
      expect(inc.taxableAmount).toBe(100);

      const exc = addExclusiveTax(100, 18);
      expect(exc.taxAmount).toBe(18);
      expect(exc.taxableAmount).toBe(100);
      expect(exc.totalAmount).toBe(118);
    });
  });

  describe('2. Menu, Portion, Modifier & Combo Pricing', () => {
    it('prices basic menu items accurately in tax-inclusive mode', () => {
      const line = priceLine({
        quantity: 3,
        unitPriceInclusive: 150,
        taxRatePercent: 5,
      });
      expect(line.lineTotal).toBe(450);
      // At 5% inclusive, tax = 450 - (450 * 100 / 105) = 21.43
      expect(line.taxAmount).toBe(21.43);
    });

    it('handles portion-based pricing (Half portion vs Full portion)', () => {
      const fullPortionPrice = 240;
      const halfPortionPrice = 140;

      const fullLine = priceLine({
        quantity: 2,
        unitPriceInclusive: fullPortionPrice,
        taxRatePercent: 5,
      });
      const halfLine = priceLine({
        quantity: 2,
        unitPriceInclusive: halfPortionPrice,
        taxRatePercent: 5,
      });

      expect(fullLine.lineTotal).toBe(480);
      expect(halfLine.lineTotal).toBe(280);
    });

    it('multiplies modifier adjustments strictly by item quantity', () => {
      const basePrice = 200;
      const extraCheese = 40;
      const baconStrip = 50;
      const quantity = 3;

      const unitPriceInclusive = basePrice + extraCheese + baconStrip; // 290
      const line = priceLine({
        quantity,
        unitPriceInclusive,
        taxRatePercent: 18,
      });

      expect(line.lineTotal).toBe(870); // 290 * 3
      // At 18% inclusive: 870 - (870 * 100 / 118) = 132.71
      expect(line.taxAmount).toBe(132.71);
    });

    it('handles combo bundle pricing where bundled components do not charge extra', () => {
      const comboParentPrice = 399; // Burger + Fries + Drink bundle
      const comboLine = priceLine({
        quantity: 2,
        unitPriceInclusive: comboParentPrice,
        taxRatePercent: 5,
      });
      expect(comboLine.lineTotal).toBe(798);

      const componentBurger = priceLine({
        quantity: 2,
        unitPriceInclusive: 0,
        taxRatePercent: 5,
      });
      const componentFries = priceLine({
        quantity: 2,
        unitPriceInclusive: 0,
        taxRatePercent: 5,
      });
      const componentDrink = priceLine({
        quantity: 2,
        unitPriceInclusive: 0,
        taxRatePercent: 5,
      });

      const totals = computeOrderTotals([
        comboLine,
        componentBurger,
        componentFries,
        componentDrink,
      ]);
      expect(totals.totalAmount).toBe(798);
      expect(totals.subtotal).toBe(798);
    });

    it('grosses up menu prices when branch operates in EXCLUSIVE tax mode', () => {
      const rawPrice = 100;
      const taxRate = 10;
      const effectiveInclusive = toEffectiveInclusiveUnitPrice(
        rawPrice,
        taxRate,
        'EXCLUSIVE',
      );
      expect(effectiveInclusive).toBe(110);

      const effectiveUnchanged = toEffectiveInclusiveUnitPrice(
        rawPrice,
        taxRate,
        'INCLUSIVE',
      );
      expect(effectiveUnchanged).toBe(100);
    });
  });

  describe('3. Discounts & Pro-Rata Tax Reduction', () => {
    it('applies percentage and flat discounts accurately', () => {
      const line1 = priceLine({
        quantity: 1,
        unitPriceInclusive: 500,
        taxRatePercent: 5,
      });
      const totals = computeOrderTotals([line1], 10, 50); // 10% + 50 flat
      expect(totals.subtotal).toBe(500);
      expect(totals.discountAmount).toBe(100); // 500 * 0.10 + 50 = 100
      expect(totals.totalAmount).toBe(400);
    });

    it('caps total discount at 100% of subtotal so bill cannot be negative', () => {
      const line1 = priceLine({
        quantity: 1,
        unitPriceInclusive: 100,
        taxRatePercent: 0,
      });
      const bill = computeBill({ lines: [line1], discountFlat: 250 });
      expect(bill.discountAmount).toBe(100);
      expect(bill.discountPercent).toBe(100);
      expect(bill.totalDue).toBe(0);
    });

    it('scales the tax breakup pro-rata with discounts', () => {
      // 118 with 18% tax has 18 tax.
      // 50% discount reduces subtotal to 59, so tax collected is exactly 9.
      const line1 = priceLine({
        quantity: 1,
        unitPriceInclusive: 118,
        taxRatePercent: 18,
      });
      const bill = computeBill({ lines: [line1], discountPercent: 50 });
      expect(bill.subtotal).toBe(118);
      expect(bill.discountAmount).toBe(59);
      expect(bill.taxAmount).toBe(9);
      expect(bill.totalDue).toBe(59);
    });
  });

  describe('4. India GST Engine (GSTIN, CGST, SGST, IGST, HSN/SAC, Rounding)', () => {
    it('validates authentic 15-character GSTIN with Luhn-mod-36 check digit', () => {
      // Valid GSTIN: 27AAPFU0939F1ZV (Maharashtra state code 27)
      const res = validateGstin('27AAPFU0939F1ZV');
      expect(res.valid).toBe(true);
      expect(res.stateCode).toBe('27');
      expect(res.pan).toBe('AAPFU0939F');

      // Invalid check digit
      const invalidDigit = validateGstin('27AAPFU0939F1ZX');
      expect(invalidDigit.valid).toBe(false);
      expect(invalidDigit.error).toContain('check digit');

      // Invalid state code
      const invalidState = validateGstin('99AAPFU0939F1ZV');
      expect(invalidState.valid).toBe(false);
      expect(invalidState.error).toContain('state code');

      // Invalid length
      expect(validateGstin('27AAPFU0939F1Z').valid).toBe(false);
      expect(validateGstin(null).valid).toBe(false);
    });

    it('splits intra-state GST into equal CGST and SGST without penny leakage', () => {
      // At ₹100 taxable with 5% GST: total tax = ₹5.00 -> CGST: ₹2.50, SGST: ₹2.50
      const split = calculateGstSplit(100, 5, false);
      expect(split.isInterState).toBe(false);
      expect(split.cgstRate).toBe(2.5);
      expect(split.sgstRate).toBe(2.5);
      expect(split.cgstAmount).toBe(2.5);
      expect(split.sgstAmount).toBe(2.5);
      expect(safeAdd(split.cgstAmount, split.sgstAmount)).toBe(split.totalTax);
    });

    it('guarantees cgst + sgst === totalTax down to the exact paisa on odd tax values', () => {
      // Odd tax value: ₹1.05 total tax
      // At 5% rate on 21.00 taxable: 21.00 * 0.05 = 1.05
      const split = calculateGstSplit(21.0, 5, false);
      expect(split.totalTax).toBe(1.05);
      expect(split.cgstAmount).toBe(0.52);
      expect(split.sgstAmount).toBe(0.53);
      expect(safeAdd(split.cgstAmount, split.sgstAmount)).toBe(1.05);
    });

    it('routes 100% tax to IGST for inter-state transactions', () => {
      const split = calculateGstSplit(500, 18, true);
      expect(split.isInterState).toBe(true);
      expect(split.cgstAmount).toBe(0);
      expect(split.sgstAmount).toBe(0);
      expect(split.igstRate).toBe(18);
      expect(split.igstAmount).toBe(90);
      expect(split.totalTax).toBe(90);
    });

    it('verifies standard SAC code for restaurant services', () => {
      expect(STANDARD_RESTAURANT_SAC).toBe('996331');
    });

    it('resolves correct India financial year from calendar date', () => {
      expect(getFinancialYear(new Date('2026-10-30'))).toBe('2026-27');
      expect(getFinancialYear(new Date('2027-01-15'))).toBe('2026-27');
      expect(getFinancialYear(new Date('2027-03-31'))).toBe('2026-27');
      expect(getFinancialYear(new Date('2027-04-01'))).toBe('2027-28');
    });

    it('conserves cents across 1,000 random transaction splits', () => {
      for (let i = 1; i <= 1000; i++) {
        const taxable = i * 0.37;
        const rate = i % 4 === 0 ? 18 : i % 3 === 0 ? 12 : 5;
        const split = calculateGstSplit(taxable, rate, false);
        const sumOfHalves = safeAdd(split.cgstAmount, split.sgstAmount);
        expect(sumOfHalves).toBe(split.totalTax);
      }
    });
  });

  describe('5. Service Charges, Tips & Delivery Fees', () => {
    it('isolates tips outside the taxable subtotal', () => {
      const line = priceLine({
        quantity: 1,
        unitPriceInclusive: 118,
        taxRatePercent: 18,
      });
      const bill = computeBill({
        lines: [line],
        tip: 25,
      });
      // Tip must not increase taxable subtotal or tax amount
      expect(bill.subtotal).toBe(118);
      expect(bill.taxAmount).toBe(18);
      expect(bill.tipAmount).toBe(25);
      expect(bill.totalDue).toBe(143); // 118 + 25
    });

    it('adds delivery fee to total due without augmenting item subtotal', () => {
      const line = priceLine({
        quantity: 1,
        unitPriceInclusive: 200,
        taxRatePercent: 5,
      });
      const bill = computeBill({
        lines: [line],
        deliveryFee: 40,
        tip: 10,
      });
      expect(bill.subtotal).toBe(200);
      expect(bill.deliveryFee).toBe(40);
      expect(bill.totalDue).toBe(250);
    });
  });

  describe('6. Multiple Payment Methods & Split Payments', () => {
    it('settles exact split payments across CASH, CARD, and UPI', () => {
      const settlement = settlePayments({
        balance: 1000,
        payments: [
          { method: 'CASH', amount: 300 },
          { method: 'CARD', amount: 500 },
          { method: 'UPI', amount: 200 },
        ],
      });
      expect(settlement.fullyPaid).toBe(true);
      expect(settlement.paidNow).toBe(1000);
      expect(settlement.balanceAfter).toBe(0);
      expect(settlement.changeDue).toBe(0);
      expect(settlement.payments).toHaveLength(3);
    });

    it('calculates change given when cash is over-tendered', () => {
      const settlement = settlePayments({
        balance: 450,
        payments: [{ method: 'CASH', amount: 450, tendered: 500 }],
      });
      expect(settlement.fullyPaid).toBe(true);
      expect(settlement.changeDue).toBe(50);
      expect(settlement.payments[0].changeGiven).toBe(50);
      expect(settlement.payments[0].amount).toBe(450);
    });

    it('strictly forbids over-tendering on non-cash payment methods', () => {
      expect(() =>
        settlePayments({
          balance: 200,
          payments: [{ method: 'CARD', amount: 250 }],
        }),
      ).toThrow(BadRequestException);

      expect(() =>
        settlePayments({
          balance: 200,
          payments: [{ method: 'UPI', amount: 200, tendered: 250 }],
        }),
      ).toThrow(BadRequestException);
    });

    it('enforces partial payment restrictions unless allowPartial is enabled', () => {
      expect(() =>
        settlePayments({
          balance: 1000,
          payments: [{ method: 'CASH', amount: 600 }],
        }),
      ).toThrow(/do not cover the total due/);

      const partial = settlePayments({
        balance: 1000,
        payments: [{ method: 'CASH', amount: 600 }],
        allowPartial: true,
      });
      expect(partial.fullyPaid).toBe(false);
      expect(partial.paidNow).toBe(600);
      expect(partial.balanceAfter).toBe(400);
    });
  });

  describe('7. Refunds, Cancellations & Credit Notes', () => {
    it('generates structured Credit Note details for order refunds', () => {
      const creditNote = generateCreditNoteDetails({
        refundId: 'ref_1234abcd',
        orderNumber: '20261030-0042',
        refundAmount: 118,
        originalTaxRatePercent: 18,
        reason: 'Customer cancelled dessert',
        method: 'UPI',
        date: new Date('2026-10-30'),
      });

      expect(creditNote.creditNoteNumber).toBe('CN/2026-27/20261030-0042-ABCD');
      expect(creditNote.originalOrderNumber).toBe('20261030-0042');
      expect(creditNote.refundAmount).toBe(118);
      expect(creditNote.taxReversal.taxableAmount).toBe(100);
      expect(creditNote.taxReversal.totalTax).toBe(18);
      expect(creditNote.taxReversal.cgstAmount).toBe(9);
      expect(creditNote.taxReversal.sgstAmount).toBe(9);
    });

    it('handles inter-state credit notes with IGST reversal', () => {
      const creditNote = generateCreditNoteDetails({
        refundId: 'ref_9876efgh',
        orderNumber: '20261030-0088',
        refundAmount: 590,
        originalTaxRatePercent: 18,
        isInterState: true,
        method: 'CARD',
      });
      expect(creditNote.taxReversal.isInterState).toBe(true);
      expect(creditNote.taxReversal.cgstAmount).toBe(0);
      expect(creditNote.taxReversal.sgstAmount).toBe(0);
      expect(creditNote.taxReversal.igstAmount).toBe(90);
    });
  });

  describe('8. Gift Cards & Loyalty Points', () => {
    it('applies gift card credit up to the bill balance', () => {
      const s = settlePayments({
        balance: 350,
        giftCardApplied: 200,
        payments: [{ method: 'CASH', amount: 150 }],
      });
      expect(s.fullyPaid).toBe(true);
      expect(s.paidNow).toBe(350);
      expect(s.balanceAfter).toBe(0);
    });

    it('caps loyalty discount at the order total', () => {
      const line = priceLine({
        quantity: 1,
        unitPriceInclusive: 150,
        taxRatePercent: 5,
      });
      const bill = computeBill({
        lines: [line],
        loyaltyDiscountRequested: 300,
      });
      expect(bill.loyaltyDiscountAmount).toBe(150);
      expect(bill.totalDue).toBe(0);
    });
  });

  describe('9. Cash Drawer Closing & Discrepancies', () => {
    it('calculates expected till cash and identifies variance correctly', () => {
      const opening = 2000;
      const cashSales = 15450;
      const cashRefunds = 450;
      const cashExpenses = 1200; // paid from till

      const expected = expectedCash(
        opening,
        cashSales,
        cashRefunds,
        cashExpenses,
      );
      expect(expected).toBe(15800);

      // Counted matching expected -> 0 variance
      const varianceExact = safeSub(15800, expected);
      expect(varianceExact).toBe(0);

      // Shortage (e.g. counted 15,750) -> -50 variance
      const varianceShortage = safeSub(15750, expected);
      expect(varianceShortage).toBe(-50);

      // Surplus (e.g. counted 15,820) -> +20 variance
      const varianceSurplus = safeSub(15820, expected);
      expect(varianceSurplus).toBe(20);
    });
  });

  describe('10. Tax & P&L Reconciliation', () => {
    it('reconciles GST summary with order totals across multiple rates', () => {
      const orderLines = [
        { lineTotal: 525, taxRatePercent: 5, factor: 1 }, // 500 taxable + 25 tax
        { lineTotal: 118, taxRatePercent: 18, factor: 1 }, // 100 taxable + 18 tax
        { lineTotal: 224, taxRatePercent: 12, factor: 1 }, // 200 taxable + 24 tax
      ];

      const report = gstSummary(orderLines);
      expect(report.rows).toHaveLength(3);
      expect(report.totalTaxable).toBe(800);
      expect(report.totalTax).toBe(67);
      expect(safeAdd(report.totalTaxable, report.totalTax)).toBe(867);

      // CGST and SGST split reconciliation
      expect(safeAdd(report.cgst, report.sgst, report.igst)).toBe(
        report.totalTax,
      );
      expect(report.cgst).toBe(33.5);
      expect(report.sgst).toBe(33.5);
    });

    it('reconciles net sales and profit across income, tax, refunds, and costs', () => {
      const grossCollected = 100000;
      const taxCollected = 5000;
      const refunds = 2000;
      const expenses = 40000;
      const payrollCost = 30000;

      const netSales = safeSub(safeSub(grossCollected, taxCollected), refunds);
      expect(netSales).toBe(93000);

      const netProfit = safeSub(safeSub(netSales, expenses), payrollCost);
      expect(netProfit).toBe(23000);
    });
  });
});
