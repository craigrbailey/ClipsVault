import axios from 'axios';
import { getDiscordWebhookURL } from '../db.js';
import { writeToLogFile } from './logging.js';

async function sendMessageToDiscord(message) {
    console.log('Sending message to Discord...');
    const webhookURL = await getDiscordWebhookURL();
    const payload = {
        content: message,
    };

    try {
        await axios.post(webhookURL, payload);
        writeToLogFile('info', `Message sent to Discord: ${message}`);
    } catch (error) {
        writeToLogFile('error', `Error sending message to Discord: ${error}`);
    }
}

export { sendMessageToDiscord };