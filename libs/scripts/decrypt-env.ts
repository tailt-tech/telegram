import * as fs from 'fs';
import SimpleCrypto from 'simple-crypto-js';

const secret = process.env.ENV_SECRET_KEY || 'secret';
const crypto = new SimpleCrypto(secret);

const encryptedEnvPath = process.env.ENCRYPTED_ENV_PATH || '.env.encrypted';
const encrypted = fs.readFileSync(encryptedEnvPath, 'utf8');
const decrypted = crypto.decrypt(encrypted);
fs.writeFileSync('.env', decrypted);
