import express from 'express';
import session from 'express-session';
import MongoDBStore from 'connect-mongodb-session';
import fs from 'fs';
import { config } from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import { initdb } from './db.js';
import { connectToOBS, obsConnection } from './utilities/obs.js';
import bodyParser from 'body-parser';
import multer from 'multer';
import { watcher } from './utilities/watcher.js'
import { validateAccessToken, refreshAccessToken } from './utilities/twitch.js';
import cron from 'node-cron';

config();
// Validates access token every 4 hours
cron.schedule('0 */4 * * *', () => {
  validateAccessToken();
});

let initialFilename = '';
watcher.on('add', (filePath) => {
  initialFilename = filePath;
});

watcher.on('change', (filePath) => {
  if (filePath !== initialFilename) {
    console.log(`File ${initialFilename} has been renamed to ${filePath}.`);
    // Perform actions you want when the file is renamed
  }
  initialFilename = '';
});

watcher.on('unlink', (filePath) => {
  console.log(`File ${filePath} has been removed.`);
  // Perform actions you want when a file is removed
});

watcher.on('error', (error) => {
  console.error(`Watcher error: ${error}`);
});


// Configure the app
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const MongoDBStoreSession = MongoDBStore(session);
const store = new MongoDBStoreSession({
  uri: 'mongodb://192.168.1.31:27017/data',
  collection: 'sessions',
});

store.on('error', (error) => {
  console.error('Session store error:', error);
});
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

const __dirname = dirname(fileURLToPath(import.meta.url));
export { __dirname };
app.use(express.static(path.join(__dirname, './public')));
app.use('/clips', express.static(path.join(__dirname, 'clips')));
app.use('/recordings', express.static(path.join(__dirname, 'recordings')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

initdb();

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Create directories if they don't exist
const folders = ['./uploads', './clips', './trash', './logs', './recordings', './models'];
for (const folder of folders) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
    console.log(`Created directory: ${folder}`);
  }
}

// Import Routes
import twitchCallBackRouter from './routes/twitchCallBack.js';
import authorizeRouter from './routes/authorize.js';
import dashboardRouter from './routes/dashboard.js';
import settingsRouter from './routes/settings.js';
import setupRouter from './routes/setup.js';
import memoryUsageRouter from './routes/memory-usage.js';
import statusRouter from './routes/api/status.js';
import getQueueRouter from './routes/queue.js';
import notificationsRouter from './routes/notifications.js';
import obsConnectionRouter from './routes/api/obs-connection.js';
import obsConnectionSettings from './routes/obs-settings.js';
import streamConnectionRouter from './routes/stream.js';
import googleCallbackRouter from './routes/google-callback.js';
import googleAuthRouter from './routes/googleauth.js';
import categorySearchRouter from './routes/api/categorysearch.js';
import addStreamRouter from './routes/api/addstream.js';
import getStreamsRouter from './routes/api/getstreams.js';
import { TagRouter } from './routes/api/tags.js';
import { ClipRouter } from './routes/api/clip.js';
import videoRouter from './routes/video.js';
import favoriteRouter from './routes/api/favorite.js';
import deleteVideoRouter from './routes/api/deleteVideo.js';
import clipsRouter from './routes/clips.js';
import searchClipsRouter from './routes/api/searchClips.js';
import queueHandler from './routes/api/queue.js'
import settingsApiRouter from './routes/api/settings.js';

// Register routes
app.use('/auth/twitch/callback', twitchCallBackRouter);
app.use('/authorize', authorizeRouter);
app.use('/', dashboardRouter);
app.use('/settings', settingsRouter);
app.use('/setup', setupRouter);
app.use('/memory-usage', memoryUsageRouter);
app.use('/status', statusRouter);
app.use('/get-queue', getQueueRouter);
app.use('/notifications', notificationsRouter);
app.use('/api/obs-connection', obsConnectionRouter);
app.use('/obs-settings', obsConnectionSettings);
app.use('/stream/:streamId', streamConnectionRouter);
app.use('/stream', streamConnectionRouter);
app.use('/googlecallback', googleCallbackRouter);
app.use('/googleauth', googleAuthRouter);
app.use('/api/categorysearch', categorySearchRouter);
app.use('/api/stream', addStreamRouter);
app.use('/api/getstreams', getStreamsRouter);
app.use('/api/tags', TagRouter);
app.use('/api/clip', ClipRouter);
app.use('/video', videoRouter);
app.use('/api/favorite', favoriteRouter);
app.use('/api/deletevideo', deleteVideoRouter);
app.use('/allclips', clipsRouter);
app.use('/api/searchclips', searchClipsRouter);
app.use('/api/queue', queueHandler);
app.use('/api/settings', settingsApiRouter);

// Connect to OBS
await connectToOBS();
// const obsConnectionStatus = obsConnection.status;


// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Visit http://localhost:${port}/authorize to start the authentication process.`);
});
