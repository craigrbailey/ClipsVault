import { Router } from 'express';
import cors from 'cors';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { insertStream, insertVideo, addVideoToStream, removeStream, updateStreamLength, updateStream } from '../../db.js';
import { getGameBoxArt } from '../../utilities/twitch.js';
import { createFolder, getVideoLength } from '../../utilities/system.js';

const router = Router();

// Enable CORS with specific options
const corsOptions = {
  origin: 'http://localhost',
};
router.use(cors(corsOptions));

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage })

router.post('/', upload.array('fileUpload'), async (req, res) => {
  const streamCategory = req.body.streamCategory;
  const streamDate = req.body.streamDate;
  const folder = await createFolder(streamDate);
  const gameArt = await getGameBoxArt(streamCategory);
  const streamId = await insertStream(streamDate, streamCategory, gameArt, '');
  let streamLength = 0;
  let streamFile = null;
  try {
    for (const file of req.files) {
      const fileLength = await getVideoLength(file.path);
      if (fileLength > 1800) {
        streamLength = fileLength;
        streamFile = file.originalname;
        updateStreamLength(streamId, streamLength);
      }
      const videoId = await insertVideo(streamId, `${folder}\\${file.originalname}`, streamDate, streamCategory, gameArt, file.size, fileLength, []);
      await addVideoToStream(streamId, videoId);
      await fs.rename(file.path, `${folder}/${file.originalname}`);
    }
    res.json({ success: true, message: 'Stream added successfully', streamId: streamId });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.put('/', async (req, res) => {
  try {
    console.log(req.body);
    const streamId = req.body.streamId;
    const streamCategory = req.body.streamCategory;
    const streamDate = req.body.streamDate;
    await updateStream(streamId, streamDate, streamCategory);
    res.json({ success: true, message: 'Stream updated successfully' });
  } catch (error) {
    console.error('Error updating stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:streamId', async (req, res) => {
  try {
    const streamId = req.params.streamId;
    console.log(streamId);
    removeStream(streamId);
    res.json({ success: true, message: 'Stream removed successfully' });
  } catch (error) {
    console.error('Error removing stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;