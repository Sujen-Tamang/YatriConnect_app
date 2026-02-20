export function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const toDegrees = (rad: number) => (rad * 180) / Math.PI;

    const startLatRad = toRadians(startLat);
    const startLngRad = toRadians(startLng);
    const destLatRad = toRadians(destLat);
    const destLngRad = toRadians(destLng);

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
        Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

    const bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
}
