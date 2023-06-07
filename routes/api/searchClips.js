import { Router } from 'express';
import { checkSetup, getVideosByDateRange, getAllVideos, getVideosByTag, getAllFavoriteVideos, getVideosByCategory } from '../../db.js';

const router = Router();

function formatStreamLength(lengthInSeconds) {
    const hours = Math.floor(lengthInSeconds / 3600);
    const minutes = Math.floor((lengthInSeconds % 3600) / 60);
    const seconds = lengthInSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}

router.post('/', checkSetup, async (req, res) => {
    let videos = await getAllVideos();
    const { tags, category, from, to, favorite } = req.body;
    console.log(`Searching for clips with tags: ${tags}, category: ${category}, from: ${from}, to: ${to}, favorite: ${favorite}`);
    videos = videos.filter((video, index) => {
        let meetsCriteria = true;
        if (tags.length > 0 && !video.tags.some(tag => tags.includes(tag))) {
            console.log(`Video ${video._id} does not contain all tags: ${tags}`);
            meetsCriteria = false;
        }
        if (category !== 'All' && video.category !== category) {
            console.log(`Video ${video._id} does not match category: ${category}`);
            meetsCriteria = false;
        }
        if (from !== '' && to !== '' && (video.date < from || video.date > to)) {
            console.log(`Video ${video._id} does not match date range: ${from} - ${to}`);
            meetsCriteria = false;
        }
        if (favorite && !video.favorite) {
            console.log(`Video ${video._id} is not a favorite`);
            meetsCriteria = false;
        }
        return meetsCriteria;
    });
    videos.forEach((video) => {
        video.length = formatStreamLength(video.length);
    });
    console.log(`Found ${videos.length} clips.`);
    return res.json(videos);
});

export default router;
