// @flow

const { createRepo } = require('./common/createRepoInner.js')
const { updateHash } = require('./common/updateHash.js')
const { easyEx } = require('./common/syncUtils.js')

async function main () {
  if (process.argv.length < 3) {
    return -1
  }

  try {
    const hostname = easyEx(null, 'hostname')
    const hostArray = hostname.split('.')
    let host = hostArray[0]
    host = host.replace(/(\r\n|\n|\r)/gm, '')

    if (createRepo(process.argv[2]) === -1) {
      process.exit(-1)
    }
    await updateHash(host, process.argv[2], 'HEAD')
  } catch (e) {
    console.log(e)
    process.exit(-1)
  }
}

main()
