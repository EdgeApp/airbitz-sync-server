/**
 * Created by paul on 6/18/17.
 * @flow
 */

const util = require('util')
const fsCallback = require('fs')
const { sprintf } = require('sprintf-js')
const nano = require('nano')
const { createRepo } = require('./common/createRepoInner.js')
const { updateHash } = require('./common/updateHashInner.js')
const {
  getRepoPath,
  getReposDir,
  getFailedReposFileName,
  getCouchUrl,
  easyExAsync,
  snooze,
  getHostname,
  dateString
} = require('./common/syncUtils.js')
// $FlowFixMe
const writeFile = util.promisify(fsCallback.writeFile)
// $FlowFixMe
const rename = util.promisify(fsCallback.rename)

const url = getCouchUrl()

const _dbRepos = nano(url).db.use('db_repos')

console.log(dateString() + '*** syncRepos.js starting ***')

let servers = []

const host = getHostname()

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

async function syncRepoAllServers (diff: any, servers: any, failArray: Array<string>) {
  shuffle(servers)
  let syncedHash: string = ''
  const repo = diff.id
  const hashMap = diff.value
  let success = false
  for (let s = 0; s < servers.length; s++) {
    const serverName = servers[s].name
    if (syncedHash !== hashMap[serverName]) {
      if (host !== serverName) {
        // console.log('Pulling repo:' + repo + ' hash:' + hashMap[serverName])
        // await snooze(5000)
        // console.log('Done pulling repo:' + repo)
        // const ret = true
        const ret = await pullRepoFromServer(repo, servers[s])
        if (ret) {
          success = true
          syncedHash = hashMap[serverName]
        }
      }
    }
  }
  if (!success) {
    failArray.push(repo)
  }
}

const QUEUE_SIZE = 8

async function main () {
  while (1) {
    servers = await getServers()
    const doc = await getRepos()
    const array = doc.rows
    let failArray = []

    let promiseArray = []
    for (let n = 0; n < array.length; n++) {
      const diff = array[n]
      console.log('Syncing repo %d of %d failed:%d', n, array.length, failArray.length)
      if (typeof diff.value.servers !== 'undefined') {
        continue
      }

      if (promiseArray.length > QUEUE_SIZE) {
        const pr = promiseArray.shift()
        await pr.then()
      }

      const p = syncRepoAllServers(diff, servers, failArray)
      promiseArray.push(p)
    }

    await Promise.all(promiseArray)

    if (failArray.length) {
      console.log(sprintf('%s COMPLETE Failed repos:', dateString()))
      console.log(failArray)
      try {
        await writeFile(getFailedReposFileName(), JSON.stringify(failArray))
      } catch (e) {
        console.log(e)
      }
    } else {
      console.log(sprintf('%s COMPLETE No Failed Repos:', dateString()))
    }
    await snooze(5000)
  }
}

async function pullRepoFromServer (repoName, server, retry = true) {
  const date = new Date()
  const serverPath = server.url + repoName
  const localPath = getRepoPath(repoName)
  const log = sprintf('%s:%s pullRepoFromServer:%s %s', date.toDateString(), date.toTimeString(), server.name, repoName)
  console.log(log)

  await createRepo(repoName)

  const status = {'branch': false, 'absync': false, 'find': false, 'push': false, 'writedb': false}

  try {
    await easyExAsync(localPath, 'git branch -D incoming')
    status.branch = true
  } catch (e) {
  }

  let retval = ''
  try {
    let cmd = sprintf('ab-sync %s %s', localPath, serverPath)
    await easyExAsync(localPath, cmd)
    status.absync = true

    retval = await easyExAsync(localPath, 'find objects -type f')
    status.find = true

    // Mark the backup directory for deletion
    if (!retry) {
      try {
        const bakdir = getReposDir() + '.bak/' + repoName
        await rename(bakdir, bakdir + '.deleteme')
      } catch (e) {
      }
    }

    if (retval.length > 0) {
      cmd = sprintf('git push %s master', serverPath)
      await easyExAsync(localPath, cmd)
      status.push = true
    }

    retval = await easyExAsync(localPath, 'git rev-parse HEAD')
    // $FlowFixMe
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
