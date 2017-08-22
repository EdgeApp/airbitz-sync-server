#!/bin/bash

if [[ $# != 2 ]]; then
    echo "$0 <base-path> <repo-name>"
    exit 1
fi

# Location where all the repos live
BASE_DIR=$1
mkdir -p ${BASE_DIR}
if [ $? -ne 0 ]; then
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
git config receive.denyDeletes true
git config receive.denyNonFastForwards true
rm -rf hooks
rm -f description
ln -s /etc/absync/hooks .
chown -R www-data:www-data .

echo "Created repo at ${REPO_DIR}"
