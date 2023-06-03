import { Router } from 'express';
import { checkSetup, deleteVideo } from '../../db.js';
import { serverKey } from '../../utilities/api-key.js';

const router = Router();

router.delete('/', checkSetup, async (req, res) => {
    const requestApiKey = req.headers['x-api-key'];
    if (requestApiKey !== serverKey) {
        writeToLogFile('error', `Unauthorized request to delete a video received from ${req.ip}`)
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.body;
    if (id === null) {
        return res.status(400).json({ error: 'invalid ID' });
    } else {
        deleteVideo(id);
        return res.json({ success: true, message: 'Deleted video successfully' });
    }
});

export default router;
