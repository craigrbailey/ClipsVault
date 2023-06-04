import { Router } from 'express';
import { addTagToStream, addTagToVideo, removeTagFromStream, removeTagFromVideo } from '../../db.js';
import { serverKey } from '../../utilities/api-key.js';
import { writeToLogFile } from '../../utilities/logging.js';

const router = Router();

router.post('/', async (req, res) => {
    const requestApiKey = req.headers['x-api-key'];
    if (requestApiKey !== serverKey) {
        writeToLogFile('error', `Unauthorized request to /api/tags received from ${req.ip}`)
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const { tagType, id, newTag } = req.body;
        if (!tagType || !id || !newTag) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        if (tagType === 'video') {
            if (id === null) {
                return res.status(400).json({ error: 'invalid ID' });
            } else if (!tagType || !id || !newTag) {
                return res.status(400).json({ error: 'Invalid request body' });
            } else {
                addTagToVideo(id, newTag);
                return res.json({ success: true, message: 'Tag added successfully' });
            }
        } else if (tagType === 'stream') {
            addTagToStream(id, newTag);
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ error: 'Invalid tag type' });
        }
    } catch (error) {
        console.error('Error adding tag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/', async (req, res) => {
    const requestApiKey = req.headers['x-api-key'];
    if (requestApiKey !== serverKey) {
        writeToLogFile('error', `Unauthorized request to /api/tags received from ${req.ip}`)
        return res.status(401).json({ error: 'Unauthorized' });
    }
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

export { router as TagRouter };