import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BackupService } from './backup.service.js';
import { CreateBackupDto } from './dto/create-backup.dto.js';
import { UpdateBackupDto } from './dto/update-backup.dto.js';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('generar')
  generarBackup(@Body() createBackupDto: CreateBackupDto) {
    return this.backupService.generarBackup(createBackupDto);
  }

}
