const LifxClient = require("node-lifx").Client;
const { lightIp } = require("./private");

const HIGH_BRIGHTNESS = 50;
const LOW_BRIGHTNESS = 20;
const SATURATION = 100;
const NUM_COLORS = 40;
const COLORS = (new Array(NUM_COLORS)).fill(0).map((x, i) => i * (360 / NUM_COLORS));

let light;
const client = new LifxClient();
client.init();
client.on("light-new", (newLight) => {
  if (newLight.address === lightIp) {
    light = newLight;
    light.on();
  }
});

let timeout;
let selection = 0;
// Pulses a light (fade to low brightness then back to high brightness over the
// course of the given duration)
module.exports = (duration) => {
  if (!light) return console.log("No light found yet...");
  light.color(COLORS[selection++ % COLORS.length], SATURATION, LOW_BRIGHTNESS, 3500, duration / 2);
  timeout = setTimeout(() => {
    light.color(COLORS[selection++ % COLORS.length], SATURATION, HIGH_BRIGHTNESS, 3500, duration / 2);
  }, duration / 2);
};
