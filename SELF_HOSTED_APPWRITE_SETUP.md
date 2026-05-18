# Self-Hosted Appwrite — Guía de Instalación

## Resumen
- Costo: ~$5.50/mes (Hetzner CX22)
- Tiempo de setup: 30-45 minutos
- Dificultad: Media (básico de Docker y VPS)

## Requisitos previos
- Cuenta en Hetzner (u otro VPS)
- Dominio propio (ej. yaxsell.com)
- Cuenta en Cloudflare (gratis)

---

## Paso 1: Crear VPS en Hetzner

1. Ve a [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Crea un nuevo proyecto
3. "Add Server" → elige:
   - **Location**: Nuremberg o Falkenstein (Europa) o Ashburn (EE.UU. para latencia baja en Chile)
   - **Image**: Ubuntu 24.04
   - **Type**: CX22 (2 vCPU, 4GB RAM, 40GB SSD) — €5/mes
   - **SSH Key**: Agrega tu llave pública (recomendado)
   - **Hostname**: appwrite-server
4. Crea el server y espera 1-2 minutos

---

## Paso 2: Configurar DNS en Cloudflare

1. En Cloudflare, ve a tu dominio
2. Agrega un subdominio:
   - **Tipo**: A
   - **Nombre**: api (o appwrite)
   - **IP**: IP de tu VPS (ej. 167.235.123.45)
3. Espera propagación (1-5 minutos)

---

## Paso 3: Acceder al VPS

```bash
ssh root@TU_IP_VPS
```

O con tu llave:
```bash
ssh -i ~/.ssh/tu_llave root@TU_IP_VPS
```

---

## Paso 4: Instalar Docker y Docker Compose

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Verificar
docker --version
docker compose version
```

---

## Paso 5: Descargar docker-compose de Appwrite

```bash
# Crear directorio
mkdir -p /opt/appwrite
cd /opt/appwrite

# Descargar docker-compose oficial
curl -L https://appwrite.io/install/production/docker-compose.yml -o docker-compose.yml
```

---

## Paso 6: Crear archivo .env

```bash
nano .env
```

Copia y pega esto:

```env
# Appwrite
_APPWRITE_ABUSE_ENABLED=false
_APPWRITE_ABUSE_IP_MAX=100
_APPWRITE_ABUSE_IP_TIME_MINUTE=1
_APPWRITE_ABUSE_LIMIT_MINUTE=100
_APPWRITE_ABUSE_LIMIT_HOUR=1000
_APPWRITE_ABUSE_LIMIT_DAY=10000

_APPWRITE_CONSOLE_ABUSE_ENABLED=false
_APPWRITE_CONSOLE_ABUSE_IP_MAX=100
_APPWRITE_CONSOLE_ABUSE_IP_TIME_MINUTE=1
_APPWRITE_CONSOLE_ABUSE_LIMIT_MINUTE=100
_APPWRITE_CONSOLE_ABUSE_LIMIT_HOUR=1000
_APPWRITE_CONSOLE_ABUSE_LIMIT_DAY=10000

_APPWRITE_CONSOLE_ABUSE_RETRIES=5
_APPWRITE_CONSOLE_ABUSE_RETRY_DELAY=3000

_APPWRITE_ABUSE_RETRIES=5
_APPWRITE_RETRY_DELAY=5000

_APPWRITE_ENV=production
_APPWRITE_OPENSSL_KEY_V1=tu_clave_secreta_super_larga_min_32_chars
_APPWRITE_DOMAIN=http://TU_SUBDOMINIO
_APPWRITE_DOMAIN_TARGET=http://TU_SUBDOMINIO
_APPWRITE_DOMAIN_FUNCTIONS=http://TU_SUBDOMINIO
_APPWRITE_HEALTH_ENABLED=true

_APPWRITE_LOGGING_ENABLED=true
_APPWRITE_LOGGING_CONFIG=production

# Database
_APPWRITE_DB_HOST=mariadb
_APPWRITE_DB_PORT=3306
_APPWRITE_DB_USER=root
_APPWRITE_DB_PASS=tu_password_seguro_db
_APPWRITE_DB_SCHEMA=appwrite

# Redis
_APPWRITE_REDIS_HOST=redis
_APPWRITE_REDIS_PORT=6379

# SMTP (opcional, para emails)
_APPWRITE_SMTP_HOST=smtp.gmail.com
_APPWRITE_SMTP_PORT=587
_APPWRITE_SMTP_SECURE=tls
_APPWRITE_SMTP_USERNAME=tu_email@gmail.com
_APPWRITE_SMTP_PASSWORD=tu_app_password

# Storage
_APPWRITE_STORAGE_LIMIT=100
_APPWRITE_STORAGE_ANTIVIRUS_ENABLED=false
_APPWRITE_STORAGE_ANTIVIRUS_HOST=clamav
_APPWRITE_STORAGE_ANTIVIRUS_PORT=3310
_APPWRITE_STORAGE_DEVICE=s3
_APPWRITE_STORAGE_S3_ACCESS_KEY=tu_s3_access_key
_APPWRITE_STORAGE_S3_SECRET=tu_s3_secret_key
_APPWRITE_STORAGE_S3_BUCKET=tu_bucket
_APPWRITE_STORAGE_S3_REGION=us-east-1
_APPWRITE_STORAGE_S3_ENDPOINT=https://s3.amazonaws.com

# Cloudflare R2 (opcional, más barato que AWS S3)
# _APPWRITE_STORAGE_DEVICE=s3
# _APPWRITE_STORAGE_S3_ACCESS_KEY=tu_r2_access_key
# _APPWRITE_STORAGE_S3_SECRET=tu_r2_secret_key
# _APPWRITE_STORAGE_S3_BUCKET=tu_r2_bucket
# _APPWRITE_STORAGE_S3_REGION=auto
# _APPWRITE_STORAGE_S3_ENDPOINT=https://TU_ACCOUNT_ID.r2.cloudflarestorage.com
```

**Importante**: Reemplaza:
- `tu_clave_secreta_super_larga_min_32_chars` → genera algo aleatorio
- `TU_SUBDOMINIO` → `https://api.yaxsell.com` (o tu dominio)
- `tu_password_seguro_db` → password fuerte
- `tu_email@gmail.com` / `tu_app_password` → para emails (opcional)
- S3/R2 credentials → para storage de archivos (opcional, o usar local)

---

## Paso 7: Iniciar Appwrite

```bash
# Iniciar servicios
docker compose up -d

# Verificar que estén corriendo
docker compose ps

# Ver logs
docker compose logs -f
```

Espera 1-2 minutos para que todos los servicios inicien.

---

## Paso 8: Configurar SSL con Cloudflare

1. En Cloudflare, ve a tu subdominio (api.yaxsell.com)
2. Asegúrate que:
   - **Proxy status**: ☑️ Proxied (naranja)
   - **SSL/TLS**: Full (strict)
   - **Always Use HTTPS**: ☑️ On

---

## Paso 9: Acceder a la consola de Appwrite

Abre en tu navegador:
```
https://api.yaxsell.com
```

1. Crea tu cuenta admin
2. Crea un proyecto
3. Obtén:
   - Project ID
   - Database ID
   - API Key

---

## Paso 10: Migrar datos desde Appwrite Cloud

### Opción A: Exportar/Importar manual

1. En tu proyecto Cloud actual, exporta:
   - Database (collections + documents)
   - Storage (buckets + files)
2. En tu self-hosted, importa todo

### Opción B: Usar Appwrite CLI

```bash
# Instalar CLI en tu máquina local
npm install -g appwrite-cli

# Login al Cloud
appwrite login

# Exportar datos
appwrite get database --project-id TU_PROJECT_ID
appwrite list documents --database-id TU_DATABASE_ID --collection-id products

# Cambiar endpoint a tu self-hosted
appwrite client --endpoint https://api.yaxsell.com

# Importar datos
appwrite create database --project-id NUEVO_PROJECT_ID
```

---

## Paso 11: Actualizar tu proyecto Next.js

En `.env.local`:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://api.yaxsell.com
NEXT_PUBLIC_APPWRITE_PROJECT_ID=NUEVO_PROJECT_ID
NEXT_PUBLIC_APPWRITE_DATABASE_ID=NUEVO_DATABASE_ID
APPWRITE_API_KEY=NUEVA_API_KEY
```

---

## Paso 12: Backup automático (opcional pero recomendado)

```bash
# Crear script de backup
nano /opt/backup-appwrite.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups/appwrite
mkdir -p $BACKUP_DIR

# Backup de base de datos
docker exec appwrite-mariadb mysqldump -u root -ptu_password_seguro_db appwrite > $BACKUP_DIR/appwrite_db_$DATE.sql

# Backup de storage (si usas local)
tar -czf $BACKUP_DIR/appwrite_storage_$DATE.tar.gz /var/lib/docker/volumes/appwrite_uploads

# Mantener solo últimos 7 días
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completado: $DATE"
```

```bash
# Dar permisos
chmod +x /opt/backup-appwrite.sh

# Agregar al crontab (backup diario a las 3 AM)
crontab -e
# Agregar línea:
0 3 * * * /opt/backup-appwrite.sh >> /var/log/appwrite-backup.log 2>&1
```

---

## Paso 13: Monitoreo básico

```bash
# Ver logs
docker compose logs -f

# Ver uso de recursos
htop

# Ver espacio en disco
df -h

# Ver uso de Docker
docker stats
```

---

## Troubleshooting

### Appwrite no inicia
```bash
# Ver logs
docker compose logs appwrite

# Reiniciar
docker compose restart
```

### Error de conexión
- Verifica que Cloudflare esté en modo proxy (naranja)
- Verifica que el firewall del VPS permita puertos 80/443

### Base de datos no conecta
```bash
# Ver logs de MariaDB
docker compose logs mariadb
```

---

## Costos mensuales

| Servicio | Costo |
|---|---|
| Hetzner CX22 | €5 (~$5.50) |
| Cloudflare | $0 |
| Appwrite | $0 (open source) |
| **Total** | **~$5.50/mes** |

vs **$25/mes** del Cloud Pro — **ahorras $19.50/mes**.

---

## Seguridad adicional

1. **Firewall UFW**:
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

2. **Solo acceso SSH con llave** (deshabilitar password)
3. **Actualizaciones automáticas**:
```bash
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades
```

---

## Soporte

- Documentación oficial: https://appwrite.io/docs
- Comunidad: https://appwrite.io/threads
- GitHub: https://github.com/appwrite/appwrite
