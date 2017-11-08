/**
 * Created by paul on 6/18/17.
 * @flow
 */

import fs from 'fs'
import { sprintf } from 'sprintf-js'
import nano from 'nano'
import { createRepo } from './common/createRepo.js'
import { updateHash } from './common/updateHash.js'
import {
  getRepoPath,
  getReposDir,
  getFailedReposFileName,
  getCouchUrl,
  easyEx,
  snooze,
  dateString
} from './common/syncUtils.js'

const url = getCouchUrl()

const _dbRepos = nano(url).db.use('db_repos')

console.log(dateString() + '*** syncRepos.js starting ***')

let servers = []

// const hostname = 'git2.airbitz.co'
const hostname = easyEx('', 'hostname')
const hostArray = hostname.split('.')
let host = hostArray[0]
host = host.replace(/(\r\n|\n|\r)/gm, '')

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

function shuffle (a: Array<any>) {
  let j, x, i
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    x = a[i]
    a[i] = a[j]
    a[j] = x
  }
}

async function main () {
  servers = await getServers()
  const doc = await getRepos()
  const array = doc.rows
  let failArray = []

  for (let n = 0; n < array.length; n++) {
    const diff = array[n]
    console.log('Syncing repo %d of %d failed:%d', n, array.length, failArray.length)
    if (typeof diff.value.servers !== 'undefined') {
      continue
    }

    let syncedHash = null
    shuffle(servers)

    for (let s = 0; s < servers.length; s++) {
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
    try {
      fs.writeFileSync(getFailedReposFileName(), JSON.stringify(failArray))
    } catch (e) {
      console.log(e)
    }
  } else {
    console.log(sprintf('%s COMPLETE No Failed Repos:', dateString()))
  }
  await snooze(5000)
  await main()
}

async function pullRepoFromServer (repoName, server, retry = true) {
  const date = new Date()
  const serverPath = server.url + repoName
  const localPath = getRepoPath(repoName)
  const log = sprintf('%s:%s pullRepoFromServer:%s %s', date.toDateString(), date.toTimeString(), server.name, repoName)
  console.log(log)

  createRepo(repoName)

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
        const bakdir = getReposDir() + '.bak/' + repoName
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
    console.log(sprintf('  FAILED: %s', repoName))
    console.log(status)
    return false
  }

  retval = await updateHash(host, repoName, retval)
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

main()
