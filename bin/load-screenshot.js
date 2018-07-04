const CDP = require('chrome-remote-interface');
const argv = require('minimist')(process.argv.slice(2));
const file = require('fs');
const shell = require('shelljs');

const url = argv.url || 'https://www.google.com';
const delay = argv.delay || 0;
let debugPort = argv.debugPort || 9333;
debugPort = parseInt(debugPort, 10);

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s * 1000));
}

function isChromeRunning() {
  return !shell.exec(`lsof -i:${debugPort} >/dev/null`).code;
}

// Start Chrome if not running
async function setupChromeshot() {
  let chromeRunning = isChromeRunning();
  if (!chromeRunning) {
    shell.exec(`LC_ALL=C google-chrome --enable-logging --hide-scrollbars --remote-debugging-port=${debugPort} --remote-debugging-address=0.0.0.0 --disable-gpu --no-sandbox --ignore-certificate-errors &`, { async: true });
    await sleep(10);
  }
}

async function load() {
  await setupChromeshot();

  const tab = await CDP.New({ port: debugPort });

  CDP({ tab }, async function(client) {
    const { DOM, Network, Page, Runtime } = client;
  
    await Page.enable();
    await DOM.enable();
    await Network.enable();
  
    await Page.navigate({ url });
  
    Page.loadEventFired(async () => {
      setTimeout(async function() {
        console.log(tab.id);
        process.exit();
      }, parseInt(delay) * 1000);
    });
  }).on('error', err => {
    console.error('Cannot connect to browser:', err);
  });
}

load();
