import { Router } from 'express';
import { getAllNotifications, removeNotificationById, addNotification } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const notifications = await getAllNotifications();
    res.json(notifications);
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete('/:id', async (req, res) => {
  console.log("Deleting notification:", req.params);
  const { id } = req.params;
  try {
    const result = await removeNotificationById(id);
    if (result) {
      res.json({ message: "Notification removed successfully." });
    } else {
      res.status(404).json({ error: "Notification not found." });
    }
  } catch (error) {
    console.error("Error removing notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/', async (req, res) => {
  const { title, message } = req.body;
  try {
    const newNotification = await addNotification(title, message);
    res.json(newNotification);
  } catch (error) {
    console.error("Error adding notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
