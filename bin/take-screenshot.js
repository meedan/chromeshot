const CDP = require('chrome-remote-interface');
const argv = require('minimist')(process.argv.slice(2));
const file = require('fs');

// CLI Args
const url = argv.url || 'https://www.google.com';
const format = argv.format === 'jpeg' ? 'jpeg' : 'png';
const viewportWidth = argv.viewportWidth || 1440;
let viewportHeight = argv.viewportHeight || 800;
const delay = argv.delay || 0;
const userAgent = argv.userAgent;
const fullPage = argv.full;
const output = argv.output || 'output.png';
const debugPort = argv.debugPort || 9333;
const script = argv.script || null;

// Start the Chrome Debugging Protocol
CDP({ port: debugPort }, async function(client) {
  // Extract used DevTools domains.
  const {DOM, Emulation, Network, Page, Runtime} = client;

  // Enable events on domains we are interested in.
  await Page.enable();
  await DOM.enable();
  await Network.enable();

  // If user agent override was specified, pass to Network domain
  if (userAgent) {
    await Network.setUserAgentOverride({userAgent});
  }

  // Set up viewport resolution, etc.
  let deviceMetrics = {
    width: viewportWidth,
    height: viewportHeight,
    deviceScaleFactor: 0,
    mobile: false,
    fitWindow: false,
  };
  await Emulation.setDeviceMetricsOverride(deviceMetrics);
  await Emulation.setVisibleSize({width: viewportWidth, height: viewportHeight});

  // Navigate to target page
  await Page.navigate({url});

  // Wait for page load event to take screenshot
  Page.loadEventFired(async () => {
    // If the `full` CLI option was passed, we need to measure the height of
    // the rendered page and use Emulation.setVisibleSize
    if (fullPage) {
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
      viewportHeight = value;
      deviceMetrics.height = viewportHeight;
      await Emulation.setDeviceMetricsOverride(deviceMetrics)
      await Emulation.setVisibleSize({width: viewportWidth, height: viewportHeight});

      if (script) {
        await Runtime.evaluate({ expression: script });
      }
    }

    setTimeout(async function() {
      const screenshot = await Page.captureScreenshot({format});
      const buffer = new Buffer(screenshot.data, 'base64');
      file.writeFile(output, buffer, 'base64', function(err) {
        if (err) {
          console.log(err);
        }
        client.close();
      });
    }, parseInt(delay) * 1000);
  });
}).on('error', err => {
  console.error('Cannot connect to browser:', err);
});
