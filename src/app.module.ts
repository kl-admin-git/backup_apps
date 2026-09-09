import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupModule } from './backup/backup.module.js';
import { CronModule } from './cron/cron.module.js';
import { GoogleModule } from './google/google.module.js';
import { ConfigModule } from '@nestjs/config';
import { OutlookModule } from './outlook/outlook.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Permite usar process.env en cualquier parte sin reimportar
    }),
    ScheduleModule.forRoot(),
    BackupModule,
    CronModule,
    GoogleModule,
    OutlookModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
