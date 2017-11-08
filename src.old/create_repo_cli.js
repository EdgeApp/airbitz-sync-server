const _createRepo = require('./create_repo.js').createRepo
const _writeDb = require('./update_hash.js').writeDb
const childProcess = require('child_process')

function easyEx (path, cmdstring) {
  const cmdArray = cmdstring.split(' ')
  const cmd = cmdArray[0]
  const args = cmdArray.slice(1, cmdArray.length)
  const r = childProcess.execFileSync(cmd, args, { encoding: 'utf8', timeout: 20000, cwd: path, killSignal: 'SIGKILL' })
  return r
}

async function mainAsync () {
  if (process.argv.length < 3) {
    return -1
  }

  try {
    const hostname = easyEx(null, 'hostname')
    const hostArray = hostname.split('.')
    let host = hostArray[0]
    host = host.replace(/(\r\n|\n|\r)/gm, '')

    if (_createRepo(process.argv[2]) === -1) {
      process.exit(-1)
    }
    await _writeDb(host, process.argv[2], 'HEAD')
  } catch (e) {
    console.log(e)
    process.exit(-1)
  }
}

mainAsync()