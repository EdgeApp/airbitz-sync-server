const fs = require('fs')
const child_process = require('child_process')
const request = require('sync-request')
const rsync = require('rsync')

const std = ["pipe", "inherit", "inherit"]
const std_noerr = ["pipe", "inherit", "ignore"]

const LOOP_DELAY_MILLISECONDS = 5000

var gdate = dateString()

console.log(gdate + ' gc_repos.js starting')
const config = require('/etc/sync_repos.config.json')
const rootDir = config.userDir + config.reposDir

function dateString() {
  var date = new Date()
  return date.toDateString() + ":" + date.toTimeString()
}


let localRepos = getLocalDirs()

mainLoop(localRepos)

function mainLoop (repos) {

  console.log('repos size:' + repos.length)
  const index = getRandomInt(0, repos.length - 1)
  const repo = repos[index]
  const localPath = rootDir + '/' + repo.substring(0,2) + '/' + repo

  console.log(dateString() + ": path:" + localPath)
  try {
    // child_process.execFileSync('git', ['gc'], { timeout: 20000, stdio: std_noerr, cwd: localPath, killSignal: 'SIGKILL' })
    console.log('  [git gc success]')
  } catch (e) {
    console.log('  [git gc failed]')
  }
  repos.splice(index, 1)
  setTimeout(() => {
    mainLoop(repos)
  }, LOOP_DELAY_MILLISECONDS)
}

function getLocalDirs() {
  console.log('ENTER getLocalDirs')

  // If repolist.txt exists, use it. Otherwise, build up the list ourselves
  var allDirs = []

  const repolistFile = config.repoListPath + 'repolist.txt'
  const exists = fs.existsSync(repolistFile)

  if (exists) {
    console.log('  Found local repolist.txt file')
    let arrayRepos = repoListToArray(repolistFile)
    allDirs = allDirs.concat(arrayRepos)
  } else {
    console.log('  Finding all local repos')
    const dir = fs.readdirSync(rootDir)
    var run_subset = false

    for (var f = 0; f < dir.length; f++) {

      // For testing only look for 'wa...' directories which are testing only
      if (run_subset && !dir[f].startsWith('ff')) {
        continue
      }

      const path = rootDir + "/" + dir[f]
      const stat = fs.statSync(path)
      if (stat.isDirectory()) {

        const dir2 = fs.readdirSync(path)
        for (var f2 = 0; f2 < dir2.length; f2++) {
          // For testing only look for 'wa...' directories which are testing only
          if (run_subset && !dir2[f2].startsWith('ffff')) {
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
  const remoteRepoListRaw = fs.readFileSync(repolistfile).toString().split("\n")
  let remoteRepoList = []

  for (var m = 0; m < remoteRepoListRaw.length; m++) {
    const repo = remoteRepoListRaw[m]
    const file_array = repo.split('/')
    if (file_array.length > 1) {
      const file = file_array[file_array.length - 1]
      remoteRepoList.push(file)
    }
  }
  // console.log('    Num repos:' + remoteRepoList.length)

  return remoteRepoList
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

