import { PartialType } from '@nestjs/mapped-types';
import { CreateCronDto } from './create-cron.dto.js';

export class UpdateCronDto extends PartialType(CreateCronDto) {}
