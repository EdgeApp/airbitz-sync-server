# Sync Server

This is a simple rest API to create new repos. The django apps calls
`node lib/createRepo.js`. 

# JS Helper scripts

Install Nodejs minimum version 8.5 and npm 5.3

    sudo apt-get update
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install nodejs

Install

    npm i
    cp syncConfig.json /etc/syncConfig.json

Edit `/etc/syncConfig.json` and change the paths appropriately

You will have several utility scripts build inside the `lib` directory

Create a GIT repo given the 256bit base 16 repoName

    node lib/createRepo.js [repoName]

Delete entries in the sync database for a specific GIT server. This does not delete the actual repos but just the CouchDB entries which determine if the repo needs to be synced from a particular server

    node lib/deleteServer.js [server name]

Update a specific repos hash for a specific server in CouchDB

    node lib/updateHash.js [server] [repo] [hash]

## The following should be run as background services

These should be run in the background using a daemon such as `forever-service`

Loop over all repos and update the DB with their current hash.

    node lib/updateReposHashes.js

This is the most important script in this repo. This script will run in the background and query CouchDB looking for repos in remote servers that need to be sync'ed with the local server. Must be run as a service in the background

    node lib/syncRepos.js

Prune Auth server backups. This will loop and prune excessive backups

    node lib/pruneBackups.js

Update list of servers in pool. This adds the current server to the pool if not already there and adds other servers to replication.

    node lib/updateServers.js

### Run all the background scripts using `forever-service`

    cd /home/bitz/code/airbitz-sync-server/lib
    sudo forever-service install fixStuck -r bitz --script fixStuck.js  --start
    sudo forever-service install gcRepos -r bitz --script gcRepos.js  --start
    sudo forever-service install syncRepos -r bitz --script syncRepos.js  --start
    sudo forever-service install pruneBackups -r bitz --script pruneBackups.js  --start
    sudo forever-service install updateServers -r bitz --script updateServers.js  --start

### Delete the background daemons

    sudo forever-service delete syncRepos
    sudo forever-service delete fixStuck
    sudo forever-service delete gcRepos
    sudo forever-service delete pruneBackups
    sudo forever-service delete updateServers

### Restart the background process scripts

    sudo service syncRepos restart
    sudo service fixStuck restart
    sudo service gcRepos restart
    sudo service pruneBackups restart
    sudo service updateServers restart
    sudo systemctl restart couchdb
