import { randomBytes } from 'crypto';

// Server key is used to sign the JWT token
const serverKey = generateApiKey();


// Function to generate a random API key
async function generateApiKey() {
    const apiKeyLength = 32;
    const apiKey = randomBytes(apiKeyLength).toString('hex');
    return apiKey;
}

// Export functions
export { serverKey, generateApiKey };