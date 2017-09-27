#!/bin/bash

# Setup the local postgres server. Every sync-server runs its own postgres server.
# sudo su - postgres
# psql -c "create role airbitz with login password 'airbitz'";
# createdb -E UTF8 -T template0 syncserver
# psql -d syncserver -c "grant all privileges on database syncserver to airbitz";
# exit

# Run Couchdb
sudo couchdb start -b
sleep 1s
curl localhost:5984