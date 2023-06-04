import { Router } from 'express';
import { getMemoryUsage } from '../utilities/system.js';
import { getDiscordWebhookURL, getAPIKey, getOBSSettings, checkSetup, getLiveRequired, 
  getCleanupTime, InitializeSetup, getNotificationsToggle, getDiscordStatus} from '../db.js';

const router = Router();

router.get('/', checkSetup, async (req, res) => {
  const obsSettings = await getOBSSettings();
  const liveRequired = await getLiveRequired();
  const discordStatus = await getDiscordStatus();
  const userData = req.session.userData
  const memoryUsage = getMemoryUsage();
  const discordWebhookURL = await getDiscordWebhookURL();
  const apiKey = await getAPIKey();
  const serverKey = await getAPIKey();
  res.render('settings', { userData, memoryUsage, discordWebhookURL, apiKey, serverKey, obsSettings, liveRequired, discordStatus });
});

export default router;
