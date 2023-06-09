import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { getArchiveSettings } from '../db.js';

async function shrinkVideoFileSize(file) {
    const settings = await getArchiveSettings();
    if (!settings.archive) {
        return;
    }
    const shrinkPercentage = settings.archivePct;
    const outputDir = path.join(__dirname, '/encoding');
    const outputFileName = path.basename(file);
    const outputFilePath = path.join(outputDir, outputFileName);
    const originalBitrate = ffmpeg.ffprobeSync(file).format.bit_rate;
    const newBitrate = Math.round(originalBitrate * (shrinkPercentage / 100));
    return new Promise((resolve, reject) => {
        ffmpeg(file)
            .videoBitrate(newBitrate)
            .on('error', (err) => {
                reject(err);
            })
            .on('end', () => {
                fs.unlink(file, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        fs.rename(outputFilePath, file, (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            })
            .save(outputFilePath);
    });
}

export { shrinkVideoFileSize }