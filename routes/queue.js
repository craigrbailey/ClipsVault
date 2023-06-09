import { Router } from 'express';
import { checkSetup, getAllQueueItems } from '../db.js';

const router = Router();

function formatStreamLength(lengthInSeconds) {
  const hours = Math.floor(lengthInSeconds / 3600);
  const minutes = Math.floor((lengthInSeconds % 3600) / 60);
  const seconds = lengthInSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}


router.get('/', checkSetup, async (req, res) => {
  const videos = await getAllQueueItems();
  videos.forEach((video) => {
    video.length = formatStreamLength(video.length);
  });
  const userData = req.session.userData
  res.render('queue', { userData, videos });
});

export default router;
