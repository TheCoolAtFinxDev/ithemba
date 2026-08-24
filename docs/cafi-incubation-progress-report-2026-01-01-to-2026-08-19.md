# CAFI Incubation Programme Progress Report

## FinX Pty Ltd — iThembaHealth Project

**Reporting period:** 1 January 2026–19 August 2026  
**Prepared for:** CAFI Incubation Programme  
**Prepared by:** FinX Pty Ltd  
**Project:** iThembaHealth digital health savings platform  
**Report date:** 19 August 2026

---

## 1. Executive summary

During the reporting period, FinX progressed iThembaHealth from an earlier partial concept/codebase into an integrated digital health savings platform for the Lesotho market. The rebuilt solution now includes an Angular progressive web application, a NestJS application programming interface (API), a PostgreSQL database, WSO2 identity and access management, notification services, and deployment tooling.

The principal product journeys developed during the period are:

- public self-registration and account verification;
- patient onboarding, health savings account management, contributions, beneficiaries, provider discovery, appointments, visit verification, and claims visibility;
- provider onboarding, profile and availability management, appointment processing, claim submission, and payout configuration;
- administrative management of users, roles, permissions, providers, appointments, claims, settings, and audit information;
- employer group plans, employee membership management, contribution uploads, billing cycles, and employer payments; and
- integration foundations for M-Pesa, EcoCash, card/EFT-related payment flows, automated debits, provider disbursements, notifications, and reconciliation controls.

The strongest recorded delivery period was from 30 April to 14 July 2026. The repository contains 24 dated Git commits between 30 April and 17 June, followed by substantial working-tree development evidenced by dated database migrations and source files through 14 July. The available project records do not contain verifiable January–March activity or newly dated development artefacts after 14 July; these periods are therefore reported as evidence gaps rather than being populated with unsupported claims.

At the report date, the platform is a functional, deployed product foundation with core multi-user workflows implemented. Remaining go-live work is concentrated around live payment-rail validation, financial reconciliation, expansion of automated test coverage, operational acceptance testing, and confirmation of third-party capabilities such as employer payslip deductions.

---

## 2. Project purpose and incubation relevance

iThembaHealth is a health savings platform designed for Basotho who need a structured way to save for and access private healthcare. Patients can build a health savings balance, find healthcare providers, book visits, and pay approved healthcare claims. Providers can manage appointments and submit claims, while administrators govern membership, providers, claims, fees, and access controls. Corporate employer plans extend the model by enabling organisations to enrol employees and fund their health savings accounts.

The work completed during this reporting period advances the incubation objectives in four areas:

1. **Product development:** conversion of the concept into an integrated web platform with role-specific user journeys.
2. **Technical validation:** implementation of the core health savings, appointment, claim, payment, identity, and notification architecture.
3. **Business-model validation:** incorporation of registration and annual fees, transaction fees, employer group plans, and potential value-added services.
4. **Go-to-market readiness:** production deployment, onboarding flows, provider administration, operational controls, documentation, templates, monitoring, and automated build checks.

---

## 3. Dated and weekly work log

### 1 January–19 April 2026 — Pre-rebuild period / evidence gap

- No dated Git commits or project documents in the available repository substantiate work performed during this period.
- This does not establish that no business, research, design, or incubation activity occurred; it only means that such work cannot be verified from the current project snapshot.
- Any CAFI meeting records, founder notes, email correspondence, pitch material, or programme submissions from this period should be appended separately if available.

### Week of 20–26 April 2026 — Data foundation and solution setup

- Created the initial database migration on 20 April, establishing the first formal data foundation for the rebuilt platform.
- Prepared the application structure and supporting project assets ahead of the first repository commit.
- Established the basis for patient, provider, appointment, health savings, transaction, claim, and administrative data management.

**Evidence:** initial Prisma migration dated 20 April and source artefacts dated 20–22 April.

### Week of 27 April–3 May 2026 — Full-stack rebuild baseline

- Established the Nx monorepo with a NestJS API and Angular progressive web application.
- Connected the platform to PostgreSQL through Prisma.
- Implemented WSO2-based authentication using OIDC/OAuth2 and JWT validation.
- Added the initial deployment and smoke-test scripts.
- Began role-based access control (RBAC), including roles, permissions, and protected application areas.
- Verified the repository and deployment workflow.

**Key dated milestones:** 30 April — initial platform commit, deployment tooling, smoke testing, and RBAC module.

### Weeks of 4–10 May 2026 — Continuation period / no distinct dated milestone

- No separate commits or dated project artefacts were recorded for this week in the available repository.
- The next recorded delivery is the integrated core feature release beginning on 12 May.

### Week of 11–17 May 2026 — Core minimum viable product delivery

This was the most concentrated core-product implementation period.

**Identity, access, and portal structure**

- Completed dynamic RBAC tables, guards, seeded roles and permissions, and automatic role assignment during identity synchronisation.
- Implemented role-aware routing and separate patient, provider, and administrator portal structures.
- Added protected routes and an unauthorised-user experience.

**Patient functionality**

- Built the three-step patient onboarding journey.
- Implemented patient profiles, addresses, and automatic health savings account creation.
- Added beneficiary management for covered family members.
- Built the patient dashboard, wallet balance, account top-up interface, transaction history, and claim history.
- Implemented provider discovery and the complete appointment user interface: booking, listing, details, cancellation, rescheduling, and visit-code display.

**Provider functionality**

- Implemented provider onboarding, profiles, seeded provider data, search, availability, and appointment slots.
- Added working hours and time-off management.
- Built the provider appointment queue and appointment lifecycle actions.
- Added six-digit visit-code verification and automatic patient check-in.
- Implemented provider claim submission and claim-history screens.
- Added live provider dashboard statistics.

**Administration and claims**

- Built administrator dashboard statistics and management views for users, providers, and claims.
- Added user lock/unlock, role assignment, provider verification, and claims review.
- Implemented claim approval/rejection, health savings balance checks, and the 5% platform-fee calculation.

**User experience**

- Redesigned the public landing page and repaired broken routes.
- Applied a consistent responsive visual language across patient, provider, and administrator areas.

**Key dated milestones:** 12–14 May — 16 recorded feature commits covering RBAC, patient and provider onboarding, appointments, wallet, claims, beneficiaries, profiles, dashboards, and administration.

### Weeks of 18 May–14 June 2026 — Evidence gap between recorded releases

- No distinct Git commits or dated project artefacts are present in the current repository for this interval.
- Work claimed for this interval should be supported with external programme or communication records before submission as dated activity.

### Week of 15–21 June 2026 — Authentication completion and production hardening

- Added automatic local user provisioning when a valid WSO2 user first signs in.
- Integrated Novu email delivery for appointment visit codes.
- Added dashboard prompts to guide users through incomplete onboarding or profile actions.
- Corrected production environment URLs and Angular production file replacement configuration.
- Improved readiness of the deployed web application and API configuration.

**Key dated milestones:** 16 June — auto-provisioning, email visit codes, and dashboard prompts; 17 June — production configuration correction.

### Week of 22–28 June 2026 — Registration architecture, employer plans, and payment planning

- Added the pending-registration data model to support staged verification before permanent account creation.
- Designed employer group-plan entities for employers, employee memberships, billing cycles, contribution line items, and payment status.
- Prepared a detailed Golink Transact integration request covering seven payment flows: registration fee, wallet top-up, recurring contribution, annual fee, provider disbursement, employer invoice collection, and payslip deductions.
- Documented payment methods and business constraints for M-Pesa, EcoCash, cards, EFT, and employer payments.
- Produced an innovation and value-added-service roadmap covering telemedicine, health credit, savings yield, pharmacy integration, wellness rewards, family plans, provider services, and platform licensing opportunities.

**Key dated milestones:** 22 June — pending registrations; 26–27 June — payment integration specification, innovation roadmap, and employer group-plan migration.

### Week of 29 June–5 July 2026 — Business rules, employer portal, and operational administration

**Claims and savings controls**

- Split claim funding between the patient’s available health savings balance and any out-of-pocket amount.
- Added claim withdrawal status and line-item support planning.
- Added an administrative savings-account adjustment transaction type.
- Extended claim administration, exports, status handling, and related user interfaces.

**Notifications and preferences**

- Added user notification preferences, including email/SMS choices and reminder timing.
- Expanded notification templates and workflows for appointment and claim events.

**Payments**

- Added Golink transaction identifiers and payment-status fields to the financial data model.
- Developed payment initiation and webhook-handling foundations, including idempotency considerations.
- Added automated debit and low-balance processing foundations.

**Employer group plans**

- Built the employer API and employer portal for organisation details, employees, contributions, billing cycles, and payment status.
- Added employer administration, verification, activation/deactivation, billing review, and contribution confirmation.
- Added CSV/XLSX import workflows and reusable import templates for employers, employer patients, providers, and patients.
- Added employer self-registration support and an EMPLOYER role route.

**Registration, legal, and administrative functions**

- Developed public registration with email and phone verification steps.
- Added administrative appointment, employer, RBAC, and settings screens.
- Added privacy and terms pages.
- Compared the original codebase with the rebuilt platform and documented the scope recovered and completed.

**Key dated milestones:** 29 June–2 July — claim, notification, payment, employer, registration, template, and administrative artefacts.

### Week of 6–12 July 2026 — Provider payouts and go-live preparation

- Added EcoCash as a provider payout option.
- Added provider disbursement enablement and a direct relationship between provider payouts and claims.
- Added idempotency constraints to reduce duplicate employer billing transactions.
- Extended Golink integration handling for provider disbursements and employer payment processing.
- Cleared production test data on 11 July as part of go-live preparation while retaining identity accounts for controlled follow-up.

**Key dated milestone:** 11 July — payout data model, EcoCash field, transaction uniqueness controls, and go-live data preparation.

### Week of 13–19 July 2026 — Reliability, security, notifications, and test automation

**Reliability and financial integrity**

- Added a database-backed uniqueness control and application guard against provider appointment double-booking.
- Added concurrency protections and tests for claim approval/rejection race conditions.
- Added webhook signature/idempotency tests for Golink callbacks.
- Added detailed claim line items and strengthened claim lifecycle handling.

**Account security and access**

- Added self-service password reset with time-limited verification requests.
- Added API rate limiting for brute-force-sensitive public routes.
- Added security headers and strengthened authentication/interceptor handling.
- Added WSO2 organisation support for provider/employer organisational identity.

**Notifications and scheduled operations**

- Added advance and final appointment reminder scheduling.
- Added a scheduled annual LSL 67 administrative-fee process.
- Expanded email, SMS/WhatsApp-oriented notification handling and preference controls.
- Added low-balance warnings and scheduled auto-debit charge processing.

**Monitoring, delivery, and quality**

- Added Sentry instrumentation for frontend/backend error monitoring.
- Added Jest configuration and targeted tests for the platform’s highest-risk workflows.
- Added continuous integration checks for database-schema drift, API tests, and API/web builds.
- Improved deployment and smoke-test scripts.

**Key dated milestones:** 13–14 July — double-booking protection, password reset, claim line items, notification/organisation changes, scheduled tasks, security controls, monitoring, and CI/test assets.

### 20 July–19 August 2026 — Current snapshot / no additional dated repository evidence

- No newly dated source artefacts or commits are present in the available repository snapshot for this interval.
- The project status described in Sections 4–7 reflects the latest available implementation rather than an assumption of further development during these weeks.

---

## 4. Consolidated outputs delivered

| Workstream | Outputs delivered during the reporting period |
|---|---|
| Product architecture | Nx monorepo; Angular PWA; NestJS API; Prisma/PostgreSQL data layer; modular patient, provider, employer, admin, appointment, claim, payment, registration, identity, and notification services |
| Identity and security | WSO2 OIDC/OAuth2 with PKCE; JWT validation; user synchronisation and auto-provisioning; dynamic RBAC; role/permission administration; password reset; route protection; API rate limiting; security headers |
| Patient experience | Registration and verification; onboarding; profile/address; HSA and wallet; top-ups; transaction history; auto-debit configuration; beneficiaries; provider search; appointment booking/management; visit codes; claim visibility; notification preferences |
| Provider experience | Onboarding; profile; verification; availability, working hours, time off and slots; appointment queue and lifecycle; visit-code verification; claim creation/edit/withdrawal; claim history; payout configuration |
| Administrator experience | Dashboard statistics; user and role management; provider verification; appointment oversight; claim review/approval/rejection/export; HSA adjustments; employer administration; settings; audit visibility |
| Employer experience | Employer registration and verification; employee membership management; contribution upload/confirmation; billing-cycle generation; invoice/payment status; employer portal; CSV/XLSX templates |
| Payments and revenue | Registration-fee flow; HSA top-up foundation; recurring debit scheduling; internal annual fee; 5% claim fee; provider disbursement; employer payment link/invoice foundations; M-Pesa/EcoCash-oriented integration; webhook and idempotency controls |
| Communications | Novu integration; email visit codes; appointment and claim event notifications; reminders; low-balance warnings; configurable notification preferences |
| Operations and quality | Production environment configuration; deployment and smoke tests; Swagger API documentation; Sentry monitoring; CI build/test/schema checks; targeted high-risk unit tests; seed and import tools |
| Strategy and documentation | Golink integration specification; innovations and value-added-services roadmap; original-versus-rebuild analysis; project README/context; operational templates |

---

## 5. Measurable progress indicators

The following indicators can be verified from the available project snapshot:

- **24 dated Git commits** between 30 April and 17 June 2026.
- **Four role-specific environments** implemented or scaffolded into working flows: patient, provider, administrator, and employer.
- **More than 90 API route handlers** present across authentication, patients, providers, appointments, claims, administration, employer functions, registration, and payments.
- **14 post-baseline database migrations** dated 22 June–14 July, covering registration, employer plans, claims, notifications, payments, password reset, payout controls, and appointment integrity.
- **Three targeted backend test suites** for appointment double-booking, claim decision concurrency, and payment-webhook security/idempotency.
- **One automated CI workflow** covering schema consistency, API tests, and frontend/backend builds.
- **Four bulk-import templates** for patients, providers, employers, and employer-linked patients.
- **Seven payment flows** specified for external payment integration.

These are engineering output indicators. They should not be presented as customer adoption, revenue, or production transaction metrics.

---

## 6. Product and business outcomes

The period’s work produced the following practical outcomes:

- FinX now has a coherent product foundation that demonstrates the full journey from member registration to healthcare booking, claim processing, and provider payment.
- Role-separated portals support the principal actors required for a health savings ecosystem.
- Employer group plans create a credible business-to-business distribution channel in addition to direct individual membership.
- Fee logic—including registration, annual administration, and claim transaction fees—has been translated into system behaviour, supporting business-model testing.
- Identity, permissions, audit-related functions, transaction idempotency, and concurrency controls improve the platform’s readiness for sensitive health and financial workflows.
- Payment, notification, deployment, monitoring, and test foundations reduce the gap between prototype demonstration and controlled pilot operation.
- The innovation roadmap gives FinX a sequenced pipeline of future value-added services beyond the initial core product.

---

## 7. Current status and outstanding work

### Implemented or substantially implemented

- Core patient, provider, administrator, and employer journeys.
- WSO2 authentication and role-based access control.
- Health savings account ledger and claim-fee logic.
- Appointment booking and visit-code verification.
- Claim submission, review, decision, and payout foundations.
- Employer memberships, contribution management, and billing.
- Notification infrastructure and scheduled operational tasks.
- Golink payment-service and webhook foundations.
- Deployment, monitoring, smoke tests, CI, and targeted automated tests.

### Requires completion or external validation

- End-to-end testing of M-Pesa, EcoCash, card/EFT, employer payment, and provider payout flows against production/live financial rails.
- Confirmation from the payment provider regarding recurring mandates, reconciliation APIs, settlement behaviour, and payslip-deduction support.
- Finance reconciliation endpoints and operating procedures for balances, transactions, exceptions, refunds, and failed payouts.
- Broader automated test coverage, including end-to-end user journeys and failure/recovery scenarios.
- Formal user acceptance, security, privacy, and operational readiness testing before a scaled launch.
- Final review of regulatory, consumer-protection, data-protection, and financial-services obligations applicable in Lesotho.
- Completion of manual production identity configuration and removal/disablement of residual test identity accounts where appropriate.

---

## 8. Recommended next reporting-period priorities

1. Complete a controlled end-to-end payment pilot covering member registration, wallet funding, claim approval, and provider payout.
2. Obtain written integration confirmation from Golink Transact for all required payment and reconciliation capabilities.
3. Run a structured pilot with a small cohort of patients, healthcare providers, and at least one employer.
4. Define and track incubation metrics: registered members, verified providers, active employer members, HSA contributions, booked/completed appointments, approved claims, payout turnaround, failed transactions, and support cases.
5. Complete security/privacy review, user acceptance testing, incident procedures, and production support ownership.
6. Expand automated regression and end-to-end tests around money movement, permissions, identity recovery, and notifications.
7. Place the substantial late-June/July working-tree changes under formal version control and tag a pilot release to improve traceability.

---

## 9. Evidence base and reporting note

This report was reconstructed from the project repository available on 19 August 2026, using:

- Git commit history and commit messages;
- dated Prisma database migrations;
- current backend and frontend source modules;
- project README and technical context documentation;
- the Golink Transact integration request dated 26 June 2026;
- innovation/value-added-service and rebuild-comparison documents;
- CI, deployment, test, seed, and import artefacts; and
- filesystem dates for work not yet committed to Git.

The timeline intentionally distinguishes committed milestones from work evidenced only in the current working tree. Filesystem dates can establish when the available copy was last modified, but they are weaker evidence than signed or centrally hosted version-control history. The January–March and post-14 July evidence gaps should therefore be supplemented with CAFI submissions, calendars, emails, meeting notes, invoices, design files, demonstrations, or stakeholder correspondence if a complete programme-activity record is required.

---

## 10. Suggested supporting annexures for CAFI

- Annexure A: screenshots of the patient, provider, administrator, and employer portals.
- Annexure B: product demonstration flow from registration to provider claim payment.
- Annexure C: system architecture and deployment diagram.
- Annexure D: Golink Transact integration request.
- Annexure E: innovation and value-added-services roadmap.
- Annexure F: original-codebase versus rebuilt-platform comparison.
- Annexure G: test/build evidence and a summary of the pilot-readiness checklist.
- Annexure H: incubation meetings and non-code activities for January–March and 15 July–19 August, if available.

