import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NovuService } from '../novu/novu.service';

// Targets the WP4 double-booking fix: a partial unique index on
// (providerId, startUtc) backs the pre-check `findFirst`, and a P2002
// violation from the DB during create() must be translated into the same
// clean "slot already booked" error as the pre-check.

describe('AppointmentsService — double-booking guard', () => {
  const patientFixture = { id: 'patient-1', userProfileId: 'up-1' };
  const providerFixture = { id: 'provider-1', isActive: true };
  const bookDto = {
    providerId: 'provider-1',
    startUtc: '2027-01-01T10:00:00Z',
    endUtc: '2027-01-01T10:30:00Z',
  };

  function buildService() {
    const tx = {
      appointment: { create: jest.fn() },
      appointmentStatusChange: { create: jest.fn() },
      auditLogEntry: { create: jest.fn() },
    };

    const prisma = {
      patient: { findUnique: jest.fn().mockResolvedValue(patientFixture) },
      provider: { findUnique: jest.fn().mockResolvedValue(providerFixture) },
      appointment: { findFirst: jest.fn().mockResolvedValue(null) },
      userProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'up-1', fullName: 'Test Patient' }) },
      $transaction: jest.fn(async (cb: (tx: unknown) => unknown) => cb(tx)),
    } as unknown as PrismaService;

    const novu = { sendNewAppointmentRequest: jest.fn() } as unknown as NovuService;

    return { service: new AppointmentsService(prisma, novu), prisma, tx };
  }

  it('rejects at the pre-check when a conflicting appointment already exists', async () => {
    const { service, prisma, tx } = buildService();
    (prisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

    await expect(service.bookAppointment('up-1', 'patient-1', bookDto as any)).rejects.toThrow(BadRequestException);
    expect(tx.appointment.create).not.toHaveBeenCalled();
  });

  it('translates a DB-level unique-constraint violation (race past the pre-check) into a clean error', async () => {
    const { service, tx } = buildService();
    tx.appointment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.bookAppointment('up-1', 'patient-1', bookDto as any))
      .rejects.toThrow('This time slot is already booked');
  });

  it('books successfully when there is no conflict', async () => {
    const { service, tx } = buildService();
    tx.appointment.create.mockResolvedValue({ id: 'apt-1', status: 'Requested' });

    const result = await service.bookAppointment('up-1', 'patient-1', bookDto as any);

    expect(result.id).toBe('apt-1');
    expect(tx.appointmentStatusChange.create).toHaveBeenCalledTimes(1);
    expect(tx.auditLogEntry.create).toHaveBeenCalledTimes(1);
  });

  it('rethrows non-constraint errors unchanged', async () => {
    const { service, tx } = buildService();
    tx.appointment.create.mockRejectedValue(new Error('boom'));

    await expect(service.bookAppointment('up-1', 'patient-1', bookDto as any)).rejects.toThrow('boom');
  });
});
