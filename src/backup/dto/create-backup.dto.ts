import { IsEnum, IsNotEmpty } from 'class-validator';
export enum DatabaseType {
  MySQL = 'mysql',
  Postgres = 'postgres',
  MariaDB = 'mariadb',
}

export enum SiteBackupType {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
}
export class CreateBackupDto {
  @IsEnum(DatabaseType)
  type: DatabaseType;
  @IsNotEmpty()
  host: string;
  @IsNotEmpty()
  port: number;
  @IsNotEmpty()
  user: string;
  @IsNotEmpty()
  pass: string;
  @IsNotEmpty()
  database: string;
  @IsNotEmpty()
  targetFolder: string;
  @IsEnum(SiteBackupType)
  backupSite: SiteBackupType;
}
