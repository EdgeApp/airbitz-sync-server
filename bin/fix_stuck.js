const fs = require('fs')
const cs = require('child_process')

var procs = []
var newProcs = []


var psresult = cs.execFileSync('ps', ['xau'], { encoding: 'utf8' })
const psArray = psresult.split('\n')
var numRunning = 0
for (var i in psArray) {
  if (psArray[i].includes('fix_stuck.js')) {
    numRunning++
  }
}

// Check if script is already running
//
// fix_stuck.js is designed to be run as a cron job using a line such as
// 0 23 * * * node $HOME/fix_stuck.js 2>&1 1>$HOME/fix_stuck.log
// Run this way, two lines containing 'fix_stuck.js' will show in the process list
// therefore we check for >2 to determine if we are already running
if (numRunning > 2) {
  console.log('fix_stuck.js already running. Exiting')
  return
}


myMain()

function myMain () {
  var ps
  try {
    ps = cs.execFileSync('ps', [ 'xau' ], { encoding: 'utf8' })
  } catch (e) {}

  const psArray = ps.split('\n')

  for (i in psArray) {
    const procLine = psArray[i]
    if (procLine.includes('git') && procLine.includes('sync.airbitz.co')) {
      // const regEx = /bitz\s(\d*) (.*)sync\.airbitz\.co\/repos\/(.*) master/g
      const regEx = /bitz\s*(\d*) (.*)sync\.airbitz\.co\/repos\/(.*) /g
      const arr = regEx.exec(procLine)

      if (arr != null && arr.length > 0) {
        var procObj = {pid: arr[1], repoName: arr[3]}
        if (!findProc(procObj)) {
          newProcs.push(procObj)
          console.log('Adding proc')
          console.log(procObj)
        } else {
          // Kill the process
          try {
            cs.execFileSync('kill', ['-9', procObj.pid], {encoding: 'utf8'})
          } catch (e) {

          }
          console.log('Killing proc')
          console.log(procObj)
          // removeProc(procObj)
        }
      }
    } else {
      // console.log('Did not find proc')
    }
  }

  procs = newProcs.slice()
  newProcs = []
  console.log(procs)
  console.log(new Date())
  console.log('Sleeping...')
  setTimeout(myMain, 30000)
}


function findProc (procObj) {
  for (i in procs) {
    const proc = procs[i]

    if (proc.pid != undefined &&
      procObj.pid != undefined &&
        proc.repoName != undefined &&
        procObj.repoName != undefined &&
      proc.pid == procObj.pid &&
      proc.repoName == procObj.repoName) {
      return true
    }
  }
  return false
}

function removeProc (procObj) {
  for (i in procs) {
    const proc = procs[i]

    if (proc.pid == procObj.pid &&
      proc.repoName == procObj.repoName) {
      procs.splice(i, 1)
      return
    }
  }
  return
}

