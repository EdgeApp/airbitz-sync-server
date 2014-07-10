#!/bin/bash

if [[ $# != 2 ]]; then
    echo "$0 <base-path> <repo-name>"
    exit 1
fi

# Location where all the repos live
BASE_DIR=$1
mkdir -p ${BASE_DIR}
if [ $? -ne 0 ]; then
    echo "Unable to create repos directory"
    exit 1
fi

# Strip off any funny business
REPO_NAME=$(basename $2)
REPO_DIR=${BASE_DIR}/${REPO_NAME:0:2}/${REPO_NAME}

echo "Setting up directories"
mkdir -p $REPO_DIR
if [ $? -ne 0 ]; then
    echo "Unable to create ${REPO_DIR}"
    exit 1
fi

echo "Creating repos"
cd ${REPO_DIR}

git init --bare 
git config --file config http.receivepack true
chown -R www-data:www-data .

echo "Created repo at ${REPO_DIR}"
