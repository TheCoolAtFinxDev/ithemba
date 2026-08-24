import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wso2Service } from '../wso2/wso2.service';
import { NovuService } from '../novu/novu.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private wso2: Wso2Service,
    private novu: NovuService,
    private authService: AuthService,
  ) {}

  // ── Users ────────────────────────────────────────────────────

  async listUsers(search?: string) {
    return this.prisma.userProfile.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        roles: { include: { role: true } },
        patient: { select: { id: true, isActive: true } },
        provider: {
          select: {
            id: true, isActive: true, isVerified: true,
            firstName: true, lastName: true, clinicName: true,
            specialization: true, location: true, phoneNumber: true, about: true,
            disbursementEnabled: true, ecocashNumber: true, bankAccountNumber: true, bankName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getUserById(userId: string) {
    const user = await this.prisma.userProfile.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        patient: { select: { id: true, isActive: true } },
        provider: {
          select: {
            id: true, isActive: true, isVerified: true,
            firstName: true, lastName: true, clinicName: true,
            specialization: true, location: true, phoneNumber: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async lockUser(adminUserId: string, targetUserId: string) {
    const target = await this.prisma.userProfile.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.patient.updateMany({ where: { userProfileId: targetUserId }, data: { isActive: false } });
      await tx.provider.updateMany({ where: { userProfileId: targetUserId }, data: { isActive: false } });
      await tx.auditLogEntry.create({
        data: { userId: adminUserId, action: 'USER_LOCKED', entity: 'UserProfile', entityId: targetUserId },
      });
      return { message: 'User locked' };
    });

    if (target.email) {
      await this.novu.sendAccountLocked({
        subscriberId: target.id, email: target.email, firstName: target.fullName?.split(' ')[0] ?? 'there',
      });
    }

    return result;
  }

  async unlockUser(adminUserId: string, targetUserId: string) {
    const target = await this.prisma.userProfile.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.patient.updateMany({ where: { userProfileId: targetUserId }, data: { isActive: true } });
      await tx.provider.updateMany({ where: { userProfileId: targetUserId }, data: { isActive: true } });
      await tx.auditLogEntry.create({
        data: { userId: adminUserId, action: 'USER_UNLOCKED', entity: 'UserProfile', entityId: targetUserId },
      });
      return { message: 'User unlocked' };
    });

    if (target.email) {
      await this.novu.sendAccountUnlocked({
        subscriberId: target.id, email: target.email, firstName: target.fullName?.split(' ')[0] ?? 'there',
      });
    }

    return result;
  }

  async assignRole(adminUserId: string, targetUserId: string, roleName: string) {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundException(`Role '${roleName}' not found`);

    await this.prisma.userRole.upsert({
      where: { userProfileId_roleId: { userProfileId: targetUserId, roleId: role.id } },
      create: { userProfileId: targetUserId, roleId: role.id },
      update: {},
    });

    await this.prisma.auditLogEntry.create({
      data: {
        userId: adminUserId,
        action: 'ROLE_ASSIGNED',
        entity: 'UserRole',
        entityId: targetUserId,
        newValues: { role: roleName },
      },
    });

    const target = await this.prisma.userProfile.findUnique({ where: { id: targetUserId } });
    if (target?.email) {
      await this.novu.sendRoleAssigned({
        subscriberId: target.id, email: target.email, firstName: target.fullName?.split(' ')[0] ?? 'there',
        roleName,
      });
    }

    return { message: `Role '${roleName}' assigned` };
  }

  async verifyProvider(adminUserId: string, providerId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    const wso2OrganizationId = await this.wso2.createOrganization(
      `${provider.firstName} ${provider.lastName ?? ''}`.trim() || provider.clinicName,
      `Ithemba Health provider tenant — ${provider.clinicName || provider.firstName}`,
    );

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        isVerified: true, lastModifiedBy: adminUserId,
        ...(wso2OrganizationId ? { wso2OrganizationId } : {}),
      },
    });

    await this.prisma.auditLogEntry.create({
      data: {
        userId: adminUserId,
        action: 'PROVIDER_VERIFIED',
        entity: 'Provider',
        entityId: providerId,
      },
    });

    if (provider.email) {
      await this.novu.sendProviderVerified({
        subscriberId: provider.userProfileId, email: provider.email, firstName: provider.firstName,
      });
    }

    return { message: 'Provider verified' };
  }

  async updateProvider(adminUserId: string, providerId: string, dto: {
    firstName?: string; lastName?: string; clinicName?: string;
    specialization?: string; phoneNumber?: string; location?: string; about?: string;
  }) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    const updated = await this.prisma.provider.update({
      where: { id: providerId },
      data: { ...dto, lastModifiedBy: adminUserId },
    });

    await this.prisma.auditLogEntry.create({
      data: {
        userId: adminUserId,
        action: 'PROVIDER_UPDATED',
        entity: 'Provider',
        entityId: providerId,
        newValues: dto,
      },
    });

    return updated;
  }

  async setProviderActive(adminUserId: string, providerId: string, isActive: boolean) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    const updated = await this.prisma.provider.update({
      where: { id: providerId },
      data: { isActive, lastModifiedBy: adminUserId },
    });

    await this.prisma.auditLogEntry.create({
      data: {
        userId: adminUserId,
        action: isActive ? 'PROVIDER_ACTIVATED' : 'PROVIDER_DEACTIVATED',
        entity: 'Provider',
        entityId: providerId,
      },
    });

    return updated;
  }

  async setProviderDisbursement(adminUserId: string, providerId: string, enabled: boolean) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    await this.prisma.provider.update({
      where: { id: providerId },
      data: { disbursementEnabled: enabled, lastModifiedBy: adminUserId },
    });

    await this.prisma.auditLogEntry.create({
      data: {
        userId: adminUserId,
        action: enabled ? 'PROVIDER_DISBURSEMENT_ENABLED' : 'PROVIDER_DISBURSEMENT_DISABLED',
        entity: 'Provider',
        entityId: providerId,
      },
    });

    return { message: `Disbursement ${enabled ? 'enabled' : 'disabled'} for provider` };
  }

  // ── Wallet adjustment (support/dispute resolution) ─────────────

  async adjustWalletBalance(adminUserId: string, patientId: string, amount: number, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A reason is required for manual wallet adjustments');
    }
    if (!amount) {
      throw new BadRequestException('Amount must be non-zero');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { savingsAccount: true, userProfile: { select: { id: true, fullName: true, email: true } } },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    const account = patient.savingsAccount;
    if (!account) throw new NotFoundException('Patient has no HSA wallet');

    const balanceBefore = Number(account.balance);
    const balanceAfter = balanceBefore + amount;
    if (balanceAfter < 0) {
      throw new BadRequestException(
        `Adjustment would result in a negative balance (current balance: R${balanceBefore.toFixed(2)})`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const txRecord = await tx.savingsTransaction.create({
        data: {
          accountId: account.id,
          patientId: patient.id,
          transactionType: 'AdminAdjustment',
          amount: Math.abs(amount),
          notes: `${amount > 0 ? 'Credit' : 'Debit'} — ${reason}`,
          isSuccessful: true,
        },
      });

      await tx.healthSavingsAccount.update({
        where: { id: account.id },
        data: { balance: { increment: amount } },
      });

      await tx.auditLogEntry.create({
        data: {
          userId: adminUserId,
          action: 'WALLET_ADJUSTED',
          entity: 'HealthSavingsAccount',
          entityId: account.id,
          newValues: { patientId: patient.id, amount, reason, balanceBefore, balanceAfter, transactionId: txRecord.id },
        },
      });

      return { message: 'Wallet adjusted', balanceBefore, balanceAfter };
    });

    if (patient.userProfile?.email) {
      await this.novu.sendWalletAdjusted({
        subscriberId: patient.userProfile.id, email: patient.userProfile.email,
        firstName: patient.userProfile.fullName?.split(' ')[0] ?? 'there',
        amount, reason, newBalance: balanceAfter,
      });
    }

    return result;
  }

  // ── Roles & Permissions ──────────────────────────────────────

  async listRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(name: string, description?: string) {
    const existing = await this.prisma.role.findUnique({ where: { name } });
    if (existing) throw new ConflictException('Role already exists');
    return this.prisma.role.create({ data: { name, description } });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    await this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      create: { roleId, permissionId },
      update: {},
    });
    return { message: 'Permission assigned to role' };
  }

  // ── Invite user ──────────────────────────────────────────────

  async inviteUser(adminId: string, dto: {
    email: string; firstName: string; lastName: string; phoneNumber: string; role: string;
  }) {
    const exists = await this.prisma.userProfile.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('An account with this email already exists');

    const { id: wso2UserId, temporaryPassword } = await this.wso2.createUser({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
    });

    await this.wso2.assignGroup(wso2UserId, dto.role, dto.email);

    await this.authService.sync(wso2UserId, {
      email: dto.email,
      fullName: `${dto.firstName} ${dto.lastName}`,
      role: dto.role,
    });

    await this.novu.sendWelcome({
      email: dto.email,
      firstName: dto.firstName,
      temporaryPassword,
      loginUrl: 'http://169.239.181.30',
    });

    await this.prisma.auditLogEntry.create({
      data: {
        userId: adminId,
        action: 'USER_INVITED',
        entity: 'UserProfile',
        entityId: wso2UserId,
        newValues: { email: dto.email, role: dto.role },
      },
    });

    return { message: `${dto.role} account created for ${dto.email}`, temporaryPassword };
  }

  // ── Provider creation ────────────────────────────────────────

  // WSO2 requires E.164 (+<country code><number>). CSV/manual entry commonly
  // comes in as a local-format Lesotho number (leading 0, or no prefix at
  // all) — normalize those instead of rejecting the whole import row.
  private normalizePhoneNumber(raw: string): string {
    const trimmed = raw.replace(/[\s-]/g, '');
    if (trimmed.startsWith('+')) return trimmed;
    if (trimmed.startsWith('266')) return `+${trimmed}`;
    if (trimmed.startsWith('0')) return `+266${trimmed.slice(1)}`;
    return `+266${trimmed}`;
  }

  async createProvider(adminId: string, dto: {
    email: string;
    firstName: string;
    lastName: string;
    clinicName: string;
    specialization: string;
    phoneNumber: string;
    location: string;
    about?: string;
  }) {
    const existing = await this.prisma.userProfile.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException(`${dto.email} is already registered`);

    const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);

    const { id: wso2UserId, temporaryPassword } = await this.wso2.createUser({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber,
    });

    await this.wso2.assignGroup(wso2UserId, 'PROVIDER', dto.email);

    // sync() auto-provisions a bare Provider row (name only) as a side effect
    // of assigning the PROVIDER role — fill it in below rather than creating
    // a second row, which would collide on the unique userProfileId.
    await this.authService.sync(wso2UserId, {
      email: dto.email,
      fullName: `${dto.firstName} ${dto.lastName}`,
      role: 'PROVIDER',
    });

    const provider = await this.prisma.provider.update({
      where: { userProfileId: wso2UserId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        clinicName: dto.clinicName,
        specialization: dto.specialization,
        phoneNumber,
        location: dto.location,
        about: dto.about ?? null,
        isVerified: false,
        isActive: true,
      },
    });

    await this.novu.sendWelcome({
      email: dto.email,
      firstName: dto.firstName,
      temporaryPassword,
      loginUrl: 'http://169.239.181.30',
    });

    await this.prisma.auditLogEntry.create({
      data: {
        userId: adminId,
        action: 'PROVIDER_CREATED',
        entity: 'Provider',
        entityId: provider.id,
        newValues: { email: dto.email, clinicName: dto.clinicName },
      },
    });

    return { ...provider, temporaryPassword };
  }

  async importProviders(adminId: string, rows: Array<{
    email: string; firstName: string; lastName: string;
    clinicName: string; specialization: string; phoneNumber: string; location: string;
  }>) {
    const results: { email: string; status: 'created' | 'error'; error?: string }[] = [];
    for (const row of rows) {
      try {
        await this.createProvider(adminId, row);
        results.push({ email: row.email, status: 'created' });
      } catch (err: any) {
        results.push({ email: row.email, status: 'error', error: err?.message ?? 'Unknown error' });
      }
    }
    const created = results.filter(r => r.status === 'created').length;
    const errors = results.filter(r => r.status === 'error');
    return { created, total: rows.length, errors };
  }

  // ── Dashboard stats ──────────────────────────────────────────

  async getStats() {
    const [patients, providers, unverifiedProviders, appointments, claims, pendingClaims, employers, pendingEmployers] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.provider.count({ where: { isVerified: true } }),
      this.prisma.provider.count({ where: { isVerified: false } }),
      this.prisma.appointment.count(),
      this.prisma.providerClaim.count(),
      this.prisma.providerClaim.count({ where: { status: 'Submitted' } }),
      this.prisma.employer.count({ where: { isVerified: true } }),
      this.prisma.employer.count({ where: { isVerified: false } }),
    ]);
    return { patients, providers, unverifiedProviders, appointments, claims, pendingClaims, employers, pendingEmployers };
  }

  async listAppointments(status?: string, limit = 100) {
    return this.prisma.appointment.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        patient: { include: { userProfile: { select: { fullName: true, email: true } } } },
        provider: { select: { firstName: true, lastName: true, clinicName: true } },
      },
      orderBy: { startUtc: 'desc' },
      take: limit,
    });
  }

  async listAudit(limit = 50) {
    return this.prisma.auditLogEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ── System Settings (configurable business rules) ────────────

  /** All defined business-rule keys with defaults, so the admin UI always has values to show. */
  static readonly SETTING_DEFAULTS: Record<string, { value: string; description: string }> = {
    registrationFee:        { value: '67',    description: 'Once-off HSA registration fee (ZAR)' },
    annualAdminFee:         { value: '67',    description: 'Annual account administration fee charged each January (ZAR)' },
    transactionFeePercent:  { value: '5',     description: 'Service fee applied on every provider claim payment (%)' },
    minMonthlyContribution: { value: '500',   description: 'Minimum monthly top-up per patient (ZAR)' },
    maxMonthlyContribution: { value: '10000', description: 'Maximum monthly top-up per patient (ZAR)' },
    amlThreshold:           { value: '50000', description: 'Lump-sum deposit amount above which AML verification is required (ZAR)' },
  };

  async listSettings() {
    const stored = await this.prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    const storedMap = new Map(stored.map(s => [s.key, s]));

    // Merge DB rows with defaults so the UI always sees every key
    return Object.entries(AdminService.SETTING_DEFAULTS).map(([key, def]) => ({
      key,
      value: storedMap.get(key)?.value ?? def.value,
      description: def.description,
      updatedAt: storedMap.get(key)?.updatedAt ?? null,
    }));
  }

  async updateSetting(adminUserId: string, key: string, value: string) {
    if (!(key in AdminService.SETTING_DEFAULTS)) {
      throw new BadRequestException(`Unknown setting key: ${key}`);
    }
    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value, description: AdminService.SETTING_DEFAULTS[key].description, updatedBy: adminUserId },
      update: { value, updatedBy: adminUserId },
    });
    await this.prisma.auditLogEntry.create({
      data: {
        userId: adminUserId,
        action: 'SETTING_UPDATED',
        entity: 'SystemSetting',
        entityId: key,
        newValues: { key, value },
      },
    });
    return setting;
  }

  /** Read a single setting at runtime, with fallback to the compiled default. */
  async getSetting(key: string): Promise<number> {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    const raw = row?.value ?? AdminService.SETTING_DEFAULTS[key]?.value ?? '0';
    return parseFloat(raw);
  }
}
