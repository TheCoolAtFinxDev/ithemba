import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Novu } from '@novu/node';

@Injectable()
export class NovuService {
  private readonly logger = new Logger(NovuService.name);
  private novu: Novu | null = null;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('NOVU_API_KEY');
    const backendUrl = config.get<string>('NOVU_API_URL');
    if (apiKey) {
      this.novu = new Novu(apiKey, { backendUrl });
    } else {
      this.logger.warn('NOVU_API_KEY not set — email notifications disabled');
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
}
