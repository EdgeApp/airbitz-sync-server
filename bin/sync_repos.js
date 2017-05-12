const fs = require('fs')
const child_process = require('child_process')
const request = require('sync-request')
const rsync = require('rsync')

const std = ["pipe", "inherit", "inherit"]

const LOOP_DELAY_MILLISECONDS = 100
// var psresult = child_process.execFileSync('ps', ['xau'], { encoding: 'utf8' })
// const psArray = psresult.split('\n')
// var numRunning = 0
// for (var i in psArray) {
//   if (psArray[i].includes('sync_repos.js')) {
//     numRunning++
//   }
// }

// Check if script is already running
//
// sync_repos.js is designed to be run as a cron job using a line such as
// 0 23 * * * node $HOME/sync_repos.js 2>&1 1>$HOME/sync_repos.log
// Run this way, two lines containing 'sync_repos.js' will show in the process list
// therefore we check for >2 to determine if we are already running
// if (numRunning > 2) {
//   var date = new Date()
//   var log = date.toDateString() + ":" + date.toTimeString()
//   console.log(log + ' sync_repos.js already running. Exiting')
//   return
// }

var gdate = new Date()
var glog = gdate.toDateString() + ":" + gdate.toTimeString()

console.log(glog + ' sync_repos.js starting')
const config = require('/etc/sync_repos.config.json')
const rootDir = config.userDir + config.reposDir
// const rootDir = '/home/bitz/www/repos'
const servers = require('/etc/absync/absync.json')

mainLoop()

function mainLoop () {
  let remoteRepos = getRemoteRepoList()
  let localRepos = getLocalDirs()
  let intersectRepos = intersect(localRepos, remoteRepos)
  console.log('intersectRepos:' + intersectRepos.length)
  let bFirst = true

  let numTotalRepos = localRepos.length

  for (let doRepoDiffs = 0; doRepoDiffs < 3; doRepoDiffs++) {
    if (bFirst) {
      bFirst = false
    } else {
      remoteRepos = getRemoteRepoList()
      localRepos = getLocalDirs()
    }

    // 'diff' are the repos that are not in both the local machine and remote machine
    // Do those first before anything else
    const diff = arrayDiff(localRepos, remoteRepos)
    if (diff.length > 0) {
      console.log('Call pushRepoLoop for diffs:' + diff.length)
      pushRepoLoop(diff)
    } else {
      doRepoDiffs = 3
    }
  }
  console.log('Call pushRepoLoop for intersection')
  pushRepoLoop(intersectRepos)

  setTimeout(() => {
    mainLoop()
  }, 1000)
}

function getRemoteRepoList () {
  console.log('ENTER getRemoteRepoList')
  let repoLists = []
  for (let n = 0; n < servers.length; n++) {
    // Rsync the remote file list from remote server
    const userAtServer = 'readuser@' + servers[n] + ":repolist.txt"
    const serverFile = 'repos-' + servers[n] + '.txt'
    try {
      child_process.execFileSync('rsync', [ userAtServer, config.userDir + serverFile ], {
        stdio: std,
        cwd: config.userDir,
        killSignal: 'SIGKILL'
      })
      console.log('  [rsync success] ' + userAtServer)
    } catch (e) {
      console.log('  [rsync failed] ' + userAtServer)
      continue
    }
    const remoteRepoListRaw = fs.readFileSync(config.userDir + serverFile).toString().split("\n")
    var remoteRepoList = []

    for (var m = 0; m < remoteRepoListRaw.length; m++) {
      const repo = remoteRepoListRaw[m]
      const file_array = repo.split('/')
      if (file_array.length > 1) {
        const file = file_array[file_array.length - 1]
        remoteRepoList.push(file)
      }
    }
    console.log('    Num repos:' + remoteRepoList.length)
    repoLists.push(remoteRepoList)
  }
  let finalList = repoLists[0]

  for (var n = 1; n < repoLists.length; n++) {
    finalList = [...new Set([...finalList, ...repoLists[n]])]
  }
  const finalListArray = Array.from(finalList)
  console.log('finalList size:' + finalList.length)
  return finalList
}

function arrayDiff(a, b) {
  return a.filter(function(i) {return b.indexOf(i) < 0})
}

function intersect(a, b) {
  const alen = a.length
  const blen = b.length

  if (blen > alen) {
    return b.filter(function (e) {
      return a.indexOf(e) > -1
    })
  } else {
    return a.filter(function (e) {
      return b.indexOf(e) > -1
    })
  }

}

function getLocalDirs() {
  console.log('ENTER getLocalDirs')
  const dir = fs.readdirSync(rootDir)

// Add a diff method to arrays

  var allDirs = []

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
    // console.log(dir[f] + ' is ' + stat.isDirectory())
  }
// console.log(allDirs)
  console.log('  num repos:' + allDirs.length)
  return allDirs
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function pushRepoLoop (dirs) {

  const numDirs = dirs.length

  while (dirs.length) {
    const completed = (numDirs - dirs.length)
    console.log('pushRepoLoop ' + completed + " of " + numDirs)
    const index = getRandomInt(0, dirs.length - 1)
    pushRepo(dirs[index])
    dirs.splice(index, 1)
  }
}

function pushRepo (repo) {
  for (server in servers) {
    pushRepoToServer(repo, servers[server])
  }
}

function pushRepoToServer (repoName, server) {
  var date = new Date()
  const localPath = rootDir + '/' + repoName.substring(0,2) + '/' + repoName
  var log = date.toDateString() + ":" + date.toTimeString()
  log += " pushRepoToServer:" + server + " " + repoName
  console.log(log)
  const serverPath = config.serverPrefix + server + "/repos/" + repoName

  try {
    child_process.execFileSync('git', [ 'branch', '-D', 'incoming' ], {
      stdio: std,
      cwd: localPath,
      killSignal: 'SIGKILL'
    })
  } catch (e) {
    console.log('  [git branch failed]')
  }

  try {
    child_process.execFileSync('ab-sync', [localPath, serverPath], { timeout: 20000, stdio: std, cwd: localPath, killSignal: 'SIGKILL' })
    console.log('  [ab-sync success]')
  } catch (e) {
    console.log('  [ab-sync failed]')
    request_repo_create(server, repoName)
  }

  try {
    child_process.execFileSync('git', ['push', serverPath, 'master'], { timeout: 20000, stdio: std, cwd: localPath, killSignal: 'SIGKILL' })
    console.log('  [git push success]')
  } catch (e) {
    console.log('  [git push failed]')
  }
}

function request_repo_create(server, name) {
  var url = config.serverPrefix + server + '/api/v1/repo/create/'
  var data = {json: {"repo_name": name}}

  try {
    res = request('POST', url, {json: {"repo_name": name}})
    console.log('  [remote repo created]')
    return true
  } catch (e) {
    console.log('  [remote repo create failed]')
    return false
  }
}