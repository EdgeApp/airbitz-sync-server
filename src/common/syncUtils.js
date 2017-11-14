/**
 * Created by paul on 6/18/17.
 * @flow
 */

const util = require('util')
const childProcess = require('child_process')
const { sprintf } = require('sprintf-js')
const config = require('../../syncConfig.json')
const fs = require('fs')
// $FlowFixMe
const execFile = util.promisify(childProcess.execFile)

const rootDir = config.userDir + config.reposDir

function isHex (h: string) {
  const out = /^[0-9A-F]+$/i.test(h)
  return out
}

function parseIntSafe (result?: Array<string> | null, idx: number): number {
  if (result && result[idx]) {
    return parseInt(result[idx])
  } else {
    throw new Error('InvalidParseResult')
  }
}

function isReservedRepoName (repoName: string) {
  return (repoName === '00000000_servers')
}

function getConfig () {
  return config
}

function moveRepoToBackup (repoName: string) {
  const localPath = getRepoPath(repoName)
  const newdir = getReposDir() + '.bak/' + repoName
  try {
    fs.renameSync(localPath, newdir)
  } catch (e) {
    console.log(e)
  }
}

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

function getRepoListFile (): string {
  return config.repoListPath + 'repolist.txt'
}

function getHostname (): string {
  const hostname = easyEx(null, 'hostname')
  const hostArray = hostname.split('.')
  let host = hostArray[0]
  host = host.replace(/(\r\n|\n|\r)/gm, '')
  return host.toLowerCase()
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

async function easyExAsync (path: string | null, cmdstring: string): Promise<string> {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)

  let opts
  if (path) {
    opts = { encoding: 'utf8', timeout: 20000, cwd: path, killSignal: 'SIGKILL' }
  } else {
    opts = { encoding: 'utf8', timeout: 20000, killSignal: 'SIGKILL' }
  }
  const r: string = await execFile(cmd, args, opts)
  return r
}
// createRepo('12lakjaweoigjaoewigjaogji')

module.exports = {
  getAuthBackupsDir,
  easyEx,
  easyExAsync,
  snooze,
  dateString,
  getReposDir,
  getRepoListFile,
  getHostname,
  getRepoSubdir,
  parseIntSafe,
  moveRepoToBackup,
  getCouchUrl,
  getFailedReposFileName,
  getRepoPath,
  getConfig,
  isReservedRepoName,
  isHex
}
