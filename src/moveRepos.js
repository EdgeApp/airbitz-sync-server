/**
 * Created by paul on 6/19/17.
 * @flow
 */

import { getConfig, moveRepoToBackup } from './common/syncUtils.js'

const config = getConfig()

export async function moveRepos() {
  // $FlowFixMe
  const failMap = require(config.userDir + config.failedRepos)

  for (const repo in failMap) {
    if (failMap[repo] > 10) {
      moveRepoToBackup(repo)
    }
  }
}
