import { getNotificationsToggle, getDiscordWebhookURL, addNotification } from '../db.js';
import { sendMessageToDiscord } from './discord-message.js';

async function notificationHandler(level, notification, type=null,) {
    const settings = await getNotificationsToggle();
    const webhookURL = await getDiscordWebhookURL();
    await addNotification(notification, level);
    if (settings.discord && settings[type]) {
        if (webhookURL === null) {
            addNotification('Discord notifications are enabled, but no webhook URL has been set. Please set a webhook URL in the settings page.');
            return;
        } else {
            await sendMessageToDiscord(notification);
        }
    }
}

export { notificationHandler };
