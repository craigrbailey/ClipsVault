import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { getMemoryUsage } from '../utilities/system.js';
import { checkSetup, getAllVideos } from '../db.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', checkSetup, async (req, res) => {
    const videos = await getAllVideos();
    const userData = req.session.userData
    const memoryUsage = getMemoryUsage();
    res.render('allclips', { userData, memoryUsage, __dirname, videos });
});

export default router;