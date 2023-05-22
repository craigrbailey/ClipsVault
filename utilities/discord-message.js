import { post } from 'axios';

async function sendMessageToDiscord(webhookURL, message) {
    const payload = {
        content: message,
    };

    try {
        await post(webhookURL, payload);
        console.log("Message sent successfully!");
    } catch (error) {
        console.error(`Error sending message to Discord: ${error}`);
    }
}
