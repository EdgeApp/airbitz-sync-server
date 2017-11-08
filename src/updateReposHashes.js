// @flow

const fs = require('fs')
const { sprintf } = require('sprintf-js')
const childProcess = require('child_process')

const { updateHash } = require('./common/updateHash.js')
const { getRepoPath, dateString, getReposDir, getRepoListFile, getHostname } = require('./common/syncUtils.js')

console.log(dateString() + ' updateReposHashes.js starting')

const hostname = getHostname()

mainLoop()

async function mainLoop () {
  const localRepos = getLocalDirs()
  console.log('localRepos:' + localRepos.length)

  let n = 0
  for (const repoName of localRepos) {
    n++
    const localPath = getRepoPath(repoName)
    let commit = ''
    try {
      // console.log(localPath)
      commit = childProcess.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 3000, cwd: localPath, killSignal: 'SIGKILL' })
      // $FlowFixMe
      commit = commit.replace(/(\r\n|\n|\r)/gm, '')
      // const commit = child_process.execFileSync('git', ['rev-parse', 'HEAD'], { timeout: 3000, stdio: std_noerr, cwd: localPath, killSignal: 'SIGKILL' })
      // console.log('  [git rev-parse success] ' + commit)
      await updateHash(hostname, repoName, commit)
      console.log(sprintf('writeDb %d/%d SUCCESS %-5s %-41s %-41s', n, localRepos.length, hostname, repoName, commit))
    } catch (e) {
      console.log(sprintf('writeDb %d/%d FAILED  %-5s %-41s %-41s', n, localRepos.length, hostname, repoName, commit))
    }
  }
}

function repoListToArray (repolistfile) {
  const remoteRepoListRaw = fs.readFileSync(repolistfile).toString().split('\n')
  const remoteRepoList = []

  for (let m = 0; m < remoteRepoListRaw.length; m++) {
    const repo = remoteRepoListRaw[m]
    const fileArray = repo.split('/')
    if (fileArray.length > 1) {
      const file = fileArray[fileArray.length - 1]
      remoteRepoList.push(file)
    }
  }

  return remoteRepoList
}

function getLocalDirs () {
  console.log('ENTER getLocalDirs')

  // If repolist.txt exists, use it. Otherwise, build up the list ourselves
  let allDirs = []

  const repolistFile = getRepoListFile()
  const exists = fs.existsSync(repolistFile)

  if (exists) {
    console.log('  Found local repolist.txt file')
    const arrayRepos = repoListToArray(repolistFile)
    allDirs = allDirs.concat(arrayRepos)
  } else {
    const reposDir = getReposDir()
    console.log('  Finding all local repos in: ' + reposDir)
    const dir = fs.readdirSync(reposDir)
    const RUN_SUBSET = false

    for (let f = 0; f < dir.length; f++) {
      // For testing only look for 'wa...' directories which are testing only
      if (RUN_SUBSET && !dir[ f ].startsWith('ff')) {
        continue
      }

      const path = reposDir + '/' + dir[ f ]
      const stat = fs.statSync(path)
      if (stat.isDirectory()) {
        const dir2 = fs.readdirSync(path)
        for (let f2 = 0; f2 < dir2.length; f2++) {
          // For testing only look for 'wa...' directories which are testing only
          if (RUN_SUBSET && !dir2[ f2 ].startsWith('ffff')) {
            continue
          }
          const path2 = path + '/' + dir2[ f2 ]
          const stat2 = fs.statSync(path2)
          if (stat2.isDirectory()) {
            allDirs.push(dir2[ f2 ])
          }
        }
      }
    }
  }
  console.log('  num repos:' + allDirs.length)
  return allDirs
}
