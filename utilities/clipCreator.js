import ffmpeg from 'fluent-ffmpeg';
import { ObjectId } from 'mongodb';
import moment from 'moment';
import { connectToMongoDB, insertVideo } from '../db.js';
import { getFileSize } from './system.js';
import { livedata } from './obs.js';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath('ffmpeg/bin/ffmpeg.exe');

// Function to create clips
async function createClips(streamFile, streamId, streamFolder) {
    console.log(`Creating clips for stream: ${streamId}, folder: ${streamFolder}, file: ${streamFile}`);
    const db = await connectToMongoDB();
    const clipsCollection = db.collection('clips');
    try {
        const cursor = clipsCollection.find();
        if (clipsCollection.countDocuments === 0) {
            return;
        }
        while (await cursor.hasNext()) {
            const clip = await cursor.next();

            const { _id, length, start, tags, category, categoryImg } = clip;
            console.log(`Creating clip for ID: ${_id}. length: ${length}, start: ${start}, tags: ${tags}, category: ${category}, categoryImg: ${categoryImg}`)
            const inputFilePath = streamFile;

            // Calculate the start and duration for the clip
            const startTime = moment.duration(start, 'seconds').asSeconds(); // Convert start time to seconds
            const clipDuration = length; // Desired duration of the clip in seconds
            const duration = Math.min(length - start, clipDuration); // Calculate the actual duration for the clip


            // Calculate the start and duration for the clip
            // const startTime = moment().startOf('day').add(start, 'minutes').format('HH:mm:ss');
            // const duration = length; // Change as desired

            // Create the clip using ffmpeg
            const timestamp = moment().format('YYYY-MM-DD HH-mm-ss-SSS');
            const fileName = `Clip-${timestamp}.mp4`;
            const outputFilePath = `./encoding/${fileName}`; // Replace with the desired output file path and name

            ffmpeg(inputFilePath)
                .seekInput(startTime) // Set the start time in raw seconds
                .setDuration(clipDuration)
                .outputOptions('-c', 'copy')
                .output(outputFilePath)
                .on('end', async () => {
                    console.log(`Clip created for ID: ${_id}`);
                    const size = await getFileSize(outputFilePath);
                    const objectId = new ObjectId(_id);
                    // Remove the document from the collection once the clip is created
                    clipsCollection.deleteOne({ _id: objectId });
                    const currentData = await livedata;
                    insertVideo(streamId, `${streamFolder}/${fileName}`, currentData.date, currentData.category, currentData.backgroundimg, size, length, tags);
                    const newPath = path.join(streamFolder, fileName);
                    fs.rename(outputFilePath, newPath, (err) => {
                        if (err) {
                            console.error(err);
                        }
                    });
                })
                .on('error', (err) => {
                    console.log(`Error creating clip for ID: ${_id}`, err);
                })
                .run();
        }
    } catch (error) {
        console.log('Error iterating through clips collection:', error);
    }
}

export { createClips }