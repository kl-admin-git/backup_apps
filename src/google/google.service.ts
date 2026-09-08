import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import path from 'path';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';

@Injectable()
export class GoogleService {
  private drive: any;

  constructor(private configService: ConfigService) {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'autentication_google.json'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    this.drive = google.drive({
      version: 'v3',
      auth: auth,
    });
  }
  async crear_archivo(localFilePath: string, subfolder: string) {
    try {
      const folderId = this.configService.get<string>('FOLDER_ID');
      // primero verificar si el subfolder existe
      const buscarFolder = await this.crearSubfolder(subfolder, folderId!);

      if (!fs.existsSync(localFilePath)) {
        throw new Error(`El archivo local no existe en: ${localFilePath}`);
      }

      const fileName = path.basename(localFilePath);
      const res = await this.drive.files.create({
        supportsAllDrives: true,
        supportsTeamDrives: true,
        requestBody: {
          name: fileName,
          // mimeType: 'text/plain',
          parents: [buscarFolder.id],
        },
        media: {
          // mimeType: 'text/plain',
          body: fs.createReadStream(localFilePath),
        },
        fields: 'id, name, webViewLink,webContentLink',
      });

       console.log(res.status);
    } catch (error) {
      console.log(error);
    }
  }

  async buscarSubfolder(subfolderName: string, parentFolderId: string) {
    const safeName = subfolderName.replace(/'/g, "\\'");

    const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeName}' and '${parentFolderId}' in parents and trashed = false`;

    const response = await this.drive.files.list({
      q: query,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, name, webViewLink)',
    });

    const files = response.data.files;
    return files && files.length > 0 ? files[0] : null;
  }

  async crearSubfolder(subfolderName: string, parentFolderId: string) {
    try {
      if (!parentFolderId) {
        throw new Error(
          'Se requiere el ID de la carpeta padre (parentFolderId)',
        );
      }

      // 2. Verificar si la subcarpeta ya existe dentro del padre para no duplicar
      const subcarpetaExistente = await this.buscarSubfolder(
        subfolderName,
        parentFolderId,
      );
      if (subcarpetaExistente) {
        console.log(
          `La subcarpeta "${subfolderName}" ya existe con ID: ${subcarpetaExistente.id}`,
        );
        return subcarpetaExistente;
      }

      // 3. Crear la subcarpeta dentro de la carpeta padre
      const response = await this.drive.files.create({
        supportsAllDrives: true,
        supportsTeamDrives: true,
        requestBody: {
          name: subfolderName,

          mimeType: 'application/vnd.google-apps.folder',

          parents: [parentFolderId],
        },
        fields: 'id, name, webViewLink, parents',
      });

      console.log(
        `Subcarpeta "${subfolderName}" creada con éxito (ID: ${response.data.id})`,
      );
      return response.data;
    } catch (error) {
      console.error('Error al crear la subcarpeta:');
    }
  }
}