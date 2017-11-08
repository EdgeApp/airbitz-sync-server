/**
 * Created by paul on 8/2/17.
 * @flow
 */

import fs from 'fs'
import { sprintf } from 'sprintf-js'
import { type PruneFilesParams, pruneFiles } from './common/pruneBackupsInner.js'

const NUM_DAYS_HOURLY_BACKUP = 1
const NUM_MONTHS_DAILY_BACKUP = 1
const NUM_MONTHS_WEEKLY_BACKUP = 4
const NUM_MONTHS_MONTHLY_BACKUP = 60

const RUN_TEST = false

// const RUN_FREQUENCY = (1000 * 10) // Run every 10 seconds
const RUN_FREQUENCY = (1000 * 60 * 60 * 4) // Run every 4 hours

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms))

function dateString () {
  const date = new Date()
  return date.toDateString() + ':' + date.toTimeString()
}

async function main () {
  while (1) {
    console.log(dateString())

    let backupFiles = []
// const backupDir = '/var/www/html/backups/'
    const backupDir = '/home/bitz/backups/'

    if (!RUN_TEST) {
      const files = fs.readdirSync(backupDir)
      files.forEach(file => {
        backupFiles.push(file)
        // console.log(file)
      })
    } else {
      for (let y = 2016; y <= 2017; y++) {
        for (let m = 1; m <= 12; m++) {
          for (let d = 1; d <= 28; d++) {
            for (let h = 0; h <= 23; h++) {
              if (y >= 2017 && m >= 9) {
                continue
              }
              let file = sprintf('%04d-%02d-%02d_%02d-%02d.dump.gpg', y, m, d, h, 0)
              backupFiles.push(file)
            }
          }
        }
      }
    }

    const pruneFilesParams: PruneFilesParams = {
      currentDate: null,
      files: backupFiles,
      numDaysHourly: NUM_DAYS_HOURLY_BACKUP,
      numMonthsDaily: NUM_MONTHS_DAILY_BACKUP,
      numMonthsWeekly: NUM_MONTHS_WEEKLY_BACKUP,
      numMonthsMonthly: NUM_MONTHS_MONTHLY_BACKUP
    }

    const delFiles = pruneFiles(pruneFilesParams)

    if (delFiles.length === 0) {
      console.log('No files to prune')
    } else {
      delFiles.forEach(file => {
        const filePath = backupDir + file
        console.log('rm: ' + filePath)
        if (!RUN_TEST) {
          fs.unlinkSync(filePath)
        }
      })
    }

    await snooze(RUN_FREQUENCY)
  }
}

main()
