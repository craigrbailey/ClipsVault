import { Router } from 'express';
import { getMemoryUsage } from '../utilities/system.js';
import { checkSetup } from '../db.js';
import { updateLiveRequired, storeDiscordWebhookURL, getDiscordWebhookURL } from '../db.js';
import { sendMessageToDiscord } from '../utilities/discord-message.js';

const router = Router();

router.get('/', checkSetup, async (req, res) => {
  const userData = req.session.userData
  const memoryUsage = getMemoryUsage();
  const discordWebhookURL = await getDiscordWebhookURL();
  res.render('settings', { userData, memoryUsage, discordWebhookURL });
});

router.post('/', (req, res) => {
  console.log(req.body);
  const setting = req.body.setting;
  const value = req.body.value;
  if (setting === 'liveRequired') {
    if (value === 'true' || value === 'false)') {
      updateLiveRequired(value);
      res.status(200).send('Live Required setting updated successfully.');
    }
  } else if (setting === 'discord') {
    storeDiscordWebhookURL(value);
    sendMessageToDiscord('Test message')
    res.status(200).send('Discord Webhook URL updated successfully.');
  }
});

export default router;
