import { existsSync, write } from 'fs';
import { connectToMongoDB, deleteOldNotifications, getArchiveSettings, removeCategoriesIfNoVideos, getVideosOlderThanDaysNotArchived, getCleanupTime } from '../db.js';
import { removeOldLogFiles, writeToLogFile } from './logging.js';
import { shrinkVideoFileSize } from './archiveVideo.js';
import { convertMilitaryTimeToCron } from './system.js';
import cron from 'node-cron';

// Function to remove documents with missing files
async function removeDocumentsWithMissingFiles() {
    const db = await connectToMongoDB();
    try {
        const collection = db.collection('videos');
        const streamsCollection = db.collection('streams');
        const documents = await collection.find({}).toArray();
        let files = 0
        for (const document of documents) {
            const filePath = document.file;
            if (!existsSync(filePath)) {
                await collection.deleteOne({ _id: document._id });
                console.log(`Removed document with _id: ${document._id}`);
                files++
                const streamId = document.stream_id;
                await streamsCollection.updateOne(
                    { _id: streamId },
                    { $pull: { videos: document._id }, $inc: { video_count: -1 } }
                );
                if (document._id === document.entire_stream) {
                    await streamsCollection.updateOne(
                        { _id: streamId },
                        { $set: { entire_stream: null } }
                    );
                }
            }
        }
        console.log(`Removed ${files} files`)
        console.log('Processing complete.');
    } catch (error) {
        writeToLogFile('error', 'Error removing documents with missing files:' + error);
        console.error('Error:', error);
    }
}

// Function to shrink all videos that are older than the specified number of days
async function archiveVideos() {
    const settings = await getArchiveSettings();
    if (!settings.archive) {
        return;
    }
    const days = settings.archiveTime;
    const videos = await getVideosOlderThanDaysNotArchived(days);
    writeToLogFile('info', `Archiving ${videos.length} videos...`);
    for (const video of videos) {
        await shrinkVideoFileSize(video.file);
    }
}

// Function to run maintenance tasks
async function maintenace() {
    writeToLogFile('info', 'Running maintenance tasks...');
    await archiveVideos();
    await deleteOldNotifications();
    await removeDocumentsWithMissingFiles();
    await removeOldLogFiles();
    await removeCategoriesIfNoVideos();
}

async function initiateMaintenance() {
    try {
        const maintenaceSchedule = await getCleanupTime();
        if (maintenaceSchedule === undefined) {
            return;
        }
        const cronSchedule = convertMilitaryTimeToCron(maintenaceSchedule);
        cron.schedule(String(cronSchedule), () => {
            maintenace();
        });
    } catch (error) {
        console.error(`Error in initiateMaintenance: ${error}`);
    }
}

export { initiateMaintenance }