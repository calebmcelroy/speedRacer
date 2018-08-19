const raspi = require("raspi");
const gpio = require("raspi-gpio");
var url = require('url');

raspi.init(() => {
  const input = new gpio.DigitalInput({ pin: "GPIO6", pullResistor: gpio.PULL_DOWN });
  const input2 = new gpio.DigitalInput({ pin: "GPIO13", pullResistor: gpio.PULL_DOWN });
  const input3 = new gpio.DigitalInput({ pin: "GPIO19", pullResistor: gpio.PULL_DOWN });

  setInterval(function() {
    console.log("Release: "+input.read());
    console.log("Track 1: "+input2.read());
    console.log("Track 2: "+input3.read());
  }, 10);
  
  
});


http.createServer(function(req, res) {

    if (req.method === "GET") {

        var call = url.parse(req.url, true);

        // allow any origin to make API calls.
        res.setHeader('Access-Control-Allow-Origin', '*');

        processRequest(call.pathname, req, res);

    } else {
        res.writeHead(400);
        res.end(JSON.stringify({
            error: "method not implemented"
        }));
    }

}.bind({
    CONFIG: CONFIG
})).listen(CONFIG.HTTP_PORT);

function processRequest(method, req, res) {

    switch (method) {
        case "/get/state": // Retrieve track/application state
            res.writeHead(200);
            res.end();
            //res.end(JSON.stringify(strip_gpioCtl(CONFIG, null, '\n')));
            break;

        case "/set/led": // Manually toggle LED state
            res.writeHead(200);
            res.end();
            /*res.end(JSON.stringify({
                command_sent: true
            }));
            CONFIG.LED_INDICATOR.ctl.toggle();*/
            break;

        case "/set/reset": // Soft reset button (in addition to physical one)
            res.writeHead(200);
            res.end();
            /*res.end(JSON.stringify({
                command_sent: true
            }));
            resetState();*/
            break;

        default: // Unhandled API method
            res.writeHead(400);
            res.end(JSON.stringify({
                error: "method not implemented"
            }));
    }

}