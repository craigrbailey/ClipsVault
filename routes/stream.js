import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { checkSetup, getVideosByStreamId, getStreamById } from '../db.js';
import { formatDate } from '../utilities/system.js';
import { serverKey } from '../utilities/api-key.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function formatDuration(durationInSeconds) {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;
    let formattedDuration = '';
    if (hours > 0) {
        formattedDuration += hours.toString().padStart(2, '0') + ':';
    }
    formattedDuration += minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    return formattedDuration;
}

router.get('/', checkSetup, async (req, res) => {
    const streamId = req.query.streamId;
    const streamData = await getStreamById(streamId);
    const videoData = await getVideosByStreamId(streamId);
    const date = streamData ? formatDate(streamData.date) : null;
    const userData = req.session.userData;
    const apiKey = serverKey;
    videoData.map((video) => {
        console.log(video);
        const durationInSeconds = video.length;
        const formattedDuration = formatDuration(durationInSeconds);
        video.length = formattedDuration;
    });
    res.render('stream', { userData, streamData, date, videoData, __dirname, apiKey });
});

export default router;
