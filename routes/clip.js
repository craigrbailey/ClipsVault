import { Router } from 'express';
import { twitchLive } from '../utilities/twitch.js';
import { insertClip } from '../db.js';
import { length } from '../utilities/obs.js';

let clipTags = [];
const router = Router();

router.post('/', async (req, res) => {
    const start = length; // Renamed the variable to 'start'
    console.log(start);
    if (start === 0) {
        console.log('Invalid start time.');
        return res.status(400).json({ error: 'Invalid start time.' });
    }
    const { tags, clipLength } = req.body; // Renamed the variable to 'clipLength'
    console.log(`Tags: ${tags}, length: ${clipLength}`);
    const liveData = await twitchLive();
    insertClip(clipLength, start, tags, liveData.category, liveData.img);
    res.json({ message: 'Tags received successfully.' });
});

export { router as ClipRouter, clipTags };
