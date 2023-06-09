import axios from 'axios';
import { getTwitchAccessToken, storeTwitchAuthToken, getRefreshToken, retrieveUserData } from '../db.js';
import { writeToLogFile } from './logging.js';


// Function to get the box art of a game
async function getGameBoxArt(gameName) {
  const width = 272 * 5;
  const height = 380 * 5;
  const access_token = await getTwitchAccessToken();
  const headers = {
    'Authorization': `Bearer ${access_token}`,
    'Client-ID': process.env.TWITCH_CLIENT_ID,
  };
  const gameUrl = `https://api.twitch.tv/helix/games?name=${encodeURIComponent(gameName)}`;
  try {
    const gameResponse = await axios.get(gameUrl, { headers });
    const gameData = gameResponse.data;
    if (!gameData.data || gameData.data.length === 0) {
      return null;
    }
    const gameId = gameData.data[0].id;
    const boxArtUrl = `https://static-cdn.jtvnw.net/ttv-boxart/${gameId}-${width}x${height}.jpg`;
    return boxArtUrl;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      await refreshAccessToken();
      return getGameBoxArt(gameName);
    }
  }
}


// Function to get the user's data from Twitch
async function getUserData() {
  const accessToken = await getTwitchAccessToken();
  const response = await axios.get('https://api.twitch.tv/helix/users', {
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  return response.data.data[0];
}

// Function to search for game categories
async function searchGameCategories(query) {
  const TWITCH_API_URL = 'https://api.twitch.tv/helix';
  const clientId = process.env.TWITCH_CLIENT_ID;
  try {
    const accessToken = await getTwitchAccessToken();
    const config = {
      headers: {
        'Client-ID': clientId,
        'Authorization': 'Bearer ' + accessToken,
      }
    };
    const response = await axios.get(`${TWITCH_API_URL}/search/categories`, {
      params: {
        query: query,
        first: 10
      },
      headers: config.headers
    });
    const data = response.data;
    const categories = data.data.map(category => {
      return {
        name: category.name,
        art: category.box_art_url
      };
    });
    return categories;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      await refreshAccessToken();
      return searchGameCategories(query);
    }
  }
}

// Function to validate the access token
async function validateAccessToken() {
  const accessToken = await getTwitchAccessToken();
  if (accessToken === null) {
    writeToLogFile('error', 'Access token not found, reauthenticate with Twitch.');
    return;
  }
  const response = await axios.get('https://id.twitch.tv/oauth2/validate', {
    headers: {
      'Authorization': `OAuth ${accessToken}`,
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Client-Secret': process.env.TWITCH_CLIENT_SECRET
    }
  });
  if (response.message === 'undefined') {
    writeToLogFile('error', 'Access token not found, reauthenticate with Twitch.');
    return
  }
  if (response.status === 200) {
    return
  } else if (response.status === 400) {
    writeToLogFile('error', 'Access token not found, reauthenticate with Twitch.');
    return
  } else if (response.status === 401) {
    await refreshAccessToken();
    await validateAccessToken();
  }
}

// Function to refresh the access token
async function refreshAccessToken() {
  try {
    const refreshToken = await getRefreshToken();
    const params = new URLSearchParams();
    params.append('client_id', process.env.TWITCH_CLIENT_ID);
    params.append('client_secret', process.env.TWITCH_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    const response = await axios.post(`https://id.twitch.tv/oauth2/token`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    });
    if (response.status === 400) {
      await storeTwitchAuthToken(null, null, null);
      writeToLogFile('error', 'Refresh token not found, reauthenticate with Twitch.');
      return;
    }
    const data = response.data;
    await storeTwitchAuthToken(data.access_token, data.refresh_token, data.expires_in);
  } catch (error) {
    writeToLogFile('error', `Error refreshing access token: ${error.message}`);
  }
}

// Function to get the category of the user's current stream
async function getUserCategory() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const userData = await retrieveUserData();
  const userId = userData.id;
  try {
    const accessToken = await getTwitchAccessToken();
    const streamResponse = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (streamResponse.data.data.length === 0) {
      return null;
    }
    const stream = streamResponse.data.data[0];
    const gameId = stream.game_id;
    const gameResponse = await axios.get(`https://api.twitch.tv/helix/games?id=${gameId}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const game = gameResponse.data.data[0];
    const category = game.name;
    return category;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      await refreshAccessToken();
      return getUserCategory();
    }
  }
}

// Function to retrieve live data from Twitch
async function twitchLive() {
  let data = {
    category: '',
    img: '',
  }
  const category = await getUserCategory();
  if (category === null) {
    data.category = 'Just Chatting';
    data.img = await getGameBoxArt('Just Chatting');
    return data;
  } else {
    data.category = category;
    data.img = await getGameBoxArt(category);
    return data;
  }
}

// Export functions
export {
  getGameBoxArt, getUserData, searchGameCategories, refreshAccessToken, validateAccessToken, getUserCategory,
  twitchLive
}