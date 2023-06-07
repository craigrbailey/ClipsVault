import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { getMemoryUsage } from '../utilities/system.js';
import { checkSetup, getAllVideos, getAllCategories } from '../db.js';

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
    const videos = await getAllVideos();
    const categories = await getAllCategories();
    const userData = req.session.userData
    const memoryUsage = getMemoryUsage();
    videos.map((video) => {
        const durationInSeconds = video.length;
        const formattedDuration = formatDuration(durationInSeconds);
        video.length = formattedDuration;
    });
    res.render('allclips', { userData, memoryUsage, __dirname, videos, categories });
});

export default router;
