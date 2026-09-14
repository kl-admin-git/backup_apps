import { Injectable, Logger } from '@nestjs/common';
import { BackupService } from '../backup/backup.service.js';
import { CreateBackupDto } from '../backup/dto/create-backup.dto.js';
import { Cron } from '@nestjs/schedule';
import fs from 'fs';
import path from 'path';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  constructor(private backupService: BackupService) {}

  private obtenerConexiones(): CreateBackupDto[] {
    const jsonPath = path.join(process.cwd(), 'conexion_backup.json');
    if (fs.existsSync(jsonPath)) {
      try {
        const fileContent = fs.readFileSync(jsonPath, 'utf-8');
        return JSON.parse(fileContent);
      } catch (e: any) {
        this.logger.error(`Error leyendo conexion_backup.json: ${e.message}`);
      }
    } else {
      this.logger.warn(`No se encontró el archivo de configuración ${jsonPath}`);
    }
    return [];
  }

  // @Cron(CronExpression.EVERY_30_SECONDS)
  @Cron('0 7 * * *', {
    timeZone: 'America/Bogota',
  })
  async ejecutarBackups() {
    this.logger.log('Iniciando proceso de respaldos automáticos programados...');
    const conexionesBackup = this.obtenerConexiones();

    for (const config of conexionesBackup) {
      try {
        this.logger.log(`Generando dump para: ${config.database} (${config.type})`);
        await this.backupService.generarBackup(config);
        this.logger.log(`Respaldo completado con éxito para: ${config.database}`);
      } catch (error: any) {
        const errorDetails = error.stderr || error.stdout || error.message || error;
        this.logger.error(errorDetails);
      }
    }
    this.logger.log('Proceso de respaldos automáticos finalizado.');
  }
}
