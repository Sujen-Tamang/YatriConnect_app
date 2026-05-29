import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, StatusBar, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { socket } from '@/services/socket';
import { getRouteDirections, Coordinate } from '@/services/directions';
import { calculateBearing } from '@/utils/tracking';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCoordinateForStop } from '@/utils/mapCoordinates';

const { width, height } = Dimensions.get('window');

// Fallback logic for when coordinates are null
const FALLBACK_KTM = { lat: 27.7172, lng: 85.3240 };

export default function LiveTrackingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const busData = useMemo(() => params.busData ? JSON.parse(params.busData as string) : null, [params.busData]);

    const [liveLocation, setLiveLocation] = useState<Coordinate | null>(null);
    const [heading, setHeading] = useState(0);
    const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
    const [eta, setEta] = useState<string | null>(null);
    const [distance, setDistance] = useState<string | null>(null);
    const [busStatus, setBusStatus] = useState<'on-route' | 'break' | 'offline'>('on-route');
    const [isOffline, setIsOffline] = useState(false);
    const [isRouteSaved, setIsRouteSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const markerRef = useRef<any>(null);
    const markerCoordinate = useRef(
        new AnimatedRegion({
            latitude: FALLBACK_KTM.lat,
            longitude: FALLBACK_KTM.lng,
            latitudeDelta: 0,
            longitudeDelta: 0,
        })
    ).current;

    const setupSocket = async () => {
        const authData = await AsyncStorage.getItem('auth');
        const token = authData ? JSON.parse(authData).token : null;

        if (socket.connected) {
            // If already connected but auth changed, we might need to reconnect
            // but for now, just ensure we join the room
            if (busData?._id) socket.emit('trackBus', busData._id);
        } else {
            if (token) {
                socket.auth = { token };
                socket.connect();
            }
        }

        socket.on('connect', () => {
            console.log('Socket reconnected, joining room...');
            if (busData?._id) socket.emit('trackBus', busData._id);
            setIsOffline(false);
        });
    };

    // Pulse animation for the bus marker
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!busData) return;

        setupSocket();

        // 1. Initial location from busData if available
        if (busData.currentLocation?.lat) {
            setLiveLocation({ lat: busData.currentLocation.lat, lng: busData.currentLocation.lng });
            markerCoordinate.setValue({
                latitude: busData.currentLocation.lat,
                longitude: busData.currentLocation.lng,
                latitudeDelta: 0,
                longitudeDelta: 0,
            });
        }

        // 2. Listen for real-time updates for THIS bus
        socket.on('bus-location-update', ({ busId, location }) => {
            console.log(`[SOCKET] Received update for ${busId}`, location.status);
            if (busId === busData._id) {
                if (location.status) setBusStatus(location.status);
                setLiveLocation(prev => {
                    if (prev) {
                        const newHeading = calculateBearing(prev.lat, prev.lng, location.lat, location.lng);
                        setHeading(newHeading);
                    }
                    return { lat: location.lat, lng: location.lng };
                });

                if (Platform.OS === 'android') {
                    if (markerRef.current) {
                        markerRef.current.animateMarkerToCoordinate(
                            { latitude: location.lat, longitude: location.lng },
                            1000
                        );
                    }
                } else {
                    markerCoordinate.timing({
                        latitude: location.lat,
                        longitude: location.lng,
                        latitudeDelta: 0,
                        longitudeDelta: 0,
                        duration: 1000,
                        useNativeDriver: false,
                    } as any).start();
                }

                setIsOffline(false);
            }
        });

        socket.on('bus-status-changed', ({ busId, status, active }) => {
            if (busId === busData._id) {
                setBusStatus(status);
                setIsOffline(!active);
                if (!active) {
                    Alert.alert("Shift Ended", "This bus has completed its journey.", [
                        { text: "Go Back", onPress: () => router.back() }
                    ]);
                }
            }
        });

        // 3. Listen for specific status changes
        socket.on('bus-deactivated', ({ busId }) => {
            if (busId === busData._id) {
                setIsOffline(true);
                Alert.alert("Bus Offline", "This vehicle is no longer broadcasting its location.", [
                    { text: "Go Back", onPress: () => router.back() }
                ]);
            }
        });

        // Pulse animation loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        socket.on('error', (err) => console.log('[SOCKET ERROR]', err));
        socket.on('connect_error', (err) => console.log('[SOCKET CONN ERROR]', err));

        return () => {
            socket.off('bus-location-update');
            socket.off('bus-deactivated');
            socket.off('error');
            socket.off('connect_error');
        };
    }, [busData]);

    // Helper to calculate distance in meters using Haversine formula
    const getHaversineDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }) => {
        const toRad = (x: number) => (x * Math.PI) / 180;
        const R = 6371e3; // Earth radius in meters
        const dLat = toRad(coord2.lat - coord1.lat);
        const dLon = toRad(coord2.lng - coord1.lng);
        const lat1 = toRad(coord1.lat);
        const lat2 = toRad(coord2.lat);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // 3. Load initial route line
    useEffect(() => {
        const loadRoute = async () => {
            if (!busData || !busData.route) return;
            try {
                let startName = "";
                let endName = "";
                let waypointsList: any[] = [];

                if (typeof busData.route === 'string') {
                    const parts = busData.route.split('-');
                    startName = parts[0]?.trim();
                    endName = parts[1]?.trim();
                } else {
                    const fromVal = busData.route.from;
                    const toVal = busData.route.to;
                    startName = typeof fromVal === 'object' ? fromVal.name : fromVal;
                    endName = typeof toVal === 'object' ? toVal.name : toVal;
                    waypointsList = busData.route.stops || [];
                }

                const startCoord = typeof busData.route === 'object' && busData.route.from && typeof busData.route.from === 'object' && busData.route.from.lat !== undefined
                    ? { lat: busData.route.from.lat, lng: busData.route.from.lng }
                    : getCoordinateForStop(startName) || FALLBACK_KTM;

                const endCoord = typeof busData.route === 'object' && busData.route.to && typeof busData.route.to === 'object' && busData.route.to.lat !== undefined
                    ? { lat: busData.route.to.lat, lng: busData.route.to.lng }
                    : getCoordinateForStop(endName) || FALLBACK_KTM;

                const processedWaypoints = waypointsList.map((w: any) => {
                    if (typeof w === 'object' && w.lat !== undefined) {
                        return { lat: w.lat, lng: w.lng };
                    }
                    const name = typeof w === 'object' ? w.name : w;
                    return getCoordinateForStop(name) || FALLBACK_KTM;
                });

                const directions = await getRouteDirections(
                    startCoord,
                    endCoord,
                    processedWaypoints
                );
                setRouteCoordinates(directions.coordinates);
            } catch (err) {
                console.log('Route load failed', err);
            }
        };
        loadRoute();
    }, [busData]);

    const lastEtaUpdateRef = useRef<{ time: number; lat: number; lng: number }>({ time: 0, lat: 0, lng: 0 });

    // 4. Dynamic ETA & Distance updates
    useEffect(() => {
        if (!liveLocation || !busData || !busData.route) return;

        const updateETA = async () => {
            try {
                let endName = "";
                if (typeof busData.route === 'string') {
                    const parts = busData.route.split('-');
                    endName = parts[1]?.trim();
                } else {
                    const toVal = busData.route.to;
                    endName = typeof toVal === 'object' ? toVal.name : toVal;
                }

                const endCoord = typeof busData.route === 'object' && busData.route.to && typeof busData.route.to === 'object' && busData.route.to.lat !== undefined
                    ? { lat: busData.route.to.lat, lng: busData.route.to.lng }
                    : getCoordinateForStop(endName) || FALLBACK_KTM;

                const directions = await getRouteDirections(
                    liveLocation,
                    endCoord,
                    []
                );

                if (directions.duration !== undefined) {
                    setEta(directions.duration === 0 ? "Now" : `${Math.round(directions.duration / 60)} mins`);
                }
                if (directions.distance !== undefined) {
                    setDistance(directions.distance === 0 ? "0 km" : `${(directions.distance / 1000).toFixed(1)} km`);
                }
            } catch (error) {
                console.log('Dynamic ETA failed', error);
            }
        };

        const now = Date.now();
        const lastUpdate = lastEtaUpdateRef.current;
        const timeDiff = now - lastUpdate.time;
        
        const distanceMoved = getHaversineDistance(
            { lat: liveLocation.lat, lng: liveLocation.lng },
            { lat: lastUpdate.lat, lng: lastUpdate.lng }
        );

        if (timeDiff > 10000 || distanceMoved > 50 || lastUpdate.time === 0) {
            lastEtaUpdateRef.current = { time: now, lat: liveLocation.lat, lng: liveLocation.lng };
            updateETA();
        }
    }, [liveLocation, busData]);

    // Check if route is already saved
    useEffect(() => {
        const checkSavedStatus = async () => {
            if (!busData?.route) return;
            try {
                const authData = await AsyncStorage.getItem('auth');
                if (!authData) return;
                const { token } = JSON.parse(authData);

                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/profile/saved-routes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    const routeId = typeof busData.route === 'string' ? busData.route : (busData.route._id || busData.route.name);
                    const saved = result.savedRoutes.some((r: any) => r.routeId === routeId);
                    setIsRouteSaved(saved);
                }
            } catch (error) {
                console.log('Failed to check saved status', error);
            }
        };
        checkSavedStatus();
    }, [busData]);

    const toggleSaveRoute = async () => {
        if (!busData?.route || saving) return;
        setSaving(true);
        try {
            const authData = await AsyncStorage.getItem('auth');
            if (!authData) {
                Alert.alert("Login Required", "Please login to save routes.");
                return;
            }
            const { token } = JSON.parse(authData);

            const routeId = typeof busData.route === 'string' ? busData.route : (busData.route._id || busData.route.name);
            const fromName = typeof busData.route?.from === 'object' ? busData.route.from.name : (busData.route?.from || 'Origin');
            const toName = typeof busData.route?.to === 'object' ? busData.route.to.name : (busData.route?.to || 'Destination');
            const routeName = typeof busData.route === 'string' ? busData.route : `${fromName} → ${toName}`;

            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/profile/saved-routes/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    routeId,
                    from: fromName,
                    to: toName,
                    name: routeName,
                    type: busData.isCityBus ? 'city' : 'intercity'
                })
            });

            const result = await response.json();
            if (result.success) {
                setIsRouteSaved(!isRouteSaved);
                Alert.alert("Success", result.message);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to save route. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const mapCoordinates = routeCoordinates.map(coord => ({ latitude: coord.lat, longitude: coord.lng }));

    const region = useMemo(() => {
        // If bus is not on route, offline, or location not available, show Kathmandu Valley
        if (isOffline || busStatus !== 'on-route' || !liveLocation) {
            return {
                latitude: FALLBACK_KTM.lat,
                longitude: FALLBACK_KTM.lng,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15,
            };
        }

        return {
            latitude: liveLocation.lat,
            longitude: liveLocation.lng,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
        };
    }, [liveLocation, isOffline, busStatus]);

    if (!busData) return null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <MapView
                style={styles.map}
                initialRegion={region}
                region={region}
                userInterfaceStyle="dark"
                customMapStyle={mapStyle} // Premium Dark Theme
            >
                {mapCoordinates.length > 1 && (
                    <Polyline
                        coordinates={mapCoordinates}
                        strokeColor="#59f20d"
                        strokeWidth={4}
                    />
                )}

                {liveLocation && (
                    <Marker.Animated
                        ref={markerRef}
                        coordinate={Platform.OS === 'ios' ? markerCoordinate as any : { latitude: liveLocation.lat, longitude: liveLocation.lng }}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.markerContainer}>
                            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
                            <Animated.View style={[styles.busMarker, { transform: [{ rotate: `${heading}deg` }] }]}>
                                <FontAwesome5 name="bus" size={18} color="#0d140a" />
                            </Animated.View>
                        </View>
                    </Marker.Animated>
                )}
            </MapView>

            {/* UI Overlays */}
            <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
                <View style={styles.topHeader}>
                    <TouchableOpacity 
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(tabs)/home' as any);
                            }
                        }} 
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.busInfoBox}>
                        <Text style={styles.busNumber}>{busData.busNumber}</Text>
                        <Text style={styles.busRoute}>
                            {typeof busData.route === 'string'
                                ? busData.route
                                : `${typeof busData.route?.from === 'object' ? busData.route.from.name : (busData.route?.from || 'Origin')} → ${typeof busData.route?.to === 'object' ? busData.route.to.name : (busData.route?.to || 'Destination')}`}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={toggleSaveRoute} 
                        style={[styles.saveBtn, isRouteSaved && styles.saveBtnActive]}
                        disabled={saving}
                    >
                        <Ionicons 
                            name={isRouteSaved ? "bookmark" : "bookmark-outline"} 
                            size={20} 
                            color={isRouteSaved ? "#0d140a" : "#59f20d"} 
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomStats}>
                    <View style={styles.statsCard}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isOffline ? '#ef4444' : (busStatus === 'break' ? '#f59e0b' : '#59f20d') }]} />
                            <Text style={[styles.statusText, busStatus === 'break' && { color: '#f59e0b' }]}>
                                {isOffline ? 'OFFLINE' : (busStatus === 'break' ? 'ON BREAK' : 'LIVE ON ROUTE')}
                            </Text>
                        </View>

                        <View style={styles.metricsGrid}>
                            <View style={styles.metricItem}>
                                <MaterialCommunityIcons name="clock-outline" size={20} color="#9ca3af" />
                                <View>
                                    <Text style={styles.metricLabel}>ETA</Text>
                                    <Text style={styles.metricValue}>{eta || '--'}</Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.metricItem}>
                                <MaterialCommunityIcons name="map-marker-distance" size={20} color="#9ca3af" />
                                <View>
                                    <Text style={styles.metricLabel}>Distance</Text>
                                    <Text style={styles.metricValue}>{distance || '--'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
    { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1b1b1b" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
    { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
    { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
    { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    map: { width, height },
    overlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },

    topHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(28, 38, 25, 0.9)', justifyContent: 'center', alignItems: 'center' },
    busInfoBox: { flex: 1, marginLeft: 15, backgroundColor: 'rgba(28, 38, 25, 0.9)', padding: 12, borderRadius: 12 },
    busNumber: { color: '#59f20d', fontSize: 16, fontWeight: 'bold' },
    busRoute: { color: '#9ca3af', fontSize: 12, marginTop: 2 },

    saveBtn: { 
        width: 44, 
        height: 44, 
        borderRadius: 12, 
        backgroundColor: 'rgba(28, 38, 25, 0.9)', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginLeft: 10,
        borderWidth: 1,
        borderColor: 'rgba(89, 242, 13, 0.2)'
    },
    saveBtnActive: {
        backgroundColor: '#59f20d',
    },

    markerContainer: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
    pulseRing: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(89, 242, 13, 0.3)' },
    busMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#59f20d', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },

    bottomStats: { padding: 20, paddingBottom: 40 },
    statsCard: { backgroundColor: 'rgba(28, 38, 25, 0.95)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

    metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    metricItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    metricLabel: { color: '#9ca3af', fontSize: 10, fontWeight: 'bold' },
    metricValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

    contactBtn: { backgroundColor: '#59f20d', height: 54, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    contactText: { color: '#0d140a', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 }
});
