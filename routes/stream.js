import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { checkSetup } from '../db.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', checkSetup, (req, res) => {
    const userData = req.session.userData
    const parameter = req.params.parameter;
    res.render('stream', { userData, parameter });
});

export default router;
