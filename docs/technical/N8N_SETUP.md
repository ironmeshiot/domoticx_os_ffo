# Levantar n8n con Docker Compose

Este documento explica cómo levantar una instancia de n8n (automatizaciones) usando Docker Compose y Postgres como base de datos.

Requisitos
- Docker y Docker Compose instalados en la máquina.

Pasos rápidos

1. Copiar el archivo de ejemplo de variables de entorno y editarlo:

```powershell
copy .env.n8n.example .env.n8n
# Editar .env.n8n para cambiar contraseñas y parámetros
```

2. Levantar los servicios:

```powershell
docker compose -f docker-compose.n8n.yml --env-file .env.n8n up -d
```

3. Abrir en el navegador:

http://localhost:5678

Notas de seguridad
- Si exponés n8n en red pública, usá un reverse proxy (Traefik, Nginx) con HTTPS.
- No dejés las credenciales por defecto en producción.
- Hacé copias de seguridad del volumen `n8n_data` y de la base de datos.

Comprobaciones
- Ver logs:

```powershell
docker compose -f docker-compose.n8n.yml logs -f n8n
```

- Conectarse a la base de datos desde el contenedor `db` para comprobar tablas.

Extensiones y siguientes pasos
- Integrar con DomoticX vía Webhooks, MQTT o llamadas HTTP.
- Crear workflows de ejemplo y exportarlos para versionado.

Verificaciones rápidas

- Listar contenedores y comprobar estado:

```powershell
docker compose -f docker-compose.n8n.yml ps
```

- Ver puertos y comprobar que 5678 está en uso (Windows PowerShell):

```powershell
Get-NetTCPConnection -LocalPort 5678
```

- Comprobar que la base de datos tiene tablas creadas (con `psql` dentro del contenedor):

```powershell
docker compose -f docker-compose.n8n.yml exec db psql -U ${DB_POSTGRES_USER} -d ${DB_POSTGRES_DB} -c "\d"
```

Backup rápido de los volúmenes (ejemplo):

```powershell
docker run --rm -v domoticx_os_ffo_n8n_data:/data -v ${PWD}:/backup alpine sh -c "cd /data && tar czf /backup/n8n_data_$(Get-Date -Format yyyyMMdd).tgz ."
```

Problemas comunes
- Si n8n no arranca, revisá los logs con `docker compose -f docker-compose.n8n.yml logs -f n8n`.
- Si obtenés error de conexión a Postgres, verificá credenciales en `.env.n8n` y que el contenedor `db` esté corriendo.

