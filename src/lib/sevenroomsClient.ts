import axios, { AxiosError } from 'axios';

export interface SevenRoomsConfig {
  apiKey: string;
  apiUrl: string; // Base API URL (e.g. https://api.sevenrooms.com)
}

export interface ReservationInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  party_size: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface AvailabilityInput {
  restaurant: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM start time
  party: number; // party size
  endTime?: string; // optional explicit end time
}

export interface AvailabilityResult {
  available_times: string[];
}

export function getConfig(): SevenRoomsConfig | null {
  const apiKey = process.env.SEVENROOMS_API_KEY;
  const apiUrl = process.env.SEVENROOMS_API_URL;
  if (!apiKey || !apiUrl) return null;
  return { apiKey, apiUrl: apiUrl.replace(/\/$/, '') };
}

function formatAxiosError(err: AxiosError | Error): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;
    return `SevenRooms API error${status ? ' ' + status : ''}: ${typeof data === 'string' ? data : JSON.stringify(data)}`;
  }
  return err.message;
}

export async function makeReservation(input: ReservationInput) {
  const cfg = getConfig();
  if (!cfg) throw new Error('SevenRooms API credentials are not configured');
  const datetime = `${input.date}T${input.time}`;
  const payload = {
    datetime,
    party_size: Number(input.party_size),
    guest: {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
    },
  };
  const url = `${cfg.apiUrl}/reservations`;
  try {
    const res = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      timeout: 15000,
    });
    return res.data;
  } catch (e: any) {
    throw new Error(formatAxiosError(e));
  }
}

export async function getAvailability(input: AvailabilityInput): Promise<AvailabilityResult> {
  const cfg = getConfig();
  if (!cfg) throw new Error('SevenRooms API credentials are not configured');
  const endTime = input.endTime || input.time;
  // Adjust URL if SevenRooms official availability endpoint differs
  const url = `${cfg.apiUrl}/availability`;
  try {
    const res = await axios.get(url, {
      params: {
        date: input.date,
        time: input.time,
        party_size: input.party,
      },
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      timeout: 10000,
    });
    const data = res.data || {};
    const times = data.times || data.available_times || data.available || [];
    const result: string[] = [];
    for (const t of times) {
      if (!t) continue;
      if (typeof t === 'string') {
        result.push(t);
        continue;
      }
      if (t.type === 'book' && (t.time || t.start_time || t.datetime)) {
        result.push(t.time || t.start_time || t.datetime);
      }
    }
    return { available_times: Array.from(new Set(result)) };
  } catch (e: any) {
    throw new Error(formatAxiosError(e));
  }
}
