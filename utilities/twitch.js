import axios from 'axios';
import { getAccessToken, storeTwitchAuthToken, getRefreshToken, retrieveUserData } from '../db.js';

async function getGameBoxArt(gameName) {
  const width = 272;
  const height = 380;
  const access_token = await getAccessToken();
  const headers = {
    'Authorization': `Bearer ${access_token}`,
    'Client-ID': process.env.TWITCH_CLIENT_ID,
  };

  const gameUrl = `https://api.twitch.tv/helix/games?name=${encodeURIComponent(gameName)}`;
  const gameResponse = await axios.get(gameUrl, { headers });
  const gameData = gameResponse.data;

  if (!gameData.data || gameData.data.length === 0) {
    return null;
  }

  const gameId = gameData.data[0].id;
  const boxArtUrl = `https://static-cdn.jtvnw.net/ttv-boxart/${gameId}-${width}x${height}.jpg`;
  return boxArtUrl;
}


async function getUserData() {
  // Get the access token from the database
  const accessToken = await getAccessToken();

  const response = await axios.get('https://api.twitch.tv/helix/users', {
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.data.data[0];
}

async function searchGameCategories(query) {
  const TWITCH_API_URL = 'https://api.twitch.tv/helix';
  const clientId = process.env.TWITCH_CLIENT_ID;

  try {
    const accessToken = await getAccessToken();
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
    console.error('Error searching game categories:', error);

    if (error.response && error.response.status === 401) {
      // Token expired or invalid, refresh the access token
      await refreshAccessToken(); // Replace with your function to refresh the access token

      // Retry the function with the updated access token
      return searchGameCategories(query);
    }

    throw error; // Rethrow the error to handle it at a higher level
  }
}

async function validateAccessToken() {
  const accessToken = await getAccessToken();
  const response = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: {
      'Authorization': `OAuth ${accessToken}`,
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Client-Secret': process.env.TWITCH_CLIENT_SECRET
    }
  });
  if (response.message === 'undefined') {
    console.log('Access token not found, reauthenticate with Twitch.');
    return
  }
  if (response.ok) {
    const data = await response.json();
    console.log(`Access token validated, data: ${data}`)
    storeTwitchAuthToken(data.access_token, data.refresh_token, data.expires_in)
    return data;
  } else if (response.status === 400) {
    console.log('Access token not found, reauthenticate with Twitch.');
    return
  } else if (response.status === 401) {
    const refreshToken = await getRefreshToken(); // Replace with your function to retrieve the refresh token
    await refreshAccessToken(); // Replace with your function to refresh the access token

    // Retry the function
    return validateAccessToken();
  }
}

async function refreshAccessToken() {
  try {
    const refreshToken = await getRefreshToken();
    console.log(`Refresh token: ${refreshToken}`);
    const TWITCH_API_URL = 'https://id.twitch.tv/oauth2';
    const response = await fetch(`${TWITCH_API_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET
      })
    });

    if (!response.ok) {
      if (response.status === 400) {
        // Refresh token expired, clear the refresh token from the database
        await storeTwitchAuthToken(null, null, null);
        console.log('Refresh token expired.');
        throw new Error('Refresh token expired.');
      }
    }

    const data = await response.json();

    await storeTwitchAuthToken(data.access_token, data.refresh_token, data.expires_in);

    console.log(data);

    return data;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}


async function getUserCategory() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const userData = await retrieveUserData();
  const userId = userData.id;
  try {
    const accessToken = await getAccessToken();

    // Get user's current stream
    const streamResponse = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (streamResponse.data.data.length === 0) {
      return null;
    }
    console.log(streamResponse.data.data[0]);
    const stream = streamResponse.data.data[0];
    const gameId = stream.game_id;

    // Get category information
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
    console.log('Error retrieving user category:', error.response.data);
    throw new Error('Failed to retrieve user category.');
  }
}

async function twitchLive() {
  let data = {
    category: '',
    img: '',
  }
  const category = await getUserCategory();
  if (category === null) { 
    data.category = 'Just Chatting';
    data.img = './images/just-chatting.jpg';
    return data;
  } else {
    data.category = category;
    data.img = await getGameBoxArt(category);
    return data;
  }
}

export { getGameBoxArt, getUserData, searchGameCategories, refreshAccessToken, validateAccessToken, getUserCategory,
  twitchLive }