import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupModule } from './backup/backup.module.js';
import { CronModule } from './cron/cron.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BackupModule,
    CronModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
