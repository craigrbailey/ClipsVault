import { Router } from 'express';

const router = Router();

const scopes = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/youtube.readonly', 
'https://www.googleapis.com/auth/gmail.send'];
// Redirect endpoint for initiating Google authorization
router.get('/', (req, res) => {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const redirect_uri = encodeURIComponent(process.env.GOOGLE_REDIRECT_URI);
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scopes.join(' ')}`;

  res.redirect(authUrl);
});

export default router;