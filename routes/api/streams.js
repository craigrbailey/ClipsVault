import { Router } from 'express';
import { getStreamsPaginated } from '../../db.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        const streams = await getStreamsPaginated(page, size);
        res.json(streams);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
        console.error('Error:', error);
    }
});

export default router;
