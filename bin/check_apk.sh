#!/bin/bash

set -u
set -e

CURRENT_DIR=$( /bin/pwd )

#if [[ $# -lt 1 ]]; then
#    echo "$0 <expected-checksum> <optional:etag>"
#    exit 1
#fi

ETAG=${1}
EXPECTED=$( cat ${HOME}/apkhash )
REMOTE=https://airbitz.co/download
#REMOTE=https://airbitz.co/download/airbitz-2.3.3-2016112602.apk
DEST=/tmp/airbitz-android.apk

curl -f -L -s -o $DEST $REMOTE
CHECKSUM=$(shasum -a 256 $DEST | awk '{print $1}')
if [[ $EXPECTED != $CHECKSUM ]]; then
    date
    echo "Checksum failed"
    echo "Expected: ${EXPECTED}"
    echo "Found: ${CHECKSUM}"
    ssendmail -oi -t << EOF
From: admin@airbitz.co
To: Tim Horton <tim@airbitz.co>,  Paul Puey <paul@airbitz.co>, William Swanson <william@airbitz.co>
Content-Type: text/html; charset="UTF-8"
Subject: Urgent: APK Mismatch detected by `hostname`

<p>
There is an APK mismatch detected by `hostname`.
</p>
URL: <a href="$REMOTE">$REMOTE</a><br />
Expected: <b>${EXPECTED}</b><br />
Found: <b>${CHECKSUM}.</b><br /><br />

<p>
Please investigate!
</p>

<p>
Airbitz
</p>
EOF
else
    OUTPUT=$( date ; echo ": all good: ${EXPECTED}" )
    echo ${OUTPUT}
fi

