import { exec } from 'child_process';

function backupMongoDB(databaseName, outputDirectory, connectionString) {
  // Generate the backup command
  const backupCommand = `mongodump --db ${databaseName} --out ${outputDirectory} --uri "${connectionString}"`;

  // Execute the backup command
  exec(backupCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup failed: ${error}`);
    } else {
      console.log('Backup completed successfully');
    }

    // Display the output and error streams
    console.log(`Backup output: ${stdout}`);
    console.error(`Backup error: ${stderr}`);
  });
}

// Usage example
const dbName = 'your_database_name';
const backupDir = '/path/to/backup/directory';
const connectionURL = 'mongodb://username:password@remote_host:port/database';
backupMongoDB(dbName, backupDir, connectionURL);
