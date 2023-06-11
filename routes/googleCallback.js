import { Router } from 'express';
import { google } from 'googleapis';
import { connectToMongoDB } from '../db.js';

const router = Router();
const credentials = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uri: process.env.GOOGLE_REDIRECT_URI,
};
console.log(`client_id: ${process.env.GOOGLE_CLIENT_ID}`);
const oauth2Client = new google.auth.OAuth2(credentials.client_id, credentials.client_secret, credentials.redirect_uri);
const youtubeVersion = 'v3';

router.get('/', async (req, res) => {
  console.log(`client_id: ${credentials.client_id}`);
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log(tokens);
    oauth2Client.setCredentials(tokens);
    const db = await connectToMongoDB();
    await db.collection('tokens').updateOne({ type: 'google' }, { $set: { tokens } }, { upsert: true });
    const youtube = google.youtube({ version: youtubeVersion, auth: oauth2Client });
    const { data: { items } } = await youtube.channels.list({ part: 'snippet', mine: true });
    const profileName = items[0].snippet.title;
    const profilePicture = items[0].snippet.thumbnails.default.url;
    const response = {
      profileName,
      profilePicture,
    };
    res.json(response);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('An error occurred.');
  }
});

export default router;
