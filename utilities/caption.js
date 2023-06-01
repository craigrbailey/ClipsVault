import { Model } from 'deepspeech';
import { readFileSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { join, dirname } from 'path';
import exec from 'child_process';

function extractAudio(videoPath, outputPath) {
  const command = `${ffmpegPath} -i ${videoPath} -vn -acodec pcm_s16le -ar 16000 -ac 1 ${outputPath}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error extracting audio: ${error}`);
      return;
    }
    console.log(`Audio extracted successfully: ${outputPath}`);
  });
}

// Function to transcribe audio using DeepSpeech
function transcribeAudio(audioPath) {
  const model = new DeepSpeech.Model('../models/output_graph.pbmm');
  const audioBuffer = fs.readFileSync(audioPath);
  const result = model.stt(audioBuffer);
  const captions = [
    {
      transcript: result,
      timestamp: '00:00:05'
    },
  ];
  return captions;
}

// Helper function to format the timestamp as "HH:MM:SS"
function formatTimestamp(time) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}

// Helper function to pad single-digit numbers with a leading zero
function padZero(number) {
  return number.toString().padStart(2, '0');
}