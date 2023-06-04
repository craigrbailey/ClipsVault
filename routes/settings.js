import { Router } from 'express';
import { getMemoryUsage } from '../utilities/system.js';
import { checkSetup } from '../db.js';
import { getDiscordWebhookURL, getAPIKey } from '../db.js';

const router = Router();

router.get('/', checkSetup, async (req, res) => {
  const userData = req.session.userData
  const memoryUsage = getMemoryUsage();
  const discordWebhookURL = await getDiscordWebhookURL();
  const apiKey = await getAPIKey();
  const serverKey = await getAPIKey();
  res.render('settings', { userData, memoryUsage, discordWebhookURL, apiKey, serverKey });
});

export default router;
