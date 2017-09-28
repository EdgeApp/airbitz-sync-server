#!/bin/bash
set -x
# Setup supervisord configuration
sudo supervisord
sleep 1s
sudo supervisorctl update

# Setup the local postgres server. Every sync-server runs its own postgres server.
sudo service postgresql start
sleep 1s
su postgres -c "psql -c \"create role airbitz with login password 'airbitz'\";"
su postgres -c "createdb -E UTF8 -T template0 syncserver"
su postgres -c "psql -d syncserver -c \"grant all privileges on database syncserver to airbitz\";"

# Update the virtualenv with dependencies and sync the django database
# RUN source /home/bitz/airbitz/ENV/bin/activate
pip install -r /home/bitz/code/airbitz-sync-server/staging/requirements.txt
python ./syncserver/manage.py migrate auth
python ./syncserver/manage.py migrate

# Run Couchdb
sudo couchdb start -b
sleep 1s
curl localhost:5984

# # From local dev machine
# rsync -a [user]@git1.airbitz.co:/etc/ssl/wildcard ~/ 
# rsync -av ~/wildcard [user]@git42.airbitz.co:
# rm -rf wildcard

# # From git42 VPS
# sudo mv ~/wildcard /etc/ssl/
# sudo chown -R root:root /etc/ssl/wildcard

# 		Change the /etc/apache2/envvars
		
# # Change the envvars
# sudo vi /etc/apache2/envvars 

# # Change the following to lines in envvars 
# export APACHE_RUN_USER=bitz
# export APACHE_RUN_GROUP=bitz

# mkdir -p /home/bitz/www/repos

# sudo rm /etc/apache2/sites-enabled/*.conf
# sudo cp /home/bitz/code/airbitz-sync-server/staging/apache/git-js.conf /etc/apache2/sites-enabled/

# # Test the configuration
# sudo apachectl -t
# # If all is well you can restart apache
# sudo service apache2 restart