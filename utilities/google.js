import { google } from 'googleapis';

async function getChannelData(channelId) {
    const youtube = google.youtube({
        version: 'v3',
        auth: 'YOUR_API_KEY'
    });
    const response = await youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        id: channelId
    });
    return response.data.items[0];
}

async function getVideoData(videoId) {
    const youtube = google.youtube({
        version: 'v3',
        auth: 'YOUR_API_KEY'
    });
    const response = await youtube.videos.list({
        part: 'snippet,contentDetails,statistics',
        id: videoId
    });
    return response.data.items[0];
}