import { MongoClient, ObjectId } from 'mongodb';
import fs, { write } from 'fs';
import { promisify } from 'util';
import { dirname } from 'path';
import { writeToLogFile } from './utilities/logging.js';
import { generateApiKey } from './utilities/api-key.js';


const uri = 'mongodb://192.168.1.31:27017';
const client = new MongoClient(uri);
let dbConnection = null;

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

// Create a collection
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
  createCollection('clips');
  // createCollection('settings');
  createCollection('trash');
  InitializeSetup();
  InitializeTokens();
  storeAPIKeyIfNotExists();
}

async function InitializeTokens() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("tokens");

    // Check if a document with type 'twitch' already exists
    const existingDocument = await collection.findOne({ type: 'twitch' });
    if (existingDocument) {
      return;
    }

    // Create the document
    const twitch = {
      type: 'twitch',
      token: 'none',
      refreshToken: 'none',
      expiresIn: 'none'
    };

    const google = {
      type: 'google',
      token: 'none',
      refreshToken: 'none',
      expiresIn: 'none'
    };
    // Insert the document into the collection
    await collection.insertOne(twitch);
    await collection.insertOne(google);
  } catch (error) {
    writeToLogFile('Error inserting document:', error);
    throw error;
  }
}

// Store the Twitch auth token data
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

async function storeTwitchUserData(userData) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("userdata");
    const query = { type: "twitch" };
    const update = {
      $set: {
        ...userData,
        type: "twitch" // Set the 'type' field explicitly to 'twitch'
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
    console.error('Error retrieving refresh token:', error);
    return null;
  }
}

async function insertVideo(streamId, file, date, category, img, size, length, captions) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("videos");
    const document = {
      stream_id: streamId,
      file: file,
      date: date,
      category: category,
      categoryImg: Image,
      size: size,
      length: length,
      favorite: false,
      tags: [],
      captions: captions
    };
    const result = await collection.insertOne(document);
    return result.insertedId;
  } catch (error) {
    console.error("Error inserting video document:", error);
    throw error;
  }
}

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
    console.error("Error inserting video document:", error);
    throw error;
  }
}

async function removeQueueItemById(itemId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("queue");
    const result = await collection.deleteOne({ _id: itemId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error("Error removing queue item by ID:", error);
    throw error;
  }
}

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
    console.error("Error creating notification document:", error);
    throw error;
  }
}

async function removeNotificationById(notificationId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    const result = await collection.deleteOne({ _id: notificationId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error("Error removing notification by ID:", error);
    throw error;
  }
}

async function getAllNotifications() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    const notifications = await collection.find().toArray();
    return notifications;
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    throw error;
  }
}

async function getAllQueueItems() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("queue");
    const items = await collection.find().toArray();
    return items;
  } catch (error) {
    console.error("Error retrieving queue items:", error);
    throw error;
  }
}

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
    return result.insertedId;
  } catch (error) {
    console.error("Error inserting stream document:", error);
    throw error;
  }
}

async function addVideoToStream(streamId, videoId) {
  try {
    const collection = dbConnection.collection('streams');

    // Update the document: push videoId to the videos array and increment video_count by 1
    const result = await collection.updateOne(
      { _id: streamId },
      {
        $push: { videos: videoId },
        $inc: { video_count: 1 }
      }
    );
  } catch (err) {
    console.log(err.stack);
  }
}

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
    console.error('Error updating stream data:', error);
  } 
}

async function addTagToVideo(videoId, newTag) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("videos");
    const result = await collection.updateOne(
      { _id: videoId },
      { $push: { tags: newTag } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error adding tag to stream document:", error);
    throw error;
  }
}

async function addTagToStream(streamId, newTag) {
  const db = await connectToMongoDB();
  try {
    const objectId = new ObjectId(streamId);
    const collection = db.collection("streams");
    const result = await collection.updateOne(
      { _id: objectId },
      { $push: { tags: newTag } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error adding tag to stream document:", error);
    throw error;
  }
}


async function removeTagFromVideo(videoId, tagToRemove) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("videos");
    const result = await collection.updateOne(
      { _id: videoId },
      { $pull: { tags: tagToRemove } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error removing tag from video document:", error);
    throw error;
  }
}

async function removeTagFromStream(streamId, tagToRemove) {
  const db = await connectToMongoDB();
  try {
    const objectId = new ObjectId(streamId);
    const collection = db.collection("streams");
    const result = await collection.updateOne(
      { _id: objectId },
      { $pull: { tags: tagToRemove } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error removing tag from video document:", error);
    throw error;
  }
}

// Function to update OBS settings in the database
async function updateOBSSettings(ip, port, password) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const existingSettings = await collection.findOne({ type: "obs_settings" });

    if (existingSettings) {
      const result = await collection.updateOne(
        { _id: existingSettings._id },
        { $set: { ip: ip, port: port, password: password } }
      );
      return result.modifiedCount > 0;
    } else {
      const result = await collection.insertOne({ _id: "obs_settings", ip: ip, port: port, password: password });
      return result.insertedId;
    }
  } catch (error) {
    console.error("Error updating OBS settings:", error);
    throw error;
  }
}

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

async function completeSetup() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const result = await collection.updateOne({}, { $set: { setup_complete: true } }, { upsert: true });
    writeToLogFile('info', 'Setup completed successfully.');
  } catch (error) {
    writeToLogFile('error', `Error completing setup: ${error}`);
    throw error;
  }
}

//
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
        streamer: null
      }
      await collection.insertOne(settings);
      await collection.insertOne({ _id: 'obs_settings', ip: 'none', port: 4444, password: 'password' });
      writeToLogFile('info', 'Setup initialized successfully.');
    }
  } catch (error) {
    writeToLogFile('error', `Error initializing setup: ${error}`);
  }
}

async function getOBSSettings() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const settings = await collection.findOne({ type: "obs_settings" });

    if (settings) {
      const { ip, password, port } = settings;
      return { ip, password, port };
    } else {
      // Handle the case when no settings document exists
      return null;
    }
  } catch (error) {
    console.error("Error retrieving OBS settings:", error);
    throw error;
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
      return null; // Return null or handle the case when the token is not found
    }
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error('Failed to retrieve access token from the database.');
  }
};

async function getStreamById(streamId) {
  const db = await connectToMongoDB();
  try {
    const objectId = new ObjectId(streamId);
    const collection = db.collection('streams');
    return await collection.findOne({ _id: objectId });
  } catch (err) {
    console.error(err.stack);
    return null;
  }
}


async function getLatestStreams(count) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('streams');
    // Sort by the _id field in descending order (-1)
    const streams = await collection.find({}).sort({ _id: -1 }).limit(count).toArray();
    // Return the streams in reversed order
    return streams.reverse();
  } catch (err) {
    console.error(err.stack);
    return [];
  }
}

async function getAllStreams() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('streams');
    const documents = await collection.find().sort({ _id: -1 }).toArray();
    return documents;
  } catch (err) { 
    console.error(err.stack);
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
    console.log(err);
  }
}

async function retrieveUserData() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("userdata");
    const query = { type: "twitch" }; // Assuming type is used to identify Twitch documents

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

async function removeStream(streamId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('streams');
    const objectId = new ObjectId(streamId);
    const result = await collection.deleteMany({ _id: { $in: [objectId] } });
    console.log(`Removed ${result.deletedCount} streams.`);
    deleteFilesByStreamId(streamId);
  } catch (error) {
    console.error('Error removing documents:', error);
  }
}

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
        console.log(`Deleted file: ${filePath}`);
        
        const directoryPath = dirname(filePath);
        const filesInDirectory = fs.readdirSync(directoryPath);
        if (filesInDirectory.length === 0) {
          await removeDirectory(directoryPath);
          console.log(`Removed empty directory: ${directoryPath}`);
        }
      }
    }
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
      console.log('API key already exists:', existingAPIKey.value);
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
  getAPIKey
}; 