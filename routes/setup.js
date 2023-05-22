import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { completeSetup } from '../db.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', (req, res) => {
  res.render('setup');
});

router.post('/', (req, res) => {
  completeSetup();
  res.json({ success: true });
});


export default router;
