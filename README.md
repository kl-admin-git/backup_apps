# Documentación Técnica: `BackupService`

Servicio de NestJS encargado de gestionar y ejecutar la generación de respaldos (*dumps*) para motores de base de datos **MySQL** y **PostgreSQL** mediante ejecuciones de CLI nativas (`mysqldump` y `pg_dump`).

---
## Carpeta adecional a crear

1 . dentro de src crea la carpeta data/conexion_backup.ts y crea el archivo como aparece acontinuacion
```typescript
import { CreateBackupDto, DatabaseType } from "../backup/dto/create-backup.dto.js";


export const conexionesBackup:CreateBackupDto[] = [
  {
    "type": DatabaseType.MySQL,
    "host": "host",
    "port": 3306,
    "user": "mi_usuario",
    "pass": "mi_password",
    "database": "mi_db",
    "targetFolder": "mi_subfolder"
  },
  {
    "type": DatabaseType.MySQL,
    "host": "host",
    "port": 3306,
    "user": "mi_usuario",
    "pass": "mi_password",
    "database": "mi_db",
    "targetFolder": "mi_subfolder"
  }
]
```
dentro de la carpeta src/backup/dto/create-backup.dto se encuentran los tipos para asignar 
```typescript
export enum DatabaseType {
  MySQL = 'mysql',
  Postgres = 'postgres',
  MariaDB = 'mariadb',
}
```
## Descripción General

El servicio automatiza el ciclo de vida de los backups:

1. **Estructura de almacenamiento:** Inicializa y organiza dinámicamente los directorios locales (`/storage/backups/<targetFolder>`).
2. **Nombrado único:** Genera nombres de archivo basados en marca temporal (formato ISO 8601 higienizado).
3. **Ejecución CLI:** Construye y ejecuta el comando de terminal correspondiente al motor seleccionado.
4. **Manejo de fallos:** Limpia archivos residuales corruptos e incompletos si ocurre un error durante la generación.

---

## Métodos

### `constructor()`

Asegura la existencia del directorio base global de respaldos (`process.cwd() + '/storage/backups'`). Si no existe, lo crea de forma recursiva al instanciar el servicio.

---

### `generarBackup(createBackupDto: CreateBackupDto)`

Ejecuta el proceso de volcado de la base de datos objetivo.

#### Parámetros
* `createBackupDto`: DTO con la configuración de conexión (`host`, `port`, `user`, `pass`, `database`, `type`, `targetFolder`).

#### Flujo de Ejecución

* **Generación de Nombre:** Construye el nombre del archivo usando la plantilla `${database}-${timestamp}.sql`.
* **Estructura de Carpetas:** Asigna `targetFolder` (o la propiedad `database` por defecto) como subdirectorio y garantiza su existencia.
* **Generación del Comando:**
  * `DatabaseType.MySQL`: Ejecuta `mysqldump` redirigiendo la salida estándar al archivo local.
  * `DatabaseType.Postgres`: Ejecuta `pg_dump` con formato plano (`-F p`) inyectando la variable `PGPASSWORD`.
* **Procesamiento de Errores:** En caso de falla durante la ejecución del proceso hijo, elimina el archivo `.sql` incompleto (`fs.unlinkSync`) y relanza la excepción.

---

## Estructura de Retorno

```json
{
  "success": true,
  "message": "Backup generado correctamente",
  "path": "/app/storage/backups/audiid/audiid_gl_original-2026-09-07T18-30-00-000Z.sql",
  "fileName": "audiid_gl_original-2026-09-07T18-30-00-000Z.sql"
}
```



## Configuración e Integración con Google Drive API

### 1. Descargar el archivo JSON de Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. En el menú lateral, navega a **IAM y administración** $\rightarrow$ **Cuentas de servicio**.
3. Haz clic en tu cuenta de servicio (o crea una nueva si no dispones de una).
4. Ve a la pestaña **Claves (Keys)**.
5. Haz clic en **Agregar clave** $\rightarrow$ **Crear clave nueva**.
6. Selecciona el formato **JSON** y descárgalo.
7. cambia su nombre y copialo en la carpeta raiz src `autentication_google.json` con el contenido de este nuevo archivo.


## Crear y compartir la carpeta en Google Drive Empresarial

1. Inicia sesión en tu cuenta institucional/empresarial de Google Drive.
2. Ve a Unidades compartidas y crea una nueva carpeta destinada a los respaldos (ejemplo: Respaldos_Sistema).
3. Haz clic derecho sobre la carpeta -> Compartir.
4. Pega el correo de tu cuenta de servicio (lo encuentras dentro de tu archivo JSON en el campo client_email, por ejemplo: mi-servicio@tu-proyecto.iam.gserviceaccount.com).
5. Asígnale el rol de Editor (o Colaborador de contenido si es una Unidad Compartida) y desmarca la notificación por correo.Copia el ID de la carpeta desde la URL del navegador: https://drive.google.com/drive/folders/1A2b3C4d5E6f7G8h9I0jKLMN
6. crear el archivo .env y agrega FOLDER_ID="1A2b3C4d5E6f7G8h9I0jKLMN"
7. Herencia automática: No es necesario otorgar permisos individuales a las subcarpetas que crees mediante código. Al pasar el parentFolderId (parents: [FOLDER_ID]), Google Drive hereda automáticamente el rol de Editor concedido en la carpeta principal.