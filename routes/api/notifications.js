import { Router } from 'express';
import { getAllNotifications, removeNotificationById, addNotification, markNotificationAsRead } from '../../db.js';
import { writeToLogFile } from '../../utilities/logging.js';

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

router.delete('/', async (req, res) => {
  console.log(req.body);
  const { id } = req.body;
  try {
    const result = await markNotificationAsRead(id);
    console.log(`Notification ${id} marked as read.`);
    res.json({ message: "Notification removed successfully." });
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