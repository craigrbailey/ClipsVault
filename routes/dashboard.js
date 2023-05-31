import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { getMemoryUsage } from '../utilities/system.js';
import { checkSetup, getAllStreams } from '../db.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function formatStreamLength(lengthInSeconds) {
  const hours = Math.floor(lengthInSeconds / 3600);
  const minutes = Math.floor((lengthInSeconds % 3600) / 60);
  const seconds = lengthInSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

router.get('/', checkSetup, async (req, res) => {
  const streams = await getAllStreams();
  streams.forEach((stream) => {
    stream.length = formatStreamLength(stream.length);
  });
  console.log(streams);
  const userData = req.session.userData
  const memoryUsage = getMemoryUsage();
  res.render('dashboard', { userData, memoryUsage, streams });
});

export default router;
