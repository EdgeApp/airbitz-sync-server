#!/usr/bin/env bash
while read line; do
   l2=$(echo "${line}" | sed -e 's/^[ \t]*//')
   echo "Adding repo: [${l2}]"
   node ../lib/createRepo.js ${l2}
done < addRepoList.txt