/**
 * Created by paul on 6/17/17.
 * @flow
 */

import { updateHash } from './common/updateHashInner.js'

async function main() {
  if (process.argv.length < 5) {
    console.log('Usage: updateHash.js [server] [repo] [hash]')
    return -1
  } else {
    await updateHash(process.argv[2], process.argv[3], process.argv[4])
  }
}

main()
