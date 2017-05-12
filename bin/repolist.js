const fs = require('fs')
const child_process = require('child_process')
const request = require('sync-request')
const rsync = require('rsync')

const std = ["pipe", "inherit", "inherit"]

var gdate = new Date()
var glog = gdate.toDateString() + ":" + gdate.toTimeString()

console.log(glog + ' sync_repos.js starting')
const config = require('/etc/sync_repos.config.json')
const rootDir = config.userDir + config.reposDir

// Spin off the loop that creates the repolist for this machine
function loopWriteRepoList() {
  console.log('ENTER loopWriteRepoList')
  child_process.execFile('find', [ rootDir, '-maxdepth', '2', '-mindepth', '2'], {
    stdio: std,
    cwd: config.userDir,
    killSignal: 'SIGKILL'
  }, (error, stdout, stderr) => {
    if (error) {
      console.log (error)
    }
    console.log('loopWriteRepoList: writing repolist.txt')
    fs.writeFile(config.repoListPath + 'repolist.txt', stdout, (err) => {
      if (err) {
        console.log (err)
      } else {
        console.log('loopWriteRepoList: writing repolist.txt SUCCESS')
        setTimeout(() => {
          loopWriteRepoList()
        }, 300000)
      }
    });
    console.log(stdout);
  })

}

loopWriteRepoList()
