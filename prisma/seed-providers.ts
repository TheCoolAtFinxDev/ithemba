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

const PROVIDERS = [
  {
    clinicName: 'Boikemisetso CHC',
    firstName: 'Julia',
    lastName: 'Mabote',
    specialization: 'Dentist',
    location: 'House 45 • Maseru • Maseru District',
    city: 'Maseru',
    district: 'Maseru District',
    phoneNumber: '+26622100001',
    email: 'julia.mabote@boikemisetso.co.ls',
  },
  {
    clinicName: 'Clinic 0',
    firstName: 'Teboho',
    lastName: 'Mokete',
    specialization: 'General Medicine',
    location: 'District 0 • Maseru',
    city: 'Maseru',
    district: 'District 0',
    phoneNumber: '+26622100002',
    email: 'teboho.mokete@clinic0.co.ls',
  },
  {
    clinicName: 'Clinic 1',
    firstName: 'Nthabiseng',
    lastName: 'Ramatla',
    specialization: 'General Medicine',
    location: 'District 1 • Maseru',
    city: 'Maseru',
    district: 'District 1',
    phoneNumber: '+26622100003',
    email: 'nthabiseng.ramatla@clinic1.co.ls',
  },
  {
    clinicName: 'Clinic 2',
    firstName: 'Khotso',
    lastName: 'Motlalepula',
    specialization: 'General Medicine',
    location: 'Maseru',
    city: 'Maseru',
    district: 'Maseru District',
    phoneNumber: '+26622100004',
    email: 'khotso.motlalepula@clinic2.co.ls',
  },
];

async function main() {
  console.log('🌱 Seeding providers...');

  for (const p of PROVIDERS) {
    // Create a dummy userProfile for each provider
    const profile = await prisma.userProfile.upsert({
      where: { email: p.email },
      create: {
        id: `seed-provider-${p.email}`,
        email: p.email,
        fullName: `Dr ${p.firstName} ${p.lastName}`,
        clinicName: p.clinicName,
      },
      update: {},
    });

    // Assign PROVIDER role
    const role = await prisma.role.findUnique({ where: { name: 'PROVIDER' } });
    if (role) {
      await prisma.userRole.upsert({
        where: { userProfileId_roleId: { userProfileId: profile.id, roleId: role.id } },
        create: { userProfileId: profile.id, roleId: role.id },
        update: {},
      });
    }

    // Create provider
    const provider = await prisma.provider.upsert({
      where: { userProfileId: profile.id },
      create: {
        userProfileId: profile.id,
        firstName: p.firstName,
        lastName: p.lastName,
        clinicName: p.clinicName,
        specialization: p.specialization,
        phoneNumber: p.phoneNumber,
        email: p.email,
        location: p.location,
        mpesaMerchantCode: '',
        isActive: true,
        isVerified: true,
      },
      update: { isVerified: true },
    });

    // Working hours Mon-Fri
    await prisma.workingHours.deleteMany({ where: { providerId: provider.id } });
    for (const day of [0, 1, 2, 3, 4, 5, 6]) {
      await prisma.workingHours.create({
        data: {
          providerId: provider.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: [1, 2, 3, 4, 5].includes(day),
        },
      });
    }

    // Primary address
    await prisma.providerAddress.upsert({
      where: { id: `seed-addr-${provider.id}` },
      create: {
        id: `seed-addr-${provider.id}`,
        providerId: provider.id,
        city: p.city,
        district: p.district,
        country: 'Lesotho',
        isPrimary: true,
      },
      update: {},
    }).catch(() => prisma.providerAddress.create({
      data: {
        providerId: provider.id,
        city: p.city,
        district: p.district,
        country: 'Lesotho',
        isPrimary: true,
      },
    }));

    console.log(`✅ ${p.clinicName} / Dr ${p.firstName} ${p.lastName}`);
  }

  console.log('🎉 Providers seeded');
}

main().catch(console.error).finally(() => prisma.$disconnect());