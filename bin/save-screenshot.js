const CDP = require('chrome-remote-interface');
const argv = require('minimist')(process.argv.slice(2));
const file = require('fs');
const util = require('util');
const shell = require('shelljs');

const tab = argv.tab;
const output = argv.output || 'output.png';
const debugPort = argv.debugPort || 9333;
const script = argv.script || null;

let deviceMetrics = {
  width: 1440,
  height: 800,
  deviceScaleFactor: 0,
  mobile: false,
  fitWindow: false,
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the Chrome Debugging Protocol
CDP({ port: debugPort, tab }, async function(client) {
  const { Emulation, Page, Runtime } = client;
  await CDP.Activate({ port: debugPort, id: tab }, async function() {
    const func = `var getMaxHeight = function() {
                    var node = document.body;
                    var maxHeight = document.body.scrollHeight;
                    var viewportHeight = window.innerHeight;
                    if (viewportHeight > maxHeight) {
                      maxHeight = viewportHeight;
                    }
                    if (maxHeight < 900) {
                      maxHeight = 900;
                    }
                    var children = new Array();
                    for (var child in node.childNodes) {
                      if (node.childNodes[child].scrollHeight > maxHeight) {
                        maxHeight = node.childNodes[child].scrollHeight;
                      }
                    }
                    return maxHeight;
                  };
                  getMaxHeight();`
    const { result: { value } } = await Runtime.evaluate({ expression: func });
    const viewportHeight = value;
    deviceMetrics.height = viewportHeight;
    await Emulation.setDeviceMetricsOverride(deviceMetrics)
    await Emulation.setVisibleSize({ width: 1440, height: viewportHeight });
    await sleep(3000);

    if (script) {
      await Runtime.evaluate({ expression: script });
    }

    const screenshot = await Page.captureScreenshot({ format: 'png' });
    const buffer = new Buffer(screenshot.data, 'base64');
    file.writeFileSync(output, buffer);
    await CDP.Close({ id: tab, port: debugPort });
    await sleep(5000);

    await CDP.List({ port: debugPort }, async function(err, tabs) {
      if (tabs.length === 1 && (tabs[0].url === 'chrome://newtab/' || tabs[0].url === 'about:blank')) {
        await CDP.Close({ port: debugPort, id: tabs[0].id }, async function(err) {
          if (!err) {
            shell.exec('pkill chrome');
            process.exit();
          }
        });
      }
    });
  });
}).on('error', err => {
  console.error('Cannot connect to browser:', err);
});
