import { Router } from 'express';
import { updateLiveRequired, storeDiscordWebhookURL,storeAPIKey, updateDiscordToggle, updateOBSSettings, updateCleanupTime, 
    updateGmailToggle, updateNotificationToggle, updateArchiveSettings} from '../../db.js';
import { sendMessageToDiscord } from '../../utilities/discord-message.js';
import { serverKey, generateApiKey } from '../../utilities/api-key.js';
import { writeToLogFile } from '../../utilities/logging.js';

const router = Router();

router.post('/', async (req, res) => {
    const setting = req.body.setting;
    const value = req.body.value;
    if (setting === 'liveRequired') {
        if (value === true || value === false) {
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
    } else if (setting === 'discordToggle') {
        if (value === true || value === false) {
            await updateDiscordToggle(value);
            res.status(200).send('Discord Toggle setting updated successfully.');
        }
    } else if (setting === 'obsSettings') {
        const{ host, port, password } = value;
        updateOBSSettings(host, port, password);
        res.status(200).send('OBS Settings updated successfully.');
    } else if (setting === 'maintenanceTime') {
        updateCleanupTime(value);
        res.status(200).send('Maintenance Time updated successfully.');
    } else if (setting === 'gmailToggle') {
        console.log('gmailToggle');
        updateGmailToggle(value);
        res.status(200).send('gmailToggle updated successfully.');
    } else if (setting === 'notificationToggle') {
        const toggle = req.body.toggle;
        updateNotificationToggle(toggle, value);
        res.status(200).send('notificationToggle updated successfully.');
    } else if (setting === 'archiveSettings') {
        const{ archive, archiveTime } = value;
        updateArchiveSettings(archive, archiveTime);
        res.status(200).send('Archive Settings updated successfully.');
    }
});

export default router;
