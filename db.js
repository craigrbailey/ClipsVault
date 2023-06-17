import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import { promisify } from 'util';
import { dirname } from 'path';
import { writeToLogFile } from './utilities/logging.js';
import { generateApiKey } from './utilities/api-key.js';
import { getGameBoxArt } from './utilities/twitch.js';
import { restartApplication } from './utilities/system.js';
import { notificationHandler } from './utilities/notificationHandler.js';


const uri = `mongodb://${process.env.MONGO_INITDB_URI}:27017`;
const client = new MongoClient(uri);
let dbConnection = null;

// Function to connect to the database
async function connectToMongoDB() {
  try {
    if (!dbConnection) {
      await client.connect();
      const db = client.db(process.env.MONGO_INITDB_DATABASE);
      dbConnection = db;
    }
    return dbConnection;
  } catch (error) {
    writeToLogFile('error', `Error connecting to MongoDB: ${error}`);
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
    writeToLogFile('error', `Error creating collection: ${error}`);
  }
}

// Initialize the database
async function initdb() {
  await createCollections();
  await InitializeSetup();
  await InitializeTokens();
}

// Function to create collections based off an array
async function createCollections(collections) {
  collections = [
    'sessions',
    'tokens',
    'streams',
    'videos',
    'tags',
    'userdata',
    'queue',
    'notifications',
    'clips',
    'trash',
    'settings'
  ]
  const db = await connectToMongoDB();
  try {
    const collectionNames = await db.listCollections().toArray();
    const existingCollections = collectionNames.map(
      (collection) => collection.name
    );
    const collectionsToCreate = collections.filter(
      (collection) => !existingCollections.includes(collection)
    );
    for (const collection of collectionsToCreate) {
      await db.createCollection(collection);
      writeToLogFile('info',`Created collection: ${collection}`);
    }
  } catch (error) {
    writeToLogFile('error', `Error creating collections: ${error}`);
  }
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
      writeToLogFile("info", "New Twitch auth token data stored successfully.");
    } else {
      writeToLogFile("info", "Existing Twitch auth token data updated successfully.")
    }
  } catch (error) {
    writeToLogFile('error', `Error storing Twitch auth token data: ${error}`);
  }
}

// Function to store discord webhook url
async function storeDiscordWebhookURL(webhookURL) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const filter = { _id: 'discord' };
    const update = {
      $set: {
        webhookURL
      },
    };
    const options = { upsert: true };
    const result = await collection.updateOne(filter, update, options);
    if (result.upsertedCount === 1) {
      writeToLogFile("New Discord webhook URL stored successfully.");
    } else {
      writeToLogFile("Existing Discord webhook URL updated successfully.");
    }
  } catch (error) {
    writeToLogFile('error', `Error storing Discord webhook URL: ${error}`);
  }
};

// Function to retrive discord webhook url
async function getDiscordWebhookURL() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const webhookURL = await collection.findOne({ _id: 'discord' }, { projection: { webhookURL: 1 } });
    return webhookURL ? webhookURL.webhookURL : null;
  } catch (error) {
    writeToLogFile('error', `Error retrieving Discord webhook URL: ${error}`);
  }
};

// Function to get discord status
async function getDiscordStatus() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const discordStatus = await collection.findOne({ _id: 'notifications' }, { projection: { discord: 1 } });
    return discordStatus.discord;
  } catch (error) {
    writeToLogFile('error', `Error retrieving Discord status: ${error}`);
  }
};

// Function to update discord toggle
async function updateDiscordToggle(value) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const filter = { _id: 'notifications' };
    const update = {
      $set: {
        discord: value
      },
    };
    const options = { upsert: true };
    await collection.updateOne(filter, update, options);
    if (value === 'true') {
      writeToLogFile('info', 'Discord notifications enabled.')
    } else {
      writeToLogFile('info', 'Discord notifications disabled.')
    }
  } catch (error) {
    writeToLogFile('error', `Error storing Discord toggle: ${error}`);
  }
};

// Function to update gmail toggle
async function updateGmailToggle(value) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const filter = { _id: 'notifications' };
    const update = {
      $set: {
        gmail: value
      },
    };
    const options = { upsert: true };
    await collection.updateOne(filter, update, options);
    if (value === true) {
      writeToLogFile('info', 'Gmail notifications enabled.')
    } else {
      writeToLogFile('info', 'Gmail notifications disabled.')
    }
  } catch (error) {
    writeToLogFile('error', `Error storing Gmail toggle: ${error}`);
  }
};

// Function to get gmail toggle
async function getGmailToggle() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const gmailToggle = await collection.findOne({ _id: 'notifications' }, { projection: { gmail: 1 } });
    return gmailToggle.gmail;
  } catch (error) {
    writeToLogFile('error', `Error retrieving Gmail toggle: ${error}`);
  }
};

// Function to update the cleanup time
async function updateCleanupTime(time) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const filter = { _id: 'settings' };
    const update = {
      $set: {
        cleanup_time: time
      },
    };
    const options = { upsert: true };
    await collection.updateOne(filter, update, options);
    writeToLogFile('info', `Cleanup time updated to: ${time}`);
    restartApplication();
  } catch (error) {
    writeToLogFile('error', `Error updating cleanup time: ${error}`);
  }
};

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
      writeToLogFile('info', 'Twitch user data updated successfully.');
    } else {
      writeToLogFile('info', 'Twitch user data stored successfully.');
    }
  } catch (error) {
    writeToLogFile('error', `Error storing Twitch user data: ${error}`);
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
    writeToLogFile('error', `Error retrieving Twitch access token: ${error}`);
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
    return null;
  }
}

// Function to insert a video into the database
async function insertVideo(streamId, file, date, category, img, size, length, tags) {
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
      tags: tags,
      captions: null,
      archived: false,
    };
    const result = await collection.insertOne(document);
    addVideoToStream(streamId, result.insertedId);
    await addCategory(category);
    notificationHandler('info', `New video added, 'ClipAdded`);
    writeToLogFile('info', `Video document created successfully. ID: ${result.insertedId}`)
    return result.insertedId;
  } catch (error) {
    writeToLogFile('error', `Error inserting video: ${error}`);
  }
}

// Function to set a video as archived
async function setVideoAsArchived(videoId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("videos");
    const result = await collection.updateOne(
      { _id: new ObjectId(videoId) },
      { $set: { archived: true } }
    );
    if (result.modifiedCount === 0) {
      writeToLogFile('error', 'Could not mark video as archived. No matching document found.');
    }
  } catch (error) {
    writeToLogFile('error', `Error setting video as archived: ${error}`);
  }
}

// Function to update a streams info
async function updateStream(streamId, date, category) {
  const db = await connectToMongoDB();
  const img = await getGameBoxArt(category);
  try {
    const collection = db.collection("streams");
    const result = await collection.updateOne(
      { _id: new ObjectId(streamId) },
      {
        $set: {
          date: date,
          category: category,
          background_img: img,
        },
      }
    );
    if (result.modifiedCount === 0) {
      writeToLogFile('error', 'No matching document found');
    }
  } catch (error) {
    writeToLogFile('error', `Error updating stream: ${error}`);
  }
}

// Function to update a video category
async function updateVideoCategory(videoId, category) {
  const db = await connectToMongoDB();
  const img = await getGameBoxArt(category);
  try {
    const collection = db.collection("videos");
    const result = await collection.updateOne(
      { _id: new ObjectId(videoId) },
      { 
        $set: { 
          category: category,
          categoryImg: img,
        },
      }
    );
    if (result.modifiedCount === 0) {
      writeToLogFile('error', 'No matching document found');
    }
  } catch (error) {
    writeToLogFile('error', `Error updating video category: ${error}`);
  }
}

// Function to add a category to the database if it doesn't exist
async function addCategory(category) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('videos');
    const document = await collection.findOne({ _id: 'categories' });
    if (document) {
      if (!document.categories.includes(category)) {
        await collection.updateOne(
          { _id: 'categories' },
          { $push: { categories: category } }
        );
        writeToLogFile('info', `Category "${category}" added successfully.`);
      }
    } else {
      await collection.insertOne({ _id: 'categories', categories: [category] });
    }
  } catch (error) {
    writeToLogFile('error', `Error adding category to databse: ${error}`);
  }
}

// Function to get all categories
async function getAllCategories() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('videos');
    const document = await collection.findOne({ _id: 'categories' });
    if (document) {
      const categories = document.categories;
      return categories;
    } else {
      return [];
    }
  } catch (error) {
    writeToLogFile('error', `Error retrieving categories from database: ${error}`);
    return [];
  }
}

// Function to add a queue item to the database
async function insertQueue(videoId) {
  const db = await connectToMongoDB();
  const videoData = await getVideoData(videoId);
  console.log(videoData);
  try {
    const queueCollection = db.collection("queue");
    await queueCollection.insertOne(videoData);
    writeToLogFile('info', `Queue item created successfully. ID: ${videoId}`)
  } catch (error) {
    writeToLogFile('error', `Error inserting queue item: ${error}`);
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
  }
}

// Function to add a notification to the database
async function addNotification(notification, level) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    const document = {
      notification: notification,
      read: false,
      date: new Date(),
      level: level,
    };
    const result = await collection.insertOne(document);
    return result.insertedId;
  } catch (error) {
    writeToLogFile('error', `Error creating notification document: ${error}`);
  }
}

// Function to remove a notification by ID
async function removeNotificationById(notificationId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    const result = await collection.deleteOne({ _id: new ObjectId(notificationId) });
    return result.deletedCount > 0;
  } catch (error) {
    writeToLogFile('error', `Error removing notification by ID: ${error}`);
  }
}

// Function to mark a notification as read
async function markNotificationAsRead(notificationId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    await collection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { read: true } }
    );
  } catch (error) {
    writeToLogFile('error', `Error marking notification as read: ${error}`);
  }
}

// Function to mark all notifications as read
async function markAllNotificationsAsRead() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    await collection.updateMany(
      { read: false },
      { $set: { read: true } }
    );
  } catch (error) {
    writeToLogFile('error', `Error marking all notifications as read: ${error}`);
  }
}

// Function to delete all notifications
async function deleteAllNotifications() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    await collection.deleteMany({});
  } catch (error) {
    writeToLogFile('error', `Error deleting all notifications: ${error}`);
  }
}

// Function to retrieve all notifications from the database
async function getAllNotifications() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    const notifications = await collection.find().toArray();
    
    // Sort the notifications based on level and date/time
    notifications.sort((a, b) => {
      if (a.level === 'warning' && b.level !== 'warning') {
        return -1; // Place 'warning' level first
      } else if (a.level !== 'warning' && b.level === 'warning') {
        return 1;
      } else {
        // Sort by date/time in descending order (newest first)
        return new Date(b.date) - new Date(a.date);
      }
    });
    
    return notifications;
  } catch (error) {
    writeToLogFile('error', `Error retrieving notifications: ${error}`);
  }
}


//Function to delete all notifications from the database that are older than a set argument
async function deleteOldNotifications(days) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("notifications");
    const result = await collection.deleteMany({ date: { $lt: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } });
    writeToLogFile('info', `Deleted ${result.deletedCount} notifications.`);
  } catch (error) {
    writeToLogFile('error', `Error deleting old notifications: ${error}`);
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
async function insertStream(date, category, backgroundImg) {
  try {
    const collection = dbConnection.collection("streams");
    const document = {
      date: date,
      videos: [],
      length: 0,
      category: category,
      background_img: backgroundImg,
      tags: [],
      entire_stream: null,
    };
    const result = await collection.insertOne(document);
    notificationHandler('info', `New stream added, 'StreamAdded`);
    writeToLogFile('info', `Created stream successfully. ID: ${result.insertedId}`);
    return result.insertedId;
  } catch (error) {
    writeToLogFile('error', `Error creating stream in database: ${error}`);
  }
}

// Function to add videos to a stream
async function addVideoToStream(streamId, videoId) {
  try {
    const collection = dbConnection.collection('streams');
    await collection.updateOne(
      { _id: new ObjectId(streamId) },
      {
        $push: { videos: new ObjectId(videoId) }
      }
    );
    notificationHandler('info', `Video added to stream ${streamId}`, 'clipAdded');
  } catch (err) {
    writeToLogFile('error', `Error adding video to stream: ${err}`);
  }
}

// Function to update the favorite status of a video
async function updateVideoFavoriteStatus(videoId, favorite) {
  const db = await connectToMongoDB();
  try {
    const videosCollection = db.collection('videos');
    const objectId = new ObjectId(videoId);
    const result = await videosCollection.updateOne(
      { _id: objectId },
      { $set: { favorite: favorite } }
    );
    if (result.modifiedCount === 1) {
      writeToLogFile('info', 'Video favorite status updated successfully');
      return favorite;
    } else {
      writeToLogFile('error', 'Video not found');
    }
  } catch (error) {
    writeToLogFile('error', `Error updating video favorite status: ${error}`);
  }
}

// Function to update the stream length
async function updateStreamLength(streamId, newLength) {
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

// Function to retrieve all settings from the database
async function getSettings() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const settings = await collection.find().toArray();
    return settings;
  } catch (error) {
    writeToLogFile('error', `Error retrieving settings: ${error}`);
  }
}

// Function to retrieve the OBS settings from the database
async function getGeneralSettings() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const settings = await collection.findOne({ _id: "settings" });
    return settings;
  } catch (error) {
    writeToLogFile('error', `Error retrieving general settings: ${error}`);
  }
}

// Function to update a setting in the database
async function updateNotificationToggle(setting, value) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    await collection.updateOne(
      { _id: "notifications" },
      { $set: { [setting]: value } }
    );
    writeToLogFile('info', `Setting updated successfully. Setting: ${setting} Value: ${value}`);
  } catch (error) {
    writeToLogFile('error', `Error updating setting: ${error}`);
  }
}

// Function to retrieve the live required setting
async function getLiveRequired() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const settings = await collection.findOne({ _id: "settings" }, { projection: { live_required: 1 } });
    return settings.live_required;
  } catch (error) {
    writeToLogFile('error', `Error retrieving live required: ${error}`);
  }
}

// Function to retrieve the cleanup time
async function getCleanupTime() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const settings = await collection.findOne({ _id: "settings" }, { projection: { cleanup_time: 1 } });
    return settings.cleanup_time;
  } catch (error) {
    writeToLogFile('error', `Error retrieving cleanup time: ${error}`);
  }
}

// Function to retrive the notifications toggle
async function getNotificationsToggle() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const settings = await collection.findOne({ _id: "notifications" });
    return settings;
  } catch (error) {
    writeToLogFile('error', `Error retrieving notifications toggle: ${error}`);
  }
}

// Function to add a tag to a video
async function addTagToVideo(videoId, newTag) {
  const db = await connectToMongoDB();
  try {
    const objectId = new ObjectId(videoId);
    const collection = db.collection("videos");
    const result = await collection.updateOne(
      { _id: objectId },
      { $push: { tags: newTag } }
    );
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
    const objectId = new ObjectId(videoId);
    const collection = db.collection("videos");
    const result = await collection.updateOne(
      { _id: objectId },
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
    notificationHandler('info', 'OBS Settings Updated');
    writeToLogFile('info', 'OBS settings updated successfully. IP: ' + ip + ' Port: ' + port + ' Password: ' + password);
  } catch (error) {
    writeToLogFile('error', `Error updating OBS settings: ${error}`);
  }
}

// Function to retrieve video data by id
async function getVideoData(videoId) {
  const db = await connectToMongoDB();
  try {
    const objectId = new ObjectId(videoId);
    const collection = db.collection('videos');
    return await collection.findOne({ _id: objectId });
  } catch (error) {
    writeToLogFile('error', `Error retrieving video data: ${error}`);
  }
}

// Function to check rather the setup is complete
async function checkSetup(req, res, next) {
  try {
    const db = await connectToMongoDB();
    const collection = db.collection("settings");
    const settings = await collection.findOne({ _id: "settings" });
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
  try {
    const db = await connectToMongoDB();
    const collection = db.collection("settings");
    await collection.updateOne(
      { _id: "settings" },
      { $set: { setup_complete: true } },
      { upsert: true }
    );
    notificationHandler('info', 'Setup completed successfully. Welcome to Clips Vault.')
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
    const videoCollection = db.collection("videos");
    const count = await collection.countDocuments();
    if (count === 0) {
      const settings = {
        _id: 'settings',
        setup_complete: false,
        live_required: false,
        cleanup_time: "0500",
        platform: null,
        twitch: null,
        youtube: null,
        discord: null
      }
      const notifications = {
        _id: 'notifications',
        discord: false,
        gmail: false,
        clipAdded: false,
        clipDeleted: false,
        streamAdded: false,
        streamDeleted: false,
        clipArchived: false,
        maintenace: false
      }
      const discord = {
        _id: 'discord',
        webhookURL: null,
      }
      const archive = {
        _id: 'archive',
        archive: false,
        archiveTime: null,
        archivePct: null
      }
      const categories = {
        _id: 'categories',
        categories: []
      }
      await storeAPIKeyIfNotExists();
      await videoCollection.insertOne(categories);
      await collection.insertOne(archive);
      await collection.insertOne(discord);
      await collection.insertOne(notifications);
      await collection.insertOne(settings);
      await collection.insertOne({ _id: 'obs_settings', ip: null, port: null, password: null });
      writeToLogFile('info', 'Setup initialized successfully.');
    }
  } catch (error) {
    writeToLogFile('error', `Error initializing setup: ${error}`);
  }
}

// Function to set the platform
async function setPlatform(platform) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    await collection.updateOne(
      { _id: "settings" },
      { $set: { platform: platform } }
    );
    notificationHandler('info', `Platform set to: ${platform}`);
    writeToLogFile('info', `Platform set to: ${platform}`);
  } catch (error) {
    writeToLogFile('error', `Error setting platform: ${error}`);
  }
}

// Function to update archive settings
async function updateArchiveSettings(archive, archiveTime, archivePct) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    await collection.updateOne(
      { _id: "archive" },
      { $set: { archive: archive, archiveTime: archiveTime, archivePct: archivePct } }
    );
    writeToLogFile('info', 'Archive settings updated successfully.');
  } catch (error) {
    writeToLogFile('error', `Error updating archive settings: ${error}`);
  }
}

// Function to get archive settings
async function getArchiveSettings() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const settings = await collection.findOne({ _id: "archive" });
    return settings;
  } catch (error) {
    writeToLogFile('error', `Error retrieving archive settings: ${error}`);
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

// Function to get streams paginated
async function getStreamsPaginated(page, size) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('streams');
    const skip = (page - 1) * size; 
    const documents = await collection.find().sort({ _id: -1 }).skip(skip).limit(size).toArray();
    return documents;
  } catch (err) {
    writeToLogFile('error', `Error retrieving streams: ${err}`);
    return [];
  }
}

// Function to get videos paginated
async function getVideosPaginated(page, size) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('videos');
    const skip = (page - 1) * size; 
    const documents = await collection.find({ _id: { $ne: 'categories' } }).sort({ _id: -1 }).skip(skip).limit(size).toArray();
    return documents;
  } catch (err) {
    writeToLogFile('error', `Error retrieving streams: ${err}`);
    return [];
  }
}

// Function to get all streams
async function getAllVideos() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('videos');
    const documents = await collection.find({ _id: { $ne: 'categories' } }).sort({ _id: -1 }).toArray();
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
    const videos = await collection.find({ stream_id: objectId }).toArray();
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
      return userData;
    } else {
      return null;
    }
  } catch (error) {
    writeToLogFile('error', `Error retrieving user data: ${error}`);
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
    notificationHandler('info', `Stream deleted successfully. ID: ${streamId}`);
    writeToLogFile('info', `Removed ${result.deletedCount} streams.`);
  } catch (error) {
    writeToLogFile('error', `Error removing stream: ${error}`);
    console.error('Error removing documents:', error);
  }
}

// Function to delete a video
async function deleteVideo(videoId) {
  const db = await connectToMongoDB();
  const deleteFile = promisify(fs.unlink);
  try {
    const collection = db.collection('videos');
    const objectId = new ObjectId(videoId);
    const video = await collection.findOne({ _id: objectId });
    const filePath = video.file;
    const result = await collection.deleteOne({ _id: objectId });
    await deleteFile(filePath);
    const streamCollection = db.collection('streams');
    await streamCollection.updateOne(
      { _id: video.stream_id },
      { $pull: { videos: objectId } }
    );
    notificationHandler('info', `Video deleted successfully. ID: ${videoId}`);
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
      start: (start-5),
      tags: tags,
      category: category,
      categoryImg: categoryImg,
    };
    await clipsCollection.insertOne(clipDocument);
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
    }
  } catch (error) {
    writeToLogFile('error', `Error storing API key: ${error}`)
  }
}

// Function to store the API key in the database
async function storeAPIKey() {
  const db = await connectToMongoDB();
  try {
    const apiKey = await generateApiKey();
    const settingsCollection = db.collection('settings');
    const hexedAPIKey = Buffer.from(apiKey).toString('hex');
    await settingsCollection.updateOne(
      { _id: 'apikey' },
      { $set: { value: hexedAPIKey } },
      { upsert: true }
    );
  } catch (error) {
    writeToLogFile('error', `Error storing API key: ${error}`);
  }
}

// Function to get the API key from the database
async function getAPIKey() {
  const db = await connectToMongoDB();
  try {
    const settingsCollection = db.collection('settings');
    const result = await settingsCollection.findOne({ _id: 'apikey' });
    if (result && result.value) {
      const apiKey = Buffer.from(result.value, 'hex').toString('utf-8');
      return apiKey;
    } else {
      writeToLogFile('error','API key not found.');
      return null;
    }
  } catch (error) {
    writeToLogFile('error', `Error retrieving API key: ${error}`);
    return null;
  }
}

// Function to search for all ideos that are marked as favorite
async function getAllFavoriteVideos() {
  const db = await connectToMongoDB();
  try {
    const videosCollection = db.collection('videos');
    const result = await videosCollection.find({ favorite: true }).toArray();
    return result;
  } catch (error) {
    writeToLogFile('Error retrieving favorite videos:', error);
    return null;
  }
}

// Function to search for all videos that contain a specific tag
async function getVideosByTag(tag) {
  const db = await connectToMongoDB();
  try {
    const videosCollection = db.collection('videos');
    const result = await videosCollection.find({ tags: tag }).toArray();
    return result;
  } catch (error) {
    writeToLogFile('Error retrieving videos by tag:', error);
    return null;
  }
}

// Function to return al the videos that are older than a set number of days
async function getVideosOlderThanDays(days) {
  const db = await connectToMongoDB();
  try {
    const videosCollection = db.collection('videos');
    const result = await videosCollection.find({ date: { $lt: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } }).toArray();
    return result;
  } catch (error) {
    writeToLogFile('Error retrieving videos older than days:', error);
    return null;
  }
}

// Function to retrun all videos that are older than a set number of days that are not marked as archived and not favorite
async function getVideosOlderThanDaysNotArchived(days) {
  const db = await connectToMongoDB();
  try {
    const videosCollection = db.collection('videos');
    const result = await videosCollection.find({ 
      date: { $lt: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
      archived: false,
      favorite: false
    }).toArray();
    return result;
  } catch (error) {
    writeToLogFile('Error retrieving videos older than days:', error);
    return null;
  }
}

// Function to  remove categories from the database if there are no videos with that category
async function removeCategoriesIfNoVideos() {
  const db = await connectToMongoDB();
  try {
    const videosCollection = db.collection('videos');
    const categoriesCollection = db.collection('categories');
    const categories = await categoriesCollection.find().toArray();
    for (const category of categories) {
      const videos = await videosCollection.find({ category: category }).toArray();
      if (videos.length === 0) {
        await categoriesCollection.deleteOne({ category: category });
        writeToLogFile('info', `Removed category from search: ${category}`);
      }
    }
  } catch (error) {
    writeToLogFile('Error removing categories if no videos:', error);
  }
}


// Export the functions
export {
  connectToMongoDB, createCollection, initdb, storeTwitchAuthToken, storeTwitchUserData, getTwitchAccessToken,
  getAllQueueItems, getAllNotifications, removeNotificationById, addNotification, getVideoData, updateOBSSettings,
  removeTagFromVideo, addTagToVideo, insertStream, insertQueue, insertVideo, removeQueueItemById, checkSetup, getOBSSettings,
  completeSetup, getGoogleAccessToken, addVideoToStream, getAllStreams, getLatestStreams, getVideosByStreamId,
  addTagToStream, removeTagFromStream, getStreamById, retrieveUserData, updateStreamLength, removeStream, getRefreshToken, insertClip, storeAPIKey,
  getAPIKey, getSettings, updateStreamer, updateLiveRequired, updateVideoFavoriteStatus, deleteVideo, getAllVideos, getVideosByTag, getAllFavoriteVideos, deleteFilesByStreamId, storeDiscordWebhookURL, getDiscordWebhookURL, updateDiscordToggle,
  updateCleanupTime, getLiveRequired, getCleanupTime, InitializeSetup, getNotificationsToggle, getDiscordStatus, updateGmailToggle, getGmailToggle, updateNotificationToggle,
  updateArchiveSettings, getAllCategories, addCategory, getArchiveSettings, markNotificationAsRead, deleteOldNotifications, updateStream, getVideosOlderThanDays, 
  removeCategoriesIfNoVideos, setVideoAsArchived, getVideosOlderThanDaysNotArchived, updateVideoCategory, getGeneralSettings, markAllNotificationsAsRead, deleteAllNotifications,
  getStreamsPaginated, getVideosPaginated
}; 