/**
 * Created by paul on 6/19/17.
 */

const fs = require('fs')
const _getReposDir = require('./create_repo.js').getReposDir
const _getRepoPath = require('./create_repo.js').getRepoPath

const repos = [
  '1195d71f523efde4a71d7b821b8d3451fdb9c906',
  '4430a860701aa001de5618e857a156f05adfda4d',
  '4e9c7d2399806539660e280e73ca3ba2453aac4d',
  '4ed60e26f3b12e67736314d98882ac0eeeb82726',
  '6103d9dd4421ef9f12f088e16056943795701b2a',
  '96f1106e9a47db3d5339c2c51d9ecfd1ec297654',
  'c688ffabb999255c3c5b234812e4f123029f80f6',
  'c7f34e60ce7d75b587dbe5ee9848b2fbec29b1e8',
  'e57d75c768d462b19c365f9a9f47d80fb1051551',
  'f01fdafd6d14dbf6f9bf971a381f6216dfa24de3',
  'f40c0d111198c76b6ed29f1d19119d79321097a1'
]

for (const n in repos) {
  const repoName = repos[n]
  const localPath = _getRepoPath(repoName)
  const newdir = _getReposDir() + '.bak/' + repoName
  fs.renameSync(localPath, newdir)
}
