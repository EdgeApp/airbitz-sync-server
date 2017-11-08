// @flow

const { createRepo } = require('./common/createRepoInner.js')
const { updateHash } = require('./common/updateHash.js')
const { getHostname } = require('./common/syncUtils.js')

async function main () {
  if (process.argv.length < 3) {
    return -1
  }

  try {
    const host = getHostname()

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
