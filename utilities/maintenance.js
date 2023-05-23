import { existsSync } from 'fs';
import { connectToMongoDB } from '../db.js';

async function removeDocumentsWithMissingFiles() {
    const db = await connectToMongoDB();
    try {
        const collection = db.collection('videos');
        const streamsCollection = db.collection('streams');

        // Fetch all documents
        const documents = await collection.find({}).toArray();

        // Iterate through the documents
        let files = 0
        for (const document of documents) {
            const filePath = document.file;

            // Check if the file exists
            if (!existsSync(filePath)) {
                // Remove the document from the collection
                await collection.deleteOne({ _id: document._id });
                console.log(`Removed document with _id: ${document._id}`);
                files++

                // Remove video from streams collection
                const streamId = document.stream_id;
                await streamsCollection.updateOne(
                    { _id: streamId },
                    { $pull: { videos: document._id }, $inc: { video_count: -1 } }
                );

                // Check if the removed file matches entire_stream
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
        console.error('Error:', error);
    }
}


export { removeDocumentsWithMissingFiles }