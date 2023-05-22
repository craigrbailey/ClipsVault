import { Router } from 'express';
import { getMemoryUsage} from '../utilities/system.js';

const router = Router();

router.get('/', (req, res) => {
    const memoryUsage = getMemoryUsage();
    res.json(memoryUsage);
  });

export default router;