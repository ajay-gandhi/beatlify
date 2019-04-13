const Spotify = require("spotify-web-api-node");
const fs = require("fs");
const changeBulb = require("./lifx");
const creds = require("./private");

const EVERY = 4;

if (!creds.access_token || !creds.refresh_token) {
  console.log("You must authorize this application first! Read the README");
  process.exit(1);
}

const spotifyApi = new Spotify(require("./private"));
spotifyApi.setAccessToken(creds.access_token);
spotifyApi.setRefreshToken(creds.refresh_token);

const fail = (err) => {
  console.log("Something went wrong!", err);
  process.exit(1);
};

let timeout;
let x = 0;
const nextFrame = (tempo) => {
  x++;
  changeBulb(tempo);
  if (x % 8 === 0) {
    console.log("Correcting...");
    getNextHit();
  } else {
    timeout = setTimeout(nextFrame, tempo, tempo);
  }
};

const getNextHit = () => {
  spotifyApi.getMyCurrentPlaybackState({})
    .then((playbackState) => {
      const progress = playbackState.body.progress_ms;
      spotifyApi.getAudioFeaturesForTrack(playbackState.body.item.id)
        .then((trackData) => {
          const bpm = trackData.body.tempo / EVERY;
          const progressInMin = progress / 1000 / 60;
          const nextBeatNum = Math.ceil(progressInMin * bpm);
          const nextBeatIn = progressInMin - (nextBeatNum / bpm);
          timeout = setTimeout(nextFrame, nextBeatIn * 60 * 1000, 1 / bpm * 60 * 1000);
        }, fail);
    }, (err) => {
      if (err.message === "Unauthorized" && err.statusCode === 401) {
        spotifyApi.refreshAccessToken().then((data) => {
          console.log("Refreshed access token!");
          spotifyApi.setAccessToken(data.body['access_token']);
          spotifyApi.setRefreshToken(data.body['refresh_token']);
          creds.expires_in = data.body["expires_in"];
          creds.access_token = data.body["access_token"];
          creds.refresh_token = data.body["refresh_token"];
          fs.writeFileSync(`${__dirname}/private.json`, JSON.stringify(creds, null, 2));
          getNextHit();
        }, fail);
      }
    });
};

getNextHit();
