const raspi = require("raspi");
const gpio = require("raspi-gpio");

raspi.init(() => {
  const input = new gpio.DigitalInput({ pin: "GPIO6", pullResistor: gpio.PULL_DOWN });

  setInterval(function() {
    console.log(input.read());
  }, 10);
});
