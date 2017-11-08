/**
 * Created by paul on 6/18/17.
 * @flow
 */

import childProcess from 'child_process'
import { sprintf } from 'sprintf-js'

// $FlowFixMe
const config = require('/etc/syncConfig.json')

const rootDir = config.userDir + config.reposDir

export function getRepoPath (repo: string): string {
  const fullPath = rootDir + '/' + repo.slice(0, 2) + '/' + repo
  return fullPath
}

export function getFailedReposFileName (): string {
  return config.userDir + config.failedRepos
}

export function getCouchUrl (): string {
  return sprintf('http://%s:%s@localhost:5984', config.couchUserName, config.couchPassword)
}

export function getRepoSubdir (repo: string): string {
  const fullPath = rootDir + '/' + repo.slice(0, 2)
  return fullPath
}

export function getReposDir (): string {
  return rootDir
}

export function dateString () {
  const date = new Date()
  return date.toDateString() + ':' + date.toTimeString()
}

export function snooze (ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// type FileSyncOptions = {
//   encoding: string,
//   timeout: number,
//   killSignal: string,
//   cwd?: string,
//   env: any
// }

export function easyEx (path: string, cmdstring: string): string {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)
  // $FlowFixMe return val is a string not a buffer
  const r: string = childProcess.execFileSync(cmd, args, { encoding: 'utf8', timeout: 20000, cwd: path, killSignal: 'SIGKILL' })
  return r
}

// createRepo('12lakjaweoigjaoewigjaogji')
