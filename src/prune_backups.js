/**
 * Created by paul on 8/2/17.
 */

// const fs = require('fs')
const sprintf = require('sprintf-js').sprintf

const NUM_DAYS_HOURLY_BACKUP = 1
const NUM_MONTHS_DAILY_BACKUP = 1
const NUM_MONTHS_WEEKLY_BACKUP = 4
const NUM_MONTHS_MONTHLY_BACKUP = 60

function monthDiff(d1, d2) {
  let months
  months = (d2.getFullYear() - d1.getFullYear()) * 12
  months -= d1.getMonth() + 1
  months += d2.getMonth()
  return months <= 0 ? 0 : months
}

function hourDiff(d1, d2) {
  const diff = Math.abs(d2 - d1) / (60 * 60 * 1000)
  return diff
}

function dayDiff(d1, d2) {
  const diff = Math.abs(hourDiff(d1, d2) / 24)
  return diff
}

// function weekDiff(d1, d2) {
//   const diff = Math.abs(dayDiff(d1, d2) / 7)
//   return diff
// }
//
//
function getWeekNumber (inDate) {
  // Copy date so don't modify original
  d = new Date(+inDate)
  d.setHours(0, 0, 0, 0)

  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay()||7))

  // Get first day of year
  const yearStart = new Date(d.getFullYear(),0,1)
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
  // Return array of year and week number
  return weekNo
}

function arrayDiff (b, a) {
  return b.filter(function(i) {return a.indexOf(i) < 0})
}

function pruneFiles (files, currentDate) {
  let date = currentDate
  if (!date) {
    date = new Date()
  }

  const year = date.getFullYear()
  const month = date.getMonth()
  const dayOfMonth = date.getDate()
  const weekOfYear = getWeekNumber(date)

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
      const regex = /(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2}).dump.gpg/;
      const parseResult = file.match(regex)
      const fileYear = parseInt(parseResult[1])
      const fileMonth = parseInt(parseResult[2])
      const fileDate = parseInt(parseResult[3])
      const fileHour = parseInt(parseResult[4])
      const fileMin = parseInt(parseResult[5])
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

      if (monthDiff(fileFullDate, date) < NUM_MONTHS_WEEKLY_BACKUP) {
        if (haveweekly !== yearWeek) {
          haveweekly = yearWeek
          if (!filePushed) {
            filePushed = true
            keepFiles.push(file)
            // console.log(file)
          }
        }
      }

      if (monthDiff(fileFullDate, date) < NUM_MONTHS_DAILY_BACKUP) {
        if (haveDaily !== yearMonthDate) {
          haveDaily= yearMonthDate
          if (!filePushed) {
            filePushed = true
            keepFiles.push(file)
            // console.log(file)
          }
        }
      }

      if (dayDiff(fileFullDate, date) < NUM_DAYS_HOURLY_BACKUP) {
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

const fs = require('fs')

let backupFiles = []
// const backupDir = '/var/www/html/backups/'
const backupDir = '/home/bitz/backups/'

const files = fs.readdirSync(backupDir)
files.forEach(file => {
  backupFiles.push(file)
  console.log(file)
})

// for (let y = 2016; y <= 2017; y++) {
//   for (let m = 1; m <= 12; m++) {
//     for (let d = 1; d <=28; d++) {
//       for (let h = 0; h <= 23; h++) {
//         if (y >= 2017 && m >= 9) {
//           continue
//         }
//         let file = sprintf('%04d-%02d-%02d_%02d-%02d.dump.gpg', y, m, d, h, 0)
//         backupFiles.push(file)
//       }
//     }
//   }
// }

const delFiles = pruneFiles(backupFiles, null)

delFiles.forEach(file => {
  const filePath = backupDir + file
  // console.log('rm:' + filePath)
  fs.unlinkSync(filePath)
})

// export { pruneFiles }