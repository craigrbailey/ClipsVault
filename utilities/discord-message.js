import axios from 'axios';
import { getDiscordWebhookURL } from '../db.js';

async function sendMessageToDiscord(message) {
    console.log('Sending message to Discord...');
    const webhookURL = await getDiscordWebhookURL();
    const payload = {
        content: message,
    };

    try {
        await axios.post(webhookURL, payload);
        console.log("Message sent successfully!");
    } catch (error) {
        console.error(`Error sending message to Discord: ${error}`);
    }
}

export { sendMessageToDiscord };