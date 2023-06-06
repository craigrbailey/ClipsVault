import { Router } from 'express';
import { twitchLive } from '../../utilities/twitch.js';
import { insertClip } from '../../db.js';
import { length } from '../../utilities/obs.js';
import { getAPIKey } from '../../db.js';
import { writeToLogFile } from '../../utilities/logging.js';

const router = Router();

router.post('/', async (req, res) => {
    const requestApiKey = req.headers['x-api-key'];
    const apiKey = await getAPIKey();
    if (requestApiKey !== apiKey) {
        writeToLogFile('error', `Unauthorized request to /api/clip received from ${req.ip}`)
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const start = length;
    if (start === 0) {
        return res.status(400).json({ error: 'Invalid start time.' });
    }
    const { tags, clipLength } = req.body;
    writeToLogFile('info', `Clip received: length: ${clipLength} Tags received: ${tags}`);
    const liveData = await twitchLive();
    insertClip(clipLength, start, tags, liveData.category, liveData.img);
    res.json({ message: 'Tags received successfully.' });
});

export { router as ClipRouter };
