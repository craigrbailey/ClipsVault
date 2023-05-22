import fs from 'fs';

async function deleteFiles(filesArray) {
    for (const file of filesArray) {
        try {
            await fs.promises.unlink(file);
            console.log(`Successfully deleted ${file}`);
        } catch (error) {
            console.error(`Error deleting ${file}:`, error);
        }
    }
}
