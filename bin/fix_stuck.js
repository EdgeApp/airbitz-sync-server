#!/usr/bin/nodejs

const fs = require('fs')
const cs = require('child_process')

var procs = []
var newProcs = []

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

    if (proc.pid == procObj.pid &&
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

