![GitHub stars](https://img.shields.io/github/stars/unixfox/antibot-proxy.svg?style=social) [![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/unixfox/antibot-proxy.svg)](https://hub.docker.com/r/unixfox/antibot-proxy) [![Docker Cloud Automated build](https://img.shields.io/docker/cloud/automated/unixfox/antibot-proxy.svg)](https://hub.docker.com/r/unixfox/antibot-proxy) ![GitHub package.json version](https://img.shields.io/github/package-json/v/unixfox/antibot-proxy.svg)

# Description

:warning: This program is still experimental and (badly written) so there are probably some bugs and vulnerabilities in the bot detection system. :warning:

The algorithm is based on the fact that every browser will accept cookie and load the external CSS that you included in your HTML page so in case of a stupid/basic bot it won't simply process the cookie or/and load that external CSS file because it does not process the HTML code.

# How to make it work? (minimalistic configuration)

1. Copy the `example.toml` to `config.toml`.

2. Modify the setting `TARGET` in the `config.toml` to the URL where your application is listening to. For example if your application reachable on `http://127.0.0.1:8080` just set `127.0.0.1:8080` in the setting.

3. Modify the setting `JAIL_PATH` in the `config.toml` to an empty directory that you created for the application.

3. On your main webserver (nginx, apache, caddy,...) when you will proxy the `antibot-proxy` application you will also need to pass the IP address of the client to the application (with the `X-Real-IP` header). Here is how to do it on:
- Apache:

```apache
RemoteIPHeader X-Real-IP
```

- NGINX:

```nginx
proxy_set_header X-Real-IP $remote_addr;
```

- Caddy:

```caddy
transparent
```
> Note: You may consult the documentation of your webserver for further details about proxying an application.

# Reference of each setting in `config.toml` for advanced configuration

- `COOKIE_NAME`: The name of the cookie that will be used for checking if the client can handle the cookie.
- `ENDPOINT_NAME`: The name of the CSS file that will be used for checking if the client can process the HTML code.
- `JAIL_PATH`: The path to the directory where the banned IP will be stored. Optionally to be used with the [ipfilter](https://caddyserver.com/docs/http.ipfilter) plugin of Caddy.
- `MAX_RETRY`: The number of retries allowed for the client before getting banned.
- `PORT`: The port of which the proxy application will listen to.
- `TARGET`: The URL of the application to proxy/protect.
- `TIMEOUT_LOAD`: The time before the program consider that the client failed to reach the CSS file.
- `WHITELIST`: The IP that you want to be whitelisted.
- `WHITELIST_PAGES`: Pages to whitelist from the blocked page for bots.


# How to configure the ipfilter Caddy plugin to handle the banned IPs?

You just need to add this block to your `Caddyfile`:
````JSON
ipfilter / {
		rule block
		prefix_dir JAIL_PATH
}
````
and change `JAIL_PATH` with the value of `JAIL_PATH` that you have previously defined in the `config.toml` file.