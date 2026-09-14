import { Module } from '@nestjs/common';
import { CronService } from './cron.service.js';

import { BackupModule } from '../backup/backup.module.js';

import { CronController } from './cron.controller.js';

@Module({
  imports: [BackupModule],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
