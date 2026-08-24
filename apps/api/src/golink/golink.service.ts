import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';

export type GolinkRail = 'MPESA' | 'CPAY';

export interface GolinkPaymentResponse {
  id: string;
  status: 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  failureReason?: string;
}

export interface GolinkMandateResponse {
  /** Stored payment method UUID — pass this as storedPaymentMethodId on future charges. */
  id: string;
  /** M-PESA's own mandate reference number — informational only. */
  mandateId: string;
}

/** Collection frequency codes per Golink's CreateMandateDto. */
const MANDATE_FREQUENCY_CODE: Record<'Weekly' | 'Monthly', string> = {
  Weekly: '03',
  Monthly: '04',
};

@Injectable()
export class GolinkService {
  private readonly logger = new Logger(GolinkService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('GOLINK_BASE_URL', 'https://sandbox.transact.golink.co.ls/api');
    this.apiKey = this.config.get<string>('GOLINK_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn('GOLINK_API_KEY not set — payment collection disabled');
    }
  }

  private headers() {
    return { 'X-Api-Key': this.apiKey, 'Content-Type': 'application/json' };
  }

  newIdempotencyKey(): string {
    return randomUUID();
  }

  /** One-off collection (C2B/USSD push) — DEBIT against a patient's phone. */
  async createPayment(params: {
    idempotencyKey: string;
    rail: GolinkRail;
    amountMinor: number;
    currency: string;
    payerPhone: string;
    payerName: string;
    sourceReference: string;
  }): Promise<GolinkPaymentResponse> {
    const body = {
      idempotencyKey: params.idempotencyKey,
      direction: 'DEBIT',
      rail: params.rail,
      amountMinor: params.amountMinor,
      currency: params.currency,
      payer: { phone: params.payerPhone, name: params.payerName },
      payee: {},
      sourceReference: params.sourceReference,
    };
    return this.post<GolinkPaymentResponse>('/payments', body);
  }

  /** Charge an existing M-PESA Direct Debit mandate — synchronous result. */
  async chargeMandate(params: {
    idempotencyKey: string;
    mandateId: string;
    amountMinor: number;
    currency: string;
  }): Promise<GolinkPaymentResponse> {
    const body = {
      idempotencyKey: params.idempotencyKey,
      direction: 'DEBIT',
      rail: 'MPESA',
      storedPaymentMethodId: params.mandateId,
      amountMinor: params.amountMinor,
      currency: params.currency,
      payer: {},
      payee: {},
    };
    return this.post<GolinkPaymentResponse>('/payments', body);
  }

  async getPayment(id: string): Promise<GolinkPaymentResponse> {
    return this.get<GolinkPaymentResponse>(`/payments/${id}`);
  }

  /** B2C disbursement — pay out to a provider's M-Pesa/EcoCash number or bank account. */
  async createDisbursement(params: {
    idempotencyKey: string;
    rail: GolinkRail;
    amountMinor: number;
    currency: string;
    recipientName: string;
    recipientPhone?: string;
    bankAccountNumber?: string;
    bankName?: string;
    sourceReference: string;
  }): Promise<GolinkPaymentResponse> {
    const body = {
      idempotencyKey: params.idempotencyKey,
      direction: 'CREDIT',
      rail: params.rail,
      amountMinor: params.amountMinor,
      currency: params.currency,
      payer: {},
      payee: {
        name: params.recipientName,
        phone: params.recipientPhone,
        bankAccountNumber: params.bankAccountNumber,
        bankName: params.bankName,
      },
      sourceReference: params.sourceReference,
    };
    return this.post<GolinkPaymentResponse>('/disbursements', body);
  }

  /** Create an M-PESA Direct Debit mandate (one consent prompt, then silent recurring charges). */
  async createMandate(params: {
    customerPhone: string;
    /** Your reference — alphanumeric only, max 32 chars (non-alphanumeric is stripped by Golink). */
    reference: string;
    frequency: 'Weekly' | 'Monthly';
    /** YYYYMMDD */
    firstPaymentDate: string;
    /** YYYYMMDD */
    expiryDate: string;
  }): Promise<GolinkMandateResponse> {
    const body = {
      customerPhone: params.customerPhone,
      reference: params.reference.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32),
      agreedTC: true,
      frequency: MANDATE_FREQUENCY_CODE[params.frequency],
      firstPaymentDate: params.firstPaymentDate,
      expiryDate: params.expiryDate,
    };
    return this.post<GolinkMandateResponse>('/mandates', body);
  }

  async checkMandate(mandateId: string, amount: number): Promise<{ status: string; sufficientBalance?: boolean }> {
    return this.get(`/mandates/${mandateId}/check?amount=${amount}`);
  }

  async cancelMandate(mandateId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.baseUrl}/mandates/${mandateId}`, { headers: this.headers() }),
    ).catch(err => {
      this.logger.error(`Failed to cancel mandate ${mandateId}`, err?.response?.data ?? err);
      throw new BadGatewayException('Could not cancel auto top-up with payment provider');
    });
  }

  /** Hosted checkout link — used where the payer isn't the one initiating (e.g. employer invoices). */
  async createPaymentLink(params: {
    idempotencyKey: string;
    rail: GolinkRail;
    amountMinor: number;
    currency: string;
    payerName: string;
    description: string;
    sourceReference: string;
  }): Promise<GolinkPaymentResponse & { checkoutUrl: string }> {
    const body = {
      idempotencyKey: params.idempotencyKey,
      direction: 'DEBIT',
      rail: params.rail,
      amountMinor: params.amountMinor,
      currency: params.currency,
      payer: { name: params.payerName },
      payee: {},
      description: params.description,
      sourceReference: params.sourceReference,
    };
    return this.post<GolinkPaymentResponse & { checkoutUrl: string }>('/payments/link', body);
  }

  /** One-time setup call — register our webhook callback URL with Golink. */
  async registerWebhook(url: string, events: string[]): Promise<{ id: string; secret: string }> {
    return this.post('/webhooks', { url, events });
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    try {
      const res = await firstValueFrom(
        this.http.post<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() }),
      );
      return res.data;
    } catch (err: any) {
      this.logger.error(`Golink POST ${path} failed`, err?.response?.data ?? err?.message ?? err);
      throw new BadGatewayException(err?.response?.data?.message ?? 'Payment provider request failed');
    }
  }

  private async get<T>(path: string): Promise<T> {
    try {
      const res = await firstValueFrom(
        this.http.get<T>(`${this.baseUrl}${path}`, { headers: this.headers() }),
      );
      return res.data;
    } catch (err: any) {
      this.logger.error(`Golink GET ${path} failed`, err?.response?.data ?? err?.message ?? err);
      throw new BadGatewayException(err?.response?.data?.message ?? 'Payment provider request failed');
    }
  }
}
