import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { checkSetup } from '../db.js';
import { serverKey } from '../utilities/api-key.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', checkSetup, async (req, res) => {
    const userData = req.session.userData;
    const apiKey = serverKey;
    res.render('addstream', { userData, __dirname, apiKey });
});

export default router;
