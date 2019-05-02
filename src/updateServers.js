/**
 * Created by paul on 6/19/17.
 */

const fetch = require('node-fetch')
const parse = require('url-parse')

const sampleView = require('../couchView.json')
const {
  getCouchUrl,
  getHostname,
  snooze,
  getCouchAdminPassword,
  dateString,
  getConfig,
  getReposUrl
} = require('../lib/common/syncUtils.js')
const url = getCouchUrl()
const config = getConfig()

console.log(url)
const host = getHostname()
const reposUrl = getReposUrl()
const couchAdminPassword = getCouchAdminPassword()

async function getDesign () {
  return getDoc(`${url}/db_repos/_design/repos`)
}
async function getServers () {
  return getDoc(`${url}/db_repos/00000000_servers`)
}
async function getDoc (docUrl) {
  const result = await fetch(docUrl)
  const out = await result.json()
  return out
}

async function pushServers (body) {
  return pushDoc(`${url}/db_repos/00000000_servers`, body)
}
async function pushDesign (body) {
  return pushDoc(`${url}/db_repos/_design/repos`, body)
}
async function pushDoc (docUrl, body) {
  const result = await fetch(docUrl, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })
  const out = await result.json()
  return out
}

main()

async function main () {
  while (1) {
    try {
      console.log(`${dateString()}: Starting...`)
      let views = await getDesign()
      let servers = await getServers()

      // Add ourselves to server list if not already there.
      let hostIncluded = false
      if (servers && servers.servers) {
        for (const s of servers.servers) {
          if (s.name === host) {
            hostIncluded = true
            break
          }
        }
      } else {
        if (!config.couchSeedServer) {
          // There is no seed server. We are the initial seed
          servers = {
            servers: []
          }
        } else {
          // Need to wait for server list to sync then update afterwards
          await snooze(10000)
          continue
        }
      }
      if (!hostIncluded) {
        console.log(`Adding ourselves as host in server list: ${host}`)
        servers.servers.push({
          name: host,
          url: reposUrl,
          password: config.couchUserPassword
        })
        await pushServers(servers)
      } else {
        console.log('No need to change server list')
      }

      // Create a view for our host that includes all the servers
      const serverArray = []
      for (const s of servers.servers) {
        serverArray.push(s.name)
      }
      const serverArrayString = JSON.stringify(serverArray).replace(/"/g, "'")

      const newView = Object.assign({}, sampleView)
      const mapString = newView.map
        .replace('__SERVER__', host)
        .replace('__SERVER_ARRAY__', serverArrayString)
      newView.map = mapString

      if (!views || views.error) {
        views = {
          _id: '_design/repos',
          language: 'javascript'
        }
      }
      if (!views.views) {
        views.views = {}
      }
      if (!views.views[host]) {
        views.views[host] = {}
      }

      const oldHostViewString = JSON.stringify(views.views[host])
      const newHostViewString = JSON.stringify(newView)

      if (oldHostViewString === newHostViewString) {
        console.log('No need to update views')
      } else {
        views.views[host] = newView
        console.log('Updating views to:')
        console.log(views)
        await pushDesign(views)
      }

      // Update replication
      for (const s of servers.servers) {
        if (s.name === host) {
          continue
        }
        const repId = `rep_${s.name}`
        let repl
        try {
          repl = getDoc(`${url}/_replicator/${repId}`)
        } catch (e) {}

        if (
          repl &&
          repl._replication_state &&
          repl._replication_state === 'triggered'
        ) {
          continue
        }

        if (!s.password) {
          continue
        }

        const p = parse(s.url)

        const srcUrl = `https://bitz:${s.password}@${p.host}:6984/db_repos`
        const dstUrl = `http://admin:${couchAdminPassword}@localhost:5984/db_repos`

        const body = {
          _id: repId,
          source: srcUrl,
          target: dstUrl,
          create_target: true,
          continuous: true
        }
        if (repl != null && repl._rev != null) body._rev = repl._rev
        console.log('Pushing new replicator')
        console.log(body)
        await pushDoc(`${url}/_replicator/${repId}`, body)
      }
      await snooze(60 * 10 * 1000)
      // await snooze(3600000);
    } catch (e) {
      console.log(e)
      await snooze(10000)
    }
  }
}
