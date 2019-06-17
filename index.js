const proxy = require('http-proxy-middleware');
const express = require('express');
const fs = require('fs');
const app = express();
require('better-logging')(console);

let timeoutObject = new Object();
let failedCounter = new Object();

const targetToProxy = (process.env.TARGET || '127.0.0.1:8888');
const countBeforeBan = ((process.env.MAX_RETRY - 1) || 5);
const jailPath = (process.env.JAIL_PATH || '/tmp');
const timeoutLoadEndpoint = (parseInt(process.env.TIMEOUT_LOAD) || 120000);
const whitelist = (process.env.WHITELIST || '127.0.0.1');
const endpointName = (process.env.ENDPOINT_NAME || 'searx.css');

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

const options = proxy({
    target: 'http://' + targetToProxy,
    onProxyRes(proxyRes, req, res) {
        let IP = req.headers["x-real-ip"];
        if (proxyRes.headers['content-type'] && !whitelist.includes(IP)
            && ((req.method == "GET" && Object.keys(req.query).length !== 0) || req.method == "POST"))
            if (proxyRes.headers['content-type'].includes("text/html")) {
                if (!timeoutObject[IP] || timeoutObject[IP]._called)
                    timeoutObject[IP] = setTimeout(function () {
                        console.info(IP + " - Client did not reach the anti bot endpoint!");
                        addFailedCounter(IP);
                    }, timeoutLoadEndpoint);
                else if (timeoutObject[IP]._called == false &&
                    timeoutObject[IP]._idleTimeout != -1) {
                    console.info(IP + " - Bot behavior detected : loading of a new HTML page before reaching the anti bot endpoint!");
                    timeoutObject[IP].refresh();
                    addFailedCounter(IP);
                }
            }
    },
    logLevel: 'silent'
});

app.get("/" + endpointName, function (req, res) {
    clearTimeout(timeoutObject[req.headers["x-real-ip"]]);
    res.setHeader('Content-Type', 'text/css');
    res.end();
});

app.all('*', options);

app.listen((process.env.PORT || 3000));