import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OutlookService } from './outlook.service.js';

@Controller('outlook')
export class OutlookController {
  constructor(private readonly outlookService: OutlookService) {}

  // @Post()
  // create(@Body() createOutlookDto: CreateOutlookDto) {
  //   return this.outlookService.create(createOutlookDto);
  // }

}
