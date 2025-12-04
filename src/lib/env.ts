// Centralized SevenRooms environment configuration helpers
// Load environment variables from .env file at module initialization
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const SEVENROOMS_BASE = process.env.SEVENROOMS_BASE || "";
export const SEVENROOMS_CLIENT_ID = process.env.SEVENROOMS_CLIENT_ID || "";
export const SEVENROOMS_CLIENT_SECRET = process.env.SEVENROOMS_CLIENT_SECRET || "";

export interface AppConfig {
  sevenRoomBaseUrl: string;
  sevenRoomsClientId: string;
  sevelRoomClientSecret: string;
}

export function requireAppConfig(): AppConfig {
  const config = {
    sevenRoomBaseUrl: process.env.SEVENROOMS_BASE || '',
    sevenRoomsClientId: process.env.SEVENROOMS_CLIENT_ID || '',
    sevelRoomClientSecret: process.env.SEVENROOMS_CLIENT_SECRET || '',
  };

  // Validate required environment variables
  const missing: string[] = [];
  if (!config.sevenRoomBaseUrl) missing.push('SEVENROOMS_BASE');
  if (!config.sevenRoomsClientId) missing.push('SEVENROOMS_CLIENT_ID');
  if (!config.sevelRoomClientSecret) missing.push('SEVENROOMS_CLIENT_SECRET');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('   Please ensure your .env file contains these values.');
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  console.error('✓ Environment variables loaded successfully');
  return config;
}
