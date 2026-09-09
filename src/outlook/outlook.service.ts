import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import path from 'path';
@Injectable()
export class OutlookService {
  private graphClient: Client;
  private userId: string;
  constructor(private configService: ConfigService) {
    this.userId = this.configService.get<string>('MICROSOFT_USER_ID') || '';

    const credential = new ClientSecretCredential(
      this.configService.get<string>('AZURE_TENANT_ID') || '',
      this.configService.get<string>('AZURE_CLIENT_ID') || '',
      this.configService.get<string>('AZURE_CLIENT_SECRET') || '',
    );

    this.graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(
            'https://graph.microsoft.com/.default',
          );
          return token.token;
        },
      },
    });
  }
  async crear_archivo(localFilePath: string, subfolder: string) {
    const folder = this.configService.get<string>('FOLDER_OUTLOOK') || '';
    try {
      // lo primero es verificar si existe o no el folder
      const carpetaExistente = await this.obtenerOCrearSubfolder(
        subfolder,
        'Backups(AWS)',
      );

      if (!fs.existsSync(localFilePath)) {
        throw new Error(`El archivo no existe en la ruta: ${localFilePath}`);
      }
      console.log(`Carpeta "${carpetaExistente.id}"`);
      // 3. Leer el archivo local como Buffer
      const fileBuffer = fs.readFileSync(localFilePath);
      const fileName = path.basename(localFilePath);
      const stats = fs.statSync(localFilePath);
      const fileSize = stats.size;
      // verificar el peso para subir por partes el chunk de datos
      if (fileSize < 4 * 1024 * 1024) {
        const endpoint = `/users/${this.userId}/drive/items/${carpetaExistente.id}:/${fileName}:/content`;
        const response = await this.graphClient
          .api(endpoint)
          .header('Content-Type', 'application/octet-stream')
          .put(fileBuffer);

        console.log(
          `Archivo "${fileName}" subido con éxito. ID: ${response.id}`,
        );
        return response;
      } else {
        const endpointSession = `/users/${this.userId}/drive/items/${carpetaExistente.id}:/${fileName}:/createUploadSession`;
        const uploadSession = await this.graphClient.api(endpointSession).post({
          item: {
            '@microsoft.graph.conflictBehavior': 'replace', // Reemplaza si ya existe
          },
        });
        const uploadUrl = uploadSession.uploadUrl;
        const minChunkSize = 320 * 1024;
        const readStream = fs.createReadStream(localFilePath, {
          highWaterMark: minChunkSize,
        });
        let counter = 0;
        for await (const chunk of readStream) {
          const chunkLength = chunk.length;
          const start = counter;
          const end = counter + chunkLength - 1;
          counter += chunkLength;

          await this.graphClient
            .api(uploadUrl)
            .header('Content-Length', chunkLength)
            .header('Content-Range', `bytes ${start}-${end}/${fileSize}`)
            .put(chunk);
        }
        console.log(`Archivo "${fileName}" subido con éxito en fragmentos.`);
      }
    } catch (error) {
      console.error('Error en OneDriveService1:', error);
    }
  }

  async obtenerOCrearSubfolder(
    subfolderName: string,
    parentFolderPath = 'root',
  ) {
    try {
      // 1. Buscar si la carpeta ya existe
      const carpetaExistente = await this.buscarFolder(
        subfolderName,
        parentFolderPath,
      );
      if (carpetaExistente) {
        // console.log(`La carpeta "${subfolderName}" ya existe con ID: ${carpetaExistente.id}`);
        return carpetaExistente;
      }

      // 2. Si no existe, crear la carpeta
      const endpoint =
        parentFolderPath === 'root'
          ? `/users/${this.userId}/drive/root/children`
          : `/users/${this.userId}/drive/root:/${parentFolderPath}:/children`;

      const response = await this.graphClient.api(endpoint).post({
        name: subfolderName,
        folder: {}, // Indica que es un directorio
        '@microsoft.graph.conflictBehavior': 'fail',
      });

      // console.log(`Carpeta "${subfolderName}" creada con ID: ${response.id}`);
      return response;
    } catch (error) {
      console.error('Error en OneDriveService:', error);
      // throw new InternalServerErrorException(`Error en OneDrive: ${error.message}`);
    }
  }

  private async buscarFolder(folderName: string, parentFolderId: string) {
    const endpoint =
      parentFolderId === 'root'
        ? `/users/${this.userId}/drive/root/children`
        : `/users/${this.userId}/drive/root:/${parentFolderId}:/children`;

    const result = await this.graphClient
      .api(endpoint)
      .filter(`name eq '${folderName}'`)
      .get();

    return result.value && result.value.length > 0 ? result.value[0] : null;
  }
}

