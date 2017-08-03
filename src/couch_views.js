function (doc) {
  const me = 'git1'
  if (typeof doc.servers !== 'undefined')
    return
  if (typeof doc[me] === 'undefined') {
    emit(null, doc)
    return
  }
  const servers = ['git1', 'git2', 'git3']
  for (var n = 0; n < servers.length; n++) {
    const serv1 = servers[ n ]
    if (me === serv1) continue
    if (typeof doc[ serv1 ] === 'undefined') continue

    var doEmit = false
    if (doc[ me ] !== doc[ serv1 ]) {
      doEmit = true
    }

    if (typeof doc[ me + ':time'] !== 'undefined') {
      if (typeof doc[ serv1 + ':time'] !== 'undefined') {
        if (doc[ me + ':time'] > doc[ serv1 + ':time' ]) {
          doEmit = false
        }
      } else {
        doEmit = false
      }
    }

    if (doEmit === true)
      emit(null, doc)
    return
  }
}
