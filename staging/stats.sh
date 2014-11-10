#!/bin/bash

if [[ $# != 2 ]]; then
    echo "$0 <search-dir> <out-file>"
    exit 1;
fi

SEARCHDIR=$1
OUTFILE=$2

calc_repo_type() {
    if [[ $(find . -name Settings.json) ]]; then
        result='ACCOUNT'
    else
        result='WALLET'
    fi
}

log_account_creation() {
    echo account,$(git log --reverse --format='%ai' | head -1) >> $OUTFILE
}

log_wallet_creation() {
    echo wallet,$(git log --reverse --format='%ai' | head -1) >> $OUTFILE
}

log_txs() {
    for i in $(git log --name-only | grep Transaction | sed 's/-.*.json//' | sort | uniq); do 
        # check for internal first
        try_tx $i "int"
        if [[ $? != 0 ]]; then
            try_tx $i "ext"
        fi
    done
}

try_tx() {
    PREFIX=$1
    TYPE=$2
    RES=$(git log --format="%ai" --reverse -- "${PREFIX}-${TYPE}.json" 2>/dev/null | head -1)
    if [[ $? == 0 && -n $RES ]]; then
        echo transaction,$RES >> $OUTFILE
        return 0
    else
        return 1
    fi
}

# truncate $OUTFILE
echo "type,date" > $OUTFILE

# save start directory
CURDIR=$(pwd)

# Search repos
for i in $(find $SEARCHDIR -maxdepth 2 -mindepth 2); do
    cd $SEARCHDIR/$i
    calc_repo_type
    repo_type=$result
    echo $i, $repo_type
    if [[ "ACCOUNT" == $repo_type ]]; then
        log_account_creation
    else
        log_wallet_creation
        log_txs
    fi
    cd $CURDIR
done

