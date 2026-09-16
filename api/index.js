import app from '../server/src/app.js';
import connectDB from '../server/src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('[Serverless] MongoDB connection error:', error.message);
  }
  return app(req, res);
}
