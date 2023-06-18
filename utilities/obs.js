import OBSWebSocket from 'obs-websocket-js';
import { getOBSSettings, insertStream, updateStreamLength, insertVideo, getGeneralSettings } from '../db.js';
import path from 'path';
import { getCurrentDate, createFolder, getFileSize } from './system.js';
import { writeToLogFile } from './logging.js';
import fs from 'fs';
import { createClips } from './clipCreator.js';

let obs;
const obsConnection = { status: false };
let live = false;
let livedata = null;
let streamId;
let length = 0;
let streamFolder;
let entireStream;
let clipFile;

// Function to conntect to OBS
async function connectToOBS() {
  obs = new OBSWebSocket();

  const connect = async () => {
    try {
      const obsSettings = await getOBSSettings();
      if (obsSettings && obsSettings.ip !== 'none') {
        const { ip, password, port } = obsSettings;
        await obs.connect(`ws://${ip}:${port}`, password);
        writeToLogFile('info', 'Connected to OBS');
        obsConnection.status = true;
        registerEventListeners();
      } else {
        writeToLogFile('error', 'OBS settings not found or IP address is set to none.');
        obsConnection.status = false;
      }
    } catch (error) {
      if (error instanceof ReferenceError && error.message.includes('getOBSSettings is not defined')) {
        writeToLogFile('error', 'OBS Connection Failed: getOBSSettings is not defined');
        return; 
      } else if (
        error instanceof SyntaxError &&
        error.message.includes('Invalid URL: ws://undefined:undefined')
      ) {
        writeToLogFile('error', 'OBS Connection Failed: Invalid URL');
        console.error('OBS Connection Failed: Invalid URL');
        return;
      }
      obsConnection.status = false;
      setTimeout(connect, 10000);
    }
  };
  await connect();
  return obs;
}

// Functio to register event listeners
function registerEventListeners() {
  obs.on('ConnectionClosed', () => {
    writeToLogFile('error', 'Connection to OBS lost');
    obsConnection.status = false;
    setTimeout(connectToOBS, 10000);
  });

  obs.on('RecordStateChanged', (event) => {
    if (event.outputState == 'OBS_WEBSOCKET_OUTPUT_STARTED') {
      const fileName = path.basename(event.outputPath);
      startRecording(fileName);
    } else if (event.outputState == 'OBS_WEBSOCKET_OUTPUT_STOPPED') {
      setTimeout(stopRecording(),
      5000);
    }
  });

  obs.on('ReplayBufferSaved', async (event) => {
    console.log('Replay Saved');
    console.log(event);
    const fileName = path.basename(event.savedReplayPath);
    const size = await getFileSize(`${process.cwd()}/recordings/${fileName}`);
    insertVideo(streamId, `${streamFolder}\\${fileName}`, livedata.date, livedata.category, size, event.duration, '')
  });

  obs.on('StreamStateChanged', async (event) => {
    if (event.outputActive == true) {
      startStream();
    } else if (event.outputState == 'OBS_WEBSOCKET_OUTPUT_STOPPED') {
      endStream();
    }
  });
}
// Function to start recording
async function startRecording(filename, count = 0) {
  const settings = await getGeneralSettings();
  const liveRequired = settings.live_required;
  if (count >= 10) {
    console.log('Maximum check limit reached');
    return;
  }
  if (liveRequired) {
    if (live) {
      streamFolder = await createFolder(livedata.date);
      entireStream = filename;
      return;
    } else {
      setTimeout(() => {
        startRecording(count + 1);
      }, 1000);
    }
  } else if (!liveRequired) {
    await startStream();
    streamFolder = await createFolder(livedata.date);
    entireStream = filename;
    return;
  }
}

// Function to stop recording
async function stopRecording() {
  if (livedata === null) {
    return;
  }
  const oldPath = path.join('../recordings', entireStream);
  const newPath = path.join(streamFolder, entireStream);
  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      console.error(err);
    }
  });
  const settings = await getGeneralSettings();
  const liveRequired = settings.live_required;
  const size = await getFileSize(`${streamFolder}\\${entireStream}`);
  await insertVideo(streamId, `${streamFolder}\\${entireStream}`, livedata.date, livedata.category, livedata.backgroundimg, size, length, []);
  await createClips(`${streamFolder}\\${entireStream}`, streamId, streamFolder);
  entireStream = null;
  streamFolder = null;
  if (!liveRequired) {
    await endStream();
  }
}

// Function to end stream
async function endStream() {
  writeToLogFile('info', 'Stream Ended');
  live = false;
  await updateStreamLength(streamId, length);
}

// Function to start stream
async function startStream() {
  if (live) {
    return;
  }
  live = true;
  writeToLogFile('info', 'Stream Started');
  startTimer();
  livedata = {
    date: getCurrentDate(),
    category: 'Just Chatting',
    backgroundimg: 'https://static-cdn.jtvnw.net/ttv-boxart/509658-1360x1900.jpg',
    captions: null
  }
  streamId = await insertStream(livedata.date, livedata.category, livedata.backgroundimg, livedata.captions);
  length = 0;
}

// Function to start timer
function startTimer() {
  let timer = setInterval(() => {
    if (live) {
      length++;
    } else {
      clearInterval(timer);
    }
  }, 1000); 
}


// Export functions
export { connectToOBS, obsConnection, entireStream, clipFile, length, livedata };
