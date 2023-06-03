import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { checkSetup, getVideoData } from '../db.js';
import { serverKey } from '../utilities/api-key.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', checkSetup, async (req, res) => {
    const videoId = req.query.videoId;
    const videoData = await getVideoData(videoId);
    const userData = req.session.userData;
    const apiKey = serverKey;
    res.render('video', { userData, videoData, __dirname, apiKey });
});

router.get('/', checkSetup, async (req, res) => {
    const apiKey = serverKey;
    const requestApiKey = req.headers['x-api-key'];
    if (requestApiKey !== serverKey) {
        writeToLogFile('error', `Unauthorized request to delete a video received from ${req.ip}`)
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.body;
    res.render('video', { userData, videoData, __dirname, apiKey });
});

export default router;
