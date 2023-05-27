import { Router } from 'express';
import cors from 'cors';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { insertStream, insertVideo, addVideoToStream, removeStream, getRefreshToken } from '../db.js';
import { getGameBoxArt, refreshAccessToken } from '../utilities/twitch.js';
import { createFolder } from '../utilities/system.js';

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

// POST /newstream endpoint
router.post('/', upload.array('fileUpload'), async (req, res) => {
  // Get the stream category and stream date from the request body
  const streamCategory = req.body.streamCategory;
  const streamDate = req.body.streamDate;
  const folder = await createFolder(streamDate);
  let largestFile;
  let largestSize = 0;
  const gameArt = await getGameBoxArt(streamCategory);
  const streamId = await insertStream(streamDate, streamCategory, gameArt, '');
  try {
    for (const file of req.files) {
      const videoId = await insertVideo(streamId, `${folder}\\${file.originalname}`, streamDate, streamCategory, file.size, '');
      addVideoToStream(streamId, videoId);
      const { size } = await fs.stat(file.path);

      // Check if this file is larger than double the current largest file size
      if (size > largestSize * 2) {
        largestFile = file;
        largestSize = size;
      }

      // Move the file
      await fs.rename(file.path, `${folder}/${file.originalname}`);
    }

    // If there is a largest file, send its info in the response
    if (largestFile) {
      res.json({
        message: 'Upload successful',
        largestFile: largestFile.originalname,
        largestSize
      });
    } else {
      res.json({ message: 'Upload successful', notice: 'No single file is at least double the size of any other file.' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal server error' });
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