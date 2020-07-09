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
  snooze
} from './common/syncUtils.js'
import { updateHash } from './common/updateHashInner.js'

const writeFile = util.promisify(fsCallback.writeFile)

const url = getCouchUrl()

const _dbRepos = nano(url).db.use('db_repos')

console.log(dateString() + '*** syncRepos.js starting ***')

let servers = []

const host = getHostname()

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
  let syncedHash: string = ''
  const repo = diff.id
  const hashMap = diff.value

  if (hashMap['ip-172-31-10-198'] != null && hashMap.git3 == null) {
    hashMap.git3 = hashMap['ip-172-31-10-198']
    hashMap['git3:time'] = hashMap['ip-172-31-10-198:time']
    console.log('fixed doc', hashMap)
  }

  let success = false
  for (let s = 0; s < servers.length; s++) {
    const serverName = servers[s].name
    if (
      hashMap[serverName] !== undefined &&
      syncedHash !== hashMap[serverName]
    ) {
      if (host !== serverName) {
        try {
          await pullRepoFromServer(repo, servers[s])
          success = true
          syncedHash = hashMap[serverName]
        } catch (e) {
          console.log(String(e))
        }
      }
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
        `Syncing repo ${n} of ${array.length} failed:${failArray.length}`
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
      await writeFile(getFailedReposFileName(), JSON.stringify(failArray))
    } catch (e) {
      console.log(e)
    }
    await snooze(5000)
  }
}

async function pullRepoFromServer(
  repoName: string,
  server: ServerInfo
): Promise<void> {
  const serverPath = server.url + repoName
  const localPath = getRepoPath(repoName)
  const syncCmd = `ab-sync ${localPath} ${serverPath}`
  console.log(syncCmd)

  await createRepo(repoName)
  await easyExAsync(localPath, 'git branch -D incoming').catch(() => undefined)
  await easyExAsync(localPath, syncCmd)
  const findResult = await easyExAsync(localPath, 'find objects -type f').catch(
    () => 'hasfile'
  )
  if (findResult.length > 0) {
    const cmd = `git push ${serverPath} master`
    await easyExAsync(localPath, cmd)
  }

  let head = await easyExAsync(localPath, 'git rev-parse HEAD')
  head = head.replace(/(\r\n|\n|\r)/gm, '')
  await updateHash(host, repoName, head)
}

main()
