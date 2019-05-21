# Description
:warning: This program is still experimental and (badly written) so there are probably be some bugs and vulnerabilities in the bot detection system. :warning:

The algorithm is based on the fact that every browser will load all the external CSS that you included in your HTML page so in case of a stupid/basic bot it won't simply load that external CSS file because it does not process the HTML code.

# How to make it work?
1. Set these environment variables:
- `TARGET`: the URL to proxy (only HTTP)
- `MAX_RETRY`: number of times before adding the client IP address to the jail list
- `JAIL_PATH`: path of the IP banned
- `ENDPOINT_NAME`: a static name that the client will have to reach after each request (example: `searx.css` for `http://example.com/searx.css`).
2. Add this HTML code into your website:
````HTML
<link rel="stylesheet" type="text/css" href="/$ENDPOINT_NAME">
````
With Caddy you just have to add that block to your config file with the `http.filter` plugin installed:
````JSON
filter rule {
		path /
		search_pattern <head>
		replacement "<head><link rel=\"stylesheet\" type=\"text/css\" href=\"/searx.css\">"
	}
````
3. Create a script that will automatically ban the IP in the `$JAIL_PATH` or configure fail2ban to do that.
But if you have Caddy you just have to add that block to your config file with the `ipfilter` plugin installed:
````JSON
ipfilter / {
		rule block
		prefix_dir $JAIL_PATH
}
````