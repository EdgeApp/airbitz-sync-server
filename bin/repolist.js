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
  var newdate = new Date()
  console.log(newdate.toDateString() + ":" + newdate.toTimeString())
  console.log('ENTER loopWriteRepoList')
  const stdout_string = child_process.execFileSync('find', [ rootDir, '-maxdepth', '2', '-mindepth', '2'], {
    // stdio: std,
    cwd: config.userDir,
    killSignal: 'SIGKILL'
  })

  console.log('loopWriteRepoList: writing repolist.txt')
  fs.writeFileSync(config.userDir + 'repolist.tmp', stdout_string)
  fs.createReadStream(config.userDir + 'repolist.tmp').pipe(fs.createWriteStream(config.repoListPath + 'repolist.txt'));

  console.log('loopWriteRepoList: writing repolist.txt SUCCESS')
  setTimeout(() => {
    loopWriteRepoList()
  }, 300000)

}

loopWriteRepoList()
