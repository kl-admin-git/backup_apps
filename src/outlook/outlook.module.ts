import { Module } from '@nestjs/common';
import { OutlookService } from './outlook.service.js';
import { OutlookController } from './outlook.controller.js';

@Module({
  controllers: [OutlookController],
  providers: [OutlookService],
  exports:[OutlookService]
})
export class OutlookModule {}
