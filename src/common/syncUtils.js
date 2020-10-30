/**
 * Created by paul on 6/18/17.
 * @flow
 */

import childProcess from 'child_process'
import fs from 'fs'

import config from '../../syncConfig.json'

const rootDir = config.userDir + config.reposDir

export function isHex(h: string): boolean {
  return /^[0-9A-F]+$/i.test(h)
}

export function parseIntSafe(
  result?: Array<string> | null,
  idx: number
): number {
  if (result && result[idx]) {
    return parseInt(result[idx])
  } else {
    throw new Error('InvalidParseResult')
  }
}

export function isReservedRepoName(repoName: string): boolean {
  return repoName === '00000000_servers'
}

export function getConfig() {
  return config
}

export function moveRepoToBackup(repoName: string) {
  const localPath = getRepoPath(repoName)
  let index = 0
  let newdir
  while (1) {
    try {
      newdir =
        getReposDir() + '.bak/' + repoName + '.' + ('0000' + index).slice(-3)
      fs.renameSync(localPath, newdir)
      console.log('rename successful: ' + localPath + ' -> ' + newdir)

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

export function getAuthBackupsDir(): string {
  return config.authBackupsDir
}

export function getRepoPath(repo: string): string {
  const fullPath = rootDir + '/' + repo.slice(0, 2) + '/' + repo
  return fullPath
}

export function getFailedReposFileName(): string {
  return config.userDir + config.failedRepos
}

export function getCouchUrl(): string {
  return `http://admin:${config.couchAdminPassword}@localhost:5984`
}

export function getRepoListFile(): string {
  return config.repoListPath + 'repolist.txt'
}

export function getReposUrl(): string {
  return config.reposUrl.toLowerCase()
}
export function getHostname(): string {
  const hostname = easyEx(null, 'hostname')
  const hostArray = hostname.split('.')
  let host = hostArray[0]
  host = host.replace(/(\r\n|\n|\r)/gm, '')
  return host.toLowerCase()
}

export function getCouchUserPassword(): string {
  return config.couchUserPassword
}

export function getCouchAdminPassword(): string {
  return config.couchAdminPassword
}

export function getRepoSubdir(repo: string): string {
  const fullPath = rootDir + '/' + repo.slice(0, 2)
  return fullPath
}

export function getReposDir(): string {
  return rootDir
}

export function dateString(): string {
  const date = new Date()
  return date.toDateString() + ':' + date.toTimeString()
}

export function snooze(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// type FileSyncOptions = {
//   encoding: string,
//   timeout: number,
//   killSignal: string,
//   cwd?: string,
//   env: any
// }

export function easyEx(path: string | null, cmdstring: string): string {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)

  let opts
  if (path) {
    opts = {
      encoding: 'utf8',
      timeout: 20000,
      cwd: path,
      killSignal: 'SIGKILL'
    }
  } else {
    opts = { encoding: 'utf8', timeout: 20000, killSignal: 'SIGKILL' }
  }
  // The output is actually a string, because of our "encoding":
  const flowHack: any = childProcess.execFileSync(cmd, args, opts)
  return flowHack
}

export function easyExAsync(
  path: string | null,
  cmdstring: string
): Promise<string> {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)

  let opts
  if (path) {
    opts = {
      encoding: 'utf8',
      timeout: 20000,
      cwd: path,
      killSignal: 'SIGKILL'
    }
  } else {
    opts = { encoding: 'utf8', timeout: 20000, killSignal: 'SIGKILL' }
  }
  return new Promise((resolve, reject) => {
    childProcess.execFile(cmd, args, opts, function(err, stdout, stderr) {
      if (err) {
        reject(err)
      } else {
        // The output is actually a string, because of our "encoding":
        const flowHack: any = stdout
        resolve(flowHack)
      }
    })
  })
}
