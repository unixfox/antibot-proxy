![GitHub stars](https://img.shields.io/github/stars/unixfox/antibot-proxy.svg?style=social) [![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/unixfox/antibot-proxy.svg)](https://hub.docker.com/r/unixfox/antibot-proxy) [![Docker Cloud Automated build](https://img.shields.io/docker/cloud/automated/unixfox/antibot-proxy.svg)](https://hub.docker.com/r/unixfox/antibot-proxy) ![GitHub package.json version](https://img.shields.io/github/package-json/v/unixfox/antibot-proxy.svg)

# Description
:warning: This program is still experimental and (badly written) so there are probably some bugs and vulnerabilities in the bot detection system. :warning:

The algorithm is based on the fact that every browser will accept cookie and load the external CSS that you included in your HTML page so in case of a stupid/basic bot it won't simply process the cookie or/and load that external CSS file because it does not process the HTML code.

# How to make it work?

1. Copy the `example.toml` to `config.toml` and the `views/bot.template.pug` to `views/bot.pug`.

2. Modify the settings inside the `config.toml`. You don't need to modify every setting, just change the one that you want to be changed. Here is the reference for each setting:
- `COOKIE_NAME`: The name of the cookie that will be used for checking if the client can handle the cookie.
- `ENDPOINT_NAME`: The name of the CSS file that will be used for checking if the client can process the HTML code.
- `JAIL_PATH`: The path to the directory where the banned IP will be stored. Optionally to be used with the [ipfilter](https://caddyserver.com/docs/http.ipfilter) plugin of Caddy.
- `MAX_RETRY`: The number of retries allowed for the client before getting banned.
- `PORT`: The port of which the proxy application will listen to.
- `TARGET`: The URL of the application to proxy/protect.
- `TIMEOUT_LOAD`: The time before the program consider that the client failed to reach the CSS file.
- `WEBSITE_NAME`: The name of your website. This name will only be displayed on the blocked page for bots.
- `WHITELIST`: The IP that you want to be whitelisted. Separate each IP with a `,`.
- `WHITELIST_PAGES`: Pages to whitelist from the blocked page for bots.

3. On your main webserver (nginx, apache, caddy,...) you need to pass the IP address of the client to the application (with the `X-Real-IP` header). Here is how to do it on:
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

4. (Optional) You may modify the `views/bot.template.pug` file so that search engines (bots) will display the correct informations about your website.
The documentation about pug is available here: https://pugjs.org/language/attributes.html.

# How to configure the ipfilter plugin to handle the banned IPs?

You just need to add this block to your `Caddyfile`:
````JSON
ipfilter / {
		rule block
		prefix_dir JAIL_PATH
}
````
and change `JAIL_PATH` with the value of `JAIL_PATH` that you have previously defined in the `config.toml` file.