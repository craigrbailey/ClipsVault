import { randomBytes } from 'crypto';

const serverKey = generateApiKey();

async function generateApiKey() {
    const apiKeyLength = 32;
    const apiKey = randomBytes(apiKeyLength).toString('hex');
    return apiKey;
}
export { serverKey, generateApiKey };