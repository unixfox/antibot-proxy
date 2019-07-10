const proxy = require('express-http-proxy');
const express = require('express');
const fs = require('fs');
const app = express();
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const net = require('net');
require('better-logging')(console, {
    format: ctx => `${ctx.date} ${ctx.time24} ${ctx.type} ${ctx.msg}`
});
require('dotenv').config();

let timeoutObject = new Object();
let failedCounter = new Object();

const targetToProxy = process.env.TARGET;
const countBeforeBan = process.env.MAX_RETRY - 1;
const jailPath = process.env.JAIL_PATH;
const timeoutLoadEndpoint = parseInt(process.env.TIMEOUT_LOAD);
const whitelist = process.env.WHITELIST;
const endpointName = process.env.ENDPOINT_NAME;

function addFailedCounter(IP) {
    if (!failedCounter[IP])
        failedCounter[IP] = 1;
    else if (failedCounter[IP] >= countBeforeBan) {
        fs.closeSync(fs.openSync(jailPath + "/" + IP, 'w'));
        clearTimeout(timeoutObject[IP]);
        delete failedCounter[IP];
        delete timeoutObject[IP];
        console.warn(IP + " - Bot detected: adding to the jail list!");
    }
    else if (failedCounter[IP] < countBeforeBan)
        failedCounter[IP] += 1;
}

function checkFileExist(path, exit) {
    if (fs.existsSync(path))
        return (true);
    else
        if (exit) {
            console.error("The file " + path + " doesn't exist, can't continue. Please check the documentation for further details.");
            process.exit(1);
        }
        else
            return (false);
}

checkFileExist(".env", true);
checkFileExist("views/bot.pug", true);

app.use(cookieParser());
app.set('view engine', 'pug');

app.get("/" + endpointName, function (userReq, userRes) {
    const IP = (userReq.headers["x-real-ip"] || userReq.connection.remoteAddress);
    clearTimeout(timeoutObject[IP]);
    userRes.setHeader('Content-Type', 'text/css');
    userRes.setHeader('Cache-Control', 'no-store');
    userRes.end();
});

app.all("*", function (userReq, userRes, next) {
    const IP = (userReq.headers["x-real-ip"] || userReq.connection.remoteAddress);
    const secretCookie = crypto.createHash('md5').update(IP).digest('hex');
    if (userReq.headers['user-agent'].toLowerCase().includes("bot") || checkFileExist(jailPath + "/" + IP, false))
        userRes.render('bot', { website: process.env.WEBSITE_NAME });
    else if ((userReq.cookies && userReq.cookies[process.env.COOKIE_NAME] === secretCookie) || whitelist.includes(IP))
        next();
    else {
        userRes.cookie(process.env.COOKIE_NAME, secretCookie);
        userRes.redirect(307, userReq.url);
        userRes.end();
    }
});

app.all('*', proxy(targetToProxy, {
    timeout: 10000,
    limit: '50kb',
    preserveHostHdr: true,
    filter: function (req, res) {
        if (req.method == 'GET')
            return req.method == 'GET';
        else if (req.method == 'POST')
            return req.method == 'POST';
        else
            return req.method == 'GET';
    },
    userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
        const IP = (headers["x-real-ip"] || userReq.connection.remoteAddress);
        if (headers['content-type'] && !whitelist.includes(IP) && (userReq.method == "GET" || userReq.method == "POST")) {
            if (headers['content-type'].includes("text/html") && (proxyRes.statusCode >= 200 && proxyRes.statusCode < 400)) {
                if (!timeoutObject[IP] || timeoutObject[IP]._called)
                    timeoutObject[IP] = setTimeout(function () {
                        console.info(IP + " - Client did not reach the anti bot endpoint!");
                        addFailedCounter(IP);
                    }, timeoutLoadEndpoint * 1000);
                else if (timeoutObject[IP]._called == false &&
                    timeoutObject[IP]._idleTimeout != -1) {
                    console.info(IP + " - Bot behavior detected : loading of a new HTML page before reaching the anti bot endpoint!");
                    timeoutObject[IP].refresh();
                    addFailedCounter(IP);
                }
            }
        }
        return headers;
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
        if (proxyRes.headers['content-type'].includes("text/html") && (proxyRes.statusCode >= 200 && proxyRes.statusCode < 400)) {
            const data = proxyResData.toString('utf8').replace('<head>', '<head><link rel="stylesheet" type="text/css" href="/' + endpointName + '">');
            return (data);
        }
        else
            return (proxyResData);
    }
}));

app.listen(process.env.PORT);