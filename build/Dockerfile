FROM ubuntu:16.04

USER root

RUN apt-get update \
      && apt-get install -y sudo \
      && rm -rf /var/lib/apt/lists/*

# Create the app server user
RUN useradd -m -g users -G sudo -s /bin/bash -p bitz bitz

# Add user script
COPY ./adduserplus.sh /adduserplus.sh
COPY ./usersSSHkeys /usersSSHkeys
RUN chmod +x /adduserplus.sh
RUN /adduserplus.sh /usersSSHkeys

# Update /etc/hostname
RUN echo "git42" > /etc/hostname

# Install system dependencies
RUN sudo apt-get -y update
RUN sudo apt-get -y upgrade
RUN sudo apt-get install -y curl software-properties-common
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN sudo add-apt-repository ppa:couchdb/stable -y
RUN sudo apt-get -y update
RUN sudo apt-get -y upgrade
RUN sudo apt-get install -y couchdb nodejs git build-essential ufw apache2 supervisor python-pip python-dev python-virtualenv libncurses5-dev vim git fail2ban libpq-dev postgresql-9.5 rabbitmq-server -y

# Configure needed apache modules
RUN sudo a2enmod rewrite proxy proxy_http proxy_html cgid ssl status xml2enc

# Next we setup the app server. First we switch to the bitz user
RUN sudo su - bitz

# Copy the ~bitz/.ssh/id_ed25519 file from another git instance to this machine.
# If not, setup a new deploy key. This is a read-only key that has clone access from github.
# Generate the deploy key:  ssh-keygen -t ed25519
# Add $HOME/.ssh/id_ed25519.pub to the airbitz-sync-server project on github as a deploy key.

# Create the virtual environment
RUN mkdir -p /home/bitz/airbitz
RUN cd /home/bitz/airbitz
RUN virtualenv ENV

# Clone the code
RUN mkdir -p /home/bitz/code
RUN cd /home/bitz/code
RUN git clone git@github.com:Airbitz/airbitz-sync-server.git
RUN ln -s /home/bitz/code/airbitz-sync-server/syncserver /home/bitz/airbitz/ENV/airbitz

# Update the virtualenv with dependencies and sync the django database
RUN source /home/bitz/airbitz/ENV/bin/activate
RUN pip install -r /home/bitz/code/airbitz-sync-server/staging/requirements.txt
RUN cd /home/bitz/code/airbitz-sync-server/syncserver
RUN python manage.py migrate auth
RUN python manage.py migrate

# Setup the absync utility. The absync utility is called from git-hooks. When changes are pushed to git42.airbitz.co the post-receive hook is called and it calls absync.
RUN sudo mkdir -p /etc/absync
COPY ./absync.conf /etc/absync/absync.conf

# Install the git hooks
RUN sudo rsync -avz /home/bitz/code/airbitz-sync-server/staging/hooks /etc/absync/

# Copy sync utilities
RUN sudo cp /home/bitz/code/airbitz-sync-server/staging/create_repo.sh /usr/bin/create_ab_repo.sh
RUN sudo cp /home/bitz/code/airbitz-sync-server/staging/libgit2* /usr/lib
RUN sudo cp /home/bitz/code/airbitz-sync-server/staging/ab-sync /usr/bin/

# Setup supervisord configuration
RUN sudo cp /home/bitz/code/airbitz-sync-server/staging/supervisord/* /etc/supervisor/conf.d/
# Edit celeryd.conf and set SYNC_SERVER_URL to other servers
RUN cat /etc/supervisor/conf.d/celeryd.conf
# RUN sudo vi /etc/supervisor/conf.d/celeryd.conf
# RUN sudo supervisorctl update

#18 18 18 18 18 18 18 18 18 

# Install Node Modules
RUN sudo npm install -y forever forever-service -g
# run as user ‘bitz’
# RUN cd /home/bitz/code/airbitz-sync-server
# RUN npm install

# Setup the local postgres server
RUN sudo mkdir -p /var/run/postgresql

# Setup couchdb
RUN sudo mkdir -p /var/run/couchdb
RUN sudo chown -R couchdb:couchdb /usr/bin/couchdb /etc/couchdb /usr/share/couchdb /var/run/couchdb
RUN sudo chmod -R 0770 /usr/bin/couchdb /etc/couchdb /usr/share/couchdb

#Update /etc/hosts
# RUN sed '1c\127.0.0.1 git42.airbitz.co git42' /etc/hosts > /tmpfile
# RUN mv /tmpfile /etc/hosts

COPY ./run.sh /run.sh
RUN chmod +x /run.sh
CMD /run.sh