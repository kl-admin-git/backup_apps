import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GoogleService } from './google.service.js';
import { CreateGoogleDto } from './dto/create-google.dto.js';
import { UpdateGoogleDto } from './dto/update-google.dto.js';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}


  @Get()
  async crear_archivo() {
    // return await this.googleService.crear_archivo();
  }

}
