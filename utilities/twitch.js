import axios from 'axios';
import { getTwitchAccessToken, storeTwitchAuthToken, getRefreshToken, retrieveUserData } from '../db.js';
import { writeToLogFile } from './logging.js';
import { notificationHandler } from './notificationHandler.js';
import fs from 'fs';


// Function to get the box art of a game
async function getGameBoxArt(gameName) {
  try {
    const db = await connectToMongoDB();
    const collection = db.collection('categories');
    const regexQuery = { name: { $regex: new RegExp(gameName, 'i') } };
    const projection = { _id: 0, box_art_url: 1 };
    const game = await collection.findOne(regexQuery, projection);
    if (!game) {
      return null;
    }
    return game.box_art_url;
  } catch (error) {
    console.error('Error retrieving game box art:', error);
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
  try {
    const db = await connectToMongoDB();
    const collection = db.collection('categories');
    const regexQuery = { name: { $regex: new RegExp(query, 'i') } };
    const projection = { _id: 0, name: 1, box_art_url: 1 };
    const categories = await collection.find(regexQuery).project(projection).limit(10).toArray();
    return categories;
  } catch (error) {
    console.error('Error searching game categories:', error);
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
      'Authorization': `OAuth ${accessToken}`
    }
  });
  if (response.status === 401) {
    await refreshAccessToken();
    return;
  } else if (response.status === 200) {
    return;
  } else if (response.status === 400) {
    await storeTwitchAuthToken(null, null, null);
    writeToLogFile('error', 'Access token not found, reauthenticate with Twitch.');
    return;
  }
}

// Function to refresh the access token
async function refreshAccessToken() {
  writeToLogFile('info', 'Refreshing access token.');
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

async function getAllTwitchGames() {
  const clientId = 'nxpbtgpivm8yf1xfzptq0tacsa7lo0'; // Replace with your Twitch client ID
  const clientSecret = '068vp8tle7wfa8a2ro0jtu6bqakqyl'; // Replace with your Twitch client secret
  const tokenUrl = 'https://id.twitch.tv/oauth2/token';
  const apiUrl = 'https://api.twitch.tv/helix/games/top';
  const limit = 100; // Number of games to retrieve per API call

  let allGames = [];

  try {
    const tokenResponse = await axios.post(tokenUrl, null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    let paginationCursor = '';

    do {
      const response = await axios.get(apiUrl, {
        params: {
          first: limit,
          after: paginationCursor
        },
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const games = response.data.data;
      allGames = allGames.concat(games);

      // Get the cursor for the next page
      paginationCursor = response.data.pagination.cursor;

      await delay(1000); // Delay for 1 second before the next API call
    } while (paginationCursor);

    // Modify box art URLs to specific dimensions
    const modifiedGames = allGames.map(game => ({
      ...game,
      box_art_url: game.box_art_url.replace('{width}', '1360').replace('{height}', '1900')
    }));

    // Store all games in a JSON file
    fs.writeFile('twitch_all_games.json', JSON.stringify(modifiedGames, null, 2), (err) => {
      if (err) throw err;
      console.log('All games successfully stored in twitch_all_games.json');
    });
  } catch (error) {
    console.error('Error retrieving Twitch games:', error);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


// Export functions
export {
  getGameBoxArt, getUserData, searchGameCategories, refreshAccessToken, validateAccessToken, getUserCategory,
  twitchLive, getAllTwitchGames
}