const fs = require('fs');
const archiver = require('archiver');

function zipFiles(filePaths, outputFileName) {
  const output = fs.createWriteStream(`./zips/${outputFileName}.zip`);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Set the compression level (0-9)
  });
  archive.pipe(output);
  for (const filePath of filePaths) {
    const fileName = filePath.split('/').pop(); // Extract the file name
    archive.file(filePath, { name: fileName });
  }
  archive.finalize();
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
const filesToZip = ['./file1.txt', './file2.txt'];
const outputFileName = 'myZipFile';

zipFiles(filesToZip, outputFileName);
