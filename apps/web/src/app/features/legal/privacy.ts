import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  template: `
<div style="max-width:780px;margin:0 auto;padding:80px 24px 120px">
  <a routerLink="/" style="display:inline-flex;align-items:center;gap:8px;font-size:14px;color:#00B9D6;text-decoration:none;margin-bottom:40px">
    <i class="bi bi-arrow-left"></i> Back to iThemba Health
  </a>

  <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
    <div style="width:40px;height:40px;background:linear-gradient(135deg,#00B9D6,#4A7C59);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px">
      <i class="bi bi-heart-pulse-fill"></i>
    </div>
    <span style="font-weight:800;font-size:20px;color:#1a1a2e">iThemba Health</span>
  </div>

  <h1 style="font-size:36px;font-weight:800;color:#1a1a2e;letter-spacing:-1px;margin-bottom:8px">Privacy Policy</h1>
  <p style="color:#9e9e9e;font-size:14px;margin-bottom:48px">Effective date: 1 July 2026 &nbsp;·&nbsp; Jurisdiction: Kingdom of Lesotho</p>

  <div style="font-size:15px;line-height:1.85;color:#444">

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">1. Who we are</h2>
  <p><strong>FinX Pty Ltd</strong> ("we", "us", "iThemba Health"), incorporated in the Kingdom of Lesotho, operates the iThemba Health savings and payments platform at <strong>myhealth.ithembahealth.com</strong>. We are the data controller for personal data collected through this platform.</p>
  <p>Contact: <a href="mailto:hello@ithembahealth.com" style="color:#00B9D6">hello&#64;ithembahealth.com</a> &nbsp;·&nbsp; +266 590 33663</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">2. Data we collect</h2>
  <p>We collect only what is necessary to operate your Health Savings Account and process healthcare payments:</p>
  <ul style="padding-left:24px">
    <li><strong>Identity:</strong> Full name, national ID number, date of birth</li>
    <li><strong>Contact:</strong> Email address, phone number (Lesotho or international)</li>
    <li><strong>Address:</strong> Physical address in Lesotho (required for AML compliance)</li>
    <li><strong>Financial:</strong> HSA balance, transaction history, M-Pesa / C-Pay phone number used for top-ups</li>
    <li><strong>Healthcare:</strong> Appointment records, provider names, claim amounts — necessary to operate the service</li>
    <li><strong>Beneficiaries:</strong> Names, national IDs, and relationships of family members you add to your account</li>
    <li><strong>Device / technical:</strong> IP address, browser type, session tokens — for security and fraud prevention only</li>
  </ul>
  <p>We do <strong>not</strong> collect or store sensitive clinical health records (diagnoses, prescriptions, test results). Those remain between you and your provider.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">3. How we use your data</h2>
  <ul style="padding-left:24px">
    <li>Create and manage your Health Savings Account</li>
    <li>Process top-ups via Vodacom M-PESA and Chaperone C-Pay (via Golink Transact)</li>
    <li>Facilitate appointment booking and visit-code authentication</li>
    <li>Process and pay healthcare provider claims from your HSA</li>
    <li>Comply with Anti-Money Laundering (AML) and Know Your Customer (KYC) obligations under Lesotho law</li>
    <li>Detect and prevent fraud</li>
    <li>Send service notifications (appointment confirmations, payment receipts, visit codes)</li>
  </ul>
  <p>We do <strong>not</strong> use your data for advertising, data brokering, or profiling unrelated to the healthcare savings service.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">4. Who we share data with</h2>
  <p>We share your data only with the following categories of third parties, strictly to deliver the service:</p>
  <ul style="padding-left:24px">
    <li><strong>Golink Transact (FinX Pty Ltd)</strong> — payment processing over M-PESA and C-Pay rails. Shares only the data necessary to execute the specific payment (phone number, amount, merchant reference).</li>
    <li><strong>Vodacom Lesotho / Chaperone Payments</strong> — the underlying mobile money network, via Golink. They receive your phone number and transaction amount.</li>
    <li><strong>Healthcare Providers</strong> — when you book an appointment, your name and appointment details are shared with the provider you chose. Claim amounts are visible to the provider who submitted the claim.</li>
    <li><strong>Supabase (database hosting)</strong> — our database is hosted on Supabase in the EU (eu-west-1 region, Ireland). Supabase processes data as our data processor under a Data Processing Agreement.</li>
    <li><strong>Golink Identity (WSO2 IS)</strong> — authentication and identity verification. Stores your email, phone, and account credentials.</li>
    <li><strong>Novu (Golink Talk)</strong> — notification delivery (email, SMS). Shares only the minimum contact data needed to send a specific notification.</li>
    <li><strong>Regulatory authorities</strong> — we will disclose data when required by law or by order of a Lesotho court or regulatory body.</li>
  </ul>
  <p>We <strong>never sell</strong> your personal data to third parties.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">5. Data retention</h2>
  <ul style="padding-left:24px">
    <li><strong>Active accounts:</strong> Data is retained for as long as your account is open.</li>
    <li><strong>Closed accounts:</strong> Financial transaction records are retained for 7 years after account closure, in compliance with Lesotho AML regulations.</li>
    <li><strong>Failed registrations:</strong> Deleted within 24 hours of OTP expiry.</li>
    <li><strong>Audit logs:</strong> Retained for 3 years.</li>
  </ul>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">6. Your rights</h2>
  <p>Under Lesotho's data protection framework and applicable international standards, you have the right to:</p>
  <ul style="padding-left:24px">
    <li><strong>Access</strong> a copy of the personal data we hold about you</li>
    <li><strong>Correct</strong> inaccurate data (update your profile in-app or contact us)</li>
    <li><strong>Delete</strong> your account and data (subject to regulatory retention requirements above)</li>
    <li><strong>Withdraw consent</strong> for non-essential communications (via notification preferences in your profile)</li>
    <li><strong>Object</strong> to specific processing — email us at the address below</li>
  </ul>
  <p>To exercise any right, email <a href="mailto:hello@ithembahealth.com" style="color:#00B9D6">hello&#64;ithembahealth.com</a> with "Data Request" in the subject. We respond within 30 days.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">7. Security</h2>
  <p>We use bank-grade security measures:</p>
  <ul style="padding-left:24px">
    <li>All data in transit is encrypted via TLS 1.2+</li>
    <li>All data at rest is encrypted at the database level (Supabase AES-256)</li>
    <li>Authentication is handled by Golink Identity (WSO2 IS 7.2) with OIDC/PKCE — we never store your password</li>
    <li>Payment flows are handled exclusively by Golink Transact over PCI-compliant infrastructure</li>
    <li>All administrative actions are logged to an immutable audit trail</li>
  </ul>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">8. Cookies and tracking</h2>
  <p>The iThemba web app uses <strong>no third-party tracking cookies</strong> and no advertising trackers. We use a single session cookie for authenticated sessions (HTTP-only, Secure, SameSite). No analytics platform with cross-site tracking (e.g. Google Analytics) is used on this site.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">9. Children</h2>
  <p>iThemba accounts may only be opened by individuals aged 18 or older. Beneficiaries may be minors, but the account holder (adult) is responsible for all account activity.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">10. Changes to this policy</h2>
  <p>We will notify you by email at least 14 days before any material change to this Privacy Policy. Continued use after the effective date of a change constitutes acceptance.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">11. Contact</h2>
  <p>FinX Pty Ltd · Maseru, Kingdom of Lesotho<br>
  Email: <a href="mailto:hello@ithembahealth.com" style="color:#00B9D6">hello&#64;ithembahealth.com</a><br>
  WhatsApp: <a href="https://wa.me/26659033663" style="color:#00B9D6">+266 590 33663</a></p>

  </div>
</div>
  `,
})
export class PrivacyPage {}
