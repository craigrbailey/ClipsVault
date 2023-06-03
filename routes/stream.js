import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { checkSetup, getVideosByStreamId, getStreamById } from '../db.js';
import { formatDate } from '../utilities/system.js';
import { serverKey } from '../utilities/api-key.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', checkSetup, async (req, res) => {
    const streamId = req.query.streamId;
    const streamData = await getStreamById(streamId);
    const videoData = await getVideosByStreamId(streamId);
    const date = streamData ? formatDate(streamData.date) : null;
    const userData = req.session.userData;
    const apiKey = serverKey;
    res.render('stream', { userData, streamData, date, videoData, __dirname, apiKey });
});

export default router;
