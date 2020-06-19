// @flow

import { createRepo } from './common/createRepoInner.js'
import { getHostname } from './common/syncUtils.js'
import { updateHash } from './common/updateHashInner.js'

async function main() {
  if (process.argv.length < 3) {
    return -1
  }

  try {
    const host = getHostname()

    if ((await createRepo(process.argv[2])) === -1) {
      process.exit(-1)
    }
    await updateHash(host, process.argv[2], 'HEAD')
  } catch (e) {
    console.log(e)
    process.exit(-1)
  }
}

main()
