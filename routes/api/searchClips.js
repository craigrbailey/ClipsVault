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
    let videos = [];
    const { tags, category, from, to, favorite } = req.body;
    console.log(`Searching for clips with tags: ${tags}, category: ${category}, from: ${from}, to: ${to}, favorite: ${favorite}`);
    if (tags.length > 0) {
        videos.push(...(await getVideosByTag(tags)));
    }
    if (category !== 'All') {
        videos.push(...(await getVideosByCategory(category)));
    } else if (category === 'All') {
        videos.push(...(await getAllVideos()));
    }
    if (from !== '' && to !== '') {
        videos.push(...(await getVideosByDateRange(from, to)));
    }
    if (favorite) {
        videos.push(...(await getAllFavoriteVideos()));
    }
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
        const duplicateIndex = videos.findIndex(item => item._id.toString() === video._id.toString());
        if (duplicateIndex !== index) {
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
