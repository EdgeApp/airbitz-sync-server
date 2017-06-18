const fs = require('fs')
const sprintf = require('sprintf-js').sprintf
const childProcess = require('child_process')
const config = require('/etc/sync_repos.config.json')
const _writeDb = require('./update_hash.js').writeDb

// const request = require('sync-request')
// const rsync = require('rsync')
//
// const std = ["pipe", "inherit", "inherit"]
// const std_noerr = ["pipe", "inherit", "ignore"]
const LOOP_DELAY_MILLISECONDS = 10000

console.log(dateString() + ' update_db_hashes.js starting')

const _rootDir = config.userDir + config.reposDir

// const snooze = ms => new Promise(resolve => setTimeout(resolve, ms))

mainLoop()

async function mainLoop () {
  const localRepos = getLocalDirs()
  console.log('localRepos:' + localRepos.length)

  for (const n in localRepos) {
    const repoName = localRepos[n]
    const localPath = _rootDir + '/' + repoName.substring(0, 2) + '/' + repoName
    let commit = ''
    try {
      // console.log(localPath)
      commit = childProcess.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 3000, cwd: localPath, killSignal: 'SIGKILL' })
      commit = commit.replace(/(\r\n|\n|\r)/gm, '')
      // const commit = child_process.execFileSync('git', ['rev-parse', 'HEAD'], { timeout: 3000, stdio: std_noerr, cwd: localPath, killSignal: 'SIGKILL' })
      // console.log('  [git rev-parse success] ' + commit)
      await _writeDb(config.serverName, repoName, commit)
      console.log(sprintf('writeDb SUCCESS %-5s %-41s %-41s', config.serverName, repoName, commit))
    } catch (e) {
      console.log(sprintf('writeDb FAILED  %-5s %-41s %-41s', config.serverName, repoName, commit))
    }
    // break
  }

  // await snooze(LOOP_DELAY_MILLISECONDS)
  // mainLoop()
//
//     for (const s in servers) {
//       const server = servers[s]
//       let remoteRepos = getRemoteRepoList(server)
//       let intersectDiffRepos = arrayDiffIntersect(localRepos, remoteRepos, true)
//       let diffLocal = intersectDiffRepos.diff
//       const intersectRepos = intersectDiffRepos.intersect
//       console.log('diffLocal:' + diffLocal.length)
//       console.log('intersectRepos:' + intersectRepos.length)
//       let diffRemote = arrayDiffIntersect(remoteRepos, localRepos)
//       console.log('diffRemote:' + diffRemote.length)
//
//       if (diffLocal.length == 0 && diffRemote.length == 0) {
//         console.log('No diffs to sync')
//         break
//       }
//       if (diffRemote.length > 0) {
//         console.log('Call syncReposLoop for diffRemote:' + diffRemote.length)
//         failedRepos = syncReposLoop(diffRemote, server)
//         allFailedRepos = allFailedRepos.concat(failedRepos)
//       }
//
//       if (diffLocal.length > 0) {
//         console.log('Call syncReposLoop for diffLocal:' + diffLocal.length)
//         failedRepos = syncReposLoop(diffLocal, server)
//         allFailedRepos = allFailedRepos.concat(failedRepos)
//       }
//
//       console.log('Retrying failed repos from diffs')
//       failedRepos = syncReposLoop(allFailedRepos)
//
//       console.log(dateString() + ': *** Failed Repos from diffs ***')
//       console.log(failedRepos)
//       console.log('*** Failed Repos from diffs ***')
//     }
//   }
//
//   // Sync the intersection of each server (this is SLOW!)
//   for (const s in servers) {
//     const server = servers[ s ]
//     let intersectDiffRepos = []
//
//     let remoteRepos = getRemoteRepoList(server)
//     intersectDiffRepos = arrayDiffIntersect(localRepos, remoteRepos, true)
//     const intersectRepos = intersectDiffRepos.intersect
//
//     console.log('Call syncReposLoop for intersection')
//     failedRepos = syncReposLoop(intersectRepos, server)
//
//     console.log('Retrying failed repos from intersection')
//     failedRepos = syncReposLoop(failedRepos)
//     console.log(dateString() + ': *** Failed Repos from intersection ***')
//     console.log(failedRepos)
//     console.log('*** Failed Repos from intersection ***')
//   }
//
//   // let bFirst = true
//   //
//   // let numTotalRepos = localRepos.length
//   //
//   // for (let doRepoDiffs = 0; doRepoDiffs < 3; doRepoDiffs++) {
//   //   if (bFirst) {
//   //     bFirst = false
//   //   } else {
//   //     remoteRepos = getRemoteRepoList()
//   //     localRepos = getLocalDirs()
//   //     // 'diff' are the repos that are not in both the local machine and remote machine
//   //     // Do those first before anything else
//   //     diffLocal = arrayDiffIntersect(localRepos, remoteRepos, false)
//   //     diffRemote = arrayDiffIntersect(remoteRepos, localRepos)
//   //   }
//   //
//   //   if (diffLocal.length > 0) {
//   //     console.log('Call syncReposLoop for diffLocal:' + diffLocal.length)
//   //     failedRepos = syncReposLoop(diffLocal)
//   //     console.log('Retrying failed repos from diffLocal')
//   //     failedRepos = syncReposLoop(failedRepos)
//   //     console.log('*** Failed Repos from diffLocal ***')
//   //     console.log(failedRepos)
//   //   }
//   //
//   //   if (diffRemote.length > 0) {
//   //     console.log('Call syncReposLoop for diffRemote:' + diffRemote.length)
//   //     failedRepos = syncReposLoop(diffRemote)
//   //     console.log('Retrying failed repos from diffRemote')
//   //     failedRepos = syncReposLoop(failedRepos)
//   //     console.log('*** Failed Repos from diffRemote ***')
//   //     console.log(failedRepos)
//   //   }
//   //
//   //   if (diffLocal.length == 0 && diffRemote.length == 0) {
//   //     doRepoDiffs = 3
//   //   }
//   // }
//   // console.log('Call syncReposLoop for intersection')
//   // failedRepos = syncReposLoop(intersectRepos)
//   // console.log('Retrying failed repos from intersection')
//   // failedRepos = syncReposLoop(failedRepos)
//   // console.log('*** Failed Repos from intersection ***')
//   // console.log(failedRepos)
}

// async function writeDb (server, repo, hash) {
//   console.log('ENTER writeDb:' + repo + ' hash:' + hash)
//   return new Promise((resolve, reject) => {
//     _dbRepos.get(repo, function (err, response) {
//       if (err) {
//         if (err.error === 'not_found') {
//           // Create the db entry
//           resolve(insertDb(server, repo, hash))
//         } else {
//           console.log(err)
//           reject(err)
//         }
//       } else {
//         resolve(insertDb(server, repo, hash, response))
//       }
//     })
//   })
// }
//
// async function insertDb (server, repo, hash, repoObj = {}) {
//   console.log('ENTER insertDB:' + repo + ' hash:' + hash)
//   repoObj[server] = hash
//
//   return new Promise((resolve, reject) => {
//     _dbRepos.insert(repoObj, repo, function (err, res) {
//       if (err) {
//         resolve(writeDb(server, repo, hash))
//       } else {
//         console.log('  Insert ' + repo + ' SUCCESS')
//         resolve()
//       }
//     })
//   })
// }

function dateString () {
  const date = new Date()
  return date.toDateString() + ':' + date.toTimeString()
}

function repoListToArray (repolistfile) {
  const remoteRepoListRaw = fs.readFileSync(repolistfile).toString().split('\n')
  const remoteRepoList = []

  for (let m = 0; m < remoteRepoListRaw.length; m++) {
    const repo = remoteRepoListRaw[m]
    const fileArray = repo.split('/')
    if (fileArray.length > 1) {
      const file = fileArray[fileArray.length - 1]
      remoteRepoList.push(file)
    }
  }
  // console.log('    Num repos:' + remoteRepoList.length)

  return remoteRepoList
}
//
// function getRemoteRepoList (server) {
//   console.log('ENTER getRemoteRepoList: ' + server)
//   const userAtServer = 'readuser@' + server + ":repolist.txt"
//   const serverFile = 'repos-' + server + '.txt'
//   try {
//     child_process.execFileSync('rsync', [ userAtServer, config.userDir + serverFile ], {
//       stdio: std,
//       cwd: config.userDir,
//       killSignal: 'SIGKILL'
//     })
//     console.log('  [rsync success] ' + userAtServer)
//   } catch (e) {
//     console.log('  [rsync failed] ' + userAtServer)
//   }
//
//   const remoteRepos = repoListToArray(config.userDir + serverFile)
//   console.log('  remoteRepos size:' + remoteRepos.length)
//   return remoteRepos
// }
//
//
//
// // const a = ['a', 'b', 'f', 'c1', 'd', 'e']
// // const b = ['a', 'z', 'b', 'c1', 'd', 'zh']
// //
// // console.log(arrayDiffIntersect(a,b,true))
//
// function hashCode(string){
//   var hash = 0;
//   if (string.length == 0) return hash;
//   for (i = 0; i < string.length; i++) {
//     let char = string.charCodeAt(i);
//     hash = ((hash<<5)-hash)+char;
//     hash = hash & hash; // Convert to 32bit integer
//   }
//   return hash;
// }
//
// // Returns a diff and/or intersection of two arrays of strings
// // Diff only returns the items in a that are not in b
// function arrayDiffIntersect(a, b, bDoIntersect=false) {
//   const alen = a.length
//   const blen = b.length
//
//   let ahash = []
//   let bhash = []
//
//   // Make hash table of arrays for fast comparison
//   console.log('Making hashes')
//   for (let n = 0; n < alen; n++) {
//     ahash[n]  = hashCode(a[n])
//   }
//   for (let n = 0; n < blen; n++) {
//     code = hashCode(b[n])
//     bhash[code] = true
//   }
//   console.log('Done with hashes')
//
//   let diff = []
//   let intersect = []
//   let iter = 0
//
//   for (let n = 0; n < alen; n++) {
//
//     let match = false
//
//     let ahashcode  = ahash[n]
//
//     if (bhash[ahashcode] != undefined && bhash[ahashcode] == true) {
//       match = true
//       if (bDoIntersect) {
//         intersect.push(a[n])
//       }
//     }
//
//     if (!match) {
//       diff.push(a[n])
//     }
//   }
//
//   if (bDoIntersect) {
//     return {diff, intersect}
//   } else {
//     return diff
//   }
// }
//
function getLocalDirs () {
  console.log('ENTER getLocalDirs')

  // If repolist.txt exists, use it. Otherwise, build up the list ourselves
  let allDirs = []

  const repolistFile = config.repoListPath + 'repolist.txt'
  const exists = fs.existsSync(repolistFile)

  if (exists) {
    console.log('  Found local repolist.txt file')
    const arrayRepos = repoListToArray(repolistFile)
    allDirs = allDirs.concat(arrayRepos)
  } else {
    console.log('  Finding all local repos')
    const dir = fs.readdirSync(_rootDir)
    const RUN_SUBSET = false

    for (let f = 0; f < dir.length; f++) {
      // For testing only look for 'wa...' directories which are testing only
      if (RUN_SUBSET && !dir[ f ].startsWith('ff')) {
        continue
      }

      const path = _rootDir + '/' + dir[ f ]
      const stat = fs.statSync(path)
      if (stat.isDirectory()) {
        const dir2 = fs.readdirSync(path)
        for (let f2 = 0; f2 < dir2.length; f2++) {
          // For testing only look for 'wa...' directories which are testing only
          if (RUN_SUBSET && !dir2[ f2 ].startsWith('ffff')) {
            continue
          }
          const path2 = path + '/' + dir2[ f2 ]
          const stat2 = fs.statSync(path2)
          if (stat2.isDirectory()) {
            allDirs.push(dir2[ f2 ])
          }
        }
      }
    }
  }
  console.log('  num repos:' + allDirs.length)
  return allDirs
}

//
// function getRandomInt(min, max) {
//   min = Math.ceil(min);
//   max = Math.floor(max);
//   return Math.floor(Math.random() * (max - min)) + min;
// }
//
// function syncReposLoop (dirs, server) {
//
//   const numDirs = dirs.length
//   let failedRepos = []
//
//   while (dirs.length) {
//     const completed = (numDirs - dirs.length)
//     console.log('syncReposLoop ' + completed + " of " + numDirs + " failed:" + failedRepos.length)
//     const index = getRandomInt(0, dirs.length - 1)
//     const retval = syncRepoWithServer(dirs[index], server)
//     if (!retval) {
//       failedRepos.push(dirs[index])
//     }
//     dirs.splice(index, 1)
//   }
//   return failedRepos
// }
// //
// // function pushRepo (repo) {
// //   let retval = true
// //   for (server in servers) {
// //     let retval2 = syncRepoWithServer(repo, servers[server])
// //     if (!retval2) {
// //       retval = false
// //     }
// //   }
// //   return retval
// // }
//
// function syncRepoWithServer (repoName, server) {
//   var date = new Date()
//   const localPath = rootDir + '/' + repoName.substring(0,2) + '/' + repoName
//   var log = date.toDateString() + ":" + date.toTimeString()
//   log += " syncRepoWithServer:" + server + " " + repoName
//   console.log(log)
//   const serverPath = config.serverPrefix + server + "/repos/" + repoName
//
//   return true
//
//   // If local directory doesn't exist, create it
//   const exists = fs.existsSync(localPath)
//   if (!exists) {
//     console.log('  [No local repo]')
//     try {
//       child_process.execFileSync('create_ab_repo.sh', [ rootDir, repoName ], {
//         stdio: std_noerr,
//         cwd: localPath,
//         killSignal: 'SIGKILL'
//       })
//       console.log('  [create_ab_repo success]')
//     } catch (e) {
//       console.log('  [create_ab_repo failed]')
//     }
//   }
//
//   try {
//     child_process.execFileSync('git', [ 'branch', '-D', 'incoming' ], {
//       stdio: std_noerr,
//       cwd: localPath,
//       killSignal: 'SIGKILL'
//     })
//   } catch (e) {
//     console.log('  [git branch failed]')
//   }
//
//   try {
//     child_process.execFileSync('ab-sync', [localPath, serverPath], { timeout: 20000, stdio: std_noerr, cwd: localPath, killSignal: 'SIGKILL' })
//     console.log('  [ab-sync success]')
//   } catch (e) {
//     console.log('  [ab-sync failed]')
//     request_repo_create(server, repoName)
//   }
//
//   try {
//     child_process.execFileSync('git', ['push', serverPath, 'master'], { timeout: 20000, stdio: std_noerr, cwd: localPath, killSignal: 'SIGKILL' })
//     console.log('  [git push success]')
//   } catch (e) {
//     console.log('  [git push failed]')
//     return false
//   }
//   return true
// }
//
// function request_repo_create(server, name) {
//   var url = config.serverPrefix + server + '/api/v1/repo/create/'
//   var data = {json: {"repo_name": name}}
//
//   try {
//     res = request('POST', url, {json: {"repo_name": name}})
//     console.log('  [remote repo created]')
//     return true
//   } catch (e) {
//     console.log('  [remote repo create failed]')
//     return false
//   }
// }
