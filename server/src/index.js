import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[CivicAI Server] Running on http://localhost:${PORT}`);
  console.log(`[CivicAI Server] Health check available at http://localhost:${PORT}/api/health`);
});
