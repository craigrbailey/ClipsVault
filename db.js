import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import { promisify } from 'util';
import { dirname } from 'path';
import { writeToLogFile } from './utilities/logging.js';
import { generateApiKey } from './utilities/api-key.js';


const uri = 'mongodb://192.168.1.31:27017';
const client = new MongoClient(uri);
let dbConnection = null;

// Function to connect to the database
async function connectToMongoDB() {
  try {
    if (!dbConnection) {
      await client.connect();
      const databaseName = 'data';
      const db = client.db(databaseName);
      dbConnection = db;
    }

    return dbConnection;
  } catch (error) {
    writeToLogFile('error', `Error connecting to MongoDB: ${error}`);
    throw error;
  }
}

// Function to create a collection if it doesn't exist
async function createCollection(collectionName) {
  const db = await connectToMongoDB();
  try {
    const collectionNames = await db.listCollections().toArray();
    const existingCollection = collectionNames.find(
      (collection) => collection.name === collectionName
    );
    if (!existingCollection) {
      await db.createCollection(collectionName);
      writeToLogFile(`Created collection: ${collectionName}`);
    }
  } catch (error) {
    writeToLogFile('Error creating collection:', error);
    throw error;
  }
}

// Initialize the database
async function initdb() {
  createCollection('tokens');
  createCollection('streams');
  createCollection('videos');
  createCollection('tags');
  createCollection('userdata');
  createCollection('queue');
  createCollection('notifications');
  createCollection('clips');;
  createCollection('trash');
  InitializeSetup();
  InitializeTokens();
  storeAPIKeyIfNotExists();
}

// Function to initialize the tokens collection
async function InitializeTokens() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("tokens");
    const existingDocument = await collection.findOne({ type: 'twitch' });
    if (existingDocument) {
      return;
    }
    const twitch = {
      type: 'twitch',
      token: null,
      refreshToken: null,
      expiresIn: null
    };
    const google = {
      type: 'google',
      token: null,
      refreshToken: null,
      expiresIn: null
    };
    await collection.insertOne(twitch);
    await collection.insertOne(google);
  } catch (error) {
    writeToLogFile('Error initializing tokens collection:', error);
  }
}

// Function to store the Twitch auth token data
async function storeTwitchAuthToken(token, refreshToken, expiresIn) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("tokens");
    const filter = { type: 'twitch' };
    const update = {
      $set: {
        token,
        refreshToken,
        expiresIn,
      },
    };
    const options = { upsert: true };
    const result = await collection.updateOne(filter, update, options);
    if (result.upsertedCount === 1) {
      writeToLogFile("New Twitch auth token data stored successfully.");
    } else {
      writeToLogFile("Existing Twitch auth token data updated successfully.");
    }
  } catch (error) {
    writeToLogFile("Error storing Twitch auth token data:", error);
    throw error;
  }
}

// Function to store twitch user data
async function storeTwitchUserData(userData) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("userdata");
    const query = { type: "twitch" };
    const update = {
      $set: {
        ...userData,
        type: "twitch"
      }
    };
    const options = { upsert: true };
    const result = await collection.findOneAndUpdate(query, update, options);
    if (result.lastErrorObject.updatedExisting) {
      writeToLogFile("User data updated successfully.");
    } else {
      writeToLogFile("User data stored successfully.");
    }
  } catch (error) {
    writeToLogFile("Error storing user data:", error);
    throw error;
  }
}

// Function to retrieve twitch access token from the database
async function getTwitchAccessToken() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("tokens");
    const tokenData = await collection.findOne({ type: "twitch" }, { projection: { token: 1 } });
    return tokenData ? tokenData.token : null;
  } catch (error) {
    writeToLogFile("Error retrieving Twitch access token:", error);
    console.error("Error retrieving access token:", error);
    throw error;
  }
}

// Get Twitch refresh token
async function getRefreshToken() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('tokens');
    const document = await collection.findOne({ type: 'twitch' });
    const refreshToken = document.refreshToken;
    return refreshToken;
  } catch (error) {
    writeToLogFile('error', `Error retrieving refresh token: ${error}`);
    console.error('Error retrieving refresh token:', error);
    return null;
  }
}

// Function to insert a video into the database
async function insertVideo(streamId, file, date, category, img, size, length, captions) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("videos");
    const document = {
      stream_id: streamId,
      file: file,
      date: date,
      category: category,
      categoryImg: img,
      size: size,
      length: length,
      favorite: false,
      tags: [],
      captions: captions
    };
    const result = await collection.insertOne(document);
    writeToLogFile('info', `Video document created successfully. ID: ${result.insertedId}`)
    return result.insertedId;
  } catch (error) {
    writeToLogFile('error', `Error inserting video document: ${error}`);
    console.error("Error inserting video document:", error);
    throw error;
  }
}

// Function to add a queue item to the database
async function insertQueue(streamId, file, date, category, size, length, favorite, tags, captions) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("queue");
    const document = {
      stream_id: streamId,
      file: file,
      date: date,
      category: category,
      size: size,
      length: length,
      favorite: favorite,
      tags: tags,
      captions: captions
    };
    const result = await collection.insertOne(document);
    return result.insertedId;
  } catch (error) {
    writeToLogFile('error', `Error inserting queue item: ${error}`);
    console.error("Error inserting video document:", error);
    throw error;
  }
}

// Function to remove a queue item by ID
async function removeQueueItemById(itemId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("queue");
    const result = await collection.deleteOne({ _id: itemId });
    return result.deletedCount > 0;
  } catch (error) {
    writeToLogFile('error', `Error removing queue item by ID: ${error}`);
    console.error("Error removing queue item by ID:", error);
    throw error;
  }
}

// Function to add a notification to the database
async function addNotification(notification) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    const document = {
      notification: notification
    };
    const result = await collection.insertOne(document);
    return result.insertedId;
  } catch (error) {
    writeToLogFile('error', `Error creating notification document: ${error}`);
    console.error("Error creating notification document:", error);
    throw error;
  }
}

// Function to remove a notification by ID
async function removeNotificationById(notificationId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    const result = await collection.deleteOne({ _id: notificationId });
    return result.deletedCount > 0;
  } catch (error) {
    writeToLogFile('error', `Error removing notification by ID: ${error}`);
    console.error("Error removing notification by ID:", error);
    throw error;
  }
}

// Function to retrieve all notifications from the database
async function getAllNotifications() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    const notifications = await collection.find().toArray();
    return notifications;
  } catch (error) {
    writeToLogFile('error', `Error retrieving notifications: ${error}`);
  }
}

// Function to get all queue items
async function getAllQueueItems() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("queue");
    const items = await collection.find().toArray();
    return items;
  } catch (error) {
    writeToLogFile('error', `Error retrieving queue items: ${error}`);
  }
}

// Functiont to create a new stream document
async function insertStream(date, category, backgroundImg, captions) {
  try {
    const collection = dbConnection.collection("streams");
    const document = {
      date: date,
      videos: [],
      video_count: 0,
      length: 0,
      category: category,
      background_img: backgroundImg,
      tags: [],
      captions: captions,
      entire_stream: 'none',
    };
    const result = await collection.insertOne(document);
    writeToLogFile('info', `Stream document created successfully. ID: ${result.insertedId}`);
    return result.insertedId;
  } catch (error) {
    writeToLogFile('error', `Error creating stream in database: ${error}`);
  }
}

// Function to add videos to a stream
async function addVideoToStream(streamId, videoId) {
  try {
    const collection = dbConnection.collection('streams');
    const result = await collection.updateOne(
      { _id: streamId },
      {
        $push: { videos: videoId },
        $inc: { video_count: 1 }
      }
    );
  } catch (err) {
    writeToLogFile('error', `Error adding video to stream: ${err}`);
  }
}

// Function to update the stream length
async function updateStreamData(streamId, newLength) {
  const db = await connectToMongoDB();
  try {
    const streamsCollection = db.collection('streams');
    const result = await streamsCollection.updateOne(
      { _id: streamId },
      { $set: { length: newLength } }
    );

    if (result.modifiedCount === 0) {
      console.log('No matching document found');
    }
  } catch (error) {
    writeToLogFile('error', `Error updating stream length: ${error}`);
  } 
}

// Function to update the live required setting
async function updateLiveRequired(liveRequired) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const result = await collection.updateOne(
      { _id: "settings" },
      { $set: { live_required: liveRequired } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    writeToLogFile('error', `Error updating live required: ${error}`);
  }
}

// Function to update the streamer
async function updateStreamer(streamer, status) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    if (streamer === 'twitch') {
      await collection.updateOne(
        { _id: "settings" },
        { $set: { twitch: status } }
      )
      } else if (streamer === 'youtube') {
        await collection.updateOne(
          { _id: "settings" },
          { $set: { youtube: status } }
          );
    }
  } catch (error) {
    writeToLogFile('error', `Error updating streamer: ${error}`);
  }
}

// Function to update the streamer
async function setStreamingPlatform(platform) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    if (platform === 'twitch') {
      await collection.updateOne(
        { _id: "settings" },
        { $set: { platform: 'twitch' } }
      )
      } else if (platform === 'youtube') {
        await collection.updateOne(
          { _id: "settings" },
          { $set: { platform: 'youtube' } }
          );
    }
    writeToLogFile('info', `Platform set to: ${platform}`);
  } catch (error) {
    writeToLogFile('error', `Error updating platform: ${error}`);
  }
}

// Function to retrieve all settings from the database
async function getSettings() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const settings = await collection.findOne({ _id: "settings" });
    return settings;
  } catch (error) {
    writeToLogFile('error', `Error retrieving settings: ${error}`);
  }
}

// Function to add a tag to a video
async function addTagToVideo(videoId, newTag) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("videos");
    const result = await collection.updateOne(
      { _id: videoId },
      { $push: { tags: newTag } }
    );
    writeToLogFile('info', `Tag added to video document: ${newTag}`);
    return result.modifiedCount > 0;
  } catch (error) {
    writeToLogFile('error', `Error adding tag to video document: ${error}`);
  }
}

// Function to add a tag to a stream
async function addTagToStream(streamId, newTag) {
  const db = await connectToMongoDB();
  try {
    const objectId = new ObjectId(streamId);
    const collection = db.collection("streams");
    const result = await collection.updateOne(
      { _id: objectId },
      { $push: { tags: newTag } }
    );
    writeToLogFile('info', `Tag added to stream document: ${newTag}`);
    return result.modifiedCount > 0;
  } catch (error) {
    writeToLogFile('error', `Error adding tag to stream document: ${error}`);
  }
}

// Function to remove a tag from a video
async function removeTagFromVideo(videoId, tagToRemove) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("videos");
    const result = await collection.updateOne(
      { _id: videoId },
      { $pull: { tags: tagToRemove } }
    );
    writeToLogFile('info', `Tag removed from video document: ${tagToRemove}`);
    return result.modifiedCount > 0;
  } catch (error) {
    writeToLogFile('error', `Error removing tag from video document: ${error}`);
  }
}

// Function to remove a tag from a stream
async function removeTagFromStream(streamId, tagToRemove) {
  const db = await connectToMongoDB();
  try {
    const objectId = new ObjectId(streamId);
    const collection = db.collection("streams");
    const result = await collection.updateOne(
      { _id: objectId },
      { $pull: { tags: tagToRemove } }
    );
    writeToLogFile('info', `Tag removed from stream document: ${tagToRemove}`);
    return result.modifiedCount > 0;
  } catch (error) {
    writeToLogFile('error', `Error removing tag from stream document: ${error}`);
  }
}

// Function to update OBS settings in the database
async function updateOBSSettings(ip, port, password) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    await collection.updateOne(
      { _id: "obs_settings" },
      { $set: { ip: ip, port: port, password: password } }
    );
    writeToLogFile('info', 'OBS settings updated successfully. IP: ' + ip + ' Port: ' + port + ' Password: ' + password);
  } catch (error) {
    writeToLogFile('error', `Error updating OBS settings: ${error}`);
  }
}

// Function to retrieve video data by id
async function getVideoData(videoId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('videos');
    const document = await collection.findOne({ _id: documentId });
    return document;
  } catch (error) {
    writeToLogFile('error', `Error retrieving video data: ${error}`);
  }
}

// Function to check rather the setup is complete
async function checkSetup(req, res, next) {
  try {
    const db = await connectToMongoDB();
    const collection = db.collection("settings");
    const settings = await collection.findOne({});
    const isSetupComplete = settings && settings.setup_complete;
    if (isSetupComplete) {
      next();
    } else {
      res.redirect('/setup');
    }
  } catch (error) {
    writeToLogFile('error', `Error checking setup: ${error}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Function to complete the setup
async function completeSetup() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    await collection.updateOne(
      {},
      { $set: { setup_complete: true } },
      { upsert: true }
    );
    writeToLogFile('info', 'Setup completed successfully.');
  } catch (error) {
    writeToLogFile('error', `Error completing setup: ${error}`);
  }
}

// Function to initialize the setup
async function InitializeSetup() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const count = await collection.countDocuments();

    if (count === 0) {
      const settings = {
        _id: 'settings',
        setup_complete: false,
        live_required: false,
        cleanup_time: "0500",
        platform: null,
        twitch: null,
        youtube: null
      }
      const notifications = {
        _id: 'notifications',
        discord: false,
        gmail: false,
      }
      await collection.insertOne(notifications);
      await collection.insertOne(settings);
      await collection.insertOne({ _id: 'obs_settings', ip: null, port: null, password: null });
      writeToLogFile('info', 'Setup initialized successfully.');
    }
  } catch (error) {
    writeToLogFile('error', `Error initializing setup: ${error}`);
  }
}

// Function to get OBS settings from the database
async function getOBSSettings() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const settings = await collection.findOne({ _id: "obs_settings" });

    if (settings) {
      const { ip, password, port } = settings;
      return { ip, password, port };
    } else {
      return null;
    }
  } catch (error) {
    writeToLogFile('error', `Error retrieving OBS settings: ${error}`);
  }
}

// Function to get the google access token from the database
async function getGoogleAccessToken() {
  try {
    const db = await connectToMongoDB();
    const tokenDocument = await db.collection('tokens').findOne({ type: 'google' });
    if (tokenDocument) {
      return tokenDocument.tokens.access_token;
    } else {
      return null;
    }
  } catch (error) {
    writeToLogFile('error', `Error retrieving Google access token: ${error}`);
  }
};

// Function to get stream data by id
async function getStreamById(streamId) {
  const db = await connectToMongoDB();
  try {
    const objectId = new ObjectId(streamId);
    const collection = db.collection('streams');
    return await collection.findOne({ _id: objectId });
  } catch (err) {
    writeToLogFile('error', `Error retrieving stream by ID: ${err}`);
    return null;
  }
}

// Function to get the latest streams by count
async function getLatestStreams(count) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('streams');
    const streams = await collection.find({}).sort({ _id: -1 }).limit(count).toArray();
    return streams.reverse();
  } catch (err) {
    writeToLogFile('error', `Error retrieving latest streams: ${err}`);
    return [];
  }
}

// Function to get all streams
async function getAllStreams() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('streams');
    const documents = await collection.find().sort({ _id: -1 }).toArray();
    return documents;
  } catch (err) { 
    writeToLogFile('error', `Error retrieving all streams: ${err}`);
    return [];
  }
}

//Get All Videos By Stream Id
async function getVideosByStreamId(streamId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('videos');
    const objectId = new ObjectId(streamId);
    const query = { stream_id: objectId };
    const videos = await collection.find(query).toArray();

    return videos;
  } catch (err) {
    writeToLogFile('error', `Error retrieving videos by stream ID: ${err}`);
  }
}

// Function to retrieve user data from the database
async function retrieveUserData() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("userdata");
    const query = { type: "twitch" };

    const userData = await collection.findOne(query);

    if (userData) {
      console.log("User data retrieved successfully.");
      return userData;
    } else {
      console.log("User data not found.");
      return null;
    }
  } catch (error) {
    console.error("Error retrieving user data:", error);
    throw error;
  }
}

// Function to remove a stream
async function removeStream(streamId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('streams');
    const objectId = new ObjectId(streamId);
    const result = await collection.deleteMany({ _id: { $in: [objectId] } });
    console.log(`Removed ${result.deletedCount} streams.`);
    await deleteFilesByStreamId(streamId);
    writeToLogFile('info', `Removed ${result.deletedCount} streams.`);
  } catch (error) {
    writeToLogFile('error', `Error removing stream: ${error}`);
    console.error('Error removing documents:', error);
  }
}

// Function to delete all files associated with a stream
async function deleteFilesByStreamId(streamId) {
  const db = await connectToMongoDB();
  const deleteFile = promisify(fs.unlink);
  const removeDirectory = promisify(fs.rmdir);
  try {
    const collection = db.collection('videos');
    const objectId = new ObjectId(streamId);
    const videos = await collection.find({ stream_id: objectId }).toArray();

    for (const video of videos) {
      const filePath = video.file;
      const videoObjectId = new ObjectId(video._id);
      await collection.deleteOne({ _id: videoObjectId });
      if (fs.existsSync(filePath)) {
        await deleteFile(filePath);
        writeToLogFile('info', `Deleted file: ${filePath}`);
        const directoryPath = dirname(filePath);
        const filesInDirectory = fs.readdirSync(directoryPath);
        if (filesInDirectory.length === 0) {
          await removeDirectory(directoryPath);
          writeToLogFile('info', `Removed empty directory: ${directoryPath}`);
        }
      }
    }
    writeToLogFile('info', `Removed ${videos.length} files.`);
  } catch (error) {
    console.error('Error deleting files:', error);
  }
}

// Function to insert a clip into the database
async function insertClip(length, start, tags, category, categoryImg) {
  const db = await connectToMongoDB();
  try {
    const clipsCollection = db.collection('clips');
    const clipDocument = {
      length: length,
      start: start,
      tags: tags,
      category: category,
      categoryImg: categoryImg,
    };
    const result = await clipsCollection.insertOne(clipDocument);
  } catch (error) {
    writeToLogFile('Error inserting clip:', error);
  }
}

// Function to check if an API key exists in the database
async function storeAPIKeyIfNotExists() {
  const db = await connectToMongoDB();
  try {
    const settingsCollection = db.collection('settings');
    const existingAPIKey = await settingsCollection.findOne({ _id: 'api_key' });

    if (existingAPIKey && existingAPIKey.value) {
      return;
    } else {
      storeAPIKey();
      console.log('API key stored successfully:', apiKey);
    }
  } catch (error) {
    writeToLogFile('error', `Error storing API key: ${error}`)
  }
}

// Function to store the API key in the database
async function storeAPIKey() {
  const db = await connectToMongoDB();
  try {
    const apiKey = generateApiKey();
    const settingsCollection = db.collection('settings');
    const hexedAPIKey = Buffer.from(apiKey).toString('hex');
    await settingsCollection.updateOne(
      { _id: 'api_key' },
      { $set: { value: hexedAPIKey } },
      { upsert: true }
    );
  } catch (error) {
    writeToLogFile('Error storing API key:', error);
  }
}

// Function to get the API key from the database
async function getAPIKey() {
  const db = await connectToMongoDB();
  try {
    const settingsCollection = db.collection('settings');
    const result = await settingsCollection.findOne({ _id: 'api_key' });
    if (result && result.value) {
      const apiKey = Buffer.from(result.value, 'hex').toString('utf-8');
      return apiKey;
    } else {
      writeToLogFile('API key not found.');
      return null;
    }
  } catch (error) {
    writeToLogFile('Error retrieving API key:', error);
    return null;
  }
}


// Export the functions
export {
  connectToMongoDB, createCollection, initdb, storeTwitchAuthToken, storeTwitchUserData, getTwitchAccessToken,
  getAllQueueItems, getAllNotifications, removeNotificationById, addNotification, getVideoData, updateOBSSettings,
  removeTagFromVideo, addTagToVideo, insertStream, insertQueue, insertVideo, removeQueueItemById, checkSetup, getOBSSettings,
  completeSetup, getGoogleAccessToken, addVideoToStream, getAllStreams, getLatestStreams, getVideosByStreamId,
  addTagToStream, removeTagFromStream, getStreamById, retrieveUserData, updateStreamData, removeStream, getRefreshToken, insertClip, storeAPIKey,
  getAPIKey, getSettings, updateStreamer, updateLiveRequired, setStreamingPlatform
}; 