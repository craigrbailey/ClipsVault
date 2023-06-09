import { Router } from 'express';
import { checkSetup, getAllStreams } from '../db.js';

const router = Router();

router.get('/', checkSetup, async (req, res) => {
  const streams = await getAllStreams();
  streams.forEach((stream) => {
    stream.length = formatStreamLength(stream.length);
  });
  const userData = req.session.userData
  res.render('queue', { userData });
});

export default router;
