import OBSWebSocket from 'obs-websocket-js';
import { getOBSSettings } from '../db.js';
import path from 'path';

let obs;
const obsConnection = { status: false };
let live;

async function connectToOBS() {
  obs = new OBSWebSocket();

  const connect = async () => {
    try {
      const obsSettings = await getOBSSettings();
      console.log(obsSettings);

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

      console.error('OBS Connection Failed:', error);
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
    console.log('Recording state changed');
    console.log(event);
    if (event.outputActive == true) {
      console.log('Recroding Started')
      const fileName = path.basename(event.outputPath);
      console.log(fileName);
    } else if (event.outputState == 'OBS_WEBSOCKET_OUTPUT_STOPPED') {
      console.log('Recording Stopped');
      const fileName = path.basename(event.outputPath);
      setTimeout(console.log('Handling File'), 5000);
    }
  });

  obs.on('ReplayBufferSaved', (event) => {
    console.log('Replay Saved');
    console.log(event);
  });

  obs.on('StreamStateChanged', (event) => {
    console.log('Stream Started');
    console.log(event);
    if (event.outputActive == true) {
      live = true;
    } else {
      live = false;
    }
  });
}

export { connectToOBS, obsConnection };
