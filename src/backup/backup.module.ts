import { Module } from '@nestjs/common';
import { BackupService } from './backup.service.js';
import { BackupController } from './backup.controller.js';
import { GoogleModule } from '../google/google.module.js';
import { OutlookModule } from '../outlook/outlook.module.js';

@Module({
  imports:[GoogleModule,OutlookModule],
  controllers: [BackupController],
  providers: [BackupService],
  exports:[BackupService]
})
export class BackupModule {}
