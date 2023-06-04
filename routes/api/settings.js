import { Router } from 'express';
import { updateLiveRequired, storeDiscordWebhookURL,storeAPIKey } from '../../db.js';
import { sendMessageToDiscord } from '../../utilities/discord-message.js';
import { serverKey, generateApiKey } from '../../utilities/api-key.js';
import { writeToLogFile } from '../../utilities/logging.js';

const router = Router();

router.post('/', async (req, res) => {
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
    } else if (setting === 'apikey') {
        const newapiKey = await generateApiKey();
        await storeAPIKey(newapiKey);
        writeToLogFile('info', 'User API Key updated:');
        res.status(200).json({
            message: 'API Key updated successfully.',
            apiKey: newapiKey
        });
    }
});

export default router;
