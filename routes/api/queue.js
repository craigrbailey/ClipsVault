import { Router } from 'express';
import { insertQueue } from '../../db.js';
import { serverKey } from '../../utilities/api-key.js';
import { writeToLogFile } from '../../utilities/logging.js';

const router = Router();

router.post('/', async (req, res) => {
    const requestApiKey = req.headers['x-api-key'];
    if (requestApiKey !== serverKey) {
        writeToLogFile('error', `Unauthorized request to /api/tags received from ${req.ip}`)
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.body;
    insertQueue(id);
});

export default router;