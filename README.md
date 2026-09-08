# Documentación Técnica: `BackupService`

Servicio de **NestJS** encargado de gestionar y ejecutar la generación de respaldos (*dumps*) para motores de base de datos **MySQL** y **PostgreSQL** mediante ejecuciones de CLI nativas (`mysqldump` y `pg_dump`), coordinando además su almacenamiento local e integración con **Google Drive API**.

---

## Índice

- [Estructura y Configuración Inicial](#estructura-y-configuración-inicial)
  - [Tipos y DTOs](#tipos-y-dtos)
  - [Conexiones de Respaldo](#conexiones-de-respaldo)
- [Descripción General](#descripción-general)
- [Métodos del Servicio](#métodos-del-servicio)
  - [`constructor()`](#constructor)
  - [`generarBackup()`](#generarbackupcreatebackupdto-createbackupdto)
  - [Estructura de Retorno](#estructura-de-retorno)
- [Integración con Google Drive API](#integración-con-google-drive-api)
  - [1. Descargar Credenciales JSON](#1-descargar-credenciales-json)
  - [2. Configurar Carpeta en Google Drive](#2-configurar-carpeta-en-google-drive)

---

## Estructura y Configuración Inicial

### Tipos y DTOs

En la ruta `src/backup/dto/create-backup.dto.ts` se definen los tipos e interfaces requeridos:

```typescript
export enum DatabaseType {
  MySQL = 'mysql',
  Postgres = 'postgres',
  MariaDB = 'mariadb',
}

export class CreateBackupDto {
  type: DatabaseType;
  host: string;
  port: number;
  user: string;
  pass: string;
  database: string;
  targetFolder: string;
}
```

### Conexiones de Respaldo

Crea el archivo `src/data/conexion_backup.ts` para registrar la lista de credenciales y bases de datos a procesar:

```typescript
import { CreateBackupDto, DatabaseType } from "../backup/dto/create-backup.dto.js";

export const conexionesBackup: CreateBackupDto[] = [
  {
    type: DatabaseType.MySQL,
    host: "host",
    port: 3306,
    user: "mi_usuario",
    pass: "mi_password",
    database: "mi_db",
    targetFolder: "mi_subfolder"
  },
  {
    type: DatabaseType.MySQL,
    host: "host",
    port: 3306,
    user: "mi_usuario",
    pass: "mi_password",
    database: "mi_db",
    targetFolder: "mi_subfolder"
  }
];
```

---

## Descripción General

El servicio automatiza el ciclo de vida completo de los respaldos:

1. **Estructura de Almacenamiento:** Inicializa y organiza dinámicamente los directorios locales (`/storage/backups/<targetFolder>`).
2. **Nombrado Único:** Genera nombres de archivo basados en marcas temporales (formato ISO 8601 higienizado).
3. **Ejecución CLI:** Construye y ejecuta el comando de terminal según el motor seleccionado (`mysqldump` / `pg_dump`).
4. **Manejo de Fallos:** Elimina archivos residuales corruptos o incompletos si ocurre un error durante la generación.

---

## Métodos del Servicio

### `constructor()`

Asegura la existencia del directorio base global para los respaldos (`<root>/storage/backups`). Si la ruta no existe, la crea de forma recursiva al instanciar el servicio.

---

### `generarBackup(createBackupDto: CreateBackupDto)`

Ejecuta el proceso de volcado de la base de datos objetivo.

#### Parámetros
* `createBackupDto`: DTO con la configuración de conexión (`host`, `port`, `user`, `pass`, `database`, `type`, `targetFolder`).

#### Flujo de Ejecución
1. **Generación de Nombre:** Construye el nombre del archivo usando la plantilla `${database}-${timestamp}.sql`.
2. **Estructura de Carpetas:** Asigna `targetFolder` (o `database` por defecto) como subdirectorio y garantiza su existencia.
3. **Generación del Comando:**
   * **MySQL:** Ejecuta `mysqldump` redirigiendo la salida estándar al archivo local `.sql`.
   * **PostgreSQL:** Ejecuta `pg_dump` con formato plano (`-F p`) inyectando la variable de entorno `PGPASSWORD`.
4. **Procesamiento de Errores:** En caso de falla durante la ejecución del proceso hijo, elimina el archivo `.sql` incompleto (`fs.unlinkSync`) y relanza la excepción.

---

### Estructura de Retorno

```json
{
  "success": true,
  "message": "Backup generado correctamente",
  "path": "/app/storage/backups/audiid/audiid_gl_original-2026-09-07T18-30-00-000Z.sql",
  "fileName": "audiid_gl_original-2026-09-07T18-30-00-000Z.sql"
}
```

---

## Integración con Google Drive API

### 1. Descargar Credenciales JSON

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. En el menú lateral, navega a **IAM y Administración** $\rightarrow$ **Cuentas de Servicio**.
3. Haz clic en tu cuenta de servicio (o crea una nueva si no dispones de una).
4. Ve a la pestaña **Claves (Keys)**.
5. Haz clic en **Agregar clave** $\rightarrow$ **Crear clave nueva**.
6. Selecciona el formato **JSON** y descárgalo.
7. Renombra el archivo a `autentication_google.json` y ubícalo en la **raíz del proyecto**.

---

### 2. Configurar Carpeta en Google Drive

1. Inicia sesión en tu cuenta empresarial de Google Drive.
2. Crea una nueva carpeta destinada a los respaldos (ejemplo: `Respaldos_Sistema`).
3. Haz clic derecho sobre la carpeta $\rightarrow$ **Compartir**.
4. Pega el correo de tu cuenta de servicio (lo encuentras dentro de tu archivo JSON en el campo `client_email`, por ejemplo: `mi-servicio@tu-proyecto.iam.gserviceaccount.com`).
5. Asígnale el rol de **Editor** (o *Colaborador de contenido* si es una Unidad Compartida) y desmarca la notificación por correo.
6. Copia el ID de la carpeta desde la URL del navegador:
   ```text
   https://drive.google.com/drive/folders/1A2b3C4d5E6f7G8h9I0jKLMN
                                          └───────────┬───────────┘
                                                  FOLDER_ID
   ```
7. Crea un archivo `.env` en la raíz del proyecto y agrega la variable:
   ```env
   FOLDER_ID="1A2b3C4d5E6f7G8h9I0jKLMN"
   ```

> **Nota sobre herencia automática:** No es necesario otorgar permisos individuales a las subcarpetas creadas mediante código. Al especificar el `parentFolderId` (`parents: [FOLDER_ID]`), Google Drive hereda automáticamente el rol de Editor concedido en la carpeta principal.