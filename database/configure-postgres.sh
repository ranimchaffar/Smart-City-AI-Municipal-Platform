#!/bin/bash
set -e
echo "Configuring postgresql.conf..."
echo "listen_addresses = '*'" >> /etc/postgresql/14/main/postgresql.conf
echo "host all all 0.0.0.0/0 trust" >> /etc/postgresql/14/main/pg_hba.conf
echo "host all all ::/0 trust" >> /etc/postgresql/14/main/pg_hba.conf
service postgresql restart

IP=$(hostname -I | awk '{print $1}')
echo "WSL IP address is: $IP"
echo "PostgreSQL service status:"
service postgresql status
