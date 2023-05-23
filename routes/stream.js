import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { checkSetup, getVideosByStreamId, getStreamById } from '../db.js';
import { formatDate } from '../utilities/system.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', checkSetup, async (req, res) => {
    const streamId = req.query.streamId;
    console.log(streamId);
    const streamData = await getStreamById(streamId);
    console.log(streamData);
    const videoData = await getVideosByStreamId(streamId);
    const date = formatDate(streamData.date);
    const userData = req.session.userData
    res.render('stream', { userData, streamData, date });
});

export default router;
