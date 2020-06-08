# Set up Caddy HTTPS proxy

First, [install Caddy](https://caddyserver.com/docs/download):

```sh
echo "deb [trusted=yes] https://apt.fury.io/caddy/ /" \
    | sudo tee -a /etc/apt/sources.list.d/caddy-fury.list
sudo apt update
sudo apt install caddy
```

Next, configure Caddy using `/etc/caddy/Caddyfile`:

```
# CouchDB:
git-uk.edge.app:6984 {
  reverse_proxy localhost:5984
}

# Location domain name:
git-uk.edge.app {
  reverse_proxy localhost:8008
}

# Numbered domain name:
git1.edge.app {
  reverse_proxy localhost:8008
}
```

Caddy's automatic HTTP-to-HTTPS redirection prefers the latest config section when there is a conflict, so the CouchDB section should generally come before the main app. Restart Caddy to load the configuration:

```sh
sudo systemctl restart caddy
```

That's pretty much all that needs to happen on a fresh machine. Existing machines, on the other hand might need to move services like CouchDB or Node away from the ports Caddy needs. To follow Caddy's log output, do:

```sh
sudo journalctl -fu caddy
```

## Configuring CouchDB

CouchDB can listen for HTTPS connections on port 6984, which will conflict with Caddy. To fix this, comment out the following line, as well as everything else in the `[ssl]` section of `/etc/couchdb/local.ini`:

```ini
[daemons]
;httpsd = {couch_httpd, start_link, [https]}

[ssl]
;cert_file = ...
;key_file = ...
```

To make CouchDB only accept connections coming from localhost, also adjust the following section:

```ini
[chttpd]
bind_address = 127.0.0.1
```

This prevents unencrypted HTTP access to the database.

## Configuring Apache

Since git-http-backend tool doesn't seem to with Caddy just yet, we need Apache to manage that. Since Apache normally listens on the ports Caddy uses, edit `/etc/apache2/ports.conf` to have just:

```ini
Listen 127.0.0.1:8008
```

This will make Apache only listen to localhost.
