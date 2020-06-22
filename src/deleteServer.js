/**
 * Created by paul on 6/17/17.
 * @flow
 */

import nano from 'nano'
import { sprintf } from 'sprintf-js'

import { getCouchUrl } from './common/syncUtils.js'
import { updateHash } from './common/updateHashInner.js'

const url = getCouchUrl()
const _dbRepos = nano(url).db.use('db_repos')

async function mainLoop() {
  if (process.argv.length < 3) {
    console.log('Usage: deleteServer.js [server]')
    return -1
  } else {
    const repos = await getRepos()

    for (const repo of repos.rows) {
      console.log(
        sprintf('Deleting %s from repo %s', process.argv[2], repo.key)
      )
      await updateHash(process.argv[2], repo.key, null)
    }
  }
}

mainLoop()

async function getRepos() {
  return new Promise(resolve => {
    _dbRepos.list({ include_docs: true }, (err, docs) => {
      if (err === null) {
        resolve(docs)
      } else {
        resolve({ rows: [] })
      }
    })
  })
}
