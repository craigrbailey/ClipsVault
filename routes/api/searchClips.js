import { Router } from 'express';
import { checkSetup, getVideosByDateRange, getAllVideos, getVideosByTag, getAllFavoriteVideos, getVideosByCategory } from '../../db.js';

const router = Router();

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

router.post('/', checkSetup, async (req, res) => {
    let videos = await getAllVideos();
    const { tags, category, from, to, favorite } = req.body;
    console.log(`Searching for clips with tags: ${tags}, category: ${category}, from: ${from}, to: ${to}, favorite: ${favorite}`);
    videos = videos.filter((video, index) => {
        let meetsCriteria = true;
        if (tags.length > 0 && !video.tags.some(tag => tags.includes(tag))) {
            meetsCriteria = false;
        }
        if (category !== 'All' && video.category !== category) {
            meetsCriteria = false;
        }
        if (from !== '' && to !== '' && (video.date < from || video.date > to)) {
            meetsCriteria = false;
        }
        if (favorite && !video.favorite) {
            meetsCriteria = false;
        }
        return meetsCriteria;
    });
    videos.forEach((video) => {
        video.length = formatDuration(video.length);
    });
    console.log(`Found ${videos.length} clips.`);
    return res.json(videos);
});

export default router;
