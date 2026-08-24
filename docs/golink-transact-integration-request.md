# IthembaHealth — Golink Transact Payment Integration Request

**Date:** 26 June 2026  
**From:** Mohau Ramakhula — FinX Pty Ltd  
**Contact:** mo.ramakhula@gmail.com  
**To:** Golink Transact Support / Integrations Team  
**Subject:** API Integration Request — Full Payment Scope, Health Savings Platform (M-Pesa, EcoCash, Card, EFT, Payslip)

---

## 1. About IthembaHealth

IthembaHealth is a **health savings scheme** built for Basotho (citizens of Lesotho). It allows members to save for private healthcare costs and pay accredited healthcare providers directly via mobile money or card. The platform is operated by FinX Pty Ltd.

**Platform components:**

| Component | Technology |
|---|---|
| Backend API | NestJS (Node.js), hosted on a dedicated Debian 13 server |
| Frontend | Angular 19 Progressive Web App (PWA) |
| Database | Supabase PostgreSQL (Prisma ORM) |
| Identity | WSO2 Identity Server 7.2 (OIDC/OAuth2) |
| Notifications | Novu (self-hosted) |

**Live environment:**

| Service | URL |
|---|---|
| Web App | http://169.239.181.30 |
| API | http://169.239.181.30/api |

---

## 2. Purpose of Integration

We require a connection to Golink Transact's payment aggregation platform to process **seven distinct payment flows** across the IthembaHealth lifecycle:

| # | Flow | Direction | Method(s) | Frequency |
|---|---|---|---|---|
| 1 | Patient registration fee | Inbound | M-Pesa, EcoCash, Card, EFT | Once per patient |
| 2 | Manual HSA top-up | Inbound | M-Pesa, EcoCash, Card, EFT | Ad-hoc |
| 3 | Auto-debit recurring contribution | Inbound (pull) | M-Pesa | Weekly or Monthly |
| 4 | Annual admin fee deduction | Internal (HSA debit) | N/A — no Golink call | Once per year |
| 5 | Provider claim disbursement | Outbound | M-Pesa B2C, EcoCash B2C, EFT | On claim approval |
| 6 | Employer bulk invoice collection | Inbound | M-Pesa, EcoCash, Card, EFT, Payment link | Monthly per employer |
| 7 | Employer payslip deduction | Inbound (payroll) | Payslip (Golink feature) | Monthly per employee |

All inbound and outbound flows are currently **stubbed** in our API (no real money movement). We need to replace each stub with live Golink Transact API calls.

Flow 4 (annual admin fee) is an internal ledger deduction from the patient's HSA balance and does not require a Golink transaction — it is included here for completeness.

Flows 6 and 7 relate to our **Corporate Employer Group Plans** feature, described in detail in §3.6 and §3.7 below.

---

## 3. Payment Flows

### 3.1 One-Off Registration Fee (Inbound)

**Trigger:** Patient completes the 3-step onboarding wizard in the PWA for the first time.

**Flow:**

```
Patient completes onboarding form
  → IthembaHealth API calls Golink Transact to collect LSL 67 registration fee
  → Golink Transact sends STK push to patient's registered phone
  → Patient authorises payment
  → Golink Transact sends webhook callback to IthembaHealth API
  → IthembaHealth API confirms fee receipt, activates the patient's HSA
  → Patient is redirected to their dashboard
```

**Details:**

| Field | Value |
|---|---|
| Amount | **LSL 67.00** (fixed) |
| Direction | Inbound (patient → IthembaHealth) |
| Destination | IthembaHealth merchant account (not the patient's HSA) |
| Recurrence | Once per patient, ever |
| Preferred method | M-Pesa STK push (patient's Vodacom Lesotho number, collected at onboarding) |
| Fallback methods | EcoCash, Card, EFT |

---

### 3.2 Manual HSA Top-Up (Inbound)

**Trigger:** Patient selects "Add Funds" from their wallet screen in the PWA.

**Flow:**

```
Patient selects amount + payment method
  → IthembaHealth API calls Golink Transact to initiate payment
  → Golink Transact sends STK push (mobile money) or hosted checkout page (card)
  → Patient authorises on their phone / card terminal
  → Golink Transact sends webhook callback to IthembaHealth API
  → IthembaHealth API validates callback signature, credits HSA balance, records Deposit transaction
  → Patient sees updated balance in real time
```

**Supported payment methods:**

| Method | Provider | Mechanism |
|---|---|---|
| M-Pesa | Vodacom Lesotho | STK push to patient's phone |
| EcoCash | EcoCash Lesotho | STK push to patient's phone |
| Card | Visa / Mastercard | Hosted payment page (redirect) |
| EFT | Local Lesotho banks | Bank reference — manual or API-initiated |

**Business constraints:**

| Constraint | Value |
|---|---|
| Minimum per transaction | **LSL 500** |
| Maximum per transaction | **LSL 10,000** |
| AML flag threshold | **LSL 50,000+** lump sum |
| Currency | **LSL** (Lesotho Loti — 1:1 peg with ZAR) |
| Withdrawals | **Not permitted** — funds flow out only via approved claims |

---

### 3.3 Auto-Debit Recurring Contributions (Inbound — Pull Payment)

**Trigger:** System-scheduled job runs on the patient's configured debit date (weekly or monthly).

This is a **critical inbound flow**. Patients configure a recurring M-Pesa auto-debit during onboarding, specifying their Vodacom Lesotho number, contribution amount, and frequency. The platform must pull the payment on the scheduled date without the patient initiating anything.

**Flow:**

```
Scheduled job fires on nextDebitDate for each active AutoDebitSetup
  → IthembaHealth API calls Golink Transact to initiate a pull/recurring debit
  → Golink Transact sends STK push to patient's registered M-Pesa number
  → Patient authorises (or auto-approves if a standing order / recurring mandate is in place)
  → Golink Transact sends webhook callback to IthembaHealth API
  → IthembaHealth API credits HSA balance, records Deposit transaction, updates nextDebitDate
  → If payment fails: platform records failure, sends SMS notification to patient
```

**Details:**

| Field | Value |
|---|---|
| Direction | Inbound (patient's M-Pesa → IthembaHealth HSA) |
| Supported method | M-Pesa (Vodacom Lesotho) — primary |
| Frequency options | **Weekly** or **Monthly** |
| Amount | Patient-configured (must satisfy LSL 500 minimum per transaction) |
| Mandate | We need to understand whether Golink supports M-Pesa **standing orders / recurring mandates** (preferred) or whether each cycle requires a fresh STK push |

**Open question for Golink Transact:** Do you support a recurring debit mandate (customer authorises once, future pulls are automatic), or does each scheduled debit require a new STK push that the customer must approve on their handset?

---

### 3.4 Annual Admin Fee (Internal — No Golink Call Required)

**Trigger:** Scheduled job runs once per year in January.

**Details:** The platform deducts **LSL 67** from each patient's HSA balance as an annual membership fee. This is an internal ledger operation and does not involve a Golink Transact API call.

**Implication for Golink integration:** If a patient's HSA balance is below LSL 67 when the annual fee runs, the platform will need to trigger a top-up reminder (Flow 3.2) or an auto-debit (Flow 3.3) before the deduction can succeed. The platform handles this logic internally.

---

### 3.5 Provider Claim Disbursement (Outbound)

**Trigger:** IthembaHealth admin approves a healthcare provider's submitted claim in the admin portal.

**Flow:**

```
Admin approves claim
  → IthembaHealth API applies 5% platform fee:
      net_debit   = claim_amount × 1.05   (debited from patient HSA)
      net_payout  = claim_amount           (paid to provider)
      platform_fee = claim_amount × 0.05  (retained by IthembaHealth)
  → IthembaHealth API calls Golink Transact disbursement endpoint (B2C / payout)
  → Golink Transact transfers net_payout to provider's registered payout account
  → Golink Transact sends webhook callback with transfer status
  → IthembaHealth API marks claim as Paid, records ClaimPayment transaction
  → Provider receives funds; patient's HSA balance is reduced by net_debit
```

**Supported disbursement methods (provider payout):**

| Method | Notes |
|---|---|
| M-Pesa B2C | Provider's registered Vodacom Lesotho number |
| EcoCash B2C | Provider's registered EcoCash Lesotho number |
| EFT | Provider's registered bank account (name + account number + bank code) |

**Business constraints:**

| Constraint | Value |
|---|---|
| Platform fee | 5% of claim amount (retained by IthembaHealth) |
| Patient debit | Claim amount + 5% fee |
| Provider payout | Claim amount only (fee already deducted from patient) |
| Provider eligibility | Must be admin-verified (`isVerified = true`) before any disbursement |
| HSA balance check | IthembaHealth API rejects claim approval if patient HSA balance < (claim + fee) |

---

### 3.6 Employer Bulk Invoice Collection (Inbound)

**Context:** IthembaHealth supports Corporate Employer Group Plans, where an employer enrolls their staff as members and funds each employee's HSA monthly. Contribution amounts per employee are provided by the employer via payroll system API push, CSV/Excel upload, or manual entry in the employer portal. The platform calculates the total and generates a single monthly invoice covering all employees.

**Flow:**

```
Billing job fires on billing date
  → Platform calculates total: SUM(individual employee contributions) + platform fee per seat
  → Generates invoice with per-employee line items
  → Employer is notified via email + employer portal

Employer pays via one of:
  (a) Payment link — Golink Transact generates a hosted payment URL; employer clicks and pays
  (b) Pay Now in portal — employer selects method and initiates payment from portal
  (c) Manual EFT — employer pays to IthembaHealth bank account; admin manually confirms receipt
  (d) Payslip deduction — see §3.7

On payment confirmed (webhook or manual):
  → Platform distributes individual amounts to each employee's HSA
  → Records EmployerContribution transaction per employee
  → Sends employer a receipt
```

**Supported collection methods for employer invoices:**

| Method | Notes |
|---|---|
| M-Pesa B2B | Employer's business M-Pesa number |
| EcoCash Business | Employer's EcoCash business account |
| Card | Visa / Mastercard via hosted payment page |
| EFT | Employer's bank account — manual confirmation by admin |
| Payment link | Golink-hosted URL sent to employer by email/SMS |
| Payslip | See §3.7 |

**Business constraints:**

- One invoice per employer per billing month
- Invoice total = sum of all active employee contributions + (platform fee per seat × headcount)
- HSA credits are only distributed **after** payment is confirmed — never before
- Employer must be admin-verified before first billing cycle is generated

---

### 3.7 Employer Payslip Deduction (Inbound — Payroll at Source)

**Context:** We understand that Golink Transact supports a **Payslip** payment method that enables deductions to be made directly from employee payslips at source through payroll integration. This would eliminate the need to invoice the employer separately — instead, each employee's HSA contribution is deducted from their salary at payroll run time and remitted directly to IthembaHealth via Golink.

**This is a high-priority item for us.** If Payslip is available for Lesotho employers, it removes the invoice-and-wait cycle entirely and guarantees monthly contribution receipt.

**Questions we need Golink Transact to answer:**

1. How does the Payslip deduction method work technically — is it an API the employer's payroll system calls, or a file-based submission?
2. What is the settlement timeline from payroll run to IthembaHealth account credit?
3. Does Golink Transact send a per-employee or per-employer webhook when deductions are processed?
4. What is the minimum employer size or payroll system requirement?
5. Is this available for Lesotho employers specifically, or only South Africa?
6. Is there a per-deduction fee structure different from standard transaction fees?

**Proposed flow (pending Golink clarification):**

```
Employer's payroll system runs (monthly)
  → Payroll system instructs Golink Transact to deduct per-employee amounts
  → Golink Transact collects from each employee payslip at source
  → Golink remits total (or per-employee) to IthembaHealth
  → Golink sends webhook with per-employee deduction results
  → IthembaHealth credits each employee's HSA individually
  → Billing cycle marked as Paid automatically
```

---

## 4. API Requirements

We require the following from Golink Transact:

### 4.1 Payment Initiation (One-off)

Used for: registration fee (§3.1), manual top-up (§3.2), individual auto-debit cycles (§3.3) if recurring mandates are not supported.

- Endpoint: `POST /payments/initiate` (or equivalent)
- Required parameters: `amount`, `currency` (`LSL`), `paymentMethod` (`MPESA` | `ECOCASH` | `CARD` | `EFT`), `customerPhone`, `merchantReference` (UUID), `callbackUrl`, `description`
- Response must include: `transactionId`, `status` (`pending` | `successful` | `failed`), `checkoutUrl` (for card redirect flows)

### 4.2 Recurring Payment Mandate / Standing Order

Used for: auto-debit recurring contributions (§3.3).

This is our most important open question. We need to understand which of the following Golink Transact supports:

**Option A — Mandate-based (preferred):**
- Customer authorises a recurring debit mandate once (via STK push or consent form)
- Golink Transact stores the mandate and automatically pulls funds on each billing date without further customer action
- `POST /mandates` — create mandate; `DELETE /mandates/{id}` — cancel; webhook on each pull outcome

**Option B — Scheduled STK push per cycle:**
- We send `POST /payments/initiate` on each billing date with the customer's phone number
- Golink Transact sends a fresh STK push for the customer to approve
- Simpler for Golink but requires active customer approval each cycle

**Please advise which option is supported for Vodacom Lesotho M-Pesa.**

### 4.3 Payment Status Check

Used for: polling status after initiating any payment.

- Endpoint: `GET /payments/{transactionId}`
- Response: `status`, `amount`, `currency`, `method`, `customerPhone`, `merchantReference`, `timestamp`, `providerReference` (the network's own reference, e.g. Vodacom's MPESA code)

### 4.4 Webhook / Callback Notifications

Golink Transact must `POST` a signed callback to our webhook endpoint (e.g., `https://app.ithembahealth.com/api/payments/webhook`) when any transaction status changes.

**Required callback payload fields:**

| Field | Purpose |
|---|---|
| `merchantReference` | Our UUID — used to look up the pending transaction in our DB |
| `transactionId` | Golink's reference |
| `providerReference` | Network reference (M-Pesa code, EcoCash ref, etc.) |
| `status` | `successful` \| `failed` \| `expired` |
| `amount` | Confirmed amount |
| `currency` | `LSL` |
| `paymentMethod` | Method used |
| `timestamp` | ISO 8601 UTC |
| `signature` | HMAC-SHA256 of the payload body using our shared secret |

**Signing:** We will verify the `signature` header on every callback before crediting any HSA balance. Please provide the signing algorithm and key format.

### 4.5 Disbursement / B2C Payout

Used for: provider claim disbursements (§3.5).

- Endpoint: `POST /disbursements` (or equivalent)
- Required parameters: `amount`, `currency`, `recipientPhone` or `bankAccount` (for EFT), `method`, `merchantReference`, `callbackUrl`, `description`, `recipientName`
- Response: `disbursementId`, `status`
- Webhook callback on completion/failure using the same structure as §4.4

### 4.6 Balance / Float Inquiry

- Endpoint: `GET /merchant/balance` (or equivalent)
- We need to check our available merchant float before initiating large disbursements.

### 4.7 Transaction List / Reconciliation

- Endpoint: `GET /transactions?from=&to=&type=` (date range + type filter)
- Required fields per record: `merchantReference`, `transactionId`, `type` (`payment` | `disbursement`), `status`, `amount`, `currency`, `paymentMethod`, `timestamp`
- Format: JSON, paginated
- Used for: daily end-of-day reconciliation against our internal ledger

---

## 5. Technical Requirements

| Requirement | Details |
|---|---|
| **Authentication** | API key + secret (Bearer token preferred) or HMAC-signed requests |
| **Protocol** | HTTPS only (TLS 1.2+) |
| **Data format** | JSON request/response |
| **Idempotency** | We will send a `merchantReference` UUID per transaction — duplicate submissions with the same reference must be safely ignored |
| **Sandbox environment** | Required for development and QA before going live |
| **Sandbox test numbers** | We need test M-Pesa and EcoCash numbers that simulate success/failure/timeout |
| **Webhook retry policy** | Golink Transact must retry failed webhook deliveries (at least 3 attempts with backoff) |
| **IP allowlisting** | Our server IP is **169.239.181.30** — please provide Golink Transact's webhook origination IPs |
| **API versioning** | Stable versioned API (e.g., `/v1/`) so upgrades don't break production |
| **Rate limits** | Please advise on rate limits per minute/hour |

---

## 6. Estimated Transaction Volumes

| Flow | Direction | Frequency | Avg. Amount | Method(s) |
|---|---|---|---|---|
| Registration fee | Inbound | ~50/month | LSL 67 | M-Pesa, EcoCash, Card |
| Manual HSA top-up | Inbound | ~200/month | LSL 1,200 | M-Pesa, EcoCash, Card, EFT |
| Auto-debit contributions | Inbound (pull) | ~300/month | LSL 600 | M-Pesa |
| Employer bulk invoice | Inbound | ~10 invoices/month | LSL 15,000 avg | EFT, Card, Payment link |
| Employer payslip deductions | Inbound (payroll) | ~200 deductions/month | LSL 1,000 | Payslip |
| Provider disbursements | Outbound | ~100/month | LSL 800 | M-Pesa B2C, EcoCash B2C, EFT |

**Estimated monthly totals (initial phase):**

| Metric | Value |
|---|---|
| Total inbound transactions | ~760/month |
| Total inbound value | ~LSL 720,000/month |
| Total outbound transactions | ~100/month |
| Total outbound value | ~LSL 80,000/month |

We are a startup. These numbers are conservative initial estimates. As we expand membership across Lesotho, volumes are expected to grow 5–10× within 18 months. We would like to discuss whether volume-based pricing tiers are available.

---

## 7. Security & Compliance

- **KYC:** Patient identities are verified at onboarding (national ID + WSO2 identity provider). We can share KYC data with Golink Transact as required.
- **AML:** We flag lump-sum deposits above LSL 50,000 internally. We require guidance on Golink Transact's AML reporting requirements.
- **PCI-DSS:** For card payments, we prefer a hosted payment page (redirect) or tokenised card input to avoid storing card data on our servers.
- **Data residency:** We prefer data processed within Southern Africa (SADC region) where possible.

---

## 8. What We Need from Golink Transact

To proceed with integration, we request:

### 8.1 Documentation
1. **Full API documentation** — Postman collection or OpenAPI/Swagger spec covering all endpoints in §4
2. **Webhook payload specification** — exact field names, types, and signing algorithm
3. **Error code reference** — list of error codes and recommended retry strategies

### 8.2 Sandbox Access
4. **Sandbox credentials** — API key + secret + sandbox base URL
5. **Sandbox test phone numbers** — M-Pesa and EcoCash numbers that simulate: success, insufficient funds, timeout, user rejection
6. **Sandbox card details** — test card numbers for Visa/Mastercard (success + decline scenarios)
7. **Sandbox webhook signing key** — so we can verify callbacks in the test environment

### 8.3 Recurring Payments & Payslip Clarification (Critical)
8. **Recurring mandate support** — please confirm:
   - Whether a standing order / recurring mandate is available for Vodacom Lesotho M-Pesa
   - If yes: the mandate creation API and the customer consent flow
   - If no: confirmation that each auto-debit cycle requires a fresh STK push

9. **Payslip payment method** — we understand Golink Transact supports a Payslip deduction method for collecting contributions directly from employee salaries at payroll run time. Please provide:
   - Full API specification or documentation for the Payslip method
   - Whether it is available for Lesotho employers
   - The integration requirements for employer payroll systems
   - Settlement timeline and per-deduction fee structure
   - Webhook / callback payload for per-employee deduction results

### 8.4 Operational Details
9. **Webhook origination IPs** — Golink Transact's IP range so we can allowlist at our firewall
10. **Settlement schedule** — how funds collected are settled to our nominated bank account (daily? T+1? T+2?) and whether disbursements are pre-funded from our merchant float or settled separately
11. **Float / merchant account management** — minimum balance requirements for outbound disbursements
12. **AML/CDDV reporting obligations** — what we are required to report to Golink Transact for transactions above LSL 50,000

### 8.5 Go-Live Requirements
13. **KYB/merchant onboarding checklist** — company registration, director IDs, bank account details, and any Lesotho-specific regulatory requirements
14. **Pricing / fee schedule** — per-transaction fees for each method (inbound and outbound), and whether volume tiers are available
15. **Dedicated integration support contact** — an engineer or Slack/Teams/email channel for the integration period

---

## 9. Our Integration Timeline

| Week | Milestone |
|---|---|
| 0 | Receive API docs, sandbox credentials, and recurring mandate clarification |
| 1–2 | Sandbox: registration fee + manual top-up (M-Pesa STK push, card redirect) |
| 3 | Sandbox: auto-debit recurring contributions (mandate or scheduled STK) |
| 4 | Sandbox: provider claim disbursement (B2C M-Pesa + EFT) |
| 5 | End-to-end QA across all 5 flows; reconciliation report validation |
| 6 | Submit go-live / production activation request with KYB documents |
| 7–8 | Production cutover; monitor first live transactions |

This timeline assumes Golink Transact provides sandbox credentials and documentation within 5 business days of receiving this request.

---

## 10. Contact

| Field | Value |
|---|---|
| **Company** | FinX Pty Ltd |
| **Product** | IthembaHealth (health savings platform) |
| **Contact person** | Mohau Ramakhula |
| **Email** | mo.ramakhula@gmail.com |
| **Platform URL** | http://169.239.181.30 |

We look forward to hearing from Golink Transact's integration team. Please let us know if additional technical details or a call/demo is needed.

---

*Document prepared by the IthembaHealth engineering team — 26 June 2026*
