import { getNotificationsToggle, getDiscordWebhookURL, addNotification } from '../db.js';
import { sendMessageToDiscord } from './discord-message.js';

async function notificationHandler(notification) {
    const settings = await getNotificationsToggle();
    const webhookURL = await getDiscordWebhookURL();
    await addNotification(notification);
    if (settings.discord === true) {
        if (webhookURL === null) {
            addNotification('Discord notifications are enabled, but no webhook URL has been set. Please set a webhook URL in the settings page.');
            return;
        } else {
            await sendMessageToDiscord(notification);
        }
    }
}

export { notificationHandler };