import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
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

  <h1 style="font-size:36px;font-weight:800;color:#1a1a2e;letter-spacing:-1px;margin-bottom:8px">Terms of Service</h1>
  <p style="color:#9e9e9e;font-size:14px;margin-bottom:48px">Effective date: 1 July 2026 &nbsp;·&nbsp; Jurisdiction: Kingdom of Lesotho</p>

  <div style="font-size:15px;line-height:1.85;color:#444">

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">1. About iThemba Health</h2>
  <p>iThemba Health ("iThemba", "we", "us") is a health savings platform operated by <strong>FinX Pty Ltd</strong>, incorporated in the Kingdom of Lesotho. Our platform enables individuals ("Members"), employers ("Employer Accounts"), and healthcare providers ("Providers") to open Health Savings Accounts (HSAs), contribute funds, and pay for accredited private healthcare services.</p>
  <p>By registering for an account, you agree to these Terms in full. If you are registering on behalf of an employer, you confirm you have authority to bind that organisation.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">2. Health Savings Account (HSA)</h2>
  <p>An HSA is a ring-fenced savings account held on the iThemba platform, accessible only for qualifying private healthcare expenditure. Key rules:</p>
  <ul style="padding-left:24px">
    <li>Only the account holder or their registered beneficiaries may use HSA funds for healthcare.</li>
    <li>Cash withdrawals from the HSA are <strong>not permitted</strong> under any circumstances.</li>
    <li>Transfers of HSA balances to third parties or other financial accounts are <strong>not permitted</strong>.</li>
    <li>Unused balances roll over indefinitely and are not forfeited.</li>
  </ul>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">3. Fees and charges</h2>
  <ul style="padding-left:24px">
    <li><strong>Registration fee:</strong> R67 (once-off), deducted from your first top-up upon account creation.</li>
    <li><strong>Annual administration fee:</strong> R67, charged each January to keep the account active.</li>
    <li><strong>Transaction fee:</strong> 5% on every payment made to a Provider from your HSA.</li>
    <li><strong>Monthly contribution:</strong> Minimum R500, maximum R10,000 per calendar month.</li>
    <li><strong>AML threshold:</strong> Lump sum deposits of R50,000 or more require additional Anti-Money Laundering (AML) verification before processing.</li>
  </ul>
  <p>FinX Pty Ltd reserves the right to update fees with 30 days' notice via the email address on your account. Continued use after the notice period constitutes acceptance.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">4. Beneficiaries</h2>
  <p>Members may add up to the platform maximum of registered beneficiaries (spouse, children, and dependants). Beneficiaries are not account holders and hold no independent rights over the HSA. The registered Member is solely responsible for all bookings and payments made on behalf of beneficiaries.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">5. Employer accounts</h2>
  <p>An employer may open a group plan and contribute to employee HSAs as a workplace benefit. Employer contributions are credited to the individual HSAs of enrolled employees; once credited, the funds belong to the employee. Employers may not recall or redirect individual employee HSA funds.</p>
  <p>Employers are responsible for ensuring all enrolled employees have consented to data sharing as required under Section 8 (Privacy).</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">6. Healthcare providers</h2>
  <p>Providers apply to join the iThemba network and must be verified by the iThemba operations team before appearing in search results. Providers submit claims via the platform after a completed appointment; claims are reviewed and, upon approval, deducted from the patient's HSA and remitted to the Provider. iThemba does not guarantee the quality, safety, or outcome of any healthcare service rendered by a Provider.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">7. Payments</h2>
  <p>Payments are processed via Golink Transact, which operates over Vodacom M-PESA and Chaperone C-Pay payment rails. By initiating a top-up, you authorise the applicable mobile money debit. iThemba is not a bank and does not hold your funds directly; funds collected via Golink are remitted and held in accordance with applicable Lesotho financial services regulations.</p>
  <p>If a payment fails or is disputed, contact us at <a href="mailto:hello@ithembahealth.com">hello&#64;ithembahealth.com</a> within 30 days.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">8. Privacy and data</h2>
  <p>We collect and process personal data as described in our <a routerLink="/privacy" style="color:#00B9D6">Privacy Policy</a>. By registering, you consent to this processing. Your data is stored on servers hosted in the EU (Supabase, eu-west-1 region) and is never sold to third parties.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">9. Account suspension and termination</h2>
  <p>iThemba may suspend or close an account if we reasonably believe it is being used fraudulently, in breach of AML regulations, or in violation of these Terms. Upon account closure, any remaining HSA balance will be remitted to the registered mobile money number, less any outstanding fees, within 30 business days — subject to applicable AML and regulatory requirements.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">10. Limitation of liability</h2>
  <p>To the fullest extent permitted by Lesotho law, FinX Pty Ltd is not liable for indirect, incidental, or consequential damages arising from your use of the platform, including any healthcare outcome, provider conduct, or payment delay. Our total liability in any calendar year shall not exceed the total fees paid by you to iThemba in that year.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">11. Governing law</h2>
  <p>These Terms are governed by the laws of the Kingdom of Lesotho. Any dispute shall be submitted to the exclusive jurisdiction of the courts of Lesotho, Maseru.</p>

  <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:36px 0 12px">12. Contact us</h2>
  <p>FinX Pty Ltd · Maseru, Kingdom of Lesotho<br>
  Email: <a href="mailto:hello@ithembahealth.com" style="color:#00B9D6">hello&#64;ithembahealth.com</a><br>
  WhatsApp: <a href="https://wa.me/26659033663" style="color:#00B9D6">+266 590 33663</a></p>

  </div>
</div>
  `,
})
export class TermsPage {}
