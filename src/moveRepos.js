/**
 * Created by paul on 6/19/17.
 * @flow
 */

import { getConfig, moveRepoToBackup } from './common/syncUtils.js'

const config = getConfig()
// $FlowFixMe
const repos = require(config.userDir + config.failedRepos)

for (const repo of repos) {
  moveRepoToBackup(repo)
}
