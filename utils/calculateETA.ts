export const calculateETA = (distanceKm: number, speedKmH: number) => {
    return (distanceKm / speedKmH) * 60; // minutes
};
