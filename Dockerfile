FROM ubuntu:16.04

USER root

RUN apt-get update \
      && apt-get install -y sudo \
      && rm -rf /var/lib/apt/lists/*

# Create the app server user
RUN useradd -m -g users -G sudo -s /bin/bash -p bitz bitz

# Create working directory
RUN mkdir -p /home/bitz/code/airbitz-sync-server
WORKDIR /home/bitz/code/airbitz-sync-server

# Add user script
COPY ./build/adduserplus.sh ./build/adduserplus.sh
COPY ./build/usersSSHkeys ./build/usersSSHkeys
RUN chmod +x ./build/adduserplus.sh
RUN ./build/adduserplus.sh ./build/usersSSHkeys

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
RUN sudo apt-get install -y jq couchdb nodejs git build-essential ufw apache2 supervisor python-pip python-dev python-virtualenv libncurses5-dev vim git fail2ban libpq-dev postgresql-9.5 rabbitmq-server -y

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

# Change code path
RUN cd /home/bitz/code
RUN mkdir -p /home/bitz/airbitz/ENV/airbitz
RUN ln -s ./syncserver /home/bitz/airbitz/ENV/airbitz

# Setup the absync utility. The absync utility is called from git-hooks. When changes are pushed to git42.airbitz.co the post-receive hook is called and it calls absync.
RUN sudo mkdir -p /etc/absync
COPY ./build/absync.conf /etc/absync/absync.conf

# Install the git hooks
RUN mkdir -p ./staging
COPY ./staging ./staging
RUN sudo rsync -avz ./staging/hooks /etc/absync/

# Copy sync utilities
COPY ./staging/create_repo.sh /usr/bin/create_ab_repo.sh
RUN sudo cp ./staging/libgit2* /usr/lib
RUN sudo cp ./staging/ab-sync /usr/bin/

# Copy supervisord configuration
RUN sudo cp ./staging/supervisord/* /etc/supervisor/conf.d/

#18 18 18 18 18 18 18 18 18 

# Install Node Modules
RUN sudo npm install -y forever forever-service -g

# Clone package.json
COPY ./package.json ./package.json

# run as user ‘bitz’
RUN npm install

# Setup the local postgres server
RUN sudo mkdir -p /var/run/postgresql

# Setup couchdb
RUN sudo mkdir -p /var/run/couchdb
RUN sudo chown -R couchdb:couchdb /usr/bin/couchdb /etc/couchdb /usr/share/couchdb /var/run/couchdb
RUN sudo chmod -R 0770 /usr/bin/couchdb /etc/couchdb /usr/share/couchdb
COPY ./build/couchdbSettings.conf /etc/couchdb/local.ini

#Update /etc/hosts
# RUN sed '1c\127.0.0.1 git42.airbitz.co git42' /etc/hosts > /tmpfile
# RUN mv /tmpfile /etc/hosts
# Clone the code
COPY . .

COPY ./build/run.sh ./build/run.sh
RUN chmod +x ./build/run.sh
CMD ./build/run.sh