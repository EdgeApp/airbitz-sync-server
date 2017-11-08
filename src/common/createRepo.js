/**
 * Created by paul on 6/18/17.
 * @flow
 */

import fs from 'fs'
import mkdirp from 'mkdirp'
import { getRepoPath, easyEx } from './syncUtils.js'

export function createRepo (repo: string) {
  const fullPath = getRepoPath(repo)
  let stat = null

  try {
    stat = fs.statSync(fullPath)
    if (stat.isFile()) {
      console.log('File found in repo location')
      return -1
    }
  } catch (e) {
    // Directory doesn't exist
    console.log(fullPath + ' doesnt exist. Creating...')
  }

  if (stat === null) {
    try {
      mkdirp.sync(fullPath)
    } catch (e) {
      return -1
    }
  }

  try {
    easyEx(fullPath, 'git init --bare')
  } catch (e) {
    // don't care if this fails
  }

  try {
    easyEx(fullPath, 'git config --file config http.receivepack true')
    easyEx(fullPath, 'git config receive.denyDeletes true')
    easyEx(fullPath, 'git config receive.denyNonFastForwards true')
    easyEx(fullPath, 'rm -rf hooks')
    easyEx(fullPath, 'rm -f description')
    easyEx(fullPath, 'ln -s /etc/absync/hooks')
    // const cmd = sprintf('chown -R %s:%s .', config.user, config.group)
    // easyEx(fullPath, cmd)
  } catch (e) {
    console.log(e)
    return -1
  }

  return true
}
