import dotenv from 'dotenv';
import path from 'node:path';

// Load environment variables from .env files
// Try local folder first, then parent (root) folder
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../.env') });
