import { Router } from 'express';
import axios from 'axios';
import { storeTwitchAuthToken, storeTwitchUserData } from '../db.js';
import { getUserData } from '../utilities/twitch.js';

const router = Router();

router.get('/', async (req, res) => {
  const code = req.query.code;
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const redirectUri = encodeURIComponent(process.env.TWITCH_REDIRECT_URI);
  const previousUrl = req.query.previous || '/';

  try {
    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUri}`
    );
  
    const { access_token, refresh_token, expires_in } = response.data;
    await storeTwitchAuthToken(access_token, refresh_token, expires_in);

    const userData = await getUserData();
    await storeTwitchUserData(userData);
    req.session.userData = userData;
    console.log(`Tokens and user data successfully stored in the database. User data: ${JSON.stringify(userData)}`);
    res.redirect('/');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error retrieving access token from Twitch.' + error.message);
  }
  return router;
});

export default router;