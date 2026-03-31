export const coordinateDictionary: Record<string, { lat: number, lng: number }> = {
    // Some mock coordinates inside Kathmandu for testing
    "Kathmandu": { lat: 27.700769, lng: 85.300140 },
    "Pokhara": { lat: 28.2096, lng: 83.9856 },
    "Chitwan": { lat: 27.5255, lng: 84.4443 },
    
    // City bus stops
    "Ratnapark": { lat: 27.7060, lng: 85.3145 },
    "Bus Park": { lat: 27.7328, lng: 85.3117 },
    "Balkhu": { lat: 27.6833, lng: 85.2952 },
    "Koteshwor": { lat: 27.6766, lng: 85.3468 },
    "Swayambhu": { lat: 27.7149, lng: 85.2903 },
    "Baneshwor": { lat: 27.6915, lng: 85.3340 }
};

export const getCoordinateForStop = (stopName: string) => {
    // Rough lowercase normalization match
    const normalized = stopName.trim().toLowerCase();
    
    const key = Object.keys(coordinateDictionary).find(
        k => k.toLowerCase().includes(normalized) || normalized.includes(k.toLowerCase())
    );
    
    return key ? coordinateDictionary[key] : null;
};
