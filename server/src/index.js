import dns from 'dns';

// Fix for Windows DNS resolvers failing on MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load .env from server/.env or project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB on startup
connectDB();

app.listen(PORT, () => {
  console.log(`[CivicAI Server] Running on http://localhost:${PORT}`);
  console.log(`[CivicAI Server] Health check available at http://localhost:${PORT}/api/health`);
});
