import { IsEnum, IsNotEmpty } from 'class-validator';
export enum DatabaseType {
  MySQL = 'mysql',
  Postgres = 'postgres',
  MariaDB = 'mariadb',
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
}
