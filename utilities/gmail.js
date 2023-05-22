import { google } from 'googleapis';
import { getGoogleAccessToken } from '../db.js'


async function sendEmail(message) {
    try {
      const accessToken = await getGoogleAccessToken();
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
  
      const emailContent = {
        to: 'bailey_craig@me.com',
        subject: 'Test Email',
        body: 'This is the content of the email.'
      };
  
      const rawMessage = [
        'To: ' + emailContent.to,
        'Subject: ' + emailContent.subject,
        '',
        emailContent.body
      ].join('\n');
  
      const encodedMessage = Buffer.from(rawMessage).toString('base64');
  
      const gmail = google.gmail({ version: 'v1', auth });
  
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
  
      console.log('Email sent:', res.data);
  
      return res.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
}

async function main() {
    const accessToken = await getGoogleAccessToken();
    try {
      // Assuming you already have an OAuth2 client
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
  
      const message = 'To: recipient@example.com\n' +
                      'Subject: Test Email\n\n' +
                      'This is the content of the email.';
  
      await sendEmail(auth, message);
    } catch (error) {
      console.error('An error occurred:', error);
    }
}

export { main };