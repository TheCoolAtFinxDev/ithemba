import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PatientsModule } from '../patients/patients.module';
import { ProvidersModule } from '../providers/providers.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ClaimsModule } from '../claims/claims.module';
import { AdminModule } from '../admin/admin.module';
import { NovuModule } from '../novu/novu.module';
import { Wso2Module } from '../wso2/wso2.module';
import { RegistrationModule } from '../registration/registration.module';
import { EmployerModule } from '../employer/employer.module';
import { GolinkModule } from '../golink/golink.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    // Default limit — tighter overrides via @Throttle() on brute-forceable
    // unauthenticated routes (OTP verify/resend, email-exists check).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    PrismaModule,
    AuthModule,
    PatientsModule,
    ProvidersModule,
    AppointmentsModule,
    ClaimsModule,
    AdminModule,
    NovuModule,
    Wso2Module,
    RegistrationModule,
    EmployerModule,
    GolinkModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}