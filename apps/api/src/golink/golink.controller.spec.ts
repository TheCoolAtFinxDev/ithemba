import { createHmac } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { GolinkWebhookController } from './golink.controller';
import { PrismaService } from '../prisma/prisma.service';

// Targets: (1) HMAC signature verification actually gates the webhook, and
// (2) idempotency — replaying an already-settled event must not double-credit
// a patient's HSA. Golink retries webhook deliveries, so this is load-bearing.

const SECRET = 'test-webhook-secret';

function sign(body: string): string {
  return 'sha256=' + createHmac('sha256', SECRET).update(body).digest('hex');
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('GolinkWebhookController', () => {
  function buildController(prismaOverrides: Partial<Record<string, any>> = {}) {
    const config = { get: jest.fn().mockReturnValue(SECRET) };
    const prisma = {
      savingsTransaction: { findUnique: jest.fn(), update: jest.fn() },
      healthSavingsAccount: { update: jest.fn() },
      paymentPayout: { findFirst: jest.fn(), update: jest.fn() },
      providerClaim: { update: jest.fn() },
      employerBillingCycle: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
      ),
      ...prismaOverrides,
    } as unknown as PrismaService;
    const novu = {
      sendTopupSucceeded: jest.fn(), sendTopupFailed: jest.fn(),
      sendProviderDisbursementSucceeded: jest.fn(), sendProviderDisbursementFailed: jest.fn(),
      notifyAdminsPaymentFailed: jest.fn(), notifyAdminsDisbursementFailed: jest.fn(),
      sendInvoicePaid: jest.fn(),
    };

    return { controller: new GolinkWebhookController(config as any, prisma, novu as any), prisma, novu };
  }

  it('rejects a request with no signature header', async () => {
    const { controller } = buildController();
    const body = JSON.stringify({ type: 'payment.succeeded', data: { id: 'pay_1' } });
    const req: any = { headers: {}, body: Buffer.from(body) };

    await expect(controller.handle(req, mockRes())).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a request with an invalid signature', async () => {
    const { controller } = buildController();
    const body = JSON.stringify({ type: 'payment.succeeded', data: { id: 'pay_1' } });
    const req: any = { headers: { 'x-golink-signature': 'sha256=deadbeef' }, body: Buffer.from(body) };

    await expect(controller.handle(req, mockRes())).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a validly signed payment.succeeded event and credits the HSA', async () => {
    const { controller, prisma } = buildController();
    (prisma.savingsTransaction.findUnique as jest.Mock).mockResolvedValue({
      id: 'txn-1', accountId: 'acct-1', amount: 250, status: 'Processing',
      account: { balance: 0, patient: null },
    });

    const body = JSON.stringify({ type: 'payment.succeeded', data: { id: 'pay_1' } });
    const req: any = { headers: { 'x-golink-signature': sign(body) }, body: Buffer.from(body) };
    const res = mockRes();

    await controller.handle(req, res);

    expect(prisma.savingsTransaction.update).toHaveBeenCalledWith({
      where: { id: 'txn-1' },
      data: { status: 'Succeeded', isSuccessful: true },
    });
    expect(prisma.healthSavingsAccount.update).toHaveBeenCalledWith({
      where: { id: 'acct-1' },
      data: { balance: { increment: 250 }, totalContributed: { increment: 250 } },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('is idempotent — a replayed event for an already-settled transaction does not double-credit', async () => {
    const { controller, prisma } = buildController();
    (prisma.savingsTransaction.findUnique as jest.Mock).mockResolvedValue({
      id: 'txn-1', accountId: 'acct-1', amount: 250, status: 'Succeeded', // already settled
    });

    const body = JSON.stringify({ type: 'payment.succeeded', data: { id: 'pay_1' } });
    const req: any = { headers: { 'x-golink-signature': sign(body) }, body: Buffer.from(body) };

    await controller.handle(req, mockRes());

    expect(prisma.savingsTransaction.update).not.toHaveBeenCalled();
    expect(prisma.healthSavingsAccount.update).not.toHaveBeenCalled();
  });

  it('is idempotent for disbursement events on an already-settled payout', async () => {
    const { controller, prisma } = buildController();
    (prisma.paymentPayout.findFirst as jest.Mock).mockResolvedValue({
      id: 'payout-1', status: 'Completed', claimId: 'claim-1', // already settled
    });

    const body = JSON.stringify({ type: 'disbursement.succeeded', data: { id: 'pay_2' } });
    const req: any = { headers: { 'x-golink-signature': sign(body) }, body: Buffer.from(body) };

    await controller.handle(req, mockRes());

    expect(prisma.paymentPayout.update).not.toHaveBeenCalled();
    expect(prisma.providerClaim.update).not.toHaveBeenCalled();
  });
});
