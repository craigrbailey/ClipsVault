import { Router } from 'express';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { connectToMongoDB } from '../db.js';


const router = Router();
// Google Drive and YouTube API credentials
const credentials = {
  client_id: '471205260309-eubjbi5hdnh5rocd7uqt0vjlapv7nuql.apps.googleusercontent.com',
  client_secret: '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',
  redirect_uri: 'http://localhost:3000/googlecallback',
};

// Scopes for required permissions
const scopes = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/youtube.readonly'];

// Create an OAuth2 client
const oauth2Client = new OAuth2Client(credentials.client_id, credentials.client_secret, credentials.redirect_uri);

// Google Drive API version
const driveVersion = 'v3';

// YouTube API version
const youtubeVersion = 'v3';

// Callback endpoint for authorization
router.get('/', async (req, res) => {
  const code = req.query.code;

  try {
    // Exchange authorization code for access token and refresh token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store access token and refresh token in MongoDB
    const db = await connectToMongoDB();
    await db.collection('tokens').updateOne({ type: 'google' }, { $set: { tokens } }, { upsert: true });


    // Get user's YouTube profile name and picture
    const youtube = google.youtube({ version: youtubeVersion, auth: oauth2Client });
    const { data: { items } } = await youtube.channels.list({ part: 'snippet', mine: true });
    const profileName = items[0].snippet.title;
    const profilePicture = items[0].snippet.thumbnails.default.url;

    // Generate the response
    const response = {
      profileName,
      profilePicture,
    };

    // Send the response
    res.json(response);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('An error occurred.');
  }
});


export default router;