import express from 'express';
import session from 'express-session';
import MongoDBStore from 'connect-mongodb-session';
import fs, { write } from 'fs';
import { config } from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import { initdb } from './db.js';
import { connectToOBS } from './utilities/obs.js';
import bodyParser from 'body-parser';
import { watcher } from './utilities/watcher.js'
import { validateAccessToken } from './utilities/twitch.js';
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
    cookie: {
      maxAge: null,
    },
  })
);

const __dirname = dirname(fileURLToPath(import.meta.url));
export { __dirname };
app.use(express.static(path.join(__dirname, './public')));
app.use('/clips', express.static(path.join(__dirname, 'clips')));
app.use('/recordings', express.static(path.join(__dirname, 'recordings')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// Initialize database
initdb();

// Create directories if they don't exist
const folders = ['./uploads', './clips', './trash', './logs', './recordings', './models', './encoding'];
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
import notificationsRouter from './routes/api/notifications.js';
import obsConnectionRouter from './routes/api/obs-connection.js';
import obsConnectionSettings from './routes/obs-settings.js';
import streamConnectionRouter from './routes/stream.js';
import googleCallbackRouter from './routes/googleCallback.js';
import googleAuthRouter from './routes/googleauth.js';
import categorySearchRouter from './routes/api/categorysearch.js';
import StreamRouter from './routes/api/addstream.js';
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
import addStreamView from './routes/addstream.js';
import { writeToLogFile } from './utilities/logging.js';
import videoHandlerRouter from './routes/api/clipHandler.js';

// Create API router
const apiRouter = express.Router();
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/obs-connection', obsConnectionRouter);
apiRouter.use('/categorysearch', categorySearchRouter);
apiRouter.use('/stream', StreamRouter);
apiRouter.use('/getstreams', getStreamsRouter);
apiRouter.use('/tags', TagRouter);
apiRouter.use('/clipit', ClipRouter);
apiRouter.use('/favorite', favoriteRouter);
apiRouter.use('/deletevideo', deleteVideoRouter);
apiRouter.use('/searchclips', searchClipsRouter);
apiRouter.use('/queue', queueHandler);
apiRouter.use('/settings', settingsApiRouter);
apiRouter.use('/clip', videoHandlerRouter);

// Create regular router
const regularRouter = express.Router();
regularRouter.use('/auth/twitch/callback', twitchCallBackRouter);
regularRouter.use('/authorize', authorizeRouter);
regularRouter.use('/', dashboardRouter);
regularRouter.use('/settings', settingsRouter);
regularRouter.use('/setup', setupRouter);
regularRouter.use('/memory-usage', memoryUsageRouter);
regularRouter.use('/status', statusRouter);
regularRouter.use('/get-queue', getQueueRouter);
regularRouter.use('/obs-settings', obsConnectionSettings);
regularRouter.use('/stream/:streamId', streamConnectionRouter);
regularRouter.use('/stream', streamConnectionRouter);
regularRouter.use('/googlecallback', googleCallbackRouter);
regularRouter.use('/googleauth', googleAuthRouter);
regularRouter.use('/video', videoRouter);
regularRouter.use('/allclips', clipsRouter);
regularRouter.use('/addstream', addStreamView);

// Register routers
app.use('/api', apiRouter);
app.use('/', regularRouter);

// Connect to OBS
await connectToOBS();

// Start the server
app.listen(port, () => {
  writeToLogFile('info', `Server is running at http://localhost:${port}`);
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Visit http://localhost:${port}/authorize to start the authentication process.`);
});
