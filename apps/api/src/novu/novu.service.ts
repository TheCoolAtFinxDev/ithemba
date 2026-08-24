import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Novu } from '@novu/node';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NovuService {
  private readonly logger = new Logger(NovuService.name);
  private novu: Novu | null = null;

  constructor(config: ConfigService, private prisma: PrismaService) {
    const apiKey = config.get<string>('NOVU_API_KEY');
    const backendUrl = config.get<string>('NOVU_API_URL');
    if (apiKey) {
      this.novu = new Novu(apiKey, { backendUrl });
    } else {
      this.logger.warn('NOVU_API_KEY not set — email notifications disabled');
    }
  }

  /**
   * Discretionary sends only — security-critical notifications (registration
   * OTP, password reset) must never be gated by this and always send.
   * No preference row yet (e.g. brand-new account) defaults to enabled.
   */
  private async isEmailEnabled(userProfileId?: string): Promise<boolean> {
    if (!userProfileId) return true;
    const pref = await this.prisma.notificationPreference.findUnique({ where: { userProfileId } });
    return pref?.emailEnabled ?? true;
  }

  // Shared low-level trigger, used by every notification method added below
  // (the original hand-written methods above each duplicate this — left as-is
  // to keep this change focused rather than refactoring proven code).
  private async trigger(
    workflowId: string,
    to: { subscriberId: string; email?: string; phone?: string; firstName?: string },
    payload: Record<string, unknown> = {},
  ) {
    if (!this.novu) {
      this.logger.log(`[DEV] ${workflowId} → ${to.email ?? to.phone} ${JSON.stringify(payload)}`);
      return;
    }
    try {
      await this.novu.trigger(workflowId, { to, payload });
    } catch (err) {
      this.logger.error(`Failed to trigger ${workflowId}`, err);
    }
  }

  // Fans a workflow out to every ADMIN-role user — used for the various
  // "something needs admin attention" notifications (new claim, new
  // registration, payment failure, etc).
  async notifyAdmins(workflowId: string, payload: Record<string, unknown> = {}) {
    const admins = await this.prisma.userProfile.findMany({
      where: { roles: { some: { role: { name: 'ADMIN' } } } },
      select: { id: true, email: true, fullName: true },
    });
    for (const admin of admins) {
      await this.trigger(workflowId,
        { subscriberId: admin.id, email: admin.email, firstName: admin.fullName?.split(' ')[0] },
        payload);
    }
  }

  async sendEmailOtp(params: { email: string; firstName: string; otp: string; pendingId?: string }) {
    if (!this.novu) {
      this.logger.log(`[DEV] Email OTP for ${params.email}: ${params.otp}`);
      return;
    }
    const verifyLink = params.pendingId
      ? `https://myhealth.ithembahealth.com/register?pid=${params.pendingId}`
      : 'https://myhealth.ithembahealth.com/register';
    try {
      await this.novu.trigger('email-otp-fks5', {
        to: { subscriberId: params.email, email: params.email, firstName: params.firstName },
        payload: { otp: params.otp, verifyLink },
      });
    } catch (err) {
      this.logger.error('Failed to send email OTP via Novu', err);
    }
  }

  // Separate workflow from sendEmailOtp — "reset your password" is a
  // different security context/message than "verify your new account".
  async sendPasswordResetOtp(params: { email: string; firstName: string; otp: string }) {
    if (!this.novu) {
      this.logger.log(`[DEV] Password reset OTP for ${params.email}: ${params.otp}`);
      return;
    }
    try {
      await this.novu.trigger('password-reset-otp', {
        to: { subscriberId: params.email, email: params.email, firstName: params.firstName },
        payload: { otp: params.otp },
      });
    } catch (err) {
      this.logger.error('Failed to send password reset OTP via Novu', err);
    }
  }

  async sendSmsOtp(params: { phoneNumber: string; firstName: string; otp: string }) {
    if (!this.novu) {
      this.logger.log(`[DEV SMS] OTP for ${params.phoneNumber}: ${params.otp}`);
      return;
    }
    try {
      await this.novu.trigger('sms-otp', {
        to: { subscriberId: params.phoneNumber, phone: params.phoneNumber },
        payload: { otp: params.otp, firstName: params.firstName },
      });
    } catch (err) {
      this.logger.error('SMS OTP trigger failed', err);
    }
  }

  async sendWelcome(params: { email: string; firstName: string; temporaryPassword: string; loginUrl: string }) {
    if (!this.novu) {
      this.logger.log(`[DEV] Welcome email for ${params.email} — temp password: ${params.temporaryPassword}`);
      return;
    }
    try {
      await this.novu.trigger('welcome-email', {
        to: { subscriberId: params.email, email: params.email, firstName: params.firstName },
        payload: { temporaryPassword: params.temporaryPassword, loginUrl: params.loginUrl },
      });
    } catch (err) {
      this.logger.error('Failed to send welcome email via Novu', err);
    }
  }

  async sendInvite(params: { email: string; firstName: string; role: string }) {
    if (!this.novu) {
      this.logger.log(`[DEV] Invite sent to ${params.email} as ${params.role}`);
      return;
    }
    try {
      await this.novu.trigger('user-invite', {
        to: { subscriberId: params.email, email: params.email, firstName: params.firstName },
        payload: { role: params.role, loginUrl: 'https://myhealth.ithembahealth.com' },
      });
    } catch (err) {
      this.logger.error('Failed to send invite email via Novu', err);
    }
  }

  async sendVisitCode(params: {
    subscriberId: string;
    email: string;
    firstName: string;
    visitCode: string;
    appointmentDate: string;
    providerName: string;
  }) {
    if (!(await this.isEmailEnabled(params.subscriberId))) {
      this.logger.log(`Visit code email skipped for ${params.email} — notifications disabled by user`);
      return;
    }
    if (!this.novu) {
      this.logger.log(`[DEV] Visit code ${params.visitCode} → ${params.email}`);
      return;
    }
    try {
      await this.novu.trigger('visit-code', {
        to: {
          subscriberId: params.subscriberId,
          email: params.email,
          firstName: params.firstName,
        },
        payload: {
          visitCode: params.visitCode,
          appointmentDate: params.appointmentDate,
          providerName: params.providerName,
        },
      });
    } catch (err) {
      this.logger.error('Failed to send visit code email via Novu', err);
    }
  }

  async sendAppointmentAccepted(params: {
    subscriberId: string;
    email: string;
    firstName: string;
    appointmentDate: string;
    providerName: string;
  }) {
    if (!(await this.isEmailEnabled(params.subscriberId))) return;
    if (!this.novu) {
      this.logger.log(`[DEV] Appointment accepted email → ${params.email}`);
      return;
    }
    try {
      await this.novu.trigger('appointment-accepted', {
        to: { subscriberId: params.subscriberId, email: params.email, firstName: params.firstName },
        payload: { appointmentDate: params.appointmentDate, providerName: params.providerName },
      });
    } catch (err) {
      this.logger.error('Failed to send appointment-accepted email via Novu', err);
    }
  }

  async sendAppointmentRejected(params: {
    subscriberId: string;
    email: string;
    firstName: string;
    appointmentDate: string;
    providerName: string;
    reason?: string;
  }) {
    if (!(await this.isEmailEnabled(params.subscriberId))) return;
    if (!this.novu) {
      this.logger.log(`[DEV] Appointment rejected email → ${params.email}`);
      return;
    }
    try {
      await this.novu.trigger('appointment-rejected', {
        to: { subscriberId: params.subscriberId, email: params.email, firstName: params.firstName },
        payload: {
          appointmentDate: params.appointmentDate,
          providerName: params.providerName,
          reason: params.reason ?? '',
        },
      });
    } catch (err) {
      this.logger.error('Failed to send appointment-rejected email via Novu', err);
    }
  }

  async sendClaimApproved(params: {
    subscriberId: string;
    email: string;
    firstName: string;
    claimAmount: number;
    providerName: string;
  }) {
    if (!(await this.isEmailEnabled(params.subscriberId))) return;
    if (!this.novu) {
      this.logger.log(`[DEV] Claim approved email → ${params.email}`);
      return;
    }
    try {
      await this.novu.trigger('claim-approved', {
        to: { subscriberId: params.subscriberId, email: params.email, firstName: params.firstName },
        payload: { claimAmount: params.claimAmount, providerName: params.providerName },
      });
    } catch (err) {
      this.logger.error('Failed to send claim-approved email via Novu', err);
    }
  }

  async sendClaimRejected(params: {
    subscriberId: string;
    email: string;
    firstName: string;
    claimAmount: number;
    providerName: string;
    reason?: string;
  }) {
    if (!(await this.isEmailEnabled(params.subscriberId))) return;
    if (!this.novu) {
      this.logger.log(`[DEV] Claim rejected email → ${params.email}`);
      return;
    }
    try {
      await this.novu.trigger('claim-rejected', {
        to: { subscriberId: params.subscriberId, email: params.email, firstName: params.firstName },
        payload: {
          claimAmount: params.claimAmount,
          providerName: params.providerName,
          reason: params.reason ?? '',
        },
      });
    } catch (err) {
      this.logger.error('Failed to send claim-rejected email via Novu', err);
    }
  }

  // ── WP-N1: money movement (patient-facing) ──────────────────

  async sendTopupSucceeded(p: { subscriberId: string; email: string; firstName: string; amount: number; newBalance: number }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('topup-succeeded', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { amount: p.amount.toFixed(2), newBalance: p.newBalance.toFixed(2) });
  }

  async sendTopupFailed(p: { subscriberId: string; email: string; firstName: string; amount: number; reason: string }) {
    // Failure notices are never gated — a patient needs to know their money didn't move.
    await this.trigger('topup-failed', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { amount: p.amount.toFixed(2), reason: p.reason });
  }

  async sendAutoDebitSucceeded(p: { subscriberId: string; email: string; firstName: string; amount: number; newBalance: number }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('auto-debit-succeeded', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { amount: p.amount.toFixed(2), newBalance: p.newBalance.toFixed(2) });
  }

  async sendAutoDebitFailed(p: { subscriberId: string; email: string; firstName: string; amount: number; reason: string }) {
    await this.trigger('auto-debit-failed', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { amount: p.amount.toFixed(2), reason: p.reason });
  }

  async sendLowBalanceWarning(p: { subscriberId: string; email: string; firstName: string; balance: number; threshold: number }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('low-balance-warning', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { balance: p.balance.toFixed(2), threshold: p.threshold.toFixed(2) });
  }

  // ── WP-N6: payment/disbursement failure alerts to admins ────

  async notifyAdminsPaymentFailed(p: { patientName: string; amount: number; reason: string }) {
    await this.notifyAdmins('admin-payment-failed', { patientName: p.patientName, amount: p.amount.toFixed(2), reason: p.reason });
  }

  async notifyAdminsDisbursementFailed(p: { providerName: string; amount: number; reason: string }) {
    await this.notifyAdmins('admin-disbursement-failed', { providerName: p.providerName, amount: p.amount.toFixed(2), reason: p.reason });
  }

  // ── WP-N2: appointment lifecycle ─────────────────────────────

  async sendNewAppointmentRequest(p: { subscriberId: string; email: string; firstName: string; patientName: string; appointmentDate: string }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('appointment-new-request', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { patientName: p.patientName, appointmentDate: p.appointmentDate });
  }

  async sendAppointmentCancelledByPatient(p: { subscriberId: string; email: string; firstName: string; patientName: string; appointmentDate: string; reason?: string }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('appointment-cancelled-by-patient', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { patientName: p.patientName, appointmentDate: p.appointmentDate, reason: p.reason ?? 'Not specified' });
  }

  async sendAppointmentCheckedIn(p: { subscriberId: string; email: string; firstName: string; providerName: string; appointmentDate: string }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('appointment-checked-in', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { providerName: p.providerName, appointmentDate: p.appointmentDate });
  }

  async sendAppointmentReminderAdvance(p: { subscriberId: string; email: string; firstName: string; providerName: string; appointmentDate: string }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('appointment-reminder-advance', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { providerName: p.providerName, appointmentDate: p.appointmentDate });
  }

  // Mandatory baseline reminder — deliberately NOT gated by isEmailEnabled(),
  // same treatment as OTP. Fires email + SMS both (workflow has both steps).
  async sendAppointmentReminderFinal(p: { subscriberId: string; email: string; phone?: string; firstName: string; providerName: string; appointmentDate: string }) {
    await this.trigger('appointment-reminder-final',
      { subscriberId: p.subscriberId, email: p.email, phone: p.phone, firstName: p.firstName },
      { providerName: p.providerName, appointmentDate: p.appointmentDate });
  }

  // ── WP-N3: claims & disbursement ─────────────────────────────

  async notifyAdminsNewClaim(p: { providerName: string; patientName: string; amount: number }) {
    await this.notifyAdmins('admin-new-claim-submitted', { providerName: p.providerName, patientName: p.patientName, amount: p.amount.toFixed(2) });
  }

  async sendProviderDisbursementSucceeded(p: { subscriberId: string; email: string; firstName: string; amount: number; claimNumber: string }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('provider-disbursement-succeeded', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { amount: p.amount.toFixed(2), claimNumber: p.claimNumber });
  }

  async sendProviderDisbursementFailed(p: { subscriberId: string; email: string; firstName: string; amount: number; claimNumber: string; reason: string }) {
    await this.trigger('provider-disbursement-failed', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { amount: p.amount.toFixed(2), claimNumber: p.claimNumber, reason: p.reason });
  }

  // ── WP-N4: admin account actions (transparency to affected user) ─

  async sendWalletAdjusted(p: { subscriberId: string; email: string; firstName: string; amount: number; reason: string; newBalance: number }) {
    // Not gated — this is the user being told an admin touched their money.
    await this.trigger('wallet-adjusted', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { amount: p.amount.toFixed(2), reason: p.reason, newBalance: p.newBalance.toFixed(2) });
  }

  async sendAccountLocked(p: { subscriberId: string; email: string; firstName: string }) {
    await this.trigger('account-locked', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName });
  }

  async sendAccountUnlocked(p: { subscriberId: string; email: string; firstName: string }) {
    await this.trigger('account-unlocked', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName });
  }

  async sendRoleAssigned(p: { subscriberId: string; email: string; firstName: string; roleName: string }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('role-assigned', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName }, { roleName: p.roleName });
  }

  // ── WP-N5: employer & verification lifecycle ─────────────────

  async notifyAdminsNewEmployer(p: { companyName: string }) {
    await this.notifyAdmins('admin-new-employer-registration', { companyName: p.companyName });
  }

  async notifyAdminsNewProvider(p: { providerName: string; clinicName: string }) {
    await this.notifyAdmins('admin-new-provider-registration', { providerName: p.providerName, clinicName: p.clinicName });
  }

  async sendProviderVerified(p: { subscriberId: string; email: string; firstName: string }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('provider-verified', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName });
  }

  async sendEmployerInvite(params: { email: string; firstName: string; employerName: string; contributionAmount: number; registerUrl: string }) {
    if (!this.novu) {
      this.logger.log(`[DEV] Employer invite sent to ${params.email} for ${params.employerName} — ${params.registerUrl}`);
      return;
    }
    try {
      await this.novu.trigger('employer-employee-invite', {
        to: { subscriberId: params.email, email: params.email, firstName: params.firstName },
        payload: {
          employerName: params.employerName,
          contributionAmount: params.contributionAmount,
          registerUrl: params.registerUrl,
        },
      });
    } catch (err) {
      this.logger.error('Failed to send employer invite via Novu', err);
    }
  }

  async sendMemberEnrolled(p: { subscriberId: string; email: string; firstName: string; employerName: string; contributionAmount: number }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('member-enrolled', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { employerName: p.employerName, contributionAmount: p.contributionAmount.toFixed(2) });
  }

  async sendMemberSuspended(p: { subscriberId: string; email: string; firstName: string; employerName: string }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('member-suspended', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName }, { employerName: p.employerName });
  }

  async sendMemberTerminated(p: { subscriberId: string; email: string; firstName: string; employerName: string }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('member-terminated', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName }, { employerName: p.employerName });
  }

  async sendInvoiceGenerated(p: { subscriberId: string; email: string; firstName: string; invoiceNumber: string; totalAmount: number; dueDate: string }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('invoice-generated', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { invoiceNumber: p.invoiceNumber, totalAmount: p.totalAmount.toFixed(2), dueDate: p.dueDate });
  }

  async sendInvoicePaid(p: { subscriberId: string; email: string; firstName: string; invoiceNumber: string; totalAmount: number }) {
    if (!(await this.isEmailEnabled(p.subscriberId))) return;
    await this.trigger('invoice-paid', { subscriberId: p.subscriberId, email: p.email, firstName: p.firstName },
      { invoiceNumber: p.invoiceNumber, totalAmount: p.totalAmount.toFixed(2) });
  }
}
