const Ds = require('deepspeech');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { WavDecoder } = require('wav-decoder');

async function transcribe(mp4Path, modelPath = '/utilities/deepspeech-0.9.3-models.pbmm', beamWidth = 500) {
  const audioPath = path.join(path.dirname(mp4Path), 'audio.wav');
  
  await new Promise((resolve, reject) => {
    ffmpeg(mp4Path)
      .noVideo()
      .toFormat('wav')
      .saveToFile(audioPath)
      .on('error', reject)
      .on('end', resolve);
  });
  
  const buffer = fs.readFileSync(audioPath);
  const audioData = await WavDecoder.decode(buffer);
  const audioBuffer = new Int16Array(audioData.channelData[0].buffer);
  
  console.log('Loading model from file:', modelPath);
  let model = new Ds.Model(modelPath);
  model.setBeamWidth(beamWidth);
  console.log('Loaded model');
  
  let metadata = model.sttWithMetadata(audioBuffer, 1);
  return metadata;
}

transcribe('path/to/video.mp4').then(metadata => {
  console.log(metadata);
}).catch(console.error);
