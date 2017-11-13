/**
 * Created by paul on 6/19/17.
 * @flow
 */

import fs from 'fs'
import { getReposDir, getRepoPath, getConfig } from './common/syncUtils.js'

const config = getConfig()
// $FlowFixMe
const repos = require(config.userDir + config.failedRepos)

for (const n in repos) {
  const repoName = repos[n]
  const localPath = getRepoPath(repoName)
  const newdir = getReposDir() + '.bak/' + repoName
  try {
    fs.renameSync(localPath, newdir)
  } catch (e) {
    console.log(e)
  }
}
