import { Controller, Get, Post } from '@nestjs/common';
import { CronService } from './cron.service.js';

@Controller('cron')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Get('ejecutar')
  @Post('ejecutar')
  ejecutarCronManual() {
    return this.cronService.ejecutarBackups();
  }
}
