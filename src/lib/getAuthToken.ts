/**
 * Fetch a SevenRooms OAuth token using client credentials.
 * Expects environment variables:
 *  - SEVENROOMS_BASE (e.g. https://api.sevenrooms.com)
 *  - SEVENROOMS_CLIENT_ID
 *  - SEVENROOMS_CLIENT_SECRET
 */
import { requireAppConfig } from "./env.js";

interface AuthSuccessShape {
  data?: { token?: string };
  token?: string;
  access_token?: string;
}

export async function getAuthToken(): Promise<string> {

  const { sevenRoomBaseUrl: SEVENROOMS_BASE, sevenRoomsClientId: SEVENROOMS_CLIENT_ID, sevelRoomClientSecret: SEVENROOMS_CLIENT_SECRET } = requireAppConfig();
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', SEVENROOMS_CLIENT_ID);
  params.append('client_secret', SEVENROOMS_CLIENT_SECRET);

  const url = `${SEVENROOMS_BASE}/auth`;
  console.error('auth url: ', url)

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`SevenRooms auth failed (${resp.status}) ${text}`);
  }

  const data: AuthSuccessShape = await resp.json();
  const token = data?.data?.token || data.token || data.access_token;
  if (!token) {
    throw new Error('SevenRooms auth response did not include a token');
  }
  console.error('fetched token: ', token)
  return token;
}