// @flow

const fs = require('fs')
const { sprintf } = require('sprintf-js')
const childProcess = require('child_process')

let { updateHash, deleteRepoRecord } = require('./common/updateHashInner.js')
const { getRepoPath, dateString, getReposDir, getRepoListFile, getHostname, isHex } = require('./common/syncUtils.js')

console.log(dateString() + ' updateReposHashes.js starting')

const hostname = getHostname()

const TEST_ONLY = true // Set to true to not execute any disk write functions

if (TEST_ONLY) {
  updateHash = function (hostname: string, repoName: string, commit: string) {
    console.log(sprintf('TEST updateHash host:%s repoName:%s commit:%s', hostname, repoName, commit))
  }
  deleteRepoRecord = function (repo: string) {
    console.log(sprintf('TEST deleteRepoRecord repo:%s', repo))
  }
  fs.unlink = function (file: string) {
    console.log(sprintf('TEST fs.unlink file:%s', file))
  }
}

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
          // Check if directory is not base16 or 40 characters. If not AND the directory is empty or
          // has no commits, then delete the directory and any record of it in the DB.
          const repo = dir2[f2]
          let emptyRepo = false
          let invalidRepoName = false
          if (!isHex(repo) || repo.length !== 40) {
            invalidRepoName = true
          }

          const path2 = path + '/' + dir2[ f2 ]
          const stat2 = fs.statSync(path2)
          if (stat2.isDirectory()) {
            const stat3 = fs.statSync(path2 + '/objects')
            if (stat3.isDirectory()) {
              const objDir = fs.readdirSync(path2 + '/objects')
              if (objDir.length === 0) {
                emptyRepo = true
              }
            } else {
              emptyRepo = true
            }

            if (emptyRepo && invalidRepoName) {
              console.log('  Deleting invalid repo: ' + path2)
              // Delete the directory
              fs.unlink(path2)

              // Remove from DB
              deleteRepoRecord(repo)
            } else {
              allDirs.push(dir2[ f2 ])
            }
          }
        }
      }
    }
  }
  console.log('  num repos:' + allDirs.length)
  return allDirs
}
