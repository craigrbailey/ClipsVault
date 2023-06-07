import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { checkSetup, getVideoData, deleteVideo } from '../db.js';
import { serverKey } from '../utilities/api-key.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', checkSetup, async (req, res) => {
    const videoId = req.query.videoId;
    const videoData = await getVideoData(videoId);
    const userData = req.session.userData;
    const apiKey = await serverKey;
    res.render('video', { userData, videoData, __dirname, apiKey });
});


export default router;
