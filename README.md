# Documentación Técnica: `BackupService`

Servicio de NestJS encargado de gestionar y ejecutar la generación de respaldos (*dumps*) para motores de base de datos **MySQL** y **PostgreSQL** mediante ejecuciones de CLI nativas (`mysqldump` y `pg_dump`).

---

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