/**
 * Created by paul on 8/2/17.
 */

import { pruneFiles } from 'src/prune_backups'

let testFiles = []

for (let y = 2016; y <= 2017; y++) {
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <=28; d++) {
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

const delFiles = pruneFiles(testFiles)
