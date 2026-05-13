import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PatientsModule } from '../patients/patients.module';
import { ProvidersModule } from '../providers/providers.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    PatientsModule,
    ProvidersModule,
    AppointmentsModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}