import { ConflictException } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma/prisma.service';
import { NovuService } from '../novu/novu.service';
import { GolinkService } from '../golink/golink.service';

// These tests target the WP4 race-condition fix: two concurrent
// approve/reject actions on the same claim must not both succeed. The
// atomic-claim guard is `tx.providerClaim.updateMany({ where: { status: {
// in: [...] } } })` — we simulate a loser by returning `count: 0`.

describe('ClaimsService — concurrent approve/reject guard', () => {
  const claimFixture = {
    id: 'claim-1',
    claimNumber: 'CLM-TEST',
    accountId: 'account-1',
    totalAmount: 100,
    status: 'Submitted',
    account: { balance: 1000, patientId: 'patient-1' },
    provider: {
      id: 'provider-1', firstName: 'Test', lastName: 'Provider',
      disbursementEnabled: false, ecocashNumber: null, bankAccountNumber: null,
      bankName: null, isVerified: true,
    },
  };

  function buildService(txOverrides: Partial<Record<string, any>> = {}) {
    const tx = {
      providerClaim: {
        updateMany: jest.fn(),
        update: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      savingsTransaction: { create: jest.fn().mockResolvedValue({ id: 'txn-1' }) },
      healthSavingsAccount: { update: jest.fn() },
      auditLogEntry: { create: jest.fn() },
      ...txOverrides,
    };

    const prisma = {
      providerClaim: { findUnique: jest.fn().mockResolvedValue(claimFixture) },
      systemSetting: { findUnique: jest.fn().mockResolvedValue(null) },
      healthSavingsAccount: {
        findUnique: jest.fn().mockResolvedValue({
          patient: { userProfile: { id: 'up-1', fullName: 'Pat Ient', email: 'patient@test.local' } },
        }),
      },
      $transaction: jest.fn(async (cb: (tx: unknown) => unknown) => cb(tx)),
    } as unknown as PrismaService;

    const novu = { sendClaimApproved: jest.fn(), sendClaimRejected: jest.fn() } as unknown as NovuService;
    const golink = { createDisbursement: jest.fn() } as unknown as GolinkService;

    return { service: new ClaimsService(prisma, novu, golink), tx, prisma, novu };
  }

  it('approveClaim rejects when the claim was already decided (count 0)', async () => {
    const { service, tx } = buildService();
    tx.providerClaim.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.approveClaim('admin-1', 'claim-1', {})).rejects.toThrow(ConflictException);

    // Must not have gone on to touch the ledger once the guard failed.
    expect(tx.savingsTransaction.create).not.toHaveBeenCalled();
    expect(tx.healthSavingsAccount.update).not.toHaveBeenCalled();
  });

  it('approveClaim proceeds and debits the HSA when it wins the race (count 1)', async () => {
    const { service, tx, novu } = buildService();
    tx.providerClaim.updateMany.mockResolvedValue({ count: 1 });
    tx.providerClaim.update.mockResolvedValue({ ...claimFixture, status: 'Approved' });

    const result = await service.approveClaim('admin-1', 'claim-1', {});

    expect(tx.providerClaim.updateMany).toHaveBeenCalledWith({
      where: { id: 'claim-1', status: { in: ['Submitted', 'InReview'] } },
      data: { status: 'Approved' },
    });
    expect(tx.savingsTransaction.create).toHaveBeenCalledTimes(1);
    expect(tx.healthSavingsAccount.update).toHaveBeenCalledWith({
      where: { id: 'account-1' },
      data: { balance: { decrement: 105 }, totalClaimed: { increment: 105 } },
    });
    expect(result.status).toBe('Approved');
    expect(novu.sendClaimApproved).toHaveBeenCalled();
  });

  it('rejectClaim rejects when the claim was already decided (count 0)', async () => {
    const { service, tx } = buildService();
    tx.providerClaim.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.rejectClaim('admin-1', 'claim-1', {})).rejects.toThrow(ConflictException);
    expect(tx.auditLogEntry.create).not.toHaveBeenCalled();
  });

  it('rejectClaim proceeds when it wins the race (count 1)', async () => {
    const { service, tx, novu } = buildService();
    tx.providerClaim.updateMany.mockResolvedValue({ count: 1 });
    tx.providerClaim.findUniqueOrThrow.mockResolvedValue({ ...claimFixture, status: 'Rejected' });

    const result = await service.rejectClaim('admin-1', 'claim-1', { notes: 'insufficient documentation' });

    expect(tx.auditLogEntry.create).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('Rejected');
    expect(novu.sendClaimRejected).toHaveBeenCalled();
  });
});
