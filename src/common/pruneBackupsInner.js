/**
 * Created by paul on 8/2/17.
 * @flow
 */

import { sprintf } from 'sprintf-js'

function monthDiff (d1: Date, d2: Date) {
  let months
  months = (d2.getFullYear() - d1.getFullYear()) * 12
  months -= d1.getMonth() + 1
  months += d2.getMonth()
  return months <= 0 ? 0 : months
}

function hourDiff (d1, d2) {
  const diff = Math.abs(d2 - d1) / (60 * 60 * 1000)
  return diff
}

function dayDiff (d1, d2) {
  const diff = Math.abs(hourDiff(d1, d2) / 24)
  return diff
}

function getWeekNumber (inDate) {
  // Copy date so don't modify original
  const d = new Date(+inDate)
  d.setHours(0, 0, 0, 0)

  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))

  // Get first day of year
  const yearStart = new Date(d.getFullYear(), 0, 1)
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  // Return array of year and week number
  return weekNo
}

function arrayDiff (b, a) {
  return b.filter(function (i) { return a.indexOf(i) < 0 })
}

function parseIntSafe (result?: Array<string> | null, idx: number): number {
  if (result && result[idx]) {
    return parseInt(result[idx])
  } else {
    throw new Error('InvalidParseResult')
  }
}

export type PruneFilesParams = {
  files: Array<string>,
  currentDate: Date | null,
  numDaysHourly: number,
  numMonthsDaily: number,
  numMonthsWeekly: number,
  numMonthsMonthly: number
}

export function pruneFiles (pruneFilesParams: PruneFilesParams) {
  const {
    currentDate,
    files,
    numMonthsWeekly,
    numMonthsDaily,
    numDaysHourly
  } = pruneFilesParams

  let date: Date | null = currentDate
  if (!date) {
    date = new Date()
  }

  let keepFiles = []
  let filesArray = files.slice()

  filesArray.sort()

  let haveMonthly
  let haveweekly
  let haveDaily
  let haveHourly

  for (let file of filesArray) {
    try {
      let filePushed = false
      const regex = /(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2}).dump.gpg/
      const parseResult = file.match(regex)
      const fileYear = parseIntSafe(parseResult, 1)
      const fileMonth = parseIntSafe(parseResult, 2)
      const fileDate = parseIntSafe(parseResult, 3)
      const fileHour = parseIntSafe(parseResult, 4)
      const fileMin = parseIntSafe(parseResult, 5)
      const fileFullDate = new Date(fileYear, fileMonth - 1, fileDate, fileHour, fileMin)
      const fileWeek = getWeekNumber(fileFullDate)
      // console.log(sprintf('year:%04d month:%02d day:%02d %02d:%02d', fileYear, fileMonth, fileDate, fileHour, fileMin))

      const yearMonth = sprintf('%04d-%02d', fileYear, fileMonth)
      const yearMonthDate = sprintf('%04d-%02d-%02d', fileYear, fileMonth, fileDate)
      const yearMonthDateHour = sprintf('%04d-%02d-%02d_%02d', fileYear, fileMonth, fileDate, fileHour)
      const yearWeek = sprintf('%04d-%02d-week', fileYear, fileWeek)

      // if (monthDiff(fileFullDate, date) < NUM_MONTHS_MONTHLY_BACKUP) {
      if (haveMonthly !== yearMonth) {
        haveMonthly = yearMonth
        keepFiles.push(file)
        filePushed = true
        // console.log(file)
      }
      // }

      if (monthDiff(fileFullDate, date) < numMonthsWeekly) {
        if (haveweekly !== yearWeek) {
          haveweekly = yearWeek
          if (!filePushed) {
            filePushed = true
            keepFiles.push(file)
            // console.log(file)
          }
        }
      }

      if (monthDiff(fileFullDate, date) < numMonthsDaily) {
        if (haveDaily !== yearMonthDate) {
          haveDaily = yearMonthDate
          if (!filePushed) {
            filePushed = true
            keepFiles.push(file)
            // console.log(file)
          }
        }
      }

      if (dayDiff(fileFullDate, date) < numDaysHourly) {
        if (haveHourly !== yearMonthDateHour) {
          haveHourly = yearMonthDateHour
          if (!filePushed) {
            filePushed = true
            keepFiles.push(file)
            // console.log(file)
          }
        }
      }
    } catch (e) {
      console.log(e)
    }
  }
  const dFiles = (arrayDiff(files, keepFiles))
  return dFiles
}
