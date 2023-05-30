import { Router } from 'express';
import { addTagToStream, addTagToVideo, removeTagFromStream } from '../db.js';
import { serverKey } from '../utilities/api-key.js';

const router = Router();
let clipTags = [];
export { clipTags };

router.post('/', async (req, res) => {
    const requestApiKey = req.headers['x-api-key'];

    if (requestApiKey !== serverKey) {
        console.log('Unauthorized');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const { tagType, id, newTag } = req.body;
        console.log(`Tag type: ${tagType}, ID: ${id}, new tag: ${newTag}`)

        if (!tagType || !id || !newTag) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        if (tagType === 'video') {
            if (id === null) {
                clipTags = newTag;
                return res.status(200).json({ success: true });
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

export { router as TagRouter };