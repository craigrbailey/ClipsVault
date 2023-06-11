import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.TWITCH_REDIRECT_URI);
    const scopes = encodeURIComponent('user:read:email');
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`;
    res.redirect(authUrl);
  });


export default router;