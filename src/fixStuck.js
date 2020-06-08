// @flow

const cs = require('child_process')
const { snooze } = require('./common/syncUtils.js')

let procs = []
let newProcs = []

async function main() {
  while (1) {
    let ps: string = ''
    try {
      // $FlowFixMe
      ps = cs.execFileSync('ps', ['xau'], { encoding: 'utf8' })
    } catch (e) {}

    const psArray = ps.split('\n')

    for (const procLine of psArray) {
      let procType = null
      if (procLine.includes('git')) {
        procType = 'git'
      }
      if (procLine.includes('ab-sync')) {
        procType = 'ab-sync'
      }
      if (procType != null && procLine.includes('.airbitz.co')) {
        // const regEx = /bitz\s(\d*) (.*)sync\.airbitz\.co\/repos\/(.*) master/g
        const regEx = /bitz\s*(\d*) (.*)\.airbitz\.co\/repos\/(.*) /g
        const arr = regEx.exec(procLine)

        if (arr != null && arr.length > 0) {
          const procObj = { pid: arr[1], repoName: arr[3], procType }
          if (!findProc(procObj)) {
            newProcs.push(procObj)
            console.log('Adding proc')
            console.log(procObj)
          } else {
            // Kill the process
            try {
              cs.execFileSync('kill', ['-9', procObj.pid], { encoding: 'utf8' })
            } catch (e) {}
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
    await snooze(30000)
  }
}

function findProc(procObj) {
  for (const proc of procs) {
    if (
      proc.pid !== undefined &&
      procObj.pid !== undefined &&
      proc.repoName !== undefined &&
      procObj.repoName !== undefined &&
      proc.pid === procObj.pid &&
      proc.repoName === procObj.repoName
    ) {
      return true
    }
  }
  return false
}

// function removeProc (procObj) {
//   let i = 0
//   for (const proc in procs) {
//     if (proc.pid === procObj.pid &&
//       proc.repoName === procObj.repoName) {
//       procs.splice(i, 1)
//       return
//     }
//     i++
//   }
// }

main()
