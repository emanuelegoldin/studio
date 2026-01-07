#!/usr/bin/env bash
set -euo pipefail

# MariaDB backup script (logical dump)
#
# Default behavior:
# - dumps the `resolution_bingo` database from the running container
# - compresses to .sql.gz
# - keeps backups for N days (default 14)
#
# Expected to be run on the Docker host (Ubuntu Server laptop).

CONTAINER_NAME="${MARIADB_CONTAINER_NAME:-studio-mariadb}"
DB_NAME="${DB_NAME:-resolution_bingo}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/resolution-bingo}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

timestamp="$(date -u +"%Y%m%d_%H%M%S")"
backup_file="${BACKUP_DIR}/${DB_NAME}_${timestamp}.sql.gz"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

mkdir -p "$BACKUP_DIR"

# Sanity: container must exist
if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "ERROR: container '$CONTAINER_NAME' is not running." >&2
  echo "Hint: start it with: docker compose up -d mariadb" >&2
  exit 1
fi

# Use MYSQL_PWD to avoid putting the password into the command line args.
dump_path="$tmp_dir/dump.sql.gz"

docker exec -e MYSQL_PWD="$DB_PASSWORD" "$CONTAINER_NAME" \
  mariadb-dump \
    -u"$DB_USER" \
    --single-transaction \
    --quick \
    --routines \
    --events \
    --triggers \
    --databases "$DB_NAME" \
  | gzip -c > "$dump_path"

if [[ ! -s "$dump_path" ]]; then
  echo "ERROR: backup dump produced an empty file." >&2
  exit 1
fi

mv "$dump_path" "$backup_file"

echo "Backup written: $backup_file"

# Rotate old backups
if [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -print -delete || true
else
  echo "WARN: BACKUP_RETENTION_DAYS is not a number; skipping rotation." >&2
fi
