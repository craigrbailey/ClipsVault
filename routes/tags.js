import { Router } from 'express';
import cors from 'cors';
import { addTagToStream, addTagToVideo, removeTagFromStream } from '../db.js';

const router = Router();

const corsOptions = {
    origin: 'http://localhost',
};

router.use(cors(corsOptions));

router.post('/', async (req, res) => {
    console.log(req.body)
    try {
        const { tagType, id, newTag } = req.body;

        if (!tagType || !id || !newTag) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        if (tagType === 'video') {
            addTagToVideo(id, newTag);
            return res.json({ success: true, message: 'Tag added successfully' });
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
    console.log(req.body);
    try {
        const { tagType, id, tagToRemove } = req.body;

        if (!tagType || !id || !tagToRemove) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        if (tagType === 'video') {
            success = await removeTagFromVideo(id, tagToRemove);
        } else if (tagType === 'stream') {
            removeTagFromStream(id, tagToRemove);
            return res.status(200).json({ success: true });
        }
    } catch (error) {
        console.error('Error removing tag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;