# IthembaHealth: Original Codebase vs. Rebuild — Comparison & Scope Analysis

**Purpose:** This document compares the codebase handed over by the previous developer (`original-project/`) against the current NestJS + Angular implementation, to establish what was actually deliverable as "compile and host" work versus what constituted new development requiring a separate contract.

**Context:** The engagement was scoped as: take over the previous developer's implementation, compile/build and host it as-is, get paid for that baseline delivery. Anything additional beyond that would require a new development contract. This document evaluates whether the original codebase supported that "compile and host" framing.

---

## 1. What `original-project/` Contains

Three components were handed over:

1. **`iThemba-main/`** — a .NET 8 / Blazor WASM solution, Clean Architecture layout:
   `Ithembahealth.API`, `Ithembahealth.Application`, `Ithembahealth.Domain`, `Ithembahealth.Identity`, `Ithembahealth.Infrastructure`, `Ithembahealth.Persistence`, `Ithembahealth.PWA.Unified`
2. **`Ithembahealth-mpesa/`** — a separate, smaller JavaScript "mini-app" (Vodacom M-Pesa super-app mini-program format), including a `swagger.json` describing a 65-endpoint API contract
3. **`CLAUDE-additional-context.md`** — a context file already present in the handover folder, which explicitly frames the work as **"a full rebuild"** commissioned to modernize the stack (this predates the current engagement's own documentation)

---

## 2. Side-by-Side Comparison

| Module | Original (.NET / Blazor) | Current (NestJS / Angular) |
|---|---|---|
| **API controllers** | 1 controller (`AppointmentController`), 1 endpoint: `GET /api/appointments/all` — `[Authorize]` is commented out (unauthenticated) | 10 controllers, **84 working, authenticated endpoints** |
| **Business logic (CQRS/services)** | 2 use cases total: `CreateAppointmentCommand`, `GetAppointmentListQuery` — and `CreateAppointmentCommand` is never wired to a controller, so it's unreachable | Full service layer across patients, providers, appointments, claims, admin, employer, RBAC |
| **Repositories** | 1 implemented (`AppointmentRepository`) + a generic base | Full Prisma-backed persistence across 33 database models |
| **Auth** | ASP.NET Core Identity — genuinely functional (register/login/refresh/logout/2FA all work), but no working login flow was ever wired to the single appointments endpoint | WSO2 IS 7.2 OIDC/PKCE, fully wired, JWT validation, auto-provisioning, dynamic role detection from WSO2 groups |
| **RBAC** | Does not exist — no Role/Permission entities anywhere in the Domain layer; roles are bare ASP.NET Identity strings | Full dynamic RBAC: roles, permissions, role-permission mapping, admin UI to manage it |
| **Employer module** | Does not exist — no entity, no UI, not in the swagger.json contract | Full module: admin-gated onboarding, billing cycles, member CSV import, admin UI |
| **Wallet/HSA** | `PatientWallet.razor` UI exists; top-up is a method literally named `SimulateTopUp()` with `Task.Delay(2000) // Simulate payment processing` — no real backend call | Real balance tracking, transaction ledger, top-up endpoint, admin-visible |
| **Claims** | `ProviderClaimSubmission.razor` contains `// TODO: Save to backend` — UI only, no persistence | Full submit → review → approve/reject flow, with HSA-balance-aware partial coverage logic (out-of-pocket disclosure) and audit trail |
| **Admin portal** | `AdminDashboard.razor` and ~10 admin Razor pages exist with hardcoded mock data, but there are no admin endpoints anywhere in the API project for them to call | Full working admin portal: users, providers (+ CSV import), employers, appointments, claims queue, RBAC, audit log |
| **Notifications** | `EmailService.cs` is a stub (`throw new NotImplementedException()`); no SMS integration | Novu integration: email + SMS OTP, welcome emails |
| **Payments (M-Pesa/C-Pay)** | Not integrated anywhere in the .NET solution — only passive, unused data fields (`MpesaPhoneNumber`, `MpesaMerchantCode`, etc.); all "M-Pesa processing" in the UI is simulated | M-Pesa top-up creates real DB transactions; C-Pay pending vendor API docs (documented as such) |

---

## 3. Deep Evidence — File-Level Findings

A line-level pass through the .NET/Blazor codebase (controllers, CQRS handlers, and all 72 Razor pages' code-behind) confirmed the structural findings above with direct citations.

### API surface, in total

- `GET api/appointments/all` — the only controller action in the entire solution
- Standard ASP.NET Identity endpoints (`/register`, `/login`, `/refresh`, `/logout`, `/forgotPassword`, `/manage/2fa`, `/manage/info`) — genuinely functional, real `UserManager`/`SignInManager` calls
- Nothing else. No Patient, Provider, Claims, Admin, Wallet, Beneficiary, or Employer endpoints exist anywhere in the API project.

### Application layer (business logic)

Exactly two CQRS handlers exist in the entire solution:
- `CreateAppointmentCommandHandler` — real DB insert via `_appointmentRepository.AddAsync()`, but **never called by any controller** — dead code, unreachable from the API
- `GetAppointmentListQueryHandler` — the only handler actually reachable, backing the one working endpoint

No Application-layer code exists at all for claims processing, HSA/wallet operations, provider verification, beneficiary management, or admin actions — despite full entity definitions existing in the Domain layer for all of these.

### Business-rule constants

A full-solution grep for the documented business rules (5% transaction fee, R67 registration fee, R500/R10,000 monthly contribution limits, R50,000 AML threshold) found **zero hits in any `.cs` file** (Domain, Application, Persistence, Infrastructure, Identity, API). The only places these numbers appear at all:
- `PatientAutoDebitSetup.razor` — client-side validation warnings only (`if (amount < 500 || amount > 10000)`), on a form whose save button never persists anything
- `Index.razor` — static marketing copy ("Minimal admin: R67/year registration"), not executable logic

No backend rule for any of these constants exists anywhere in the original codebase.

### Blazor pages (72 files) — representative evidence

Every patient/provider/admin screen follows the same pattern: complete-looking markup bound to hardcoded data or simulated behavior. Verbatim examples:

| File | Evidence |
|---|---|
| `PatientDashboard.razor` | Hardcoded `"LSL 220.00"` balance, hardcoded `"Dr. Makhotso"` last appointment |
| `PatientWallet.razor` | Method named `SimulateTopUp()`; `Task.Delay(2000); // Simulate payment processing` |
| `PatientDoctorsList.razor.cs` | `Enumerable.Range(1, 15)` generates fake `"Dr. Example N"` providers, `Fee = 150 + i * 5` |
| `BookAppointment.razor` | `Task.Delay(3000); // simulate M-Pesa processing delay`; hardcoded wallet balance |
| `PatientSavings.razor` | Hardcoded `"LSL 950.00"` balance, hardcoded `"Savings Goal: LSL 1500.00"` |
| `Profile.razor` | Hardcoded `"Thabo Mokoena"` / `"thabo@example.com"` |
| `ProviderDashboard.razor` | Hardcoded `"58"` total claims, `"LSL 23,400"` earned |
| `ProviderProfileEdit.razor` | `// TODO: Save to backend`; M-Pesa code check is `if (_mpesaCode == "123456") // Simulated` |
| `ProviderAppointmentDetail.razor` | `// Replace with actual API/service call`; OTP check is `if (_otp == "123456") // Simulate OTP check` |
| `ProviderClaimSubmission.razor` | `// TODO: Save to backend`; file upload is `// Simulated file upload` |
| `ProvidersList.razor` (admin) | `// TODO: replace this with API call to load providers`; generates 40 fake rows |
| `AdminDashboard.razor` | Hardcoded `"135"` claims, `"LSL 45,000"` savings balance |
| `CreateReport.razor` | `GenerateReport()` does `Console.WriteLine(...)` — no real report generation |
| `SupportTickets.razor` | `// TODO: Replace with API call` |
| `AddProvider.razor` | Partially functional — creates a real Identity user via `AuthenticationService.Register()`, but `// TODO: If you have a Providers API, create/update the provider profile here` — never creates the actual `Provider` entity |
| `OTPDialog.razor` | Entire markup commented out — not rendered anywhere |

Across all 72 `.razor` files, only **2** (`BookingDrawer.razor`, `NetworkBanner.razor`) make any real HTTP call to a backend. **Login, Register, and Logout are the only fully functional end-to-end flows in the entire original codebase.**

### Infrastructure stubs

```csharp
// EmailService.cs
public Task<bool> SendEmailAsync(Email email)
{
    throw new NotImplementedException();
}
```

- **Email**: stub, throws `NotImplementedException`
- **CSV export**: `CsvExporter` is an empty class implementing an effectively empty interface
- **SMS**: not implemented — one empty comment placeholder (`// Send Email or SMS OTP here`) in the orphaned `CreateAppointmentCommandHandler`
- **M-Pesa / C-Pay**: not implemented anywhere — confirmed via full-solution grep, zero hits beyond unused passive data-model fields

### Domain entities (the one genuinely solid layer)

30 well-organized entity classes across 7 subdomains (Appointments, ClaimsAndPatient, HealthSavings, PatientAndProvider, NotificationsAndFeedback, SystemSettingsAndLogs), all inheriting a shared `AuditableEntity` base. This is a legitimate, fairly thorough data model — but only the Appointment-related portion of it was ever exercised by working code. The other ~25 entities have never been queried or persisted to by any actual application logic.

### The `swagger.json` contract

A 65-endpoint API contract exists in the `Ithembahealth-mpesa` mini-app folder (not the .NET solution itself), covering patients, HSAs, full provider appointment lifecycle, admin user management, and mini-app login flows. This closely resembles the shape of what the current NestJS rebuild actually delivers. It appears to be an aspirational/forward-looking contract rather than documentation of what the .NET backend had built — of its 65 defined endpoints, the actual .NET API implements **1**.

---

## 4. Completion Percentage — How Much Work Remained

**Scope assumption:** measured against the original codebase's *own* intended scope — its 30 Domain entities, the 65-endpoint `swagger.json` contract, and its 72 Blazor pages — not against anything added later in the rebuild (RBAC, Employer module, WSO2, Novu, etc., which were new scope, not gaps in the original's own design).

### Methodology

Weighted by where real engineering effort goes in a system like this:

| Layer | Weight | Rationale |
|---|---|---|
| Database schema/migrations | 10% | Foundational but mechanical once entities are designed |
| Backend API + business logic | 35% | The core engineering — endpoints, validation, calculations, state transitions |
| Frontend UI markup/structure | 25% | Visible, demoable, but largely declarative/templating work |
| Frontend↔backend integration | 20% | Wiring real data through — usually where hidden effort/bugs live |
| Infrastructure (auth, email, SMS, payment, export) | 10% | Third-party integration work |

### Per-layer completion score

| Layer | Score | Basis |
|---|---|---|
| Database schema | 65% | 30 entity classes and real migrations exist, but only the Appointment-related schema was ever exercised by working code |
| Backend API + logic | ~4% | 1 of 65 contracted endpoints implemented (unauthenticated); 2 of presumably dozens of needed handlers exist, one orphaned; zero business-rule constants coded anywhere |
| Frontend UI structure | ~70% | 72 pages exist with generally complete-looking markup — the most genuinely advanced layer, though a few (OTPDialog, ChangePassword) are stubs too |
| Frontend↔backend integration | ~3% | 2 of 72 files make a real HTTP call; everything else is hardcoded data, `Task.Delay` "simulations," or `// TODO: Save to backend` |
| Infrastructure | 20% | Auth/Identity genuinely works (1 of 5 sub-areas); Email, CSV export, SMS, M-Pesa/C-Pay are all stubs or unimplemented |

### Weighted result

```
0.10 × 65%  =  6.5
0.35 ×  4%  =  1.4
0.25 × 70%  = 17.5
0.20 ×  3%  =  0.6
0.10 × 20%  =  2.0
                ----
Total       ≈ 28%
```

**≈ 28% of the original's own self-contained scope was complete. ≈ 72% of the work remained** before there was an actual working system — real data flowing from a real backend through to a real, functioning frontend.

### Interpretation

The original codebase's UI looked far more finished than it functionally was — roughly 70% of the screens existed and looked professional in a demo or screenshot, which is exactly why "compile and host as-is" appeared plausible at a glance. But UI markup is only ~25% of the real engineering weight. The two layers that actually make a system *work* — backend logic (35% weight) and real frontend-to-backend data integration (20% weight) — were each at single-digit completion. That combination is what pushed total remaining work to roughly three-quarters of the project, far beyond what a screenshot-level review would suggest.

---

## 5. Summary Table

| Layer | Verdict |
|---|---|
| API Controllers | Scaffolding only — 1 controller, 1 unauthenticated action. Identity auth endpoints are the sole exception (fully implemented). |
| Domain Entities | Fully implemented as a schema (30 entity classes) — but no business-rule constants exist anywhere in code. |
| Blazor Pages (72 files) | Scaffolding/stub for everything except Login/Register/Logout. Polished UI bound to hardcoded mock data and simulated behavior throughout. |
| Application Layer (CQRS) | Real but minimal — only Appointments (create + list), and the create handler is orphaned (unreachable). |
| Identity/Auth | Fully implemented — real ASP.NET Core Identity, working register/login/refresh/password-reset/2FA. |
| Email | Stub — `throw new NotImplementedException()`. |
| File Export (CSV) | Stub — empty class. |
| Payment (M-Pesa/C-Pay) | Not implemented anywhere — only passive data fields and UI-simulated delays. |
| SMS | Not implemented — one empty comment placeholder. |
| Mini-app (M-Pesa) | Separate JS reference client with real request-handling code and a large aspirational `swagger.json`, targeting backend endpoints that don't exist in the actual .NET API. |

**Overall conclusion:** the original codebase amounted to a well-modeled data schema and a functional authentication system, with almost everything else — appointments beyond listing, claims, wallet/HSA, beneficiaries, provider management, and all admin functions — present only as visual scaffolding bound to hardcoded mock data, never connected to a real backend. There was no working system available to "compile and host"; an estimated 72% of the engineering work required to reach a functioning, end-to-end system remained.
