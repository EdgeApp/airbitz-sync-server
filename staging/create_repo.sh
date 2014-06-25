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
git update-server-info
cp /usr/share/git-core/templates/hooks/post-update.sample hooks/post-update
chmod a+x hooks/post-update
chown -R www-data:www-data .

echo "Created repo at ${REPO_DIR}"
