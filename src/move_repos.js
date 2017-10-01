/**
 * Created by paul on 6/19/17.
 */

const config = require('/etc/sync_repos.config.json')
const fs = require('fs')
const _getReposDir = require('./create_repo.js').getReposDir
const _getRepoPath = require('./create_repo.js').getRepoPath

const repos = require(config.userDir + config.failedRepos)

for (const n in repos) {
  const repoName = repos[n]
  const localPath = _getRepoPath(repoName)
  const newdir = _getReposDir() + '.bak/' + repoName
  try {
    fs.renameSync(localPath, newdir)
  } catch (e) {
    console.log (e)
  }
}
