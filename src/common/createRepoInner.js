/**
 * Created by paul on 6/18/17.
 * @flow
 */

import fs from 'fs'
import mkdirp from 'mkdirp'
import util from 'util'

import { easyExAsync, getRepoPath } from './syncUtils.js'

const fsstat = util.promisify(fs.stat)
const mkdirpp = util.promisify(mkdirp)

export async function createRepo(repo: string) {
  const fullPath = getRepoPath(repo)
  let stat = null

  try {
    stat = await fsstat(fullPath)
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
      await mkdirpp(fullPath)
    } catch (e) {
      return -1
    }
  }

  try {
    await easyExAsync(fullPath, 'git init --bare')
  } catch (e) {
    // don't care if this fails
  }

  try {
    await easyExAsync(
      fullPath,
      'git config --file config http.receivepack true'
    )
    await easyExAsync(fullPath, 'git config receive.denyDeletes true')
    await easyExAsync(fullPath, 'git config receive.denyNonFastForwards true')
    await easyExAsync(fullPath, 'rm -rf hooks')
    await easyExAsync(fullPath, 'rm -f description')
    await easyExAsync(fullPath, 'ln -s /etc/absync/hooks')
    // const cmd = `chown -R ${config.user}:${config.group} .`
    // easyEx(fullPath, cmd)
  } catch (e) {
    console.log(e)
    return -1
  }

  return true
}
