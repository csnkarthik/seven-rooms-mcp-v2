import { SEVENROOMS_BASE } from "./env.js";
import { getAuthToken } from "./getAuthToken.js";

type FindMyReservationInput = {
    confirmation_number: string;   
};

type FindMyReservationOutput = {
    reservation_id: string;
    firstName: string;
    lastName: string;
    time: string;
    date: string;
    guests: string
};

export async function findReservation(confirmation_number: string): Promise<FindMyReservationOutput | null> {

  //
  const token = await getAuthToken();
  
  // Build URL safely with encoding - only include non-empty parameters
  const params = new URLSearchParams();
  params.append('reference_code', confirmation_number);


  const url = `${SEVENROOMS_BASE}/reservations?${params.toString()}`;

  console.error('url', url)

  const sr = await fetch(url, {
      headers: { Authorization: `${token}` },
  });


  if (!sr.ok) {
      console.error('Error finding reservation HTTP ${sr.status})', sr.statusText);
      return null;
  }

  const result = await sr.json();

  if (result?.data?.results.length && result.data.results.length === 0) {
      console.error('No reservation found for confirmation number:', confirmation_number);
      return null;
  }

  const reservation = result.data.results[0];

  return { 
        reservation_id: reservation.reservation_id, 
        firstName: reservation.first_name,  
        lastName: reservation.last_name, 
        time: reservation.arrival_time, 
        date: reservation.date ,
        guests: reservation.max_guests
      };
}

