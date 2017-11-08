/**
 * Created by paul on 6/17/17.
 * @flow
 */

// $FlowFixMe
const config = require('/etc/syncConfig.json')
const sprintf = require('sprintf-js').sprintf
const url = sprintf('http://%s:%s@localhost:5984', config.couchUserName, config.couchPassword)
const nano = require('nano')(url)
const _dbRepos = nano.db.use('db_repos')

export async function updateHash (server: string, repo:string, hash: string) {
  // console.log('ENTER writeDb:' + repo + ' hash:' + hash)
  return new Promise((resolve, reject) => {
    _dbRepos.get(repo, function (err, response) {
      if (err) {
        if (err.error === 'not_found') {
          // Create the db entry
          resolve(insertDb(server, repo, hash))
        } else {
          console.log('  writeDb:' + repo + ' hash:' + hash + ' FAILED')
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

async function insertDb (server, repo, hash: string, repoObj: any = {}) {
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

  return new Promise((resolve) => {
    _dbRepos.insert(repoObj, repo, function (err, res) {
      if (err) {
        resolve(updateHash(server, repo, hash))
      } else {
        // console.log('  writeDb:' + repo + ' hash:' + hash + ' SUCCESS')
        resolve(true)
      }
    })
  })
}
