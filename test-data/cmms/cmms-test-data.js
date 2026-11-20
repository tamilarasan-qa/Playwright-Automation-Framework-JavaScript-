require('dotenv').config();
const { randomUUID } = require('node:crypto');

const requiredEnvironmentVariables = ['CMMS_EMAIL', 'CMMS_PASSWORD'];
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]
);

if (missingEnvironmentVariables.length > 0) {
    throw new Error(
        `Missing required environment variable(s): ${missingEnvironmentVariables.join(', ')}`
    );
}

function createSyntheticAssetData() {
    const suffix = randomUUID().replace(/-/g, '');
    return {
        name: `pw-cmms-asset-${suffix}`,
        serialNumber: `PW-${suffix.slice(0, 12)}`,
        qrCode: `PW-QR-${suffix.slice(0, 12)}`,
        description: 'Synthetic Playwright test asset'
    };
}

function createSyntheticWorkOrderData() {
    const suffix = randomUUID().replace(/-/g, '');
    return {
        subject: `pw-cmms-work-order-${suffix}`,
        description: 'Synthetic Playwright test work order'
    };
}

module.exports = Object.freeze({
    baseUrl: 'https://cmms.tamidas.com',
    credentials: Object.freeze({
        email: process.env.CMMS_EMAIL,
        password: process.env.CMMS_PASSWORD
    }),
    invalidCredentials: Object.freeze({
        email: 'invalid-user@example.invalid',
        password: 'NotAValidTestPassword123!'
    }),
    createSyntheticAssetData,
    createSyntheticWorkOrderData
});
