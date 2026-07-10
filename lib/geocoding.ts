
export interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function getGeocode(address: string, city: string, state: string, zip?: string): Promise<GeocodeResult> {
  const fullAddress = `${address}, ${city}, ${state}${zip ? ` ${zip}` : ''}`;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Maps API Key is not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } else {
      throw new Error(data.error_message || `Geocoding failed with status: ${data.status}`);
    }
  } catch (error) {
    console.error('Error in getGeocode:', error);
    throw error;
  }
}
