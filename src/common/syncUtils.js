/**
 * Created by paul on 6/18/17.
 * @flow
 */

const childProcess = require('child_process')
const { sprintf } = require('sprintf-js')

// $FlowFixMe
const config = require('/etc/syncConfig.json')

const rootDir = config.userDir + config.reposDir

function getAuthBackupsDir () {
  return config.authBackupsDir
}

function getRepoPath (repo: string): string {
  const fullPath = rootDir + '/' + repo.slice(0, 2) + '/' + repo
  return fullPath
}

function getFailedReposFileName (): string {
  return config.userDir + config.failedRepos
}

function getCouchUrl (): string {
  return sprintf('http://%s:%s@localhost:5984', config.couchUserName, config.couchPassword)
}

function getRepoSubdir (repo: string): string {
  const fullPath = rootDir + '/' + repo.slice(0, 2)
  return fullPath
}

function getReposDir (): string {
  return rootDir
}

function dateString () {
  const date = new Date()
  return date.toDateString() + ':' + date.toTimeString()
}

function snooze (ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// type FileSyncOptions = {
//   encoding: string,
//   timeout: number,
//   killSignal: string,
//   cwd?: string,
//   env: any
// }

function easyEx (path: string | null, cmdstring: string): string {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)

  let opts
  if (path) {
    opts = { encoding: 'utf8', timeout: 20000, cwd: path, killSignal: 'SIGKILL' }
  } else {
    opts = { encoding: 'utf8', timeout: 20000, killSignal: 'SIGKILL' }
  }
  // $FlowFixMe return val is a string not a buffer
  const r: string = childProcess.execFileSync(cmd, args, opts)
  return r
}

// createRepo('12lakjaweoigjaoewigjaogji')

module.exports = {
  getAuthBackupsDir,
  easyEx,
  snooze,
  dateString,
  getReposDir,
  getRepoSubdir,
  getCouchUrl,
  getFailedReposFileName,
  getRepoPath
}
