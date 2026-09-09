import { PartialType } from '@nestjs/mapped-types';
import { CreateOutlookDto } from './create-outlook.dto.js';

export class UpdateOutlookDto extends PartialType(CreateOutlookDto) {}
