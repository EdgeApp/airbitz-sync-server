const fs = require('fs')
const child_process = require('child_process')
const request = require('sync-request')
const rsync = require('rsync')

const std = ["pipe", "inherit", "inherit"]
const std_noerr = ["pipe", "inherit", "ignore"]

const LOOP_DELAY_MILLISECONDS = 10
const REPO_PUSH_FAIL = 0
const REPO_PUSH_SUCCESS = 1
const REPO_PUSH_EMPTY = 2

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
  console.log('remoteRepos:' + remoteRepos.length)
  console.log('localRepos:' + localRepos.length)

  let intersectDiffRepos = arrayDiffIntersect(localRepos, remoteRepos, true)
  let diff = intersectDiffRepos.diff
  const intersectRepos = intersectDiffRepos.intersect
  console.log('intersectRepos:' + intersectRepos.length)
  console.log('diff:' + diff.length)
  let bFirst = true

  let numTotalRepos = localRepos.length
  let resultRepos = []

  for (let doRepoDiffs = 0; doRepoDiffs < 3; doRepoDiffs++) {
    if (bFirst) {
      bFirst = false
    } else {
      remoteRepos = getRemoteRepoList()
      localRepos = getLocalDirs()
      // 'diff' are the repos that are not in both the local machine and remote machine
      // Do those first before anything else
      diff = arrayDiffIntersect(localRepos, remoteRepos, false)
    }

    if (diff.length > 0) {
      console.log('Call pushRepoLoop for diffs:' + diff.length)
      resultRepos = pushRepoLoop(diff)
      console.log('*** Empty Repos from diffs ***')
      console.log(resultRepos.emptyRepos)

      console.log('Retrying failed repos from diffs')
      resultRepos = pushRepoLoop(resultRepos.failedRepos)
      console.log('*** Failed Repos from diffs ***')
      console.log(resultRepos.failedRepos)
    } else {
      doRepoDiffs = 3
    }
  }
  console.log('Call pushRepoLoop for intersection')
  resultRepos = pushRepoLoop(intersectRepos)
  console.log('*** Empty Repos from intersection ***')
  console.log(resultRepos.emptyRepos)

  console.log('Retrying failed repos from intersection')
  resultRepos = pushRepoLoop(resultRepos.failedRepos)
  console.log('*** Failed Repos from intersection ***')
  console.log(resultRepos.failedRepos)

  setTimeout(() => {
    mainLoop()
  }, LOOP_DELAY_MILLISECONDS)
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
  console.log('    Num repos:' + remoteRepoList.length)

  return remoteRepoList
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

    let arrayRepos = repoListToArray(config.userDir + serverFile)
    repoLists.push(arrayRepos)
  }

  let indexOfSmallestRepo = 0
  let sizeOfSmallestRepo = 999999999
  console.log('  repoLists.length:' + repoLists.length)
  for (var n = 0; n < repoLists.length; n++) {
    console.log('  repoLists[' + n + '].length:' + repoLists[n].length)
    if (repoLists[n].length < sizeOfSmallestRepo) {
      indexOfSmallestRepo = n
      sizeOfSmallestRepo = repoLists[n].length
      console.log('  indexOfSmallestRepo:' + indexOfSmallestRepo)
      console.log('  sizeOfSmallestRepo:' + sizeOfSmallestRepo)
    }
    // finalList = [...new Set([...finalList, ...repoLists[n]])]
  }
  const finalList = repoLists[indexOfSmallestRepo]
  console.log('  finalList size:' + finalList.length)
  return finalList
}


function dateString() {
  var date = new Date()
  return date.toDateString() + ":" + date.toTimeString()

}

// const a = ['a', 'b', 'f', 'c1', 'd', 'e']
// const b = ['a', 'z', 'b', 'c1', 'd', 'zh']
//
// console.log(arrayDiffIntersect(a,b,true))

function hashCode(string){
  var hash = 0;
  if (string.length == 0) return hash;
  for (i = 0; i < string.length; i++) {
    let char = string.charCodeAt(i);
    hash = ((hash<<5)-hash)+char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Returns a diff and/or intersection of two arrays of strings
// Diff only returns the items in a that are not in b
function arrayDiffIntersect(a, b, bDoIntersect=false) {
  const alen = a.length
  const blen = b.length

  let ahash = []
  let bhash = []

  // Make hash table of arrays for fast comparison
  console.log('Making hashes')
  for (let n = 0; n < alen; n++) {
    ahash[n]  = hashCode(a[n])
  }
  for (let n = 0; n < blen; n++) {
    code = hashCode(b[n])
    bhash[code] = true
  }
  console.log('Done with hashes')

  let diff = []
  let intersect = []
  let iter = 0

  for (let n = 0; n < alen; n++) {

    let match = false

    let ahashcode  = ahash[n]

    if (bhash[ahashcode] != undefined && bhash[ahashcode] == true) {
      match = true
      if (bDoIntersect) {
        intersect.push(a[n])
      }
    }

    if (!match) {
      diff.push(a[n])
    }
  }

  if (bDoIntersect) {
    return {diff, intersect}
  } else {
    return diff
  }
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

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function pushRepoLoop (dirs) {

  const numDirs = dirs.length
  let failedRepos = []
  let emptyRepos = []

  while (dirs.length) {
    const completed = (numDirs - dirs.length)
    console.log('pushRepoLoop ' + completed + " of " + numDirs + " failed:" + failedRepos.length + " empty:" + emptyRepos.length)
    const index = getRandomInt(0, dirs.length - 1)
    const retval = pushRepo(dirs[index])
    if (retval == REPO_PUSH_FAIL) {
      failedRepos.push(dirs[index])
    } else if (retval == REPO_PUSH_EMPTY) {
      emptyRepos.push(dirs[index])
    }
    dirs.splice(index, 1)
  }
  return { failedRepos, emptyRepos }
}

function pushRepo (repo) {
  let retval = REPO_PUSH_SUCCESS
  for (server in servers) {
    let retval2 = pushRepoToServer(repo, servers[server])
    if (retval2 != REPO_PUSH_SUCCESS) {
      retval = retval2
    }
  }
  return retval
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
      stdio: std_noerr,
      cwd: localPath,
      killSignal: 'SIGKILL'
    })
  } catch (e) {
    console.log('  [git branch failed]')
  }

  try {
    child_process.execFileSync('ab-sync', [localPath, serverPath], { timeout: 20000, stdio: std_noerr, cwd: localPath, killSignal: 'SIGKILL' })
    console.log('  [ab-sync success]')
  } catch (e) {
    console.log('  [ab-sync failed]')
    request_repo_create(server, repoName)
  }


  try {
    const r = child_process.execFileSync('find', ['objects', '-type', 'f'], { timeout: 20000, cwd: localPath, killSignal: 'SIGKILL' })

    if (r.length > 0) {
      try {
        child_process.execFileSync('git', ['push', serverPath, 'master'], { timeout: 20000, stdio: std_noerr, cwd: localPath, killSignal: 'SIGKILL' })
        console.log('  [git push success]')
      } catch (e) {
        console.log('  [git push failed]')
        return false
      }
    } else {
      console.log('  [git push unneeded. Empty repo]')
    }
  } catch (e) {
      console.log('  [git push unneeded. Empty repo (exc)]')
  }
  return true
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