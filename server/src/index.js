import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB on startup
connectDB();

app.listen(PORT, () => {
  console.log(`[CivicAI Server] Running on http://localhost:${PORT}`);
  console.log(`[CivicAI Server] Health check available at http://localhost:${PORT}/api/health`);
});
