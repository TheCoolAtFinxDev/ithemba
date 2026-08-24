import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import https from 'https';
import crypto from 'crypto';

// ── DB client ─────────────────────────────────────────────────────────────────

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '6543'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) as any });

// ── WSO2 SCIM2 helper ────────────────────────────────────────────────────────

const WSO2_BASE   = 'https://identity.golink.co.ls/scim2';
const WSO2_ADMIN_USER = process.env.WSO2_ADMIN_USER || 'admin';
const WSO2_ADMIN_PASS = process.env.WSO2_ADMIN_PASS;
if (!WSO2_ADMIN_PASS) {
  throw new Error('WSO2_ADMIN_PASS is not set — check your .env file');
}
const WSO2_BASIC  = Buffer.from(`${WSO2_ADMIN_USER}:${WSO2_ADMIN_PASS}`).toString('base64');
// Test account's own password — generated, not the admin credential.
const TEST_EMPLOYER_PASSWORD = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + 'aA1!';

function scim(method: string, path: string, body?: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const url = new URL(WSO2_BASE + path);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Basic ${WSO2_BASIC}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding employer test data...\n');

  // ── 1. Create EMPLOYER group in WSO2 ─────────────────────────────────────

  const groupSearch = await scim('GET', '/Groups?filter=displayName+eq+EMPLOYER');
  let employerGroupId: string;

  if (groupSearch.totalResults > 0) {
    employerGroupId = groupSearch.Resources[0].id;
    console.log(`✅ WSO2 group EMPLOYER already exists (${employerGroupId})`);
  } else {
    const newGroup = await scim('POST', '/Groups', {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
      displayName: 'EMPLOYER',
    });
    if (!newGroup.id) throw new Error(`Failed to create EMPLOYER group: ${JSON.stringify(newGroup)}`);
    employerGroupId = newGroup.id;
    console.log(`✅ Created WSO2 group EMPLOYER (${employerGroupId})`);
  }

  // ── 2. Create testemployer user in WSO2 ──────────────────────────────────

  const userSearch = await scim('GET', '/Users?filter=userName+eq+testemployer%40ithembahealth.com');
  let wso2UserId: string;

  if (userSearch.totalResults > 0) {
    wso2UserId = userSearch.Resources[0].id;
    console.log(`✅ WSO2 user testemployer already exists (${wso2UserId})`);
  } else {
    const newUser = await scim('POST', '/Users', {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      userName: 'testemployer@ithembahealth.com',
      password: TEST_EMPLOYER_PASSWORD,
      name: { givenName: 'Test', familyName: 'Employer' },
      emails: [{ value: 'testemployer@ithembahealth.com', primary: true }],
    });
    if (!newUser.id) throw new Error(`Failed to create WSO2 user: ${JSON.stringify(newUser)}`);
    wso2UserId = newUser.id;
    console.log(`✅ Created WSO2 user testemployer@ithembahealth.com (${wso2UserId})`);
  }

  // ── 3. Add user to EMPLOYER group ────────────────────────────────────────

  await scim('PATCH', `/Groups/${employerGroupId}`, {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
    Operations: [{
      op: 'add',
      path: 'members',
      value: [{ value: wso2UserId, display: 'testemployer@ithembahealth.com' }],
    }],
  });
  console.log(`✅ Added testemployer to EMPLOYER group`);

  // ── 4. Upsert UserProfile in DB ──────────────────────────────────────────

  await prisma.userProfile.upsert({
    where: { id: wso2UserId },
    create: { id: wso2UserId, email: 'testemployer@ithembahealth.com', fullName: 'Test Employer' },
    update: { fullName: 'Test Employer' },
  });
  console.log(`✅ UserProfile upserted (sub: ${wso2UserId})`);

  // ── 5. Assign EMPLOYER role ───────────────────────────────────────────────

  const employerRole = await prisma.role.findUnique({ where: { name: 'EMPLOYER' } });
  if (!employerRole) throw new Error('EMPLOYER role not found — run npm run seed first');

  await prisma.userRole.upsert({
    where: { userProfileId_roleId: { userProfileId: wso2UserId, roleId: employerRole.id } },
    create: { userProfileId: wso2UserId, roleId: employerRole.id },
    update: {},
  });
  console.log(`✅ EMPLOYER role assigned`);

  // ── 6. Create Employer record in DB ──────────────────────────────────────

  const existing = await prisma.employer.findUnique({ where: { contactUserProfileId: wso2UserId } });

  let employer;
  if (existing) {
    employer = existing;
    console.log(`✅ Employer record already exists (${employer.id})`);
  } else {
    employer = await prisma.employer.create({
      data: {
        name: 'Test Company Ltd',
        registrationNumber: 'LSO-2024-00001',
        contactName: 'Test Employer',
        contactEmail: 'testemployer@ithembahealth.com',
        contactPhone: '+26650000000',
        contactUserProfileId: wso2UserId,
        platformFeePerSeat: 50,
        isActive: true,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: 'seed',
        createdBy: 'seed',
      },
    });
    console.log(`✅ Employer record created (${employer.id})`);
  }

  // ── 7. Enroll testpatient as a member ────────────────────────────────────

  const patientProfile = await prisma.userProfile.findFirst({
    where: { email: 'testpatient@ithembahealth.com' },
    include: { patient: true },
  });

  if (!patientProfile?.patient) {
    console.log(`⚠️  testpatient not found in DB — skipping member enrollment`);
    console.log(`   Log in as testpatient@ithembahealth.com first to auto-provision their record`);
  } else {
    const patientId = patientProfile.patient.id;
    const existingMembership = await prisma.employerMembership.findUnique({
      where: { employerId_patientId: { employerId: employer.id, patientId } },
    });

    if (existingMembership) {
      console.log(`✅ testpatient already enrolled as member`);
    } else {
      await prisma.employerMembership.create({
        data: {
          employerId: employer.id,
          patientId,
          employeeRef: 'EMP001',
          contributionAmount: 1200,
          status: 'Active',
          createdBy: 'seed',
        },
      });
      console.log(`✅ testpatient enrolled as member (ref: EMP001, LSL 1,200/month)`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Employer seed complete

  WSO2 user:  testemployer@ithembahealth.com
  Password:   ${wso2UserId && userSearch.totalResults === 0 ? TEST_EMPLOYER_PASSWORD : '(unchanged — user already existed)'}
  WSO2 group: EMPLOYER
  WSO2 sub:   ${wso2UserId}

  Employer:   Test Company Ltd
  DB ID:      ${employer.id}
  Verified:   ✅

  Portal URL: http://169.239.181.30/employer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
