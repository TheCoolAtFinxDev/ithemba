import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
        provider: { select: { id: true, isActive: true, isVerified: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async lockUser(adminUserId: string, targetUserId: string) {
    const exists = await this.prisma.userProfile.count({ where: { id: targetUserId } });
    if (!exists) throw new NotFoundException('User not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.patient.updateMany({ where: { userProfileId: targetUserId }, data: { isActive: false } });
      await tx.provider.updateMany({ where: { userProfileId: targetUserId }, data: { isActive: false } });
      await tx.auditLogEntry.create({
        data: { userId: adminUserId, action: 'USER_LOCKED', entity: 'UserProfile', entityId: targetUserId },
      });
      return { message: 'User locked' };
    });
  }

  async unlockUser(adminUserId: string, targetUserId: string) {
    const exists = await this.prisma.userProfile.count({ where: { id: targetUserId } });
    if (!exists) throw new NotFoundException('User not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.patient.updateMany({ where: { userProfileId: targetUserId }, data: { isActive: true } });
      await tx.provider.updateMany({ where: { userProfileId: targetUserId }, data: { isActive: true } });
      await tx.auditLogEntry.create({
        data: { userId: adminUserId, action: 'USER_UNLOCKED', entity: 'UserProfile', entityId: targetUserId },
      });
      return { message: 'User unlocked' };
    });
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

    return { message: `Role '${roleName}' assigned` };
  }

  async verifyProvider(adminUserId: string, providerId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    await this.prisma.provider.update({
      where: { id: providerId },
      data: { isVerified: true, lastModifiedBy: adminUserId },
    });

    await this.prisma.auditLogEntry.create({
      data: {
        userId: adminUserId,
        action: 'PROVIDER_VERIFIED',
        entity: 'Provider',
        entityId: providerId,
      },
    });

    return { message: 'Provider verified' };
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

  // ── Dashboard stats ──────────────────────────────────────────

  async getStats() {
    const [patients, providers, appointments, claims] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.provider.count({ where: { isVerified: true } }),
      this.prisma.appointment.count(),
      this.prisma.providerClaim.count(),
    ]);
    const pendingClaims = await this.prisma.providerClaim.count({ where: { status: 'Submitted' } });
    return { patients, providers, appointments, claims, pendingClaims };
  }
}
