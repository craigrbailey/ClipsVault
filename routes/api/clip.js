import { Router } from 'express';
import { twitchLive } from '../../utilities/twitch.js';
import { insertClip } from '../../db.js';
import { length } from '../../utilities/obs.js';
import { writeToLogFile } from '../../utilities/logging.js';
import { validateApiKey } from '../../utilities/middleware.js';

const router = Router();

router.post('/', validateApiKey, async (req, res) => {
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
