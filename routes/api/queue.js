import { Router } from 'express';
import { removeQueueItemById, insertQueue } from '../../db.js';

const router = Router();

router.post('/', async (req, res) => {
    const { item } = req.body;
    try {
        await insertQueue(item);
        res.json({ success: true, message: "Clip added ton queue." });
    } catch (error) {
        console.error("Error adding item to queue:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

router.delete('/', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await removeQueueItemById(id);
        if (result) {
            res.json({ success: true, message: "Queue item removed successfully." });
        } else {
            res.status(404).json({ error: "Queue item not found." });
        }
    } catch (error) {
        console.error("Error removing queue item:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

export default router;