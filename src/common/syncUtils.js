/**
 * Created by paul on 6/18/17.
 * @flow
 */

const childProcess = require('child_process')
const { sprintf } = require('sprintf-js')
const config = require('../../syncConfig.json')
const fs = require('fs')

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
  let index = 0
  let newdir
  while (1) {
    try {
      newdir = getReposDir() + '.bak/' + repoName + '.' + ('0000' + index).slice(-3)
      fs.renameSync(localPath, newdir)
      console.log('rename successful: ' + localPath + ' -> ' + newdir)
      try {
        fs.rmdirSync(localPath)
      } catch (e) {
        console.log(e)
      }
      break
    } catch (e) {
      console.log('Error code:' + e.code)
      if (e.code === 'ENOTEMPTY') {
        index++
      } else {
        console.log(e)
        break
      }
    }
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
  return sprintf('http://admin:%s@localhost:5984', config.couchAdminPassword)
}

function getRepoListFile (): string {
  return config.repoListPath + 'repolist.txt'
}

function getReposUrl (): string {
  return config.reposUrl.toLowerCase()
}
function getHostname (): string {
  const hostname = easyEx(null, 'hostname')
  const hostArray = hostname.split('.')
  let host = hostArray[0]
  host = host.replace(/(\r\n|\n|\r)/gm, '')
  return host.toLowerCase()
}

function getCouchUserPassword (): string {
  return config.couchUserPassword
}

function getCouchAdminPassword (): string {
  return config.couchAdminPassword
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

function easyExAsync (path: string | null, cmdstring: string) {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)

  let opts
  if (path) {
    opts = { encoding: 'utf8', timeout: 20000, cwd: path, killSignal: 'SIGKILL' }
  } else {
    opts = { encoding: 'utf8', timeout: 20000, killSignal: 'SIGKILL' }
  }
  return new Promise((resolve, reject) => {
    childProcess.execFile(cmd, args, opts, function (err, stdout, stderr) {
      if (err) {
        reject(err)
      } else {
        resolve(stdout)
      }
    })
  })
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
  getReposUrl,
  getRepoSubdir,
  parseIntSafe,
  moveRepoToBackup,
  getCouchUrl,
  getCouchUserPassword,
  getCouchAdminPassword,
  getFailedReposFileName,
  getRepoPath,
  getConfig,
  isReservedRepoName,
  isHex
}
