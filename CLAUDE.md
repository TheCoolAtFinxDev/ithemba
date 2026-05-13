# IthembaHealth Platform — Claude Code Context

## Project Overview

iThemba means "hope". This is a health savings scheme for Basotho (people of Lesotho) that lets them save for private healthcare and pay providers via M-Pesa or C-Pay.

**GitHub repo:** https://github.com/TheCoolAtFinxDev/ithemba

---

## Infrastructure

| Component | URL / Location |
|---|---|
| App server | 169.239.181.30 (Debian 13) |
| Middleware server | 169.255.59.27 (Ubuntu 24) |
| WSO2 IS 7.2 | https://identity.golink.co.ls/console |
| Novu notifications | https://talk.golink.co.ls |
| Nginx Proxy Manager | http://169.255.59.27:81 |
| Supabase project | seodrkgpfytwofwozitt (eu-west-1) |
| Angular PWA | http://169.239.181.30 |
| NestJS API | http://169.239.181.30/api |
| Swagger | http://169.239.181.30/api/docs |

---

## Workspace Structure

```
~/ithemba/                          ← Nx monorepo root
├── apps/
│   ├── api/src/                    ← NestJS API
│   │   ├── app/app.module.ts       ← root module (imports all modules)
│   │   ├── auth/                   ← WSO2 JWT, guards, decorators, RBAC
│   │   ├── prisma/                 ← PrismaService + PrismaModule (global)
│   │   ├── patients/               ← patient profile, onboarding, HSA
│   │   ├── providers/              ← provider profile, search, slots, hours
│   │   └── appointments/           ← booking, OTP, status transitions
│   └── web/src/app/               ← Angular PWA
│       ├── core/auth/              ← AuthService, guards, interceptor, OIDC
│       ├── app.routes.ts           ← all routes
│       └── features/
│           ├── landing/            ← public landing page
│           ├── patient/            ← patient portal (bottom nav)
│           │   └── onboarding/     ← 3-step patient onboarding
│           ├── provider/           ← provider portal (sidebar nav)
│           │   ├── onboarding/     ← 3-step provider onboarding
│           │   └── appointments/   ← appointment queue component
│           └── admin/              ← admin portal (sidebar nav)
├── prisma/
│   ├── schema.prisma               ← 29 tables + RBAC
│   ├── seed.ts                     ← roles + permissions seed
│   └── seed-providers.ts           ← 4 test providers seed
├── deploy.sh                       ← build API + restart PM2 + smoke test
├── smoke-test.sh                   ← API health checks
├── git-push.sh                     ← commit + push current branch
└── .env                            ← secrets (not in git)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | NestJS 10 + Passport JWT + Swagger |
| ORM | Prisma 7 + PostgreSQL adapter |
| Database | Supabase PostgreSQL |
| Auth | WSO2 IS 7.2 (OIDC/OAuth2 + PKCE) |
| Notifications | Novu (self-hosted at talk.golink.co.ls) |
| Frontend | Angular 19 (standalone components, signals) |
| CSS | Bootstrap 5 + Bootstrap Icons |
| Process manager | PM2 |
| Web server | Nginx |
| Monorepo | Nx 22 |

---

## Environment Variables (.env)

```env
# Database
DATABASE_URL="postgresql://postgres.seodrkgpfytwofwozitt:..."
DIRECT_URL="postgresql://postgres.seodrkgpfytwofwozitt:..."
DB_HOST=aws-0-eu-west-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.seodrkgpfytwofwozitt
DB_PASSWORD=qU9ne$q#2Ah/y?y

# WSO2
WSO2_ISSUER=https://identity.golink.co.ls/oauth2/token
WSO2_JWKS_URI=https://identity.golink.co.ls/oauth2/jwks
WSO2_AUDIENCE=jwaADZBObZ3IIenbRWsfoGlytNka
WSO2_CLIENT_ID=jwaADZBObZ3IIenbRWsfoGlytNka
WSO2_SPA_CLIENT_ID=qK58RLdy2ehhqhvtzUhBgB7m1v4a

# Novu
NOVU_API_KEY=
NOVU_API_URL=https://talk.golink.co.ls/api

# App
NODE_ENV=production
PORT=3000
```

---

## WSO2 Applications

| App | Client ID | Purpose |
|---|---|---|
| ithemba-api | jwaADZBObZ3IIenbRWsfoGlytNka | Resource server (M2M) |
| ithemba-pwa | qK58RLdy2ehhqhvtzUhBgB7m1v4a | SPA (PKCE auth code flow) |

**WSO2 admin:** admin / Mg2Q4VVm8MgJLqK5dBEn

**Test users:**
- Patient: testpatient@ithembahealth.com / Mg2Q4VVm8MgJLqK5dBEn
- Patient 2: testpatient2@ithembahealth.com / Mg2Q4VVm8MgJLqK5dBEn  
- Provider: testprovider@ithembahealth.com / Mg2Q4VVm8MgJLqK5dBEn

---

## Database

**Supabase project:** seodrkgpfytwofwozitt
**Region:** eu-west-1
**Connection:** Session pooler (IPv4 only — server doesn't support IPv6)

**Key tables:**
- `user_profiles` — WSO2 sub as primary key
- `patients` — patient records (linked to user_profile)
- `providers` — provider records (linked to user_profile)
- `appointments` — bookings with status history
- `health_savings_accounts` — HSA per patient
- `savings_transactions` — deposit/debit history
- `provider_claims` — claims submitted by providers
- `roles` — dynamic roles (PATIENT, PROVIDER, ADMIN + custom)
- `permissions` — resource:action pairs
- `role_permissions` — many-to-many
- `user_roles` — user to role assignments

**Run migrations:**
```bash
cd ~/ithemba && npx prisma migrate dev --name <name>
npx prisma generate
```

**Run seeds:**
```bash
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
npm run seed                    # RBAC roles + permissions
npx tsx prisma/seed-providers.ts  # test providers
```

---

## Completed Modules ✅

### Backend (NestJS)
- **Auth** — WSO2 JWT validation, `/auth/sync`, `/auth/me`, auto role assignment
- **RBAC** — Dynamic roles + permissions, `PermissionsGuard`, `@RequirePermission()`
- **Patients** — Onboarding (creates patient + HSA + R67 fee), profile, address
- **Providers** — Profile, search, slots (30-min), working hours, time off, onboarding
- **Appointments** — Book, cancel, reschedule, confirm, OTP/visit code, provider actions (accept/check-in/complete/no-show)

### Frontend (Angular)
- **Landing page** — Hero, how it works, patient CTA, provider CTA
- **Auth flow** — WSO2 OIDC login, token interceptor, role-based redirect
- **Patient portal** — Dashboard (bottom nav), onboarding (3 steps)
- **Provider portal** — Dashboard (sidebar), onboarding (3 steps), appointment queue

---

## Pending Modules 🔲

### Backend
- **Wallet/HSA** — top-up (M-Pesa stub), balance, transaction history
- **Claims** — submit, review, approve/reject, pay
- **Admin API** — user management, lock/unlock, role assignment
- **RBAC API** — CRUD for roles and permissions (admin UI)

### Frontend
- **Patient appointments** — find doctor, slot picker, booking flow, appointment list, visit code
- **Patient wallet** — HSA balance, top-up, transaction history
- **Admin portal** — users, claims review, roles & permissions management
- **Provider claims** — submit claim after completed appointment

---

## Business Rules

| Rule | Value |
|---|---|
| Registration fee | R67 once-off (deducted on HSA creation) |
| Annual admin fee | R67 (deducted every January — TODO: scheduled job) |
| Transaction fee | 5% (on all payments) |
| Min monthly contribution | R500 |
| Max monthly contribution | R10,000 |
| Lump sum AML threshold | R50,000+ |
| Cash withdrawals | NOT allowed |
| Transfers out | NOT allowed |
| Visit code OTP | 6-digit, 1-hour expiry, SMS via Novu |
| Slot duration | 30 minutes |

---

## Brand & Design

```css
--ith-teal:    #00B9D6   /* primary, app bars, buttons */
--ith-green:   #4A7C59   /* provider, book buttons, accents */
--ith-danger:  #E53935   /* cancel, danger */
--ith-bg:      #f5f7fb   /* page background */
```

- Patient portal: **mobile-first, bottom navigation** (Home | Appointments | Claims)
- Provider portal: **Dasher-style sidebar** navigation
- Admin portal: **Dasher-style sidebar** navigation
- Font: system-ui / Segoe UI
- Cards: white, `border-radius: 12px`, subtle shadow

---

## Deploy Commands

```bash
# Build API + restart PM2 + smoke test
cd ~/ithemba && ./deploy.sh

# Build Angular + reload Nginx
NX_IGNORE_UNSUPPORTED_TS_SETUP=true npx nx build web --skip-nx-cache
sudo systemctl reload nginx

# Commit + push current branch
./git-push.sh "feat: description"

# Merge to main
git checkout main && git merge feat/xxx && GIT_TERMINAL_PROMPT=1 GIT_ASKPASS="" git push
```

---

## API Endpoints (implemented)

### Auth
- `POST /api/auth/sync` — upsert profile + assign role
- `GET /api/auth/me` — profile with roles + permissions

### Patients
- `GET /api/patients/profile`
- `PUT /api/patients/profile/address`
- `POST /api/v1/users/:id/patient/onboard`
- `GET /api/patients/:patientId`

### Providers
- `GET /api/v1/providers/profile/Me`
- `POST /api/v1/users/:id/provider/onboard`
- `PUT /api/v1/providers/profile/update`
- `PUT /api/v1/providers/profile/address`
- `GET/PUT /api/v1/providers/profile/hours`
- `GET /api/v1/providers/profile/search`
- `GET /api/v1/providers/profile/details`
- `GET /api/v1/providers/profile/slots`
- `GET/POST/DELETE /api/v1/providers/:id/time-off`

### Appointments
- `GET/POST /api/patients/:id/appointments`
- `GET /api/patients/:id/appointments/:aptId`
- `PUT .../cancel`
- `PUT .../reschedule`
- `PUT .../confirm`
- `POST .../otp/send`
- `GET /api/v1/providers/:id/appointments`
- `GET /api/v1/providers/:id/appointments/:aptId`
- `PUT .../accept|reject|check-in|start|complete|no-show|cancel`

---

## Key Design Decisions

1. **No Role enum in UserProfile** — roles are fully dynamic via `UserRole` table
2. **WSO2 sub = UserProfile.id** — no separate auth tables
3. **Session pooler only** — app server IPv4 only, Supabase IPv6 not reachable
4. **PermissionsGuard reads DB** — in-memory cache for now, Redis later
5. **`isVerified: false` on provider onboard** — admin must approve before provider appears in search
6. **Visit code = 6-digit OTP** — stored in `appointment_otps`, sent via Novu SMS
7. **R67 fee recorded as transaction** — balance stays 0 until patient tops up

---

## Current Branch

```
main  ← stable, all completed modules merged
```

Next feature branch to create:
```bash
git checkout -b feat/patient-appointments-ui
```

This will build the patient-side booking flow:
- Find doctor (search + provider cards)
- Slot picker (date + 30-min pills matching screenshots)
- My appointments list (upcoming/past tabs)
- Appointment detail + visit code screen
