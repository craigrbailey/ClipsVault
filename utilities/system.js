import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import os from 'os';

async function getFileSize(filename) {
  const stats = fs.statSync(filename);
  const fileSizeInBytes = stats.size;
  const fileSizeInKilobytes = fileSizeInBytes / 1024;
  const fileSizeInMegabytes = fileSizeInKilobytes / 1024;
  return fileSizeInBytes;
}

async function getVideoLength(filePath, callback) {
  ffmpeg.ffprobe(filePath, (err, metadata) => {
    if (err) {
      callback(err, null);
    } else {
      const duration = metadata.format.duration;
      callback(null, duration);
    }
  });
}

async function createFolder(dateString) {
  const momentObj = moment(dateString, 'YYYY-MM-DD');
  const year = momentObj.year();
  const month = momentObj.format('MMMM');
  const day = momentObj.date();
  const dayOfWeek = momentObj.format('dddd');
  const yearFolder = path.join('clips', year.toString());
  const monthFolder = path.join(yearFolder, month);
  const dayFolder = path.join(monthFolder, `${day} - ${dayOfWeek}`);
  if (!fs.existsSync(yearFolder)) {
    fs.mkdirSync(yearFolder);
  }
  if (!fs.existsSync(monthFolder)) {
    fs.mkdirSync(monthFolder);
  }
  if (!fs.existsSync(dayFolder)) {
    fs.mkdirSync(dayFolder);
  }
  return dayFolder;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

function generateDateFolderStructure() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString('en-us', { month: 'long' });
  const day = now.getDate();
  const dayOfWeek = now.toLocaleString('en-us', { weekday: 'long' });

  return `${year}/${month}/${day} ${dayOfWeek}`;
}

function getMemoryUsage() {
  let totalMemory = os.totalmem();
  let freeMemory = os.freemem();
  let usedMemory = totalMemory - freeMemory;

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let usedMemoryIndex = 0;
  while (usedMemory >= 1024 && usedMemoryIndex < units.length - 1) {
    usedMemory /= 1024;
    usedMemoryIndex++;
  }

  let totalMemoryIndex = 0;
  while (totalMemory >= 1024 && totalMemoryIndex < units.length - 1) {
    totalMemory /= 1024;
    totalMemoryIndex++;
  }

  const usedMemoryPercentage = Math.floor((usedMemory / totalMemory) * 100);
  const usedMemoryFormatted = usedMemory.toFixed(2);
  const totalMemoryFormatted = totalMemory.toFixed(2);
  let totalMemoryUnit = units[totalMemoryIndex];
  let usedMemoryUnit = units[usedMemoryIndex];
  if (totalMemoryUnit === 'GB' && totalMemoryFormatted >= 999) {
    totalMemoryFormatted /= 1024;
    totalMemoryUnit = 'TB';
  }
  if (usedMemoryUnit === 'GB' && usedMemoryFormatted >= 999) {
    usedMemoryFormatted /= 1024;
    usedMemoryUnit = 'TB';
  }

  return {
    memoryPct: usedMemoryPercentage,
    usedMemory: `${usedMemoryFormatted} ${usedMemoryUnit}`,
    totalMemory: `${totalMemoryFormatted} ${totalMemoryUnit}`
  };
}
function checkSetup(req, res, next) {
  if (isSetupComplete) {
    next();
  } else {
    res.redirect('/setup');
  }
}

function moveFileToTrash(filePath) {
  const trashDir = './trash';
  const fileName = filePath.split('/').pop();
  const trashFilePath = `${trashDir}/${fileName}`;

  // Create the trash directory if it doesn't exist
  if (!fs.existsSync(trashDir)) {
    fs.mkdirSync(trashDir);
  }

  // Move the file to the trash directory
  fs.renameSync(filePath, trashFilePath);
  console.log(`Moved file to trash: ${trashFilePath}`);

  return trashFilePath;
}

function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to convert from military time to standard time
async function convertToStandardTime(militaryTime) {
  if (militaryTime === '0000') {
    return 'Midnight';
  } else {
    const hours = parseInt(militaryTime.substring(0, 2));
    const minutes = militaryTime.substring(2);
    const period = hours >= 12 ? 'PM' : 'AM';
    const standardHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${standardHours}:${minutes} ${period}`;
  }
}

export {
  getVideoLength, getFileSize, createFolder, generateDateFolderStructure, getMemoryUsage, checkSetup,
  formatDate, moveFileToTrash, getCurrentDate, convertToStandardTime
};