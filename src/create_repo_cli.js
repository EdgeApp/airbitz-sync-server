const createRepo = require('./create_repo.js').createRepo

if (process.argv.length < 3) {
  return -1
}
return createRepo(process.argv[2])
