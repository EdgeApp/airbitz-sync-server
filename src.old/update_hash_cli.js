/**
 * Created by paul on 6/17/17.
 */
const _writeDb = require('./update_hash.js').writeDb

async function mainLoop () {
  if (process.argv.length < 5) {
    console.log('Usage: update_hash.js [server] [repo] [hash]')
    return -1
  } else {
    await _writeDb(process.argv[2], process.argv[3], process.argv[4])
  }
}

mainLoop()
