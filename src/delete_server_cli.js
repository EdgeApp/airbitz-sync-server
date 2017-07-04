/**
 * Created by paul on 6/17/17.
 */
const config = require('/etc/sync_repos.config.json')
const sprintf = require('sprintf-js').sprintf
const url = sprintf('http://%s:%s@localhost:5984', config.couchUserName, config.couchPassword)
const nano = require('nano')(url)
const _writeDb = require('./update_hash.js').writeDb
const _dbRepos = nano.db.use('db_repos')

async function mainLoop () {
  if (process.argv.length < 3) {
    console.log('Usage: delete_server_cli.js [server]')
    return -1
  } else {
    const repos = await getRepos()

    for (const i in repos.rows) {
      const repo = repos.rows[i]
      console.log(sprintf('Deleting %s from repo %s', process.argv[2], repo.key))
      await _writeDb(process.argv[2], repo.key, null)
    }


    // await _writeDb(process.argv[2])
  }
}

mainLoop()

async function getRepos () {
  return new Promise((resolve) => {
    _dbRepos.list({include_docs: true}, (err, docs) => {
      if (err === null) {
        resolve(docs)
      } else {
        resolve({'rows': []})
      }
    })
  })
}

