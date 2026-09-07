import { Injectable, Logger } from '@nestjs/common';
import { CreateBackupDto, DatabaseType } from './dto/create-backup.dto.js';
import { UpdateBackupDto } from './dto/update-backup.dto.js';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execPromise = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly baseBackupDir = path.join(
    process.cwd(),
    'storage',
    'backups',
  );
  constructor() {
    // Asegurar que el directorio base exista al iniciar
    if (!fs.existsSync(this.baseBackupDir)) {
      fs.mkdirSync(this.baseBackupDir, { recursive: true });
    }
  }
  async generarBackup(createBackupDto: CreateBackupDto) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${createBackupDto.database}-${timestamp}.sql`;
   

    // toma el nombre de la carpeta donde se va almacenar
    const folderName = createBackupDto.targetFolder || createBackupDto.database;
    const targetDir = path.join(this.baseBackupDir, folderName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
     
    const filePath = path.join(targetDir, fileName);
    let dumpCommand = '';
    if (createBackupDto.type === DatabaseType.MySQL) {
      // mysqldump para MySQL / MariaDB
     dumpCommand = `mariadb-dump --skip-ssl -h ${createBackupDto.host} -P ${createBackupDto.port} -u ${createBackupDto.user} -p"${createBackupDto.pass}" ${createBackupDto.database} > "${filePath}";`;
    } else if (createBackupDto.type === DatabaseType.Postgres) {
      // pg_dump para PostgreSQL
      dumpCommand = `PGPASSWORD='${createBackupDto.pass}' pg_dump -h ${createBackupDto.host} -p ${createBackupDto.port} -U ${createBackupDto.user} -d ${createBackupDto.database} -F p -f "${filePath}";`;
    } else if(createBackupDto.type === DatabaseType.MariaDB){

       dumpCommand = `mariadb-dump --skip-ssl -h ${createBackupDto.host} -P ${createBackupDto.port} -u ${createBackupDto.user} -p"${createBackupDto.pass}" ${createBackupDto.database} > "${filePath}";`;
    }else {
      throw new Error(`Motor de base de datos no soportado: ${createBackupDto.type}`);
    }
     this.logger.log(`'${dumpCommand}'`);
    try {
      // this.logger.log(`Iniciando respaldo para ${createBackupDto.database} (${createBackupDto.type}) en ${createBackupDto.host}...`);
      this.logger.log(dumpCommand);
      this.logger.log(filePath);
      const {stderr,stdout} = await execPromise(dumpCommand);

      return  {
        success: true,
        message: 'Backup generado correctamente',
        path: filePath,
        fileName,
      };
      
    } catch (error:any) {
      const errorDetails = error.stderr || error.stdout || error.message || error;
    
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      throw new Error(errorDetails);
    }
  }
}
