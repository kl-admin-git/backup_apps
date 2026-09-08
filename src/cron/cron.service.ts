import { Injectable, Logger } from '@nestjs/common';
import { BackupService } from '../backup/backup.service.js';
import { conexionesBackup } from '../data/conexion_backup.js';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  constructor(private backupService: BackupService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  // @Cron('0 7 * * *', {
  //   timeZone: 'America/Bogota',
  // })
  async ejecutarBackups() {
    this.logger.log('Iniciando proceso de respaldos automáticos programados...');
    for(const config  of conexionesBackup){

      try {
        
        this.logger.log(`Generando dump para: ${config.database} (${config.type})`);
        await this.backupService.generarBackup(config)
        this.logger.log(`Respaldo completado con éxito para: ${config.database}`);
      } catch (error:any) {
        const errorDetails = error.stderr || error.stdout || error.message || error;
        this.logger.error(errorDetails);
      }
     

    }
    this.logger.log('Proceso de respaldos automáticos finalizado.');
  }

}
