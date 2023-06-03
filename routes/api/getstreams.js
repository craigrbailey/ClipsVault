import { Router } from 'express';
import cors from 'cors';
import multer from 'multer';
import { getAllStreams, getLatestStreams } from '../../db.js';

const router = Router();

const corsOptions = {
  origin: 'http://localhost',
};

router.use(cors(corsOptions));

router.get('/', async (req, res) => {
  const streams = await getAllStreams();
  res.json(streams);
});

router.post('/', async (req, res) => {
  const count = req.body.count;
  if (typeof count === 'number' && count > 0) {
    try {
      const streams = await getLatestStreams(count);
      res.json(streams);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.status(400).json({ message: 'Invalid count parameter' });
  }
});

export default router;