import { watch } from 'chokidar';

// Define the root directory you want to watch
const rootDirectory = '/';

// Create a watcher to listen for changes recursively
const watcher = watch(rootDirectory, { ignored: /[\/\\]\./ });

let initialFilename = '';

// watcher.on('add', (filePath) => {
//     initialFilename = filePath;
// });

// watcher.on('change', (filePath) => {
//     if (filePath !== initialFilename) {
//         console.log(`File ${initialFilename} has been renamed to ${filePath}.`);
//         // Perform actions you want when the file is renamed
//     }
//     initialFilename = '';
// });

// watcher.on('unlink', (filePath) => {
//     console.log(`File ${filePath} has been removed.`);
//     // Perform actions you want when a file is removed
// });

// watcher.on('error', (error) => {
//     console.error(`Watcher error: ${error}`);
// });


export { watcher };