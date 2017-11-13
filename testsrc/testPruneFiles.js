/**
 * Created by paul on 8/2/17.
 * @flow
 */

import type { PruneFilesParams } from '../src/common/pruneBackupsInner.js'
const { pruneFiles } = require('../lib/common/pruneBackupsInner.js')
const { sprintf } = require('sprintf-js')

const NUM_DAYS_HOURLY_BACKUP = 1
const NUM_MONTHS_DAILY_BACKUP = 1
const NUM_MONTHS_WEEKLY_BACKUP = 4
const NUM_MONTHS_MONTHLY_BACKUP = 60

let testFiles = []

for (let y = 2016; y <= 2017; y++) {
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 28; d++) {
      for (let h = 0; h <= 23; h++) {
        if (y >= 2017 && m >= 9) {
          continue
        }
        let file = sprintf('%04d-%02d-%02d_%02d-%02d.dump.gpg', y, m, d, h, 0)
        testFiles.push(file)
      }
    }
  }
}

const pruneFilesParams: PruneFilesParams = {
  currentDate: null,
  files: testFiles,
  numDaysHourly: NUM_DAYS_HOURLY_BACKUP,
  numMonthsDaily: NUM_MONTHS_DAILY_BACKUP,
  numMonthsWeekly: NUM_MONTHS_WEEKLY_BACKUP,
  numMonthsMonthly: NUM_MONTHS_MONTHLY_BACKUP
}

const delFiles = pruneFiles(pruneFilesParams)

console.log(delFiles)
