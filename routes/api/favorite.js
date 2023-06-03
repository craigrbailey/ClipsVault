import { Router } from 'express';
import { updateVideoFavoriteStatus } from '../../db.js';
import { serverKey } from '../../utilities/api-key.js';
import { writeToLogFile } from '../../utilities/logging.js';

const router = Router();

router.post('/', async (req, res) => {
    const requestApiKey = req.headers['x-api-key'];
    if (requestApiKey !== serverKey) {
        writeToLogFile('error', `Unauthorized request to /api/favorite received from ${req.ip}`)
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const { favoriteType, id, status } = req.body;
        if (favoriteType === 'video') {
            if (id === null) {
                return res.status(400).json({ error: 'invalid ID' });
            } else {
                if (status === true) {
                    updateVideoFavoriteStatus(id, true);
                    return res.json({ success: true, message: 'Updated favorite status successfully' });
                } else if (status === false) {
                    updateVideoFavoriteStatus(id, false);
                    return res.json({ success: true, message: 'Updated favorite status successfully' });
                }
            }
        } else if (favoriteType === 'stream') {
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ error: 'Invalid favorite type type' });
        }
    } catch (error) {
        writeToLogFile('error', `Error favoriting video: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;