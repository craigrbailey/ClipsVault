import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { getMemoryUsage} from '../utilities/system.js';
import { checkSetup } from '../db.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', checkSetup, (req, res) => {
  const userData = req.session.userData
  const memoryUsage = getMemoryUsage();
  res.render('dashboard', { userData, memoryUsage });
});

export default router;
