/**
 * Created by paul on 6/18/17.
 */
const fs = require('fs')
const nano = require('nano')('http://bitz:pillow_butt_plug@git2.airbitz.co:5984')
const sprintf = require('sprintf-js').sprintf
const childProcess = require('child_process')
const config = require('/etc/sync_repos.config.json')
const servers = require('/etc/absync/absync.json')

const _getRepoPath = require('./create_repo.js').getRepoPath
const _createRepo = require('./create_repo.js').createRepo
const _writeDb = require('./update_hash.js').writeDb
const _dbRepos = nano.db.use('db_repos')

console.log(dateString() + '*** sync_repos2.js starting ***')

// const _rootDir = config.userDir + config.reposDir

// const snooze = ms => new Promise(resolve => setTimeout(resolve, ms))

const hostname = easyEx(null, 'hostname')
// const hostname = 'git2.airbitz.co'
const hostArray = hostname.split('.')
let host = hostArray[0]
host = host.replace(/(\r\n|\n|\r)/gm, '')

main()

function main () {
  _dbRepos.view('repos', host, null, (err, doc) => {
    if (err === null) {
      asyncMain(doc)
    }
  })
}

async function asyncMain (doc) {
  const array = doc.rows

  for (const n in array) {
    const diff = array[n]
    console.log('Syncing repo %d of %d', n, array.length)

    for (const s in servers) {
      if (getServer(host) !== servers[s]) {
        await pullRepoFromServer(diff.id, servers[s])
      }
    }
  }
}

function getServer (prefix) {
  for (const n in servers) {
    if (servers[n].lastIndexOf(prefix + '.', 0) === 0) {
      return servers[n]
    }
  }
  return -1
}

function easyEx (path, cmdstring) {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)
  const r = childProcess.execFileSync(cmd, args, { encoding: 'utf8', timeout: 20000, cwd: path, killSignal: 'SIGKILL' })
  return r
}

async function pullRepoFromServer (repoName, server) {
  const date = new Date()
  const serverPath = config.serverPrefix + server + '/repos/' + repoName
  const localPath = _getRepoPath(repoName)
  const log = sprintf('%s:%s pullRepoFromServer:%s %s', date.toDateString(), date.toTimeString(), server, repoName)
  console.log(log)

  _createRepo(repoName)

  const status = {'branch': false, 'absync': false, 'find': false, 'push': false, 'writedb': false}

  try {
    easyEx(localPath, 'git branch -D incoming')
    status.branch = true
  } catch (e) {
  }

  let retval = ''
  try {
    let cmd = sprintf('ab-sync %s %s', localPath, serverPath)
    easyEx(localPath, cmd)
    status.absync = true

    retval = easyEx(localPath, 'find objects -type f')
    status.find = true

    if (retval.length > 0) {
      cmd = sprintf('git push %s master', serverPath)
      easyEx(localPath, cmd)
      status.push = true
    }

    retval = easyEx(localPath, 'git rev-parse HEAD')
    retval = retval.replace(/(\r\n|\n|\r)/gm, '')
  } catch (e) {
    console.log(sprintf('  FAILED: %s', repoName))
    console.log(status)
    return false
  }

  retval = await _writeDb(host, repoName, retval)
  if (!retval) {
    status.writedb = retval
    console.log(sprintf('  FAILED:  %s', repoName))
    console.log(retval)
    return false
  } else {
    console.log(sprintf('  SUCCESS: %s', repoName))
    return true
  }

}

function dateString () {
  const date = new Date()
  return date.toDateString() + ':' + date.toTimeString()
}
