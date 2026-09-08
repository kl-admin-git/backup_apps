import { Module } from '@nestjs/common';
import { GoogleService } from './google.service.js';
import { GoogleController } from './google.controller.js';

@Module({
  controllers: [GoogleController],
  providers: [GoogleService],
  exports:[GoogleService]
})
export class GoogleModule {}
