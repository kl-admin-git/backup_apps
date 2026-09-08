import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupModule } from './backup/backup.module.js';
import { CronModule } from './cron/cron.module.js';
import { GoogleModule } from './google/google.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Permite usar process.env en cualquier parte sin reimportar
    }),
    ScheduleModule.forRoot(),
    BackupModule,
    CronModule,
    GoogleModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
