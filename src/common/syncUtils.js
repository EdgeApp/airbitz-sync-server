/**
 * Created by paul on 6/18/17.
 * @flow
 */

import childProcess from 'child_process'

// $FlowFixMe
const config = require('/etc/syncConfig.json')

const rootDir = config.userDir + config.reposDir

export function getRepoPath (repo: string): string {
  const fullPath = rootDir + '/' + repo.slice(0, 2) + '/' + repo
  return fullPath
}

export function getRepoSubdir (repo: string): string {
  const fullPath = rootDir + '/' + repo.slice(0, 2)
  return fullPath
}

export function getReposDir (): string {
  return rootDir
}

export function easyEx (path: string, cmdstring: string) {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)
  const r = childProcess.execFileSync(cmd, args, { timeout: 20000, cwd: path, killSignal: 'SIGKILL' })
  return r
}

// createRepo('12lakjaweoigjaoewigjaogji')
