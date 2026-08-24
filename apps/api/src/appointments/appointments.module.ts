import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentReminderTask } from './appointment-reminder.task';
import { NovuModule } from '../novu/novu.module';

@Module({
  imports: [NovuModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentReminderTask],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
