// @flow

const fs = require('fs')
const childProcess = require('child_process')
const { dateString, getReposDir, snooze } = require('./common/syncUtils.js')

console.log(dateString() + ' repolist.js starting')

// $FlowFixMe
const config = require('/etc/syncConfig.json')
const reposDir = getReposDir()

// Spin off the loop that creates the repolist for this machine
async function main () {
  while (1) {
    console.log(dateString())
    console.log('ENTER loopWriteRepoList')
    const stdoutString = childProcess.execFileSync('find', [ reposDir, '-maxdepth', '2', '-mindepth', '2' ], {
      // stdio: std,
      cwd: config.userDir,
      killSignal: 'SIGKILL'
    })

    console.log('loopWriteRepoList: writing repolist.txt')
    fs.writeFileSync(config.userDir + 'repolist.tmp', stdoutString)
    fs.createReadStream(config.userDir + 'repolist.tmp').pipe(fs.createWriteStream(config.repoListPath + 'repolist.txt'))

    console.log('loopWriteRepoList: writing repolist.txt SUCCESS')
    await snooze(300000)
  }
}

main()
