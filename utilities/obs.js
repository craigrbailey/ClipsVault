import OBSWebSocket from 'obs-websocket-js';
import { getOBSSettings, insertStream, updateStreamData, insertVideo } from '../db.js';
import path from 'path';
import { getCurrentDate, createFolder, getFileSize } from './system.js';
import { twitchLive } from './twitch.js';
import { writeToLogFile } from './logging.js';
import fs from 'fs';

let obs;
const obsConnection = { status: false };
let live = false;
let livedata;
let streamId;
let videos = [];
let length = 0;
let streamFolder;
let entireStream;

async function connectToOBS() {
  obs = new OBSWebSocket();

  const connect = async () => {
    try {
      const obsSettings = await getOBSSettings();

      if (obsSettings && obsSettings.ip !== 'none') {
        const { ip, password, port } = obsSettings;
        await obs.connect(`ws://${ip}:${port}`, password);
        console.log('Connected to OBS');
        obsConnection.status = true;
        registerEventListeners(); // Register event listeners on successful connection
      } else {
        console.log('OBS settings not found or IP address is set to none.');
        obsConnection.status = false;
        // Handle the case when OBS settings are not available or IP address is 'none'
      }
    } catch (error) {
      if (error instanceof ReferenceError && error.message.includes('getOBSSettings is not defined')) {
        console.error('OBS Connection Failed: getOBSSettings is not defined');
        return; // Break the connect function if getOBSSettings is not defined
      } else if (
        error instanceof SyntaxError &&
        error.message.includes('Invalid URL: ws://undefined:undefined')
      ) {
        console.error('OBS Connection Failed: Invalid URL');
        return; // Break the connect function if the URL is invalid
      }

      obsConnection.status = false;
      setTimeout(connect, 10000);
    }
  };

  await connect();
  return obs;
}

function registerEventListeners() {
  obs.on('ConnectionClosed', () => {
    console.log('Connection lost, retrying in 10 seconds...');
    obsConnection.status = false;
    setTimeout(connectToOBS, 10000);
  });

  obs.on('RecordStateChanged', (event) => {
    if (event.outputActive == true) {
      console.log('Recroding Started');
      const fileName = path.basename(event.outputPath);
      startRecording(fileName);
    } else if (event.outputState == 'OBS_WEBSOCKET_OUTPUT_STOPPED') {
      const fileName = path.basename(event.outputPath);
      setTimeout(console.log(stopRecording()), 5000);
    }
  });

  obs.on('ReplayBufferSaved', async (event) => {
    console.log('Replay Saved');
    console.log(event);
    const fileName = path.basename(event.savedReplayPath);
    const size = await getFileSize(`${process.cwd()}/recordings/${fileName}`);
    insertVideo(streamId, `${streamFolder}\\${event.name}`, livedata.date, livedata.category, size, event.duration, '' )
  });

  obs.on('StreamStateChanged', async (event) => {
    if (event.outputActive == true) {
      startStream();
    } else if (event.outputState == 'OBS_WEBSOCKET_OUTPUT_STOPPED') {
      endStream();
    }
  });
}

async function startRecording(filename, count = 0) {
  if (count >= 10) {
    console.log('Maximum check limit reached');
    return;
  }

  if (live !== false) {
    streamFolder = await createFolder(livedata.date);
    entireStream = filename;
    return
  }

  setTimeout(() => {
    startRecording(count + 1);
  }, 1000);
}

async function stopRecording () {
  console.log('Recording Stopped');
  videos.push(`${streamFolder}\\${entireStream}`);
  const size = await getFileSize(`${process.cwd()}/recordings/${entireStream}`);
  insertVideo(streamId, `${streamFolder}\\${entireStream}`, livedata.date, livedata.category, size, length, '' )
  const oldPath = path.join(process.cwd(), 'recordings', entireStream);
  const newPath = path.join(streamFolder, entireStream);
  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      console.error(err);
    }
  });
  entireStream = '';
  streamFolder = '';
}

async function endStream () {
  console.log('Stream Stopped');
  live = false;
  await updateStreamData(streamId, length);
}

async function startStream() {
  writeToLogFile('info', 'Stream Started');
  const twitchdata = await twitchLive();
  console.log(`Stream Started: ${twitchdata}`);
  live = true;
  livedata = {
    date: getCurrentDate(),
    category: twitchdata.category,
    backgroundimg: twitchdata.img,
    captions: 'none'
  }
  streamId = await insertStream(livedata. date, livedata.category, livedata.backgroundimg, livedata.captions);
  videos = [];
  length = 0;
  startTimer();
}

function startTimer() {
  let timer = setInterval(() => {
    if (live) {
      length++;
    } else {
      clearInterval(timer); // Stop the timer
    }
  }, 1000); // Check every second
}

export { connectToOBS, obsConnection };
