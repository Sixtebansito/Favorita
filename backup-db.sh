#!/bin/bash
# Script para hacer backup de la base de datos de Prisma (Neon Postgres)

if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL no está definido en el archivo .env"
  exit 1
fi

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="backup-${DATE}.sql"

echo "Iniciando backup de la base de datos..."
# pg_dump requires the connection string.
pg_dump "$DATABASE_URL" -F c -f "$FILENAME"

if [ $? -eq 0 ]; then
  echo "Backup completado exitosamente: $FILENAME"
else
  echo "Error al hacer el backup. Asegúrate de tener pg_dump instalado y acceso a la base de datos."
fi
