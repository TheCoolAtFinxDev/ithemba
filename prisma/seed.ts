import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '6543'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const PERMISSIONS = [
  { resource: 'appointments', action: 'read',     description: 'View appointments' },
  { resource: 'appointments', action: 'create',   description: 'Book appointments' },
  { resource: 'appointments', action: 'update',   description: 'Update appointments' },
  { resource: 'appointments', action: 'cancel',   description: 'Cancel appointments' },
  { resource: 'appointments', action: 'accept',   description: 'Accept appointment requests' },
  { resource: 'appointments', action: 'checkin',  description: 'Check in patients' },
  { resource: 'appointments', action: 'complete', description: 'Complete appointments' },
  { resource: 'appointments', action: 'manage',   description: 'Full appointment management' },
  { resource: 'wallet',       action: 'read',     description: 'View wallet balance' },
  { resource: 'wallet',       action: 'topup',    description: 'Top up wallet via M-Pesa' },
  { resource: 'wallet',       action: 'manage',   description: 'Full wallet management' },
  { resource: 'claims',       action: 'read',     description: 'View claims' },
  { resource: 'claims',       action: 'submit',   description: 'Submit claims' },
  { resource: 'claims',       action: 'approve',  description: 'Approve claims' },
  { resource: 'claims',       action: 'reject',   description: 'Reject claims' },
  { resource: 'claims',       action: 'manage',   description: 'Full claims management' },
  { resource: 'providers',    action: 'read',     description: 'View providers' },
  { resource: 'providers',    action: 'search',   description: 'Search providers' },
  { resource: 'providers',    action: 'manage',   description: 'Manage provider profiles' },
  { resource: 'patients',     action: 'read',     description: 'View patient profiles' },
  { resource: 'patients',     action: 'manage',   description: 'Manage patient profiles' },
  { resource: 'beneficiaries', action: 'read',    description: 'View beneficiaries' },
  { resource: 'beneficiaries', action: 'manage',  description: 'Manage beneficiaries' },
  { resource: 'users',        action: 'read',     description: 'View all users' },
  { resource: 'users',        action: 'manage',   description: 'Manage users' },
  { resource: 'users',        action: 'lock',     description: 'Lock/unlock user accounts' },
  { resource: 'roles',        action: 'read',     description: 'View roles' },
  { resource: 'roles',        action: 'manage',   description: 'Manage roles and permissions' },
  { resource: 'reports',      action: 'read',     description: 'View reports' },
  { resource: 'system',       action: 'manage',   description: 'System settings' },
];

const ROLES = [
  {
    name: 'PATIENT',
    description: 'Health savings plan member',
    isSystem: true,
    permissions: [
      'appointments:read', 'appointments:create', 'appointments:cancel',
      'wallet:read', 'wallet:topup',
      'claims:read',
      'providers:read', 'providers:search',
      'beneficiaries:read', 'beneficiaries:manage',
    ],
  },
  {
    name: 'PROVIDER',
    description: 'Healthcare service provider (doctor, dentist, pharmacist, etc.)',
    isSystem: true,
    permissions: [
      'appointments:read', 'appointments:accept', 'appointments:checkin',
      'appointments:complete', 'appointments:update',
      'claims:read', 'claims:submit',
      'providers:read',
      'patients:read',
    ],
  },
  {
    name: 'ADMIN',
    description: 'IthembaHealth platform administrator',
    isSystem: true,
    permissions: [
      'appointments:manage',
      'wallet:manage',
      'claims:manage', 'claims:approve', 'claims:reject',
      'providers:manage',
      'patients:manage',
      'users:read', 'users:manage', 'users:lock',
      'roles:read', 'roles:manage',
      'reports:read',
      'system:manage',
    ],
  },
];

async function main() {
  console.log('🌱 Seeding RBAC...');

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      create: perm,
      update: { description: perm.description },
    });
  }
  console.log(`✅ ${PERMISSIONS.length} permissions seeded`);

  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      create: {
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
      },
      update: { description: roleData.description },
    });

    for (const permKey of roleData.permissions) {
      const [resource, action] = permKey.split(':');
      const perm = await prisma.permission.findUnique({
        where: { resource_action: { resource, action } },
      });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          create: { roleId: role.id, permissionId: perm.id },
          update: {},
        });
      }
    }
    console.log(`✅ Role ${roleData.name} seeded with ${roleData.permissions.length} permissions`);
  }

  console.log('🎉 RBAC seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());