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
│   │   ├── auth/                   ← WSO2 JWT, guards, RBAC, decorators
│   │   ├── prisma/                 ← PrismaService + PrismaModule (global)
│   │   ├── patients/               ← patient profile, onboarding, HSA, beneficiaries
│   │   ├── providers/              ← provider profile, search, slots, hours, time off
│   │   ├── appointments/           ← booking, OTP send + verify, status transitions
│   │   ├── claims/                 ← submit, review, approve/reject, pay
│   │   └── admin/                  ← users, providers, roles, permissions, stats
│   └── web/src/app/               ← Angular PWA
│       ├── core/auth/              ← AuthService, authGuard, roleGuard, interceptor, OIDC
│       ├── app.routes.ts           ← all routes (roleGuard on all portals)
│       └── features/
│           ├── landing/            ← public landing page
│           ├── unauthorized/       ← 403 page with role-aware redirect
│           ├── patient/            ← patient portal (bottom nav: Home | Appointments | Claims)
│           │   ├── onboarding/     ← 3-step patient onboarding
│           │   ├── appointments/   ← list, detail, book, reschedule, OTP
│           │   ├── book/           ← find doctor, slot picker, booking flow
│           │   ├── wallet/         ← HSA balance, top-up, transaction history
│           │   ├── claims/         ← patient claims list
│           │   ├── beneficiaries/  ← add/remove covered family members
│           │   └── profile/        ← personal details, address, sign out
│           ├── provider/           ← provider portal (sidebar nav)
│           │   ├── onboarding/     ← 3-step provider onboarding
│           │   ├── appointments/   ← appointment queue + OTP verify & check-in modal
│           │   ├── claims/         ← submit claims, view history
│           │   ├── timeoff/        ← manage time off blocks
│           │   └── profile/        ← profile edit + working hours editor
│           └── admin/              ← admin portal (sidebar nav, red brand)
│               └── sections/       ← admin-users, admin-providers, admin-claims
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
| Frontend | Angular 19 (standalone components) |
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
DB_PASSWORD=<redacted — see local .env, not committed>

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

# Sentry (error tracking) — optional, no-ops if unset
SENTRY_DSN=
```

---

## WSO2 Applications

| App | Client ID | Purpose |
|---|---|---|
| ithemba-api | jwaADZBObZ3IIenbRWsfoGlytNka | Resource server — API validates tokens against this audience |
| ithemba-pwa | qK58RLdy2ehhqhvtzUhBgB7m1v4a | SPA — authorization code + PKCE (S256), JWT access tokens |

**WSO2 admin:** admin / <redacted — see password manager, not committed>

**Test users:** their Postgres records (patient/provider/HSA/appointments/etc.) were wiped from the production database on 2026-07-11 as part of go-live prep. **The WSO2 accounts themselves still exist and can still log in** — disabling/deleting them in the identity.golink.co.ls console is a manual step that hasn't been done yet. Recreate via real onboarding if needed for dev/staging.
- Patient: testpatient@ithembahealth.com
- Patient 2: testpatient2@ithembahealth.com
- Provider: testprovider@ithembahealth.com

**Required WSO2 settings for ithemba-pwa:**
- Token type: JWT (not opaque — backend validates via JWKS)
- PKCE: Mandatory, S256
- Allowed redirect URIs: `http://169.239.181.30`, `https://myhealth.ithembahealth.com` (confirmed production domain as of 2026-07-13 — **must be added in the WSO2 console manually, not just here**)
- Allowed origins: same as redirect URIs
- Scopes: `openid profile email roles`
- Requested attributes (in access token): email, given_name, family_name, name, roles
- Allowed audience: `jwaADZBObZ3IIenbRWsfoGlytNka`

**WSO2 Groups (must match DB role names exactly):**
- `ADMIN`, `PROVIDER`, `PATIENT` — roles flow from WSO2 groups into JWT, then into DB on first sync

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
- `appointment_otps` — 6-digit visit codes (isUsed, expiresAtUtc)
- `health_savings_accounts` — HSA per patient
- `savings_transactions` — deposit/debit history (Deposit, Debit, ClaimPayment)
- `provider_claims` — claims submitted by providers
- `beneficiaries` — family members covered under a patient's HSA
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
- **Auth** — WSO2 JWT validation (JWKS + issuer + audience), `/auth/sync` (role auto-detection from WSO2 groups claim), `/auth/me`, `RolesGuard`, `PermissionsGuard`
- **RBAC** — Dynamic roles + permissions, `@Roles()` decorator, `@RequirePermission()`, admin controller protected by `RolesGuard('ADMIN')`
- **Patients** — Onboarding (patient + HSA + R67 fee), profile read/update (phone, DOB, national ID), address update, `GET /patients/:id`
- **Providers** — Profile, search, slots (30-min), working hours, time off, onboarding
- **Appointments** — Book, cancel, reschedule, confirm, OTP send, **OTP verify + auto check-in**, provider actions (accept/reject/check-in/start/complete/no-show/cancel)
- **Wallet/HSA** — Balance, top-up (M-Pesa stub), transaction history
- **Claims** — Submit (provider, post-completed appointment), provider history, patient view, admin list with status filter, approve (5% fee + account debit), reject
- **Beneficiaries** — List, add, soft-delete (isActive: false)
- **Admin** — Users list + lock/unlock, role assignment, provider verification, stats, roles CRUD, permissions CRUD

### Frontend (Angular)
- **Landing page** — Hero, how it works, patient CTA, provider CTA
- **Auth flow** — WSO2 OIDC PKCE login, Bearer token interceptor, `authGuard` + `roleGuard` on all portal routes, unauthorized page (role-aware redirect)
- **Patient portal**
  - Home — live HSA balance card, quick actions (Find Doctor, Appointments, Beneficiaries, Claims), upcoming appointments preview
  - Appointments — list (upcoming/past tabs), appointment detail, book flow (search providers, slot picker, confirm), reschedule, cancel, OTP send + display
  - Wallet — balance, top-up bottom-sheet (M-Pesa), transaction history
  - Claims — claims list with status badges
  - Beneficiaries — list with relationship badges, add modal, remove
  - Profile — personal details (phone, DOB, national ID), address, logout with confirmation
- **Provider portal**
  - Dashboard — live stats (today's count, checked-in, completed this week, pending claims)
  - Appointments — queue with filter chips, **OTP verify & check-in modal** (6-digit input), accept/reject/complete/no-show
  - Claims — submit claim for completed appointment, claim history
  - Time Off — add/remove time-off blocks
  - Profile — profile edit (firstName, lastName, clinic, specialization, phone, location, about), working hours editor (7-day grid with availability toggle + time pickers)
- **Admin portal**
  - Dashboard — 4 stat cards (patients, providers, appointments, pending claims)
  - Users — debounced search, role badges, lock/unlock, role assignment, provider verification
  - Providers — pending verification zone + verified table
  - Claims — status filter chips, approve/reject modal with 5% fee breakdown

---

## Pending / Future Work 🔲

*(Last verified against code 2026-07-13 — this list decays fast, re-check before trusting it.)*

- **Employer payslip deduction** — blocked on Golink Transact's vendor response (API shape, Lesotho availability, settlement timeline); `EmployerPaymentMethod.Payslip` exists as a schema placeholder only
- **C-Pay/M-Pesa live-rail testing** — both rails are fully wired through `GolinkService` (top-up, auto-debit, provider disbursement, employer payment links) but only exercised against `sandbox.transact.golink.co.ls` so far — needs real end-to-end testing before go-live
- **Appointment reminder notifications** — distinct from visit-code delivery (which is done); no reminder job exists yet
- **Reconciliation / balance endpoints** — `GET /merchant/balance`, `GET /transactions` from the Golink integration request doc are not implemented; needed for finance reconciliation before go-live, not user-facing
- **Backend test coverage** — `apps/api` has Jest wired up with unit tests for the highest-risk paths (claim approval/rejection race conditions, appointment double-booking, Golink webhook signature/idempotency) — still far from comprehensive, expand as new risk areas are found

### Already done, despite what older versions of this doc said
- Novu SMS is live via Golink Talk (Vomule provider), not a stub
- Annual R67 admin fee — daily cron (`apps/api/src/admin/annual-fee.task.ts`)
- M-Pesa real integration — live Golink STK push for top-up/auto-debit/registration fee
- Appointment/claim email notifications (accepted/rejected/approved/rejected) — wired via Novu
- CI (`​.github/workflows/ci.yml`) — build + schema-drift check + tests on every PR

---

## Business Rules

| Rule | Value |
|---|---|
| Registration fee | R67 once-off (deducted on HSA creation) |
| Annual admin fee | R67 (deducted every January — TODO: scheduled job) |
| Transaction fee | 5% (on all claim payments) |
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
--ith-danger:  #E53935   /* admin, cancel, danger */
--ith-bg:      #f5f7fb   /* page background */
```

- Patient portal: **mobile-first, bottom navigation** (Home | Appointments | Claims)
- Provider portal: **Dasher-style sidebar** (green brand)
- Admin portal: **Dasher-style sidebar** (red brand)
- Font: system-ui / Segoe UI
- Cards: white, `border-radius: 12px`, subtle shadow
- Angular components: standalone only — always list `NgIf`, `NgFor`, `NgClass`, `FormsModule`, `DecimalPipe`, `DatePipe` explicitly in `imports[]`

---

## Deploy Commands

```bash
# Build API + restart PM2 + smoke test
cd ~/ithemba && ./deploy.sh

# Build Angular (Nginx serves from dist/ directly — no reload needed)
NX_IGNORE_UNSUPPORTED_TS_SETUP=true npx nx build web --skip-nx-cache

# Restart API after build
pm2 restart ithemba-api

# Commit + push current branch
./git-push.sh "feat: description"

# Merge to main
git checkout main && git merge feat/xxx && GIT_TERMINAL_PROMPT=1 GIT_ASKPASS="" git push
```

---

## API Endpoints (implemented)

### Auth
- `POST /api/auth/sync` — upsert profile + assign role from WSO2 groups
- `GET /api/auth/me` — profile with roles + permissions

### Patients
- `GET /api/patients/profile`
- `PUT /api/patients/profile` — update phone, DOB, national ID
- `PUT /api/patients/profile/address`
- `POST /api/v1/users/:id/patient/onboard`
- `GET /api/patients/:patientId`
- `GET /api/patients/:id/wallet`
- `POST /api/patients/:id/wallet/topup`
- `GET /api/patients/:id/wallet/transactions`
- `GET /api/patients/:id/beneficiaries`
- `POST /api/patients/:id/beneficiaries`
- `DELETE /api/patients/:id/beneficiaries/:beneficiaryId`
- `GET /api/patients/:id/appointments`
- `POST /api/patients/:id/appointments`
- `GET /api/patients/:id/appointments/:aptId`
- `PUT .../cancel`, `.../reschedule`, `.../confirm`
- `POST .../otp/send`
- `GET /api/patients/:id/claims`

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
- `GET /api/v1/providers/:id/appointments`
- `GET /api/v1/providers/:id/appointments/:aptId`
- `PUT .../accept|reject|check-in|start|complete|no-show|cancel`
- `POST .../verify-otp` — verify patient visit code + auto check-in
- `GET /api/v1/providers/:id/claims`
- `POST /api/v1/providers/:id/claims`

### Admin (requires ADMIN role)
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id/lock`, `.../unlock`
- `POST /api/admin/users/:id/roles`
- `PUT /api/admin/providers/:id/verify`
- `GET /api/admin/claims`
- `PUT /api/admin/claims/:id/approve`, `.../reject`
- `GET /api/admin/roles`
- `POST /api/admin/roles`
- `GET /api/admin/permissions`
- `POST /api/admin/roles/:id/permissions`

---

## Key Design Decisions

1. **No Role enum in UserProfile** — roles are fully dynamic via `UserRole` table; WSO2 groups flow into DB roles on first sync
2. **WSO2 sub = UserProfile.id** — no separate auth tables
3. **Session pooler only** — app server IPv4 only, Supabase IPv6 not reachable
4. **`RolesGuard` on admin controller** — non-admin JWTs get 403 on all `/api/admin/*` routes
5. **`roleGuard` on all frontend routes** — patients can't navigate to provider portal by URL manipulation, and vice versa
6. **JWT access tokens only** — backend validates via JWKS; WSO2 must be set to JWT token type (not opaque)
7. **Audience validation** — backend rejects tokens not issued with `aud: jwaADZBObZ3IIenbRWsfoGlytNka`
8. **`isVerified: false` on provider onboard** — admin must verify before provider appears in search
9. **Visit code = 6-digit OTP** — stored in `appointment_otps`, verified by provider before check-in; verification atomically transitions appointment to CheckedIn
10. **R67 fee recorded as transaction** — balance stays 0 until patient tops up; fee is a Debit transaction record
11. **5% claim fee** — on claim approval, `net = amount * 1.05`; debits patient's HSA balance and creates a ClaimPayment transaction
12. **Angular standalone components** — never use NgModules; always import `NgIf`, `NgFor`, `NgClass`, `FormsModule`, pipes in the component's `imports[]`

---

## Current Branch

```
feat/patient-appointments-ui  ← active development
main                          ← stable
```

Merge when ready:
```bash
git checkout main && git merge feat/patient-appointments-ui && GIT_TERMINAL_PROMPT=1 GIT_ASKPASS="" git push
```
