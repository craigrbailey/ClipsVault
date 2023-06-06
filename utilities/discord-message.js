import axios from 'axios';
import { getDiscordWebhookURL } from '../db.js';
import { writeToLogFile } from './logging.js';

// Function to send a message to Discord
async function sendMessageToDiscord(message) {
    console.log('Sending message to Discord...');
    const webhookURL = await getDiscordWebhookURL();
    const payload = {
        content: message,
    };
    try {
        await axios.post(webhookURL, payload);
    } catch (error) {
        writeToLogFile('error', `Error sending message to Discord: ${error}`);
    }
}


export { sendMessageToDiscord };