import { getAPIKey } from "../db.js";
import { serverKey } from "./api-key.js";
import { writeToLogFile } from "./logging.js";

// Function to validate API key
async function validateApiKey(req, res, next) {
    const userApiKey = await getAPIKey();
    const apiKey = req.headers['x-api-key'];
    const serverApiKey = await serverKey;
    if (apiKey === userApiKey || apiKey === serverApiKey) {
        next();
    } else {
        writeToLogFile('error', `Unauthorized request received from ${req.ip}`)
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

export { validateApiKey };