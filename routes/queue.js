import { Router } from 'express';
import { getAllQueueItems, removeQueueItemById, insertQueue } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const queueItems = await getAllQueueItems();
    res.json(queueItems);
  } catch (error) {
    console.error("Error retrieving queue items:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/queue', async (req, res) => {
  const { item } = req.body;
  try {
    const newQueueItem = await insertQueue(item);
    res.json(newQueueItem);
  } catch (error) {
    console.error("Error adding item to queue:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete('/queue/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await removeQueueItemById(id);
    if (result) {
      res.json({ message: "Queue item removed successfully." });
    } else {
      res.status(404).json({ error: "Queue item not found." });
    }
  } catch (error) {
    console.error("Error removing queue item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
