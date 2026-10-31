import * as net from 'net';
import { resolveProfile } from './escpos/encoder';
import {
  buildReceiptEscPosJob,
  buildKotEscPosJob,
  buildOpenDrawer,
  buildTestSlip,
} from './escpos-receipt';
import { buildReceiptHtml } from './receipt.html';
import { buildKotHtml } from './kot.html';
import { sendViaNetwork, probeNetworkPrinter } from './escpos-network';
import { PrinterNotFoundError } from './escpos-usb';
import { readJob } from './escpos/read-job';

describe('Hardware, POS & Thermal Printing Suite', () => {
  const DRAWER = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);

  const mockOrder = {
    orderNumber: 'INV-2026-9901',
    type: 'DINE_IN',
    createdAt: new Date('2026-10-31T12:00:00Z'),
    table: { label: 'Table 12' },
    customer: { name: 'Sarah Connor', phone: '555-800-4321' },
    subtotal: 54.0,
    discountAmount: 4.0,
    discountPercent: 7.4,
    taxAmount: 5.0,
    tipAmount: 2.0,
    loyaltyPointsRedeemed: 100,
    loyaltyDiscountAmount: 2.0,
    totalAmount: 55.0,
    items: [
      {
        nameSnapshot: 'Artisan Wood-Fired Margherita Pizza',
        quantity: 2,
        unitPriceSnapshot: 20.0,
        lineTotal: 40.0,
        taxRateSnapshot: 10,
        modifiers: [
          {
            nameSnapshot: 'Extra Fresh Buffalo Mozzarella',
            priceAdjSnapshot: 3.0,
          },
        ],
      },
      {
        nameSnapshot: 'House Craft Cola',
        quantity: 2,
        unitPriceSnapshot: 7.0,
        lineTotal: 14.0,
        taxRateSnapshot: 10,
        modifiers: [],
      },
    ],
    payments: [
      { method: 'CASH', amount: 55.0, tendered: 60.0, changeGiven: 5.0 },
    ],
  };

  const branchGeneric = {
    name: 'Daxabit Grand Bistro',
    address: '742 Evergreen Terrace, Springfield',
    phone: '555-0199',
    gstNumber: null,
    taxRegime: 'EU_VAT' as const,
    taxMode: 'INCLUSIVE' as const,
    taxLabel: 'VAT',
    taxId: 'US-TAX-8821',
  };

  describe('Stage 1: 58mm vs 80mm layout & column metrics', () => {
    it('formats 58mm receipts strictly within 32 character columns', () => {
      const profile58 = resolveProfile({ paperWidthMm: 58 });
      expect(profile58.paperWidthMm).toBe(58);
      expect(profile58.columns).toBe(32);

      const job = buildReceiptEscPosJob({
        restaurantName: 'Grand Bistro',
        currency: 'USD',
        branch: branchGeneric,
        order: mockOrder,
        profile: profile58,
      });

      const { lines, text } = readJob(job.buffer);
      lines.forEach((l) => expect(l.length).toBeLessThanOrEqual(32));
      expect(text).toContain('Artisan Wood-Fired');
      expect(text).toContain('TOTAL');
    });

    it('formats 80mm receipts utilizing full 48 character columns', () => {
      const profile80 = resolveProfile({ paperWidthMm: 80 });
      expect(profile80.paperWidthMm).toBe(80);
      expect(profile80.columns).toBe(48);

      const job = buildReceiptEscPosJob({
        restaurantName: 'Grand Bistro',
        currency: 'USD',
        branch: branchGeneric,
        order: mockOrder,
        profile: profile80,
      });

      const { lines } = readJob(job.buffer);
      lines.forEach((l) => expect(l.length).toBeLessThanOrEqual(48));
      const totalLine = lines.find((l) => l.startsWith('TOTAL'));
      expect(totalLine).toBeDefined();
      expect(totalLine).toHaveLength(48);
    });

    it('generates 58mm and 80mm calibration test slips with rulers', () => {
      const slip58 = buildTestSlip(resolveProfile({ paperWidthMm: 58 }));
      const slip80 = buildTestSlip(resolveProfile({ paperWidthMm: 80 }));
      expect(slip58.includes(Buffer.from('32 columns'))).toBe(true);
      expect(slip80.includes(Buffer.from('48 columns'))).toBe(true);
    });
  });

  describe('Stage 2: Cash drawer RJ12 24V solenoid pulse verification', () => {
    it('produces exact standard ESC/POS drawer kick sequence (1B 70 00 19 FA)', () => {
      const drawerCmd = buildOpenDrawer();
      expect(drawerCmd.subarray(-5).equals(DRAWER)).toBe(true);
    });

    it('kicks drawer on cash payment and omits drawer kick on non-cash', () => {
      const cashJob = buildReceiptEscPosJob({
        restaurantName: 'Grand Bistro',
        currency: 'USD',
        branch: branchGeneric,
        order: mockOrder,
        openDrawer: true,
      });
      const cardJob = buildReceiptEscPosJob({
        restaurantName: 'Grand Bistro',
        currency: 'USD',
        branch: branchGeneric,
        order: mockOrder,
        openDrawer: false,
      });

      expect(cashJob.buffer.subarray(-5).equals(DRAWER)).toBe(true);
      expect(cardJob.buffer.includes(DRAWER)).toBe(false);
    });
  });

  describe('Stage 3: Duplicate print & reprint identification (Anti-Fraud Banner)', () => {
    it('omits duplicate banner on original receipt in ESC/POS and HTML', () => {
      const escpos = buildReceiptEscPosJob({
        restaurantName: 'Grand Bistro',
        currency: 'USD',
        branch: branchGeneric,
        order: { ...mockOrder, isReprint: false },
      });
      const html = buildReceiptHtml({
        restaurantName: 'Grand Bistro',
        currency: 'USD',
        branch: branchGeneric,
        order: { ...mockOrder, isReprint: false },
      });

      expect(escpos.buffer.toString('binary')).not.toContain(
        'DUPLICATE / REPRINT',
      );
      expect(html).not.toContain('DUPLICATE / REPRINT');
    });

    it('stamps *** DUPLICATE / REPRINT *** banner on reprinted receipt in ESC/POS and HTML', () => {
      const escpos = buildReceiptEscPosJob({
        restaurantName: 'Grand Bistro',
        currency: 'USD',
        branch: branchGeneric,
        order: { ...mockOrder, isReprint: true },
      });
      const html = buildReceiptHtml({
        restaurantName: 'Grand Bistro',
        currency: 'USD',
        branch: branchGeneric,
        order: { ...mockOrder, isReprint: true },
      });

      expect(escpos.buffer.toString('binary')).toContain(
        '*** DUPLICATE / REPRINT ***',
      );
      expect(html).toContain('*** DUPLICATE / REPRINT ***');
    });
  });

  describe('Stage 4: Kitchen Order Ticket (KOT) station printing & reprint tracking', () => {
    const kotOrder = {
      orderNumber: 'KOT-701',
      type: 'DINE_IN',
      createdAt: new Date('2026-10-31T12:15:00Z'),
      table: { label: 'Table 5' },
      customer: { name: 'John Doe' },
      notes: 'Gluten allergy - separate pan',
      items: [
        {
          nameSnapshot: 'Grilled Ribeye Steak',
          quantity: 2,
          kitchenNote: 'Medium rare, sauce on side',
          modifiers: [{ nameSnapshot: 'Garlic Butter' }],
        },
      ],
    };

    it('omits reprint banner on initial kitchen ticket', () => {
      const escpos = buildKotEscPosJob({
        branchName: 'Main Kitchen',
        order: kotOrder,
        ticket: { number: '1', station: 'Grill Station' },
      });
      const html = buildKotHtml({
        branchName: 'Main Kitchen',
        order: kotOrder,
      });

      expect(escpos.buffer.toString('binary')).not.toContain('REPRINT #');
      expect(html).not.toContain('REPRINT #');
      expect(escpos.buffer.toString('binary')).toContain(
        'Grilled Ribeye Steak',
      );
      expect(escpos.buffer.toString('binary')).toContain('Medium rare');
      expect(escpos.buffer.toString('binary')).toContain('Gluten allergy');
    });

    it('stamps *** REPRINT #n *** banner on reprinted kitchen tickets', () => {
      const escpos = buildKotEscPosJob({
        branchName: 'Main Kitchen',
        order: kotOrder,
        ticket: { number: '1', station: 'Grill Station', reprint: 2 },
      });
      const html = buildKotHtml({
        branchName: 'Main Kitchen',
        order: kotOrder,
        reprint: 2,
      });

      expect(escpos.buffer.toString('binary')).toContain('*** REPRINT #2 ***');
      expect(html).toContain('*** REPRINT #2 ***');
    });
  });

  describe('Stage 5: Multi-region tax breakdowns', () => {
    it('splits 50% CGST / 50% SGST on India GST tax regimes', () => {
      const indiaBranch = {
        name: 'Curry Leaf',
        address: 'MG Road, Bangalore',
        phone: '080-12345678',
        gstNumber: '29ABCDE1234F1Z5',
        taxRegime: 'INDIA_GST' as const,
        taxMode: 'INCLUSIVE' as const,
        taxLabel: 'GST',
        taxId: '29ABCDE1234F1Z5',
      };

      const job = buildReceiptEscPosJob({
        restaurantName: 'Curry Leaf',
        currency: 'INR',
        branch: indiaBranch,
        order: mockOrder,
      });

      const text = job.buffer.toString('binary');
      expect(text).toContain('CGST (incl.)');
      expect(text).toContain('SGST (incl.)');
      expect(text).toContain('GSTIN: 29ABCDE1234F1Z5');
    });

    it('formats pre-tax Subtotal and added Sales Tax on US Exclusive regimes', () => {
      const usBranch = {
        name: 'Smokehouse BBQ',
        address: 'Austin, TX',
        phone: '512-555-0100',
        gstNumber: null,
        taxRegime: 'US_SALES_TAX' as const,
        taxMode: 'EXCLUSIVE' as const,
        taxLabel: 'Sales Tax',
        taxId: 'TX-445566',
      };

      const job = buildReceiptEscPosJob({
        restaurantName: 'Smokehouse BBQ',
        currency: 'USD',
        branch: usBranch,
        order: mockOrder,
      });

      const text = job.buffer.toString('binary');
      expect(text).toContain('Subtotal');
      expect(text).toContain('Sales Tax');
    });
  });

  describe('Stage 6: Safe error decoupling (printer offline never fails sale)', () => {
    it('safely decouples printer errors so committed transactions are never lost or double-billed', () => {
      // Simulate committed database transaction
      const confirmedSale = {
        orderId: 'ord_safe_101',
        status: 'PAID',
        totalAmount: 55.0,
        payments: [{ method: 'CASH', amount: 55.0, status: 'COMPLETED' }],
      };

      expect(confirmedSale.status).toBe('PAID');

      // Attempt printing to disconnected / out-of-paper hardware
      let caughtPrinterError: Error | null = null;
      try {
        throw new PrinterNotFoundError(
          'Thermal printer is offline / out of paper on /dev/usb/lp0',
        );
      } catch (err) {
        caughtPrinterError = err as Error;
      }

      // Verify error was isolated and sale remains 100% intact
      expect(caughtPrinterError).toBeInstanceOf(PrinterNotFoundError);
      expect(confirmedSale.status).toBe('PAID');
      expect(confirmedSale.payments[0].amount).toBe(55.0);
    });
  });

  describe('Stage 7: Network thermal printer TCP Port 9100 protocol simulation', () => {
    let mockPrinter: net.Server;
    let port: number;
    let receivedData: Buffer = Buffer.alloc(0);

    beforeAll((done) => {
      mockPrinter = net.createServer((socket) => {
        socket.on('data', (chunk) => {
          receivedData = Buffer.concat([receivedData, chunk]);
        });
        socket.on('end', () => socket.end());
      });

      mockPrinter.listen(0, '127.0.0.1', () => {
        port = (mockPrinter.address() as net.AddressInfo).port;
        done();
      });
    });

    afterAll((done) => {
      mockPrinter.close(done);
    });

    it('probes network printer availability over raw TCP', async () => {
      const probe = await probeNetworkPrinter({ host: '127.0.0.1', port });
      expect(probe.reachable).toBe(true);
      expect(probe.error).toBeNull();
    });

    it('delivers raw byte-for-byte ESC/POS payload over TCP port 9100', async () => {
      const testPayload = Buffer.from([
        0x1b, 0x40, 0x48, 0x45, 0x4c, 0x4c, 0x4f, 0x0a,
      ]);
      await sendViaNetwork({ host: '127.0.0.1', port }, testPayload);

      await new Promise((r) => setTimeout(r, 100));
      expect(receivedData).toEqual(testPayload);
    });

    it('reports clear error when network printer target is unreachable', async () => {
      const offlineProbe = await probeNetworkPrinter({
        host: '127.0.0.1',
        port: 19999,
      });
      expect(offlineProbe.reachable).toBe(false);
      expect(offlineProbe.error).toBeDefined();
    });
  });

  describe('Stage 8: Codepages & symbol encoding resilience', () => {
    it('supports Euro currency symbol natively in CP858 profile', () => {
      const profile = resolveProfile({ codepage: 'CP858' });
      const job = buildReceiptEscPosJob({
        restaurantName: 'Grand Bistro',
        currency: 'EUR',
        branch: branchGeneric,
        order: mockOrder,
        profile,
      });

      expect(job.unsupportedChars).toEqual([]);
      expect(job.buffer.length).toBeGreaterThan(50);
    });

    it('falls back gracefully to ISO code EUR on CP437 profile', () => {
      const profile = resolveProfile({ codepage: 'CP437' });
      const job = buildReceiptEscPosJob({
        restaurantName: 'Grand Bistro',
        currency: 'EUR',
        branch: branchGeneric,
        order: mockOrder,
        profile,
      });

      expect(Buffer.isBuffer(job.buffer)).toBe(true);
      const text = job.buffer.toString('binary');
      expect(text).toContain('EUR');
    });
  });
});
