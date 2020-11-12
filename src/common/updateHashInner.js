/**
 * Created by paul on 6/17/17.
 * @flow
 */

import nano from 'nano'
import childProcess from 'child_process'
// import util from 'util'

import {
  getConfig, isReservedRepoName, getRepoPath
} from './syncUtils.js'

const config = getConfig()
const url = `http://admin:${config.couchAdminPassword}@localhost:5984`
const _dbRepos = nano(url).db.use('db_repos')
// const execFile = util.promisify(childProcess.execFile)

export async function getRepoHash(repoName: string): Promise<string> {
  const localPath = getRepoPath(repoName)
  let commit = ''
  try {
    commit = childProcess.execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      timeout: 3000,
      cwd: localPath,
      killSignal: 'SIGKILL'
    })
    // $FlowFixMe
    commit = commit.replace(/(\r\n|\n|\r)/gm, '')
  } catch (e) {
    return ''
  }
  return commit
}

export async function updateHash(
  server: string,
  repo: string,
  hash: string | null
): Promise<true> {
  // console.log('ENTER writeDb:' + repo + ' hash:' + hash)
  return new Promise((resolve, reject) => {
    _dbRepos.get(repo, function(err, response) {
      if (err) {
        if (err.error === 'not_found') {
          // Create the db entry
          resolve(insertDb(server, repo, hash))
        } else {
          if (hash) {
            console.log('  updateHash:' + repo + ' hash:' + hash + ' FAILED')
          } else {
            console.log('  updateHash:' + repo + ' hash: NULLptr' + ' FAILED')
          }
          console.log(err)
          resolve(true)
        }
      } else {
        if (typeof response[server] !== 'undefined') {
          if (response[server] === hash) {
            resolve(true)
          }
        }
        resolve(insertDb(server, repo, hash, response))
      }
    })
  })
}

async function insertDb(server, repo, hash: string | null, repoObj: any = {}) {
  // console.log('ENTER insertDB:' + repo + ' hash:' + hash)
  if (hash === null) {
    if (repoObj[server] == null) {
      return Promise.resolve(true)
    } else {
      repoObj[server] = undefined
      repoObj[server + ':time'] = undefined
    }
  } else {
    repoObj[server] = hash
    const d = new Date()
    repoObj[server + ':time'] = d.getTime()
  }

  return new Promise(resolve => {
    _dbRepos.insert(repoObj, repo, function(err, res) {
      if (err) {
        resolve(updateHash(server, repo, hash))
      } else {
        // console.log('  writeDb:' + repo + ' hash:' + hash + ' SUCCESS')
        resolve(true)
      }
    })
  })
}

export async function deleteRepoRecord(repo: string): Promise<boolean> {
  console.log('deleteRepoRecord: ' + repo)
  return new Promise((resolve, reject) => {
    if (isReservedRepoName(repo)) {
      resolve(true)
    }
    _dbRepos.get(repo, function(err, response) {
      if (err) {
        if (err.error === 'not_found') {
          resolve(true)
        } else {
          resolve(false)
        }
      } else {
        _dbRepos.destroy(repo, response._rev, (err, body) => {
          if (err) {
            console.log(err)
            resolve(false)
          } else {
            resolve(true)
          }
        })
      }
    })
  })
}
