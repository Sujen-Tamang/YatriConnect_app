import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getCoordinateForStop } from '@/utils/mapCoordinates';
import { socket } from '@/services/socket';
import { getRouteDirections, Coordinate } from '../../services/directions';


const { width, height } = Dimensions.get('window');

// Fallback logic for when coordinates are null or stops are empty
const FALLBACK_KTM = { latitude: 27.700769, longitude: 85.300140 };

export default function RouteDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const busData = useMemo(() => params.busData ? JSON.parse(params.busData as string) : null, [params.busData]);
    const [liveLocation, setLiveLocation] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        if (!busData) return;

        // 1. Initial location from busData if available
        if (busData.currentLocation?.lat) {
            setLiveLocation({ lat: busData.currentLocation.lat, lng: busData.currentLocation.lng });
        }

        // 2. Listen for real-time updates for THIS bus
        socket.on('bus-location-update', ({ busId, location }) => {
            if (busId === busData._id) {
                setLiveLocation({ lat: location.lat, lng: location.lng });
            }
        });

        // 3. Listen for specific status changes (like going offline)
        socket.on('bus-deactivated', ({ busId }) => {
            if (busId === busData._id) {
                setLiveLocation(null);
            }
        });

        return () => {
            socket.off('bus-location-update');
            socket.off('bus-deactivated');
        };
    }, [busData]);

    if (!busData) {
        return (
            <View style={styles.container}>
                <Text style={{color: 'white'}}>Error loading route data.</Text>
                <TouchableOpacity onPress={() => router.back()}><Text style={{color: 'white', marginTop: 20}}>Go Back</Text></TouchableOpacity>
            </View>
        );
    }

    const { busNumber, route, schedule } = busData;
    
    // Process stops differently based on City vs Intercity payloads
    let stopsList: { name: string, coord: { lat: number, lng: number } }[] = [];
    
    if (typeof route === "string") {
        // City Bus scenario: route is a string (e.g. "Ratnapark - Kalanki")
        const stops = route.split("-").map(s => s.trim());
        stopsList = stops.map(stop => ({
            name: stop,
            coord: getCoordinateForStop(stop) || { lat: FALLBACK_KTM.latitude + Math.random() * 0.02, lng: FALLBACK_KTM.longitude + Math.random() * 0.02 } // randomized fallback if no mapping
        }));
    } else {
        // Intercity Bus scenario: route is object with stops array
        // Handles new backend schema where stops are { name, lat, lng } objects
        const rawStops = [
            typeof route.from === 'string' ? { name: route.from } : route.from,
            ...(route.stops || []),
            typeof route.to === 'string' ? { name: route.to } : route.to
        ];

        stopsList = rawStops.map((stop: any) => {
            const stopName = stop?.name || (typeof stop === 'string' ? stop : 'Unknown Stop');
            // If the backend object provides lat/lng natively, use it directly
            if (stop?.lat && stop?.lng) {
                return {
                    name: stopName,
                    coord: { lat: stop.lat, lng: stop.lng }
                };
            }
            // Otherwise fallback to local coordinate mapping
            return {
                name: stopName,
                coord: getCoordinateForStop(stopName) || { lat: FALLBACK_KTM.latitude - Math.random() * 0.05, lng: FALLBACK_KTM.longitude - Math.random() * 0.05 }
            };
        });
    }

    // Prepare Polyline points with road directions
    const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);

    useEffect(() => {
        const loadRoute = async () => {
            if (stopsList.length > 1) {
                try {
                    const directions = await getRouteDirections(
                        stopsList[0].coord,
                        stopsList[stopsList.length - 1].coord,
                        stopsList.slice(1, -1).map(s => s.coord)
                    );
                    setRouteCoordinates(directions.coordinates);
                } catch (error) {
                    console.error('Failed to load route directions:', error);
                    // Fallback to straight line
                    setRouteCoordinates(stopsList.map(s => s.coord));
                }
            } else {
                setRouteCoordinates(stopsList.map(s => s.coord));
            }
        };
        loadRoute();
    }, [busData]);

    const mapCoordinates = routeCoordinates.map(coord => ({ latitude: coord.lat, longitude: coord.lng }));
    
    // Compute central region encompassing the path
    const region = useMemo(() => {
        if (mapCoordinates.length === 0) return { ...FALLBACK_KTM, latitudeDelta: 0.1, longitudeDelta: 0.1 };
        
        let minLat = mapCoordinates[0].latitude;
        let maxLat = mapCoordinates[0].latitude;
        let minLng = mapCoordinates[0].longitude;
        let maxLng = mapCoordinates[0].longitude;

        mapCoordinates.forEach(point => {
            if (point.latitude < minLat) minLat = point.latitude;
            if (point.latitude > maxLat) maxLat = point.latitude;
            if (point.longitude < minLng) minLng = point.longitude;
            if (point.longitude > maxLng) maxLng = point.longitude;
        });

        const latDelta = (maxLat - minLat) * 1.5 || 0.05;
        const lngDelta = (maxLng - minLng) * 1.5 || 0.05;

        return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
        };
    }, [mapCoordinates]);



    return (
        <View style={styles.container}>
            {/* Top Navigation Overlay */}
            <View style={styles.headerOverlay}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={styles.headerTitle}>Route {busNumber}</Text>
                    <Text style={styles.headerSub}>Via {stopsList[0]?.name} & {stopsList[1]?.name || 'City'}</Text>
                </View>
                <TouchableOpacity style={styles.shareBtn}>
                    <Ionicons name="share-social" size={20} color="#f9fafb" />
                </TouchableOpacity>
            </View>

            {/* Top Half Map */}
            <View style={styles.mapContainer}>
                {/* Search removed per user request */}

                <MapView 
                    style={styles.map}
                    initialRegion={region}
                    userInterfaceStyle="dark" // applies proper Apple maps dark mode theme
                >
                    <Polyline
                        coordinates={mapCoordinates}
                        strokeColor="#59f20d" // Neon Green path
                        strokeWidth={4}
                    />
                    
                    {stopsList.map((stop, index) => (
                        <Marker 
                            key={index} 
                            coordinate={{ latitude: stop.coord.lat, longitude: stop.coord.lng }} 
                            title={stop.name}
                        >
                            <View style={[styles.markerRing, index === 0 || index === stopsList.length - 1 ? styles.markerRingEnd : null]}>
                                <View style={styles.markerDot} />
                            </View>
                        </Marker>
                    ))}

                    {/* LIVE BUS POSITION */}
                    {liveLocation && (
                        <Marker
                            coordinate={{ latitude: liveLocation.lat, longitude: liveLocation.lng }}
                            title="Actual Bus Location"
                            zIndex={10}
                        >
                            <View style={styles.liveBusMarker}>
                                <FontAwesome5 name="bus" size={16} color="#0d140a" />
                                <View style={styles.livePulse} />
                            </View>
                        </Marker>
                    )}
                </MapView>
                
                {/* Map Controls */}
                <View style={styles.mapControls}>
                    <TouchableOpacity style={styles.mapControlBtn}><Ionicons name="add" size={24} color="#f9fafb" /></TouchableOpacity>
                    <View style={styles.mapControlDivider} />
                    <TouchableOpacity style={styles.mapControlBtn}><Ionicons name="remove" size={24} color="#f9fafb" /></TouchableOpacity>
                </View>
            </View>

            {/* Bottom Half Data Sheet */}
            <View style={styles.bottomSheetWrapper}>
                <View style={styles.dragHandle} />
                
                <View style={styles.sheetHeaderRow}>
                    <Text style={styles.sheetTitle}>Route Stops</Text>
                    <TouchableOpacity 
                        style={styles.liveTrackBtn}
                        onPress={() => router.push({
                            pathname: '/(screens)/live-tracking' as any,
                            params: { busData: JSON.stringify(busData) }
                        })}
                    >
                        <Text style={styles.liveTrackText}>LIVE TRACKING</Text>
                    </TouchableOpacity>
                </View>

                {stopsList.map((stop, index) => {
                    const isPassed = index === 0;
                    const isApproaching = index === 1;
                    
                    return (
                        <View key={index} style={styles.stopRow}>
                            <View style={styles.stopTimeline}>
                                <View style={[styles.stopDot, isPassed ? styles.dotPassed : isApproaching ? styles.dotApproaching : styles.dotPending]}>
                                    {isApproaching && <View style={styles.dotPulse} />}
                                </View>
                                {index !== stopsList.length - 1 && (
                                    <View style={[styles.stopLine, isPassed ? styles.linePassed : styles.linePending]} />
                                )}
                            </View>

                            <View style={styles.stopDetails}>
                                <Text style={[styles.stopNameText, isApproaching && styles.textApproaching]}>{stop.name}</Text>
                                <Text style={styles.stopDescText}>{index === 0 ? 'Departure Point' : index === stopsList.length - 1 ? 'Terminal Arrival' : `Station #${index + 1}`}</Text>
                            </View>

                            <View style={styles.stopTimes}>
                                <Text style={[styles.timeTextArrival, isApproaching && styles.textApproaching]}>{schedule ? schedule.departure : "Active"}</Text>
                                <Text style={[styles.timeStatus, isPassed ? styles.statusPassed : isApproaching ? styles.statusApproaching : styles.statusPending]}>
                                    {isPassed ? 'DEPARTED' : isApproaching ? 'APPROACHING' : 'SCHEDULED'}
                                </Text>
                            </View>
                        </View>
                    );
                })}

                {/* Book Now Action */}
                <TouchableOpacity 
                    style={styles.bookNowBtn}
                    onPress={() => router.push({
                        pathname: '/booking' as any,
                        params: { busData: JSON.stringify(busData) }
                    })}
                >
                    <View style={styles.bookNowContent}>
                        <View>
                            <Text style={styles.bookNowPrice}>NPR {busData.price || '850'}</Text>
                            <Text style={styles.bookNowLabel}>Per seat</Text>
                        </View>
                        <View style={styles.bookNowAction}>
                            <Text style={styles.bookNowText}>BOOK NOW</Text>
                            <Ionicons name="arrow-forward" size={18} color="#0d140a" />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    
    headerOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(13, 20, 10, 0.9)',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c2619', borderRadius: 12 },
    shareBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c2619', borderRadius: 12 },
    headerTitleBox: { flex: 1, marginLeft: 10 },
    headerTitle: { color: '#f9fafb', fontSize: 18, fontWeight: 'bold' },
    headerSub: { color: '#9ca3af', fontSize: 13 },

    mapContainer: { flex: 1, position: 'relative' },
    map: { ...StyleSheet.absoluteFillObject },
    
    mapSearchBox: {
        position: 'absolute', top: 110, left: 20, right: 20, zIndex: 10,
        backgroundColor: '#1c2619',
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    mapSearchPlaceholder: { color: '#9ca3af', fontSize: 16, marginLeft: 10 },

    mapControls: {
        position: 'absolute', bottom: 120, right: 20, zIndex: 10,
        backgroundColor: '#1c2619', borderRadius: 8,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    mapControlBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    mapControlDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginHorizontal: 8 },

    markerRing: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(89, 242, 13, 0.3)', justifyContent: 'center', alignItems: 'center' },
    markerRingEnd: { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
    markerDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#59f20d', borderWidth: 2, borderColor: '#fff' },

    bottomSheetWrapper: {
        backgroundColor: '#0d140a',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 30,
        borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10,
        position: 'absolute', bottom: 0, left: 0, right: 0,
    },
    dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#1c2619', alignSelf: 'center', marginBottom: 20 },
    
    sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    sheetTitle: { color: '#f9fafb', fontSize: 22, fontWeight: 'bold' },
    liveTrackBtn: { backgroundColor: 'rgba(89, 242, 13, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    liveTrackText: { color: '#59f20d', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },

    stopRow: { flexDirection: 'row', alignItems: 'flex-start' },
    
    stopTimeline: { width: 24, alignItems: 'center', marginRight: 16 },
    stopDot: { width: 14, height: 14, borderRadius: 7 },
    dotPassed: { backgroundColor: '#59f20d' },
    dotApproaching: { backgroundColor: 'transparent', borderWidth: 3, borderColor: '#59f20d' },
    dotPending: { backgroundColor: '#1c2619' },
    dotPulse: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(89, 242, 13, 0.3)', top: -6, left: -6 },
    
    stopLine: { width: 2, height: 40, marginVertical: 4 },
    linePassed: { backgroundColor: '#59f20d' },
    linePending: { backgroundColor: '#1c2619' },

    stopDetails: { flex: 1, paddingBottom: 24 },
    stopNameText: { color: '#f9fafb', fontSize: 16, fontWeight: '600', marginBottom: 4 },
    textApproaching: { color: '#59f20d' },
    stopDescText: { color: '#9ca3af', fontSize: 13 },

    stopTimes: { alignItems: 'flex-end', paddingBottom: 24 },
    timeTextArrival: { color: '#f9fafb', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
    timeStatus: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
    statusPassed: { color: '#59f20d' }, 
    statusApproaching: { color: '#f59e0b' }, 
    statusPending: { color: '#6b7280' },

    bookNowBtn: {
        backgroundColor: '#1c2619',
        borderRadius: 20,
        padding: 4,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(89, 242, 13, 0.2)',
        overflow: 'hidden',
    },
    bookNowContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    bookNowPrice: { color: '#59f20d', fontSize: 20, fontWeight: 'bold' },
    bookNowLabel: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
    bookNowAction: {
        backgroundColor: '#59f20d',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        gap: 8,
    },
    bookNowText: { color: '#0d140a', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

    liveBusMarker: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#59f20d',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#59f20d',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    livePulse: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: 'rgba(89, 242, 13, 0.4)',
        zIndex: -1,
    },
});
