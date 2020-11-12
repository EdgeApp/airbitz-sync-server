// @flow

import childProcess from 'child_process'
import fs from 'fs'
import { sprintf } from 'sprintf-js'

import {
  dateString,
  easyEx,
  getHostname,
  getRepoListFile,
  getRepoPath,
  getReposDir,
  isHex,
  moveRepoToBackup,
  parseIntSafe
} from './common/syncUtils.js'
import { updateHash, getRepoHash } from './common/updateHashInner.js'

console.log(dateString() + ' updateReposHashes.js starting')

const hostname = getHostname()

const TEST_ONLY = false // Set to true to not execute any disk write functions
const MOVE_INVALID_REPOS = true
const RUN_SUBSET = false
const SUBSET_PREFIX = 'ffff'

mainLoop()

async function mainLoop() {
  const localRepos = await getLocalDirs()
  console.log('localRepos:' + localRepos.length)

  let n = 0
  for (const repoName of localRepos) {
    n++
    let commit = ''
    try {
      commit = await getRepoHash(repoName)
      if (TEST_ONLY) {
        console.log(
          sprintf(
            'TEST updateHash host:%s repoName:%s hash:%s',
            hostname,
            repoName,
            commit || 'null'
          )
        )
      } else {
        await updateHash(hostname, repoName, commit)
      }
      console.log(
        sprintf(
          'writeDb %d/%d SUCCESS %-5s %-41s %-41s',
          n,
          localRepos.length,
          hostname,
          repoName,
          commit
        )
      )
    } catch (e) {
      console.log(
        sprintf(
          'writeDb %d/%d FAILED  %-5s %-41s %-41s',
          n,
          localRepos.length,
          hostname,
          repoName,
          commit
        )
      )
    }
  }
}

function repoListToArray(repolistfile) {
  const remoteRepoListRaw = fs
    .readFileSync(repolistfile)
    .toString()
    .split('\n')
  const remoteRepoList = []

  for (let m = 0; m < remoteRepoListRaw.length; m++) {
    const repo = remoteRepoListRaw[m]
    const fileArray = repo.split('/')
    if (fileArray.length > 1) {
      const file = fileArray[fileArray.length - 1]
      remoteRepoList.push(file)
    }
  }

  return remoteRepoList
}

async function getLocalDirs() {
  console.log('ENTER getLocalDirs')

  // If repolist.txt exists, use it. Otherwise, build up the list ourselves
  let allDirs = []

  const repolistFile = getRepoListFile()
  const exists = fs.existsSync(repolistFile)

  if (exists) {
    console.log('  Found local repolist.txt file')
    const arrayRepos = repoListToArray(repolistFile)
    allDirs = allDirs.concat(arrayRepos)
  } else {
    const reposDir = getReposDir()
    console.log('  Finding all local repos in: ' + reposDir)
    const dir = fs.readdirSync(reposDir)

    for (let f = 0; f < dir.length; f++) {
      // For testing only look for 'wa...' directories which are testing only
      if (RUN_SUBSET && !dir[f].startsWith(SUBSET_PREFIX.slice(0, 2))) {
        continue
      }

      try {
        const path = reposDir + '/' + dir[f]
        const stat = fs.statSync(path)
        if (stat.isDirectory()) {
          const dir2 = fs.readdirSync(path)
          for (let f2 = 0; f2 < dir2.length; f2++) {
            // For testing only look for 'wa...' directories which are testing only
            if (RUN_SUBSET && !dir2[f2].startsWith(SUBSET_PREFIX)) {
              continue
            }
            // Check if directory is not base16 or 40 characters. If not AND the directory is empty or
            // has no commits, then delete the directory and any record of it in the DB.
            const repo = dir2[f2]
            let emptyRepo = true
            let invalidRepoName = false
            if (!isHex(repo) || repo.length !== 40) {
              invalidRepoName = true
            }

            const path2 = path + '/' + dir2[f2]
            if (invalidRepoName) {
              const stat2 = fs.statSync(path2)
              if (stat2.isDirectory()) {
                const pathObjDir = path2 + '/objects'
                if (fs.existsSync(pathObjDir)) {
                  const objectsDirStat = fs.statSync(pathObjDir)
                  if (objectsDirStat.isDirectory()) {
                    const objDir = fs.readdirSync(pathObjDir)
                    if (objDir.length !== 0) {
                      // Check if there are no commits using `git count-objects`
                      try {
                        const result = easyEx(path2, 'git count-objects')
                        const regex = /(\d) objects, (\d) kilobytes/
                        const parseResult = result.match(regex)
                        const numObjects = parseIntSafe(parseResult, 1)
                        const numKb = parseIntSafe(parseResult, 2)
                        if (numKb !== 0 && numObjects !== 0) {
                          emptyRepo = false
                        }
                      } catch (e) {
                        // Play it safe if we throw. Mark repo as non-empty
                        emptyRepo = false
                      }
                    }
                  }
                }
              }
            }

            if (MOVE_INVALID_REPOS && emptyRepo && invalidRepoName) {
              console.log('  Archiving invalid repo: ' + path2)
              if (TEST_ONLY) {
                console.log(sprintf('TEST moveRepoToBackup repo:%s', repo))
              } else {
                try {
                  moveRepoToBackup(repo)
                } catch (e) {}
              }

              // Remove from DB
              // await updateHash(hostname, repo, null)
            } else {
              allDirs.push(dir2[f2])
            }
          }
        }
      } catch (e) {
        console.log(e)
      }
    }
  }
  console.log('  num repos:' + allDirs.length)
  return allDirs
}
