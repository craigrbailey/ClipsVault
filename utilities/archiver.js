const fs = require('fs');
const archiver = require('archiver');

function zipFiles(filePaths, outputFileName) {
  // Create a writable stream to save the zip file
  const output = fs.createWriteStream(`./zips/${outputFileName}.zip`);
  
  // Create an Archiver instance
  const archive = archiver('zip', {
    zlib: { level: 9 } // Set the compression level (0-9)
  });

  // Pipe the output stream to the archive
  archive.pipe(output);

  // Add files to the archive
  for (const filePath of filePaths) {
    const fileName = filePath.split('/').pop(); // Extract the file name
    archive.file(filePath, { name: fileName });
  }

  // Finalize the archive
  archive.finalize();

  // Event handlers for various archive events
  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      console.warn(err);
    } else {
      throw err;
    }
  });

  archive.on('error', function (err) {
    throw err;
  });

  output.on('close', function () {
    console.log('Archive created successfully!');
  });
}

// Usage example
const filesToZip = ['./file1.txt', './file2.txt']; // Provide an array of file paths to be zipped
const outputFileName = 'myZipFile'; // Specify the output file name (without extension)

zipFiles(filesToZip, outputFileName);
