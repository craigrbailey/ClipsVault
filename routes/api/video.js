import { Router } from 'express';
import {removeTagFromStream, removeTagFromVideo, getVideosPaginated } from '../../db.js';
import { serverKey } from '../../utilities/api-key.js';
import { writeToLogFile } from '../../utilities/logging.js';
import { validateApiKey } from '../../utilities/middleware.js';

const router = Router();

router.delete('/', validateApiKey, async (req, res) => {
    try {
        const { tagType, id, tagToRemove } = req.body;
        if (!tagType || !id || !tagToRemove) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        if (tagType === 'video') {
            removeTagFromVideo(id, tagToRemove);
            writeToLogFile('info', 'Video tag removed:', tagToRemove);
            return res.status(200).json({ success: true });
        } else if (tagType === 'stream') {
            removeTagFromStream(id, tagToRemove);
            writeToLogFile('info', 'Stream tag removed:', tagToRemove);
            return res.status(200).json({ success: true });
        }
    } catch (error) {
        writeToLogFile('info', 'Error removing tag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', async (req, res) => {
    console.log('get request received');
    try {
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        const videos = await getVideosPaginated(page, size);
        res.json(videos);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
        console.error('Error:', error);
    }
});

export default router;