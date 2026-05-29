import axios from 'axios';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteResponse {
  coordinates: Coordinate[];
  distance?: number;
  duration?: number;
}

export const getRouteDirections = async (
  start: Coordinate,
  end: Coordinate,
  waypoints: Coordinate[] = []
): Promise<RouteResponse> => {
  const apiKey = process.env.EXPO_PUBLIC_ORS_API_KEY;

  if (!apiKey || apiKey === 'your_openrouteservice_api_key_here') {
    const msg = 'OpenRouteService API key not configured. Set EXPO_PUBLIC_ORS_API_KEY in your .env and rebuild the app.';
    console.error(msg);
    throw new Error(msg);
  }

  // Build coordinates in [lng, lat] order as required by ORS
  const coordsArray = [start, ...waypoints, end].map(c => [c.lng, c.lat]);

  const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

  try {
    const response = await axios.post(
      url,
      { coordinates: coordsArray },
      {
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const feature = response.data?.features?.[0];
    if (!feature || !feature.geometry || !feature.geometry.coordinates) {
      throw new Error('Invalid route response from OpenRouteService');
    }

    const coords: Coordinate[] = feature.geometry.coordinates.map((c: number[]) => ({ lat: c[1], lng: c[0] }));

    const segment = feature.properties?.segments?.[0];
    return { coordinates: coords, distance: segment?.distance, duration: segment?.duration };
  } catch (error: any) {
    // Provide clearer diagnostic when ORS rejects the request
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 403) {
        console.error('OpenRouteService returned 403 Forbidden — likely an invalid or restricted API key.');
      } else if (error.response.status === 401) {
        console.error('OpenRouteService returned 401 Unauthorized — check the API key.');
      } else {
        console.error('OpenRouteService error:', error.response.status, error.response.data);
      }
    } else {
      console.error('Network or unexpected error calling OpenRouteService:', error?.message || error);
    }

    // Re-throw so callers can fallback to straight-line rendering if they want
    throw error;
  }
};
