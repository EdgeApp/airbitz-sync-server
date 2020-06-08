/**
 * Created by paul on 6/18/17.
 * @flow
 */

const util = require('util')
const fs = require('fs')
const mkdirp = require('mkdirp')
const { getRepoPath, easyExAsync } = require('./syncUtils.js')

// $FlowFixMe
const fsstat = util.promisify(fs.stat)
// $FlowFixMe
const mkdirpp = util.promisify(mkdirp)

async function createRepo(repo: string) {
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
    // const cmd = sprintf('chown -R %s:%s .', config.user, config.group)
    // easyEx(fullPath, cmd)
  } catch (e) {
    console.log(e)
    return -1
  }

  return true
}

module.exports = { createRepo }
