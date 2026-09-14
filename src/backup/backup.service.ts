import { Injectable, Logger } from '@nestjs/common';
import { CreateBackupDto, DatabaseType,SiteBackupType } from './dto/create-backup.dto.js';
import { UpdateBackupDto } from './dto/update-backup.dto.js';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { GoogleService } from '../google/google.service.js';
import { OutlookService } from '../outlook/outlook.service.js';

const execPromise = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly baseBackupDir = path.join(
    process.cwd(),
    'storage',
    'backups',
  );
  constructor(private googleService:GoogleService,private outlookService:OutlookService) {
    // Asegurar que el directorio base exista al iniciar
    if (!fs.existsSync(this.baseBackupDir)) {
      fs.mkdirSync(this.baseBackupDir, { recursive: true });
    }
  }
  async generarBackup(createBackupDto: CreateBackupDto) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${createBackupDto.database}-${timestamp}.sql`;
    const fileZip = `${createBackupDto.database}-${timestamp}.zip`;
   

    // toma el nombre de la carpeta donde se va almacenar
    const folderName = createBackupDto.targetFolder || createBackupDto.database;
    const targetDir = path.join(this.baseBackupDir, folderName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
     
    const filePath = path.join(targetDir, fileName);
    const filePathZip = path.join(targetDir, fileZip);
    const passArg = createBackupDto.pass ? `-p"${createBackupDto.pass}"` : '';
    let dumpCommand = '';
    if (createBackupDto.type === DatabaseType.MySQL || createBackupDto.type === DatabaseType.MariaDB) {
      // mysqldump / mariadb-dump para MySQL y MariaDB
      dumpCommand = `mariadb-dump --skip-ssl -h ${createBackupDto.host} -P ${createBackupDto.port} -u ${createBackupDto.user} ${passArg} ${createBackupDto.database} > "${filePath}" && zip -j "${filePathZip}" "${filePath}" && rm "${filePath}";`;
    } else if (createBackupDto.type === DatabaseType.Postgres) {
      // pg_dump para PostgreSQL
      dumpCommand = `PGPASSWORD='${createBackupDto.pass || ''}' pg_dump -h ${createBackupDto.host} -p ${createBackupDto.port} -U ${createBackupDto.user} -d ${createBackupDto.database} -F p -f "${filePath}" && zip -j "${filePathZip}" "${filePath}" && rm "${filePath};`;
    } else {
      throw new Error(`Motor de base de datos no soportado: ${createBackupDto.type}`);
    }
     this.logger.log(`'${dumpCommand}'`);
    try {
      // this.logger.log(`Iniciando respaldo para ${createBackupDto.database} (${createBackupDto.type}) en ${createBackupDto.host}...`);
      // this.logger.log(dumpCommand);
      // this.logger.log(filePath);
      const {stderr,stdout} = await execPromise(dumpCommand);
      if (createBackupDto.backupSite === SiteBackupType.GOOGLE ) {
        await this.googleService.crear_archivo(filePathZip,createBackupDto.targetFolder)
      }else{
        await this.outlookService.crear_archivo(filePathZip,createBackupDto.targetFolder)
      }

      // se pide enviar al drive o al outlook dependiendo lo que venga configurado

      
      return  {
        success: true,
        message: 'Backup generado correctamente',
        path: filePath,
        fileName,
      };
      
    } catch (error:any) {
      const errorDetails = error.stderr || error.stdout || error.message || error;
    
      if (fs.existsSync(filePathZip)) {
        fs.unlinkSync(filePathZip);
      }

      throw new Error(errorDetails);
    }
  }
}
