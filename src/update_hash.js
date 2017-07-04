/**
 * Created by paul on 6/17/17.
 */
const config = require('/etc/sync_repos.config.json')
const sprintf = require('sprintf-js').sprintf
const url = sprintf('http://%s:%s@localhost:5984', config.couchUserName, config.couchPassword)
const nano = require('nano')(url)
const _dbRepos = nano.db.use('db_repos')

async function writeDb (server, repo, hash) {
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

async function insertDb (server, repo, hash, repoObj = {}) {
  // console.log('ENTER insertDB:' + repo + ' hash:' + hash)
  if (hash === null) {
    if (repoObj[server] == null) {
      return Promise.resolve(true)
    } else {
      repoObj[server] = undefined
    }
  } else {
    repoObj[server] = hash
  }

  return new Promise((resolve) => {
    _dbRepos.insert(repoObj, repo, function (err, res) {
      if (err) {
        resolve(writeDb(server, repo, hash))
      } else {
        // console.log('  writeDb:' + repo + ' hash:' + hash + ' SUCCESS')
        resolve(true)
      }
    })
  })
}

module.exports.writeDb = writeDb
