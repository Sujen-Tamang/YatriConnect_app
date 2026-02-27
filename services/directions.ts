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
    return fetchOSRMRoute(start, end, waypoints);
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
    console.warn('OpenRouteService failed, falling back to OSRM:', error?.message);
    return fetchOSRMRoute(start, end, waypoints);
  }
};

const fetchOSRMRoute = async (start: Coordinate, end: Coordinate, waypoints: Coordinate[]): Promise<RouteResponse> => {
  try {
    const coords = [start, ...waypoints, end].map(c => `${c.lng},${c.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    
    const response = await axios.get(url);
    const route = response.data?.routes?.[0];

    if (!route || !route.geometry || !route.geometry.coordinates) {
      throw new Error('No route found in OSRM response');
    }

    return {
      coordinates: route.geometry.coordinates.map((c: number[]) => ({ lat: c[1], lng: c[0] })),
      distance: route.distance,
      duration: route.duration
    };
  } catch (err: any) {
    console.error('OSRM fallback failed:', err?.message);
    return {
      coordinates: [start, ...waypoints, end],
      distance: 0,
      duration: 0
    };
  }
};
