import { Router } from 'express';
import cors from 'cors';
import multer from 'multer';
import { promises as fs } from 'fs';
import { getStreamById, insertVideo, addVideoToStream, removeStream } from '../../db.js';
import { createFolder, getVideoLength } from '../../utilities/system.js';
import { ObjectId } from 'mongodb';

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
    console.log(req.body);
    const { streamId } = req.body;
    const streamData = await getStreamById(streamId);
    const { category, date, background_img } = streamData;
    const folder = await createFolder(date);
    try {
        for (const file of req.files) {
            const fileLength = await getVideoLength(file.path);
            const videoId = await insertVideo(new ObjectId(streamId), `${folder}\\${file.originalname}`, date, category, background_img, file.size, fileLength, []);
            await addVideoToStream(streamId, videoId);
            await fs.rename(file.path, `${folder}/${file.originalname}`);
        }
        res.json({ success: true, message: 'Stream added successfully' });
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