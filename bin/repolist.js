const fs = require('fs')
const child_process = require('child_process')
const request = require('sync-request')
const rsync = require('rsync')

const std = ["pipe", "inherit", "inherit"]

var gdate = new Date()
var glog = gdate.toDateString() + ":" + gdate.toTimeString()

console.log(glog + ' repolist.js starting')
const config = require('/etc/sync_repos.config.json')
const rootDir = config.userDir + config.reposDir

// Spin off the loop that creates the repolist for this machine
function loopWriteRepoList() {
  console.log('ENTER loopWriteRepoList')
  const stdout_string = child_process.execFileSync('find', [ rootDir, '-maxdepth', '2', '-mindepth', '2'], {
    // stdio: std,
    cwd: config.userDir,
    killSignal: 'SIGKILL'
  })

  console.log('loopWriteRepoList: writing repolist.txt')
  fs.writeFileSync(config.repoListPath + 'repolist.txt', stdout_string)

  console.log('loopWriteRepoList: writing repolist.txt SUCCESS')
  setTimeout(() => {
    loopWriteRepoList()
  }, 300000)

}

loopWriteRepoList()