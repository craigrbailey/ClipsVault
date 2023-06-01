import { fileURLToPath } from 'url';
import { Router } from 'express';
import { getMemoryUsage} from '../utilities/system.js';
import { checkSetup } from '../db.js';
import { updateLiveRequired } from '../db.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);

router.get('/', checkSetup, (req, res) => {
  const userData = req.session.userData
  const memoryUsage = getMemoryUsage();
  res.render('settings', { userData, memoryUsage });
});

router.post('/', (req, res) => {
  console.log(req.body);
  const setting = req.body.setting;
  const value = req.body.value;
  if (setting === 'liveRequired') {
    if (value === 'true' || value === 'false)') {
      updateLiveRequired(value);
      res.status(200).send('Live Required setting updated successfully.');
    }
  }
});

export default router;
