import { Router } from 'express';
import { obsConnection  } from '../utilities/obs.js';

const router = Router();

router.get('/', (req, res) => {
  const obsConnectionStatus = obsConnection.status;
    res.json({ status: obsConnectionStatus });
  });

export default router;