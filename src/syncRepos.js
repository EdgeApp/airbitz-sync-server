/**
 * Created by paul on 6/18/17.
 * @flow
 */

import fsCallback from 'fs'
import nano from 'nano'
import util from 'util'

import { createRepo } from './common/createRepoInner.js'
import {
  dateString,
  easyExAsync,
  getCouchUrl,
  getFailedReposFileName,
  getHostname,
  getRepoPath,
  getReposDir,
  snooze
} from './common/syncUtils.js'
import { updateHash, getRepoHash } from './common/updateHashInner.js'
import { moveRepos } from './moveRepos.js'

const readFile = util.promisify(fsCallback.readFile)
const writeFile = util.promisify(fsCallback.writeFile)
const rename = util.promisify(fsCallback.rename)

const url = getCouchUrl()

const _dbRepos = nano(url).db.use('db_repos')

console.log(dateString() + '*** syncRepos.js starting ***')

let servers = []

const host = getHostname()

function phash(hash?: string) {
  return hash ? hash.slice(0, 6) : ''
}

type ServerInfo = {
  name: string,
  url: string,
  password: string
}

async function getRepos() {
  return new Promise(resolve => {
    _dbRepos.view('repos', host, null, (err, doc) => {
      if (err === null) {
        // resolve({'rows': []})
        resolve(doc)
      } else {
        resolve({ rows: [] })
      }
    })
  })
}

async function getServers(): Promise<ServerInfo[]> {
  return new Promise(resolve => {
    _dbRepos.get('00000000_servers', function(err, response) {
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

function shuffle(a: Array<any>) {
  let j, x, i
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    x = a[i]
    a[i] = a[j]
    a[j] = x
  }
}

async function syncRepoAllServers(
  diff: any,
  servers: ServerInfo[],
  failArray: Array<string>
) {
  shuffle(servers)
  const repo = diff.id
  const hashMap = diff.value
  let syncedHash: string = await getRepoHash(repo).catch(e => '')
  // console.log(`host: ${host} repo: ${repo} getRepoHash ${syncedHash}`)

  if (hashMap['ip-172-31-10-198'] != null && hashMap.git3 == null) {
    hashMap.git3 = hashMap['ip-172-31-10-198']
    hashMap['git3:time'] = hashMap['ip-172-31-10-198:time']
    console.log('fixed doc', hashMap)
  }

  if (syncedHash.length > 1 && hashMap[host] !== syncedHash) {
    console.log(`Hash mismatch repo:${repo} db:${phash(hashMap[host])} disk:${phash(syncedHash)}`)
    await updateHash(host, repo, syncedHash).catch(e => undefined)
    hashMap[host] = syncedHash
  }

  let success = true
  for (let s = 0; s < servers.length; s++) {
    const serverName = servers[s].name
    if (host === serverName) continue

    if (hashMap[serverName] === undefined) {
      // console.log(` repo:${repo} target server has no hash ${serverName}`)
      continue
    }
    if (syncedHash === hashMap[serverName]) {
      // console.log(` repo:${repo} target server hash matches ${serverName} ${syncedHash}`)
      continue
    }
    // console.log('Pulling repo:' + repo + ' hash:' + hashMap[serverName])
    // await snooze(5000)
    // console.log('Done pulling repo:' + repo)
    // const ret = true
    const ret = await pullRepoFromServer(repo, servers[s], syncedHash, hashMap[serverName])
    if (ret !== '') {
      syncedHash = ret
    } else {
      success = false
    }
  }
  if (!success) {
    failArray.push(repo)
  }
}

const QUEUE_SIZE = 32

async function main() {
  while (1) {
    servers = await getServers()
    const doc = await getRepos()
    const array = doc.rows
    const failArray = []

    const promiseArray = []
    for (let n = 0; n < array.length; n++) {
      const diff = array[n]
      console.log(
        `Syncing repo ${diff.id} ${n} of ${array.length} failed:${failArray.length}`
      )
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
      console.log(`${dateString()} COMPLETE Failed repos:`, failArray)
    } else {
      console.log(`${dateString()} COMPLETE No Failed Repos`)
    }
    try {
      const oldFailMap = await readFile(getFailedReposFileName()).then(x => JSON.parse(x)).catch(e => { return {} })
      const newFailMap = {}
      failArray.map(f => {
        newFailMap[f] = 1
      })
      Object.keys(oldFailMap).map(repo => {
        if (newFailMap[repo]) {
          newFailMap[repo] += oldFailMap[repo]
        }
      })

      await writeFile(getFailedReposFileName(), JSON.stringify(newFailMap))
    } catch (e) {
      console.log(e)
    }
    await moveRepos()
    await snooze(5000)
  }
}

async function pullRepoFromServer(
  repoName: string,
  server: ServerInfo,
  myHash: string,
  theirHash: string,
  retry = true
): Promise<string> {
  const date = new Date()
  const serverPath = server.url + repoName
  const localPath = getRepoPath(repoName)
  console.log(
    `${dateString()} pullRepoFromServer:${
      server.name
    } ${repoName} ${phash(myHash)} ${phash(theirHash)}`
  )

  await createRepo(repoName)

  const status = {
    branch: false,
    absync: false,
    find: false,
    push: false,
    writedb: false
  }

  try {
    await easyExAsync(localPath, 'git branch -D incoming')
    status.branch = true
  } catch (e) {}

  let retval = ''
  try {
    let cmd = `ab-sync ${localPath} ${serverPath}`
    await easyExAsync(localPath, cmd)
    status.absync = true

    try {
      retval = await easyExAsync(localPath, 'find objects -type f')
      status.find = true
    } catch (e) {
      status.find = true
      retval = 'hasfile'
    }

    // Mark the backup directory for deletion
    if (!retry) {
      try {
        const bakdir = getReposDir() + '.bak/' + repoName
        await rename(bakdir, bakdir + '.deleteme')
      } catch (e) {}
    }

    if (retval.length > 0) {
      cmd = `git push ${serverPath} master`
      await easyExAsync(localPath, cmd)
      status.push = true
    }

    retval = await easyExAsync(localPath, 'git rev-parse HEAD')
    retval = retval.replace(/(\r\n|\n|\r)/gm, '')
  } catch (e) {
    console.log(`${dateString()} pullRepoFromServer:${server.name} FAILED git ${repoName}`)
    console.log(status)
    return ''
  }

  const success = await updateHash(host, repoName, retval)
  if (!success) {
    status.writedb = success
    console.log(`${dateString()} pullRepoFromServer:${server.name} FAILED updateHash ${repoName}`)
    console.log(retval)
    return ''
  } else {
    console.log(`${dateString()} pullRepoFromServer:${server.name} SUCCESS ${repoName} ${phash(retval)}`)
    return retval
  }
}

main()
