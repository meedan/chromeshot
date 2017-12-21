const CDP = require('chrome-remote-interface');
const argv = require('minimist')(process.argv.slice(2));
const file = require('fs');

const url = argv.url || 'https://www.google.com';
const delay = argv.delay || 0;
const debugPort = argv.debugPort || 9333;

async function load() {
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
