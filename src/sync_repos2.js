/**
 * Created by paul on 6/18/17.
 */
const fs = require('fs')
const sprintf = require('sprintf-js').sprintf
const config = require('/etc/sync_repos.config.json')
const url = sprintf('http://%s:%s@localhost:5984', config.couchUserName, config.couchPassword)
const nano = require('nano')(url)
const childProcess = require('child_process')
// const servers = require('/etc/absync/absync.json.donotuse')

const _getRepoPath = require('./create_repo.js').getRepoPath
const _createRepo = require('./create_repo.js').createRepo
const _getReposDir = require('./create_repo.js').getReposDir
const _writeDb = require('./update_hash.js').writeDb
const _dbRepos = nano.db.use('db_repos')

console.log(dateString() + '*** sync_repos2.js starting ***')

// const _rootDir = config.userDir + config.reposDir

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms))

let servers = []

// const hostname = 'git2.airbitz.co'
const hostname = easyEx(null, 'hostname')
const hostArray = hostname.split('.')
let host = hostArray[0]
host = host.replace(/(\r\n|\n|\r)/gm, '')

main()

function main () {
  asyncMain()
}

async function getRepos () {
  return new Promise((resolve) => {
    _dbRepos.view('repos', host, null, (err, doc) => {
      if (err === null) {
        // resolve({'rows': []})
        resolve(doc)
      } else {
        resolve({'rows': []})
      }
    })
  })
}

async function getServers () {
  return new Promise((resolve) => {
    _dbRepos.get('00000000_servers', function (err, response) {
      if (err) {
        if (err.error === 'not_found') {
          // Create the db entry
          resolve([])
        } else {
          resolve([])
        }
      } else {
        if (typeof response.servers !== 'undefined') {
          resolve(response.servers)
        } else {
          resolve([])
        }
      }
    })
  })
}

async function asyncMain () {
  servers = await getServers()
  const doc = await getRepos()
  const array = doc.rows
  let failArray = []

  for (const n in array) {
    const diff = array[n]
    console.log('Syncing repo %d of %d failed:%d', n, array.length, failArray.length)
    if (typeof diff.value.servers !== 'undefined') {
      continue
    }

    let syncedHash = null
    for (const s in servers) {
      if (diff.id !== syncedHash) {
        if (host !== servers[s].name) {
          const ret = await pullRepoFromServer(diff.id, servers[s])
          if (!ret) {
            failArray.push(diff.id)
          } else {
            syncedHash = diff.id
          }
        }
      }
    }
  }
  if (failArray.length) {
    console.log(sprintf('%s COMPLETE Failed repos:', dateString()))
    console.log(failArray)
  } else {
    console.log(sprintf('%s COMPLETE No Failed Repos:', dateString()))
  }
  await snooze(20000)
  await asyncMain()
}

function easyEx (path, cmdstring) {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)
  const r = childProcess.execFileSync(cmd, args, { encoding: 'utf8', timeout: 20000, cwd: path, killSignal: 'SIGKILL' })
  return r
}

async function pullRepoFromServer (repoName, server, retry = true) {
  const date = new Date()
  const serverPath = server.url + repoName
  const localPath = _getRepoPath(repoName)
  const log = sprintf('%s:%s pullRepoFromServer:%s %s', date.toDateString(), date.toTimeString(), server.name, repoName)
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

    // Mark the backup directory for deletion
    if (!retry) {
      try {
        const bakdir = _getReposDir() + '.bak/' + repoName
        fs.renameSync(bakdir, bakdir + '.deleteme')
      } catch (e) {
      }
    }

    if (retval.length > 0) {
      cmd = sprintf('git push %s master', serverPath)
      easyEx(localPath, cmd)
      status.push = true
    }

    retval = easyEx(localPath, 'git rev-parse HEAD')
    retval = retval.replace(/(\r\n|\n|\r)/gm, '')
  } catch (e) {
    // if (retry && status.absync != true) {
    //   console.log(sprintf('  FAILED: %s Moving dir and retrying...', repoName))
    //   try {
    //     const newdir = _getReposDir() + '.bak/' + repoName
    //     fs.renameSync(localPath, newdir)
    //     return await pullRepoFromServer(repoName, server, false)
    //   } catch (e) {
    //     return false
    //   }
    // } else {
      console.log(sprintf('  FAILED: %s', repoName))
      console.log(status)
      return false
    // }
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
