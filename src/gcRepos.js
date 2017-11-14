// @flow

const fs = require('fs')
const { dateString, getReposDir, snooze, getRepoListFile } = require('./common/syncUtils.js')

const LOOP_DELAY_MILLISECONDS = 5000

const gdate = dateString()

console.log(gdate + ' gcRepos.js starting')
const reposDir = getReposDir()
let repos: Array<string> = []

mainLoop()

async function mainLoop () {
  while (1) {
    if (repos.length === 0) {
      repos = getLocalDirs()
    }

    console.log('repos size:' + repos.length)
    const index = getRandomInt(0, repos.length - 1)
    const repo = repos[index]
    const localPath = reposDir + '/' + repo.substring(0, 2) + '/' + repo

    console.log(dateString() + ': path:' + localPath)
    try {
      // child_process.execFileSync('git', ['gc'], { timeout: 20000, stdio: std_noerr, cwd: localPath, killSignal: 'SIGKILL' })
      console.log('  [git gc success]')
    } catch (e) {
      console.log('  [git gc failed]')
    }
    repos.splice(index, 1)
    await snooze(LOOP_DELAY_MILLISECONDS)
  }
}

function getLocalDirs () {
  console.log('ENTER getLocalDirs')

  // If repolist.txt exists, use it. Otherwise, build up the list ourselves
  let allDirs = []

  const repolistFile = getRepoListFile()
  const exists = fs.existsSync(repolistFile)

  if (exists) {
    console.log('  Found local repolist.txt file')
    let arrayRepos = repoListToArray(repolistFile)
    allDirs = allDirs.concat(arrayRepos)
  } else {
    console.log('  Finding all local repos')
    const dir = fs.readdirSync(reposDir)
    let runSubset = false

    for (let f = 0; f < dir.length; f++) {
      // For testing only look for 'wa...' directories which are testing only
      if (runSubset && !dir[f].startsWith('ff')) {
        continue
      }

      const path = reposDir + '/' + dir[f]
      const stat = fs.statSync(path)
      if (stat.isDirectory()) {
        const dir2 = fs.readdirSync(path)
        for (let f2 = 0; f2 < dir2.length; f2++) {
          // For testing only look for 'wa...' directories which are testing only
          if (runSubset && !dir2[f2].startsWith('ffff')) {
            continue
          }
          const path2 = path + '/' + dir2[f2]
          const stat2 = fs.statSync(path2)
          if (stat2.isDirectory()) {
            allDirs.push(dir2[f2])
          }
        }
      }
    }
  }

  console.log('  num repos:' + allDirs.length)
  return allDirs
}

function repoListToArray (repolistfile) {
  const remoteRepoListRaw = fs.readFileSync(repolistfile).toString().split('\n')
  let remoteRepoList = []

  for (let m = 0; m < remoteRepoListRaw.length; m++) {
    const repo = remoteRepoListRaw[m]
    const fileArray = repo.split('/')
    if (fileArray.length > 1) {
      const file = fileArray[fileArray.length - 1]
      remoteRepoList.push(file)
    }
  }
  // console.log('    Num repos:' + remoteRepoList.length)

  return remoteRepoList
}

function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}
