type restaurant = {
  venueId: string;
  venueName: string;
  venueKey: string;
}

export async function getAllRestaurants(): Promise<Array<restaurant>> {
 return [
    { venueId: 'ahhzfnNldmVucm9vbXMtc2VjdXJlLWRlbW9yHAsSD25pZ2h0bG9vcF9WZW51ZRiAgOikn42lCQw', venueName: 'Casa Playa', venueKey: 'casaplaya' },
    { venueId: 'ahhzfnNldmVucm9vbXMtc2VjdXJlLWRlbW9yHAsSD25pZ2h0bG9vcF9WZW51ZRiAgOik34TyCww', venueName: 'SW Steakhouse', venueKey: 'swsteakhouse' },
    { venueId: 'ahhzfnNldmVucm9vbXMtc2VjdXJlLWRlbW9yHAsSD25pZ2h0bG9vcF9WZW51ZRiAgOixg9myCww', venueName: 'Jardin', venueKey: 'jardin' },
    { venueId: 'ahhzfnNldmVucm9vbXMtc2VjdXJlLWRlbW9yHAsSD25pZ2h0bG9vcF9WZW51ZRiAgOjxjZGBCww', venueName: 'La Cave', venueKey: 'lacave' },
 ];
}

export async function getRestaurant(venueName: string): Promise<restaurant> {
 return (await getAllRestaurants()).find(r => r.venueName.toLocaleLowerCase() === venueName.toLocaleLowerCase())!;
}