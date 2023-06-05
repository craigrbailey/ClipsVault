import { Router } from 'express';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { connectToMongoDB } from '../db.js';


const router = Router();
const credentials = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: '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',
  redirect_uri: 'http://localhost:3000/googlecallback',
};
const scopes = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/youtube.readonly'];
const oauth2Client = new OAuth2Client(credentials.client_id, credentials.client_secret, credentials.redirect_uri);
const driveVersion = 'v3';
const youtubeVersion = 'v3';
router.get('/', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
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