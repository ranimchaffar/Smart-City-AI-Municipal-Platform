#!/bin/bash
set -e
echo "Updating package lists..."
apt-get update -qq
echo "Installing PostgreSQL..."
apt-get install -y -qq postgresql postgresql-contrib
echo "Starting PostgreSQL service..."
service postgresql start

echo "Configuring postgres user and municipal_tickets database..."
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""
su - postgres -c "psql -c \"CREATE DATABASE municipal_tickets;\" || true"
su - postgres -c "psql -d municipal_tickets -c \"CREATE EXTENSION IF NOT EXISTS \\\"uuid-ossp\\\";\" || true"

# Allow local connections with password or md5/trust for localhost
PG_HBA="/etc/postgresql/14/main/pg_hba.conf"
if [ -f "$PG_HBA" ]; then
    sed -i 's/local   all             postgres                                peer/local   all             postgres                                trust/' "$PG_HBA"
    sed -i 's/host    all             all             127.0.0.1\/32            scram-sha-256/host    all             all             127.0.0.1\/32            trust/' "$PG_HBA"
    sed -i 's/host    all             all             ::1\/128                 scram-sha-256/host    all             all             ::1\/128                 trust/' "$PG_HBA"
    service postgresql reload
fi

echo "PostgreSQL is ready!"
su - postgres -c "psql -d municipal_tickets -c 'SELECT version();'"
