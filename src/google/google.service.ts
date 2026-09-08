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

//   /**
//    * Subir un archivo local a Google Drive
//    * @param localFilePath Ruta absoluta o relativa del archivo local
//    * @param folderId ID de la carpeta en Google Drive donde se guardará
//    */
//   async uploadLocalFile(localFilePath: string, folderId?: string) {
//     try {
//       // Verificar existencia del archivo
//       if (!fs.existsSync(localFilePath)) {
//         throw new Error(`El archivo local no existe en: ${localFilePath}`);
//       }

//       const fileName = path.basename(localFilePath);

//       // Metadata del archivo en Drive
//       const fileMetaData: Record<string, any> = {
//         name: fileName,
//       };

//       // Si se especifica una carpeta destino, se agrega a los padres
//       if (folderId) {
//         fileMetaData.parents = [folderId];
//       }

//       // Stream para leer el archivo local
//       const media = {
//         body: fs.createReadStream(localFilePath),
//       };

//       // Petición a la API de Google Drive
//       const response = await this.drive.files.create({
//         requestBody: fileMetaData,
//         media: media,
//         fields: 'id, name, webViewLink, webContentLink',
//       });

//       return response.data;
//     } catch (error) {
//       throw new InternalServerErrorException(
//         `Error al subir archivo a Drive: ${error.message}`,
//       );
//     }
//   }
// }

//   /**
//    * Crea una subcarpeta dentro de una carpeta padre específica.
//    * Si ya existe, retorna la subcarpeta encontrada sin duplicarla.
//    *
//    * @param subfolderName Nombre de la nueva subcarpeta (ej: "Facturas 2026")
//    * @param parentFolderId ID de la carpeta contenedora existente
//    */
//   async crearSubfolder(subfolderName: string, parentFolderId: string) {
//     try {
//       // 1. Validar que tengamos el ID de la carpeta padre
//       if (!parentFolderId) {
//         throw new Error('Se requiere el ID de la carpeta padre (parentFolderId)');
//       }

//       // 2. Verificar si la subcarpeta ya existe dentro del padre para no duplicar
//       const subcarpetaExistente = await this.buscarSubfolder(subfolderName, parentFolderId);
//       if (subcarpetaExistente) {
//         console.log(`La subcarpeta "${subfolderName}" ya existe con ID: ${subcarpetaExistente.id}`);
//         return subcarpetaExistente;
//       }

//       // 3. Crear la subcarpeta dentro de la carpeta padre
//       const response = await this.drive.files.create({
//         supportsAllDrives: true,
//         supportsTeamDrives: true,
//         requestBody: {
//           name: subfolderName,
//           // ⚠️ MIME Type para definir que es una carpeta
//           mimeType: 'application/vnd.google-apps.folder',
//           // ⚠️ ID de la carpeta contenedora
//           parents: [parentFolderId],
//         },
//         fields: 'id, name, webViewLink, parents',
//       });

//       console.log(`Subcarpeta "${subfolderName}" creada con éxito (ID: ${response.data.id})`);
//       return response.data;

//     } catch (error) {
//       console.error('Error al crear la subcarpeta:', error.message);
//       throw new InternalServerErrorException(`Error al crear subcarpeta: ${error.message}`);
//     }
//   }

//   /**
//    * Método privado para verificar si la subcarpeta ya existe dentro de la carpeta padre
//    */
//   private async buscarSubfolder(subfolderName: string, parentFolderId: string) {
//     const safeName = subfolderName.replace(/'/g, "\\'");

//     // Consulta: Nombre exacto + tipo carpeta + dentro de la carpeta padre + no en papelera
//     const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeName}' and '${parentFolderId}' in parents and trashed = false`;

//     const response = await this.drive.files.list({
//       q: query,
//       supportsAllDrives: true,
//       includeItemsFromAllDrives: true,
//       fields: 'files(id, name, webViewLink)',
//     });

//     const files = response.data.files;
//     return files && files.length > 0 ? files[0] : null;
//   }
// }
