// import babel from 'rollup-plugin-babel'
// import multiEntry from 'rollup-plugin-multi-entry'
//
// const packageJson = require('./package.json')
//
// // const updateDbHashes= {
// //   entry: 'updateDbHashes.js',
// //   dest: 'lib/updateDbHashes.js',
// //   moduleName: 'updateDbHashes',
// //   sourceMapFile: 'lib/updateDbHashes.js.map'
// // }
//
// const moveRepos = {
//   entry: 'src/moveRepos.js',
//   dest: 'lib/moveRepos.js',
//   moduleName: 'moveRepos',
//   sourceMapFile: 'lib/moveRepos.js.map'
// }
//
// const pruneBackups = {
//   entry: 'src/pruneBackups.js',
//   dest: 'lib/pruneBackups.js',
//   moduleName: 'pruneBackups',
//   sourceMapFile: 'lib/pruneBackups.js.map'
// }
//
// const COMMON = {
//   external: Object.keys(packageJson.dependencies),
//   format: 'es',
//   plugins: [
//     multiEntry(),
//     babel({})
//   ],
//   sourceMap: true
// }
//
// export default [
//   // Object.assign({},updateDbHashes, COMMON),
//   Object.assign({}, moveRepos, pruneBackups, COMMON)
// ]
