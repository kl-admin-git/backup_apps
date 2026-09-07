import { Module } from '@nestjs/common';
import { CronService } from './cron.service.js';

import { BackupModule } from '../backup/backup.module.js';

@Module({
  imports:[BackupModule],
  providers: [CronService],
})
export class CronModule {}
