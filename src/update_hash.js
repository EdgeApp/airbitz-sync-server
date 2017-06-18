/**
 * Created by paul on 6/17/17.
 */
const nano = require('nano')('http://localhost:5984')
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
          reject(err)
        }
      } else {
        resolve(insertDb(server, repo, hash, response))
      }
    })
  })
}

async function insertDb (server, repo, hash, repoObj = {}) {
  // console.log('ENTER insertDB:' + repo + ' hash:' + hash)
  repoObj[server] = hash

  return new Promise((resolve, reject) => {
    _dbRepos.insert(repoObj, repo, function (err, res) {
      if (err) {
        resolve(writeDb(server, repo, hash))
      } else {
        console.log('  writeDb:' + repo + ' hash:' + hash + ' SUCCESS')
        resolve()
      }
    })
  })
}

module.exports.writeDb = writeDb
