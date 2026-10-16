#!/bin/bash
pg_ctlcluster 14 main start || true
su - postgres -c "psql -d municipal_tickets -c 'SELECT 1 as connected;'"
netstat -tulpn | grep 5432 || ss -tulpn | grep 5432
