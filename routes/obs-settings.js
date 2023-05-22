import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { updateOBSSettings } from '../db.js';
import { connectToOBS } from '../utilities/obs.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.post('/', async (req, res) => {
    console.log('OBS Settings:', req.body);
    // Extract the form data from the request
    const { host, port, password } = req.body;

    try {
        // Call the updateOBSSettings function with the form data
        await updateOBSSettings(host, port, password);
        await connectToOBS();
        res.status(200).send('OBS settings updated successfully.');
    } catch (error) {
        res.status(500).send('Error updating OBS settings.');
    }
});

export default router;