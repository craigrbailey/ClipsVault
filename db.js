import { MongoClient, ObjectId } from 'mongodb';

let dbConnection;

async function connectToMongoDB() {
  const uri = 'mongodb://192.168.1.31:27017'; // Replace with your MongoDB connection string
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const databaseName = 'data'; // Replace with your desired database name
    const db = client.db(databaseName);

    dbConnection = db;
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
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
      console.log(`Created collection: ${collectionName}`);
    }
  } catch (error) {
    console.error('Error creating collection:', error);
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
  // createCollection('settings');
  createCollection('trash');
  InitializeSetup();
  InitializeTokens();
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

    console.log('Document inserted successfully.');
  } catch (error) {
    console.error('Error inserting document:', error);
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
      console.log("New Twitch auth token data stored successfully.");
    } else {
      console.log("Existing Twitch auth token data updated successfully.");
    }
  } catch (error) {
    console.error("Error storing Twitch auth token data:", error);
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
      console.log("User data updated successfully.");
    } else {
      console.log("User data stored successfully.");
    }
  } catch (error) {
    console.error("Error storing user data:", error);
    throw error;
  }
}



async function getAccessToken() {
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
async function retrieveRefreshToken() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('tokens'); // Replace with your collection name
    const query = { type: 'twitch' };
    const projection = { refreshToken: 1 };

    const tokenDocument = await collection.findOne(query, projection);
    if (tokenDocument) {
      const refreshToken = tokenDocument.refreshToken;
      return refreshToken;
    } else {
      console.log('Refresh token not found.');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving refresh token:', error);
    return null;
  }
}

async function insertVideo(streamId, file, date, category, size, length, captions) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("videos");
    const document = {
      stream_id: streamId,
      file: file,
      date: date,
      category: category,
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

async function updateOBSSettings(ip, port, password) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const existingSettings = await collection.findOne({ type: "obs_settings" });

    if (existingSettings) {
      // Update the existing settings
      const result = await collection.updateOne(
        { _id: existingSettings._id },
        { $set: { ip: ip, port: port, password: password } }
      );
      return result.modifiedCount > 0;
    } else {
      // Insert new settings
      const result = await collection.insertOne({ type: "obs_settings", ip: ip, port: port, password: password });
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
    console.error("Error retrieving document by ID:", error);
    throw error;
  }
}


async function checkSetup(req, res, next) {
  try {
    // Retrieve the setup_complete value from the settings collection
    const db = await connectToMongoDB();
    const collection = db.collection("settings");
    const settings = await collection.findOne({});
    const isSetupComplete = settings && settings.setup_complete;

    // Check if the setup is complete
    if (isSetupComplete) {
      // If setup is complete, continue to the next middleware or route
      next();
    } else {
      // If setup is not complete, redirect to the setup page
      res.redirect('/setup');
    }
  } catch (error) {
    console.error("Error checking setup:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function completeSetup() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection("settings");
    const result = await collection.updateOne({}, { $set: { setup_complete: true } }, { upsert: true });
    return result.upsertedCount > 0;
  } catch (error) {
    console.error("Error completing setup:", error);
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
      // If no document exists, insert a new document with setup_complete set to false
      const result = await collection.insertOne({ setup_complete: false });
      await collection.insertOne({ type: 'obs_settings', ip: 'none', port: 4444, password: 'password' });
      return result.insertedCount > 0;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error completing setup:", error);
    throw error;
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

async function getAllStreams() {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('streams');
    return await collection.find({}).toArray();
  } catch (err) {
    console.error(err.stack);
    return [];
  }
}

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

async function removeStreamById(streamId) {
  const db = await connectToMongoDB();
  try {
    const videosCollection = db.collection('videos');
    const streamsCollection = db.collection('streams');
    const trashCollection = db.collection('trash');

    // Get the stream document
    const stream = await streamsCollection.findOne({ _id: streamId });

    if (!stream) {
      console.log(`Stream with ID ${streamId} not found.`);
      return;
    }

    const videoIds = stream.videos;

    // Iterate through the videos
    for (const videoId of videoIds) {
      // Remove video document from videos collection
      const video = await videosCollection.findOne({ _id: videoId });
      if (video) {
        // Move the file to the trash directory
        const filePath = video.file;
        const trashFilePath = moveFileToTrash(filePath);

        // Insert a document in the trash collection
        const trashDocument = {
          stream_id: stream._id,
          video_id: video._id,
          file: trashFilePath,
          date: video.date,
          category: video.category,
          size: video.size,
          length: video.length,
          favorite: video.favorite,
          tags: video.tags,
          captions: video.captions,
          trashDate: new Date().toISOString()
        };
        await trashCollection.insertOne(trashDocument);

        // Remove video document from videos collection
        await videosCollection.deleteOne({ _id: videoId });
        console.log(`Removed video with _id: ${videoId}`);
      }
    }

    // Remove the stream document from streams collection
    await streamsCollection.deleteOne({ _id: streamId });
    console.log(`Removed stream with _id: ${streamId}`);

    console.log('Processing complete.');
  } catch (error) {
    console.error('Error:', error);
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
    const result = await collection.deleteMany({ _id: { $in: objectId } });
    console.log(`Removed ${result.deletedCount} streams.`);
    deleteFilesByStreamId(streamId);
  } catch (error) {
    console.error('Error removing documents:', error);
  }
}

async function deleteFilesByStreamId(streamId) {
  const db = await connectToMongoDB();
  try {
    const collection = db.collection('videos');

    const videos = await collection.find({ stream_id: streamId }).toArray();

    for (const video of videos) {
      const filePath = video.file;
      await collection.deleteOne({ _id: ObjectId(video._id) });
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }

    client.close();
  } catch (error) {
    console.error('Error deleting files:', error);
  }
}



// Export the functions
export {
  connectToMongoDB, createCollection, initdb, storeTwitchAuthToken, storeTwitchUserData, getAccessToken,
  getAllQueueItems, getAllNotifications, removeNotificationById, addNotification, getVideoData, updateOBSSettings,
  removeTagFromVideo, addTagToVideo, insertStream, insertQueue, insertVideo, removeQueueItemById, checkSetup, getOBSSettings,
  completeSetup, getGoogleAccessToken, retrieveRefreshToken, addVideoToStream, getAllStreams, getLatestStreams, getVideosByStreamId,
  addTagToStream, removeTagFromStream, getStreamById, retrieveUserData, updateStreamData, removeStream
}; 