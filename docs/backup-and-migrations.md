# Backups & Schema Migration History (On-Prem Ubuntu + Docker)

This repo currently uses a MariaDB container started via [docker-compose.yml](../docker-compose.yml).

You asked for:
- periodic database dumps (backups)
- a schema migration history to track schema changes
- a guide to run backups periodically on Ubuntu Server

## 1) Backup strategy (logical dumps)

### What this does
The script [scripts/db-backup.sh](../scripts/db-backup.sh) performs a **logical dump** (like `mysqldump`) from inside the running MariaDB container and stores it on the host as a compressed `.sql.gz` file.

Default output:
- directory: `/var/backups/resolution-bingo`
- filename: `resolution_bingo_YYYYmmdd_HHMMSS.sql.gz`
- retention: 14 days (configurable)

### Important limitation (no off-machine storage)
If the laptop’s disk dies or is stolen, local backups can be lost too. If you can later add an external USB disk (even without cloud), point `BACKUP_DIR` to that mount.

### Manual run
1. Ensure MariaDB is running:
   - `docker compose up -d mariadb`
2. Make the script executable:
   - `chmod +x scripts/db-backup.sh`
3. Run it:
   - `DB_PASSWORD=root BACKUP_DIR=./backups ./scripts/db-backup.sh`

### Restore from a backup
This restores the full database from a `.sql.gz` file:

- `gzip -dc /var/backups/resolution-bingo/resolution_bingo_20260107_031500.sql.gz | docker exec -i -e MYSQL_PWD=root studio-mariadb mariadb -uroot`

If you prefer to restore into a fresh DB name, create it first, then pipe into `mariadb -uroot <db>`.

## 2) Schema migration history

### What this does
The migration runner [scripts/db-migrate.ts](../scripts/db-migrate.ts):
- creates/uses a table named `schema_migrations`
- records each migration file’s checksum (SHA-256)
- refuses to run if an already-applied migration file was modified

Migration files live in [migrations/](../migrations) and are applied in lexicographic order.

### Commands
- `npm run db:status` — show applied/pending counts
- `npm run db:migrate` — apply pending migrations
- `npm run db:baseline` — mark migrations as applied **without executing SQL**

### Recommended workflow (given your current Docker init schema)
Your MariaDB image currently runs [scripts/mariadb-init/001-schema.sql](../scripts/mariadb-init/001-schema.sql) on first startup of an empty data directory.

That means the DB schema likely already exists on your Ubuntu laptop.

Do this once per environment:
1. Start MariaDB (existing volume):
   - `docker compose up -d mariadb`
2. Record the baseline migration without re-applying schema:
   - `npm run db:baseline`

From now on, **do not edit** already-applied migration files. Add new ones, e.g.:
- `migrations/0002_add_index_to_users.sql`

Then apply:
- `npm run db:migrate`

## 3) Periodic backups on Ubuntu Server (systemd timer)

### Files provided
- [scripts/systemd/resolution-bingo-db-backup.service](../scripts/systemd/resolution-bingo-db-backup.service)
- [scripts/systemd/resolution-bingo-db-backup.timer](../scripts/systemd/resolution-bingo-db-backup.timer)
- [scripts/backup.env.example](../scripts/backup.env.example)

### Setup steps on the Ubuntu Server laptop
Assumptions:
- repo is checked out at `/opt/resolution-bingo`
- you run Docker as root, or your user is in the `docker` group

1. Copy and edit the backup env file:
   - `cp /opt/resolution-bingo/scripts/backup.env.example /opt/resolution-bingo/backup.env`
   - edit `/opt/resolution-bingo/backup.env`

2. Make the backup script executable:
   - `chmod +x /opt/resolution-bingo/scripts/db-backup.sh`

3. Install the unit files:
   - `sudo cp /opt/resolution-bingo/scripts/systemd/resolution-bingo-db-backup.service /etc/systemd/system/`
   - `sudo cp /opt/resolution-bingo/scripts/systemd/resolution-bingo-db-backup.timer /etc/systemd/system/`

4. Enable + start the timer:
   - `sudo systemctl daemon-reload`
   - `sudo systemctl enable --now resolution-bingo-db-backup.timer`

5. Verify it’s scheduled:
   - `systemctl list-timers --all | grep resolution-bingo`

6. Run a one-off backup immediately:
   - `sudo systemctl start resolution-bingo-db-backup.service`

7. Inspect logs:
   - `journalctl -u resolution-bingo-db-backup.service --since today`
