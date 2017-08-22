/**
 * Created by paul on 6/18/17.
 */
const fs = require('fs')
const mkdirp = require('mkdirp')
const sprintf = require('sprintf-js').sprintf
const childProcess = require('child_process')
const config = require('/etc/sync_repos.config.json')
const rootDir = config.userDir + config.reposDir

function getRepoPath (repo) {
  const fullPath = rootDir + '/' + repo.slice(0, 2) + '/' + repo
  return fullPath
}

function getRepoSubdir (repo) {
  const fullPath = rootDir + '/' + repo.slice(0, 2)
  return fullPath
}

function getReposDir () {
  return rootDir
}

function createRepo (repo) {
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

function easyEx (path, cmdstring) {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)
  const r = childProcess.execFileSync(cmd, args, { timeout: 20000, cwd: path, killSignal: 'SIGKILL' })
  return r
}

// createRepo('12lakjaweoigjaoewigjaogji')
module.exports.createRepo = createRepo
module.exports.getRepoPath = getRepoPath
module.exports.getRepoSubdir = getRepoSubdir
module.exports.getReposDir = getReposDir
