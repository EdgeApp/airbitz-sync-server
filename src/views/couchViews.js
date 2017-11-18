//
// CouchDB javascript code to define a view that filters which repos need to be synced by which server.
// Copy this into a design view in CouchDB to enable a view for a specific server
//
// This is formatted as JSON in couchViews.json for each copy/paste into a new git cluster
//

// function (doc) {
//   const me = 'git2'
//   if (typeof doc.servers !== 'undefined')
//     return
//   if (typeof doc[me] === 'undefined') {
//     emit(null, doc)
//     return
//   }
//   const servers = ['git1', 'git2']
//   for (var n = 0; n < servers.length; n++) {
//     const serv1 = servers[ n ]
//     if (me === serv1) continue
//     if (typeof doc[ serv1 ] === 'undefined') continue
//
//     if (doc[ me ] !== doc[ serv1 ]) {
//       emit(null, doc)
//       return
//     }
//   }
// }
