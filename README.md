# iThemba Health Savings Platform

**iThemba** (Sesotho: *hope*) is a digital health savings scheme for Basotho — the people of Lesotho. Members save for private healthcare and pay providers directly via M-Pesa or C-Pay.

> Built by [FinX Pty Ltd](https://finx.co.za)

---

## Live Environment

| | URL |
|---|---|
| Patient / Provider app | http://169.239.181.30 |
| API | http://169.239.181.30/api |
| Swagger docs | http://169.239.181.30/api/docs |
| Identity (WSO2 IS 7.2) | https://identity.golink.co.ls/console |

---

## What It Does

- **Patients** open an HSA (Health Savings Account), top it up via M-Pesa, find doctors, book 30-minute appointments, manage beneficiaries, and track claims
- **Providers** (doctors / clinics) manage their appointment queue, verify patients with a 6-digit OTP visit code, submit claims after completed visits, and manage working hours and time off
- **Admins** manage users, verify providers, approve/reject claims, and manage RBAC roles and permissions

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | NestJS 10 · Passport JWT · Swagger |
| ORM | Prisma 7 · PostgreSQL |
| Database | Supabase PostgreSQL (eu-west-1) |
| Auth | WSO2 IS 7.2 · OIDC / OAuth2 + PKCE |
| Notifications | Novu (self-hosted at talk.golink.co.ls) |
| Frontend | Angular 19 · Standalone components |
| CSS | Bootstrap 5 · Bootstrap Icons |
| Process manager | PM2 |
| Web server | Nginx |
| Monorepo | Nx 22 |

---

## Monorepo Structure

```
ithemba/
├── apps/
│   ├── api/src/                    NestJS API
│   │   ├── auth/                   WSO2 JWT strategy, RolesGuard, PermissionsGuard
│   │   ├── patients/               HSA, profile, beneficiaries, wallet
│   │   ├── providers/              Profile, search, slots, hours, time off
│   │   ├── appointments/           Booking, OTP send + verify, status machine
│   │   ├── claims/                 Submit, approve, reject, pay (5% fee)
│   │   └── admin/                  Users, providers, roles, permissions
│   └── web/src/app/                Angular PWA
│       ├── core/auth/              OIDC client, authGuard, roleGuard, interceptor
│       └── features/
│           ├── landing/            Public landing page
│           ├── patient/            Mobile portal (bottom nav: Home | Appointments | Claims)
│           │   ├── appointments/   Book · list · detail · OTP
│           │   ├── wallet/         HSA balance · top-up · history
│           │   ├── claims/         Claims list
│           │   ├── beneficiaries/  Add / remove covered family members
│           │   └── profile/        Personal details · address · sign out
│           ├── provider/           Desktop portal (sidebar nav)
│           │   ├── appointments/   Queue · OTP verify & check-in
│           │   ├── claims/         Submit · history
│           │   ├── timeoff/        Manage time off blocks
│           │   └── profile/        Profile · working hours
│           └── admin/              Admin portal (sidebar nav)
│               └── sections/       Users · Providers · Claims
├── prisma/
│   ├── schema.prisma               29 tables + RBAC
│   ├── seed.ts                     Roles + permissions
│   └── seed-providers.ts           4 test providers
├── deploy.sh                       Build API + restart PM2 + smoke test
├── smoke-test.sh                   API health checks
├── git-push.sh                     Commit + push current branch
└── .env                            Secrets (not committed)
```

---

## Development Setup

### Prerequisites

- Node.js 20+
- Access to Supabase project `seodrkgpfytwofwozitt`

### Install

```bash
git clone https://github.com/TheCoolAtFinxDev/ithemba
cd ithemba
npm install
# Copy .env and fill in secrets (see CLAUDE.md for the full template)
npx prisma generate
```

### Run locally

```bash
npx nx serve api        # NestJS on :3000
npx nx serve web        # Angular on :4200
```

### Seed the database

```bash
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
npm run seed                       # RBAC roles + permissions
npx tsx prisma/seed-providers.ts   # 4 test provider accounts
```

---

## Deploy (production)

```bash
# Build API + restart PM2 + smoke test
./deploy.sh

# Build Angular (Nginx serves from dist/ automatically)
NX_IGNORE_UNSUPPORTED_TS_SETUP=true npx nx build web --skip-nx-cache

# Push branch
./git-push.sh "feat: description"

# Merge to main
git checkout main && git merge feat/xxx && git push
```

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Patient | testpatient@ithembahealth.com | Mg2Q4VVm8MgJLqK5dBEn |
| Patient 2 | testpatient2@ithembahealth.com | Mg2Q4VVm8MgJLqK5dBEn |
| Provider | testprovider@ithembahealth.com | Mg2Q4VVm8MgJLqK5dBEn |
| WSO2 admin | admin | Mg2Q4VVm8MgJLqK5dBEn |

---

## Business Rules

| Rule | Value |
|---|---|
| Registration fee | R67 once-off (deducted on HSA creation) |
| Annual admin fee | R67 (January — scheduled job pending) |
| Transaction fee | 5% on all claim payments |
| Min monthly contribution | R500 |
| Max monthly contribution | R10,000 |
| AML lump-sum threshold | R50,000+ |
| Cash withdrawals | Not allowed |
| Transfers out | Not allowed |
| Visit code OTP | 6-digit · 1-hour expiry · SMS via Novu |
| Appointment slot | 30 minutes |

---

## Brand

```
--ith-teal:   #00B9D6   primary · app bars · buttons
--ith-green:  #4A7C59   provider · booking · accents
--ith-red:    #E53935   admin · danger · cancel
--ith-bg:     #f5f7fb   page background
```

Cards: white · `border-radius: 12px` · subtle shadow · font: system-ui

---

## License

Proprietary — © 2025 FinX Pty Ltd. All rights reserved.
