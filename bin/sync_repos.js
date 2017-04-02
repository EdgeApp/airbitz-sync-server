const fs = require('fs')
const child_process = require('child_process')
const request = require('sync-request')

const std = ["pipe", "inherit", "inherit"]

var psresult = child_process.execFileSync('ps', ['xau'], { encoding: 'utf8' })
const psArray = psresult.split('\n')
var numRunning = 0
for (var i in psArray) {
  if (psArray[i].includes('sync_repos.js')) {
    numRunning++
  }
}

// Check if script is already running
//
// sync_repos.js is designed to be run as a cron job using a line such as
// 0 23 * * * node $HOME/sync_repos.js 2>&1 1>$HOME/sync_repos.log
// Run this way, two lines containing 'sync_repos.js' will show in the process list
// therefore we check for >2 to determine if we are already running
if (numRunning > 2) {
  console.log('sync_repos.js already running. Exiting')
  return
}

// const rootdir = '/Users/paul/git'
const rootdir = '/home/bitz/www/repos'
const servers = require('/etc/absync/absync.json')

const dir = fs.readdirSync(rootdir)

var allDirs = []

for (var f = 0; f < dir.length; f++) {

  // For testing only look for 'wa...' directories which are testing only
  if (false && !dir[f].startsWith('wa')) {
    continue
  }

  const path = rootdir + "/" + dir[f]
  const stat = fs.statSync(path)
  if (stat.isDirectory()) {

    const dir2 = fs.readdirSync(path)
    for (var f2 = 0; f2 < dir2.length; f2++) {
      // For testing only look for 'wa...' directories which are testing only
      if (false && !dir2[f2].startsWith('wa')) {
        continue
      }
      const path2 = path + '/' + dir2[f2]
      const stat2 = fs.statSync(path2)
      if (stat2.isDirectory()) {
        allDirs.push(
          {
            fullPath: path2,
            repoName: dir2[f2]
          }
        )
      }
    }
  }
  // console.log(dir[f] + ' is ' + stat.isDirectory())
}
// console.log(allDirs)

pushRepoLoop(allDirs, 0)

function pushRepoLoop (dirs, index) {

  console.log('pushRepoLoop ' + index)
  if (dirs.length <= index) {
    return
  } else {
    pushRepo(dirs[index])
    setTimeout(function () {
      pushRepoLoop(dirs, index + 1)
    }, 3000)
  }
}

function pushRepo (repo) {
  for (server in servers) {
    pushRepoToServer(repo, servers[server])
  }
}

function pushRepoToServer (repo, server) {
  var date = new Date()
  var log = date.toDateString() + ":" + date.toTimeString()
  log += " pushRepoToServer:" + server + " " + repo.repoName
  console.log(log)
  const path = server + "/repos/" + repo.repoName

  try {
    child_process.execFileSync('git', [ 'branch', '-D', 'incoming' ], {
      stdio: std,
      cwd: repo.fullPath,
      killSignal: 'SIGKILL'
    })
  } catch (e) {
    console.log('  [git branch failed]')
  }

  try {
    child_process.execFileSync('ab-sync', [repo.fullPath, path], { stdio: std, cwd: repo.fullPath, killSignal: 'SIGKILL' })
    console.log('  [ab-sync success]')
  } catch (e) {
    console.log('  [ab-sync failed]')
    request_repo_create(server, repo.repoName)
  }

  try {
    child_process.execFileSync('git', ['push', path, 'master'], { stdio: std, cwd: repo.fullPath, killSignal: 'SIGKILL' })
    console.log('  [git push success]')
  } catch (e) {
    console.log('  [git push failed]')
  }
}

function request_repo_create(server, name) {
  var url = server + '/api/v1/repo/create/'
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