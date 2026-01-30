import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ScrollView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { socket } from '@/services/socket';
import { getRouteDirections, Coordinate } from '@/services/directions';
import { getCityBusEtaApi } from '@/features/bus/bus.service';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCoordinateForStop } from '@/utils/mapCoordinates';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const FALLBACK_KTM = { latitude: 27.7172, longitude: 85.3240 };

export default function CityTrackingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const busData = useMemo(() => params.busData ? JSON.parse(params.busData as string) : null, [params.busData]);
    
    const [liveLocation, setLiveLocation] = useState<Coordinate | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
    const [stopsWithEta, setStopsWithEta] = useState<any[]>([]);
    const [busStatus, setBusStatus] = useState<'on-route' | 'break' | 'offline'>('on-route');
    const [isOffline, setIsOffline] = useState(false);
    const [loading, setLoading] = useState(true);

    const pulseAnim = useRef(new Animated.Value(1)).current;

    const setupSocket = async () => {
        const authData = await AsyncStorage.getItem('auth');
        const token = authData ? JSON.parse(authData).token : null;

        if (socket.connected) {
            if (busData?._id) socket.emit('trackBus', busData._id);
        } else {
            if (token) {
                socket.auth = { token };
                socket.connect();
            }
        }

        socket.on('connect', () => {
            if (busData?._id) socket.emit('trackBus', busData._id);
            setIsOffline(false);
        });
    };

    // 1. Process stops into coordinate-aware objects
    const stopsList = useMemo(() => {
        if (!busData || !busData.route) return [];
        
        let stops: any[] = [];
        if (typeof busData.route === 'string') {
            stops = busData.route.split('-').map((s: string) => ({ name: s.trim() }));
        } else {
            const fromPoint = typeof busData.route.from === 'object' 
                ? busData.route.from 
                : { name: busData.route.from };
            
            const toPoint = typeof busData.route.to === 'object' 
                ? busData.route.to 
                : { name: busData.route.to };

            stops = [
                fromPoint,
                ...(busData.route.stops || []),
                toPoint
            ];
        }

        return stops.map(s => {
            const name = typeof s === 'string' ? s : s.name;
            // Use lat/lng from DB if available, otherwise fallback to local map
            const coord = (s.lat && s.lng) ? { lat: s.lat, lng: s.lng } : getCoordinateForStop(name) || FALLBACK_KTM;
            return { name, coord };
        });
    }, [busData]);

    useEffect(() => {
        if (!busData) return;

        // 1. Socket Setup & room joining
        setupSocket();

        // 2. Initial location from busData
        if (busData.currentLocation?.lat) {
            setLiveLocation({ lat: busData.currentLocation.lat, lng: busData.currentLocation.lng });
        }

        // Socket listener
        socket.on('bus-location-update', ({ busId, location }) => {
            console.log(`[CITY-SOCKET] Update for ${busId}`, location.status);
            if (busId === busData._id) {
                setLiveLocation({ lat: location.lat, lng: location.lng });
                if (location.status) setBusStatus(location.status);
                setIsOffline(false);
            }
        });

        socket.on('bus-status-changed', ({ busId, status, active }) => {
            if (busId === busData._id) {
                setBusStatus(status);
                setIsOffline(!active);
                if (!active) {
                    Alert.alert("Shift Ended", "The captain has ended their shift for this route.", [
                        { text: "OK", onPress: () => router.back() }
                    ]);
                }
            }
        });

        socket.on('error', (err) => console.log('[CITY-SOCKET ERROR]', err));
        socket.on('connect_error', (err) => console.log('[CITY-SOCKET CONN ERROR]', err));

        socket.on('bus-deactivated', ({ busId }) => {
            if (busId === busData._id) {
                setIsOffline(true);
                Alert.alert("Bus Offline", "This vehicle is no longer broadcasting its location.", [
                    { text: "Go Back", onPress: () => router.back() }
                ]);
            }
        });

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        return () => {
            socket.off('bus-location-update');
            socket.off('bus-deactivated');
            socket.off('error');
            socket.off('connect_error');
        };
    }, [busData]);

    // 2. Fetch full route and initial ETAs
    useEffect(() => {
        const fetchRouteData = async () => {
            if (stopsList.length < 2) return;
            setLoading(true);
            try {
                const directions = await getRouteDirections(
                    stopsList[0].coord,
                    stopsList[stopsList.length - 1].coord,
                    stopsList.slice(1, -1).map(s => s.coord)
                );
                setRouteCoordinates(directions.coordinates);
                
                // For initial display, set generic ETAs
                setStopsWithEta(stopsList.map((s, idx) => ({
                    ...s,
                    eta: idx === 0 ? 'Dep' : `${idx * 8}m`
                })));
            } catch (err) {
                console.error("CityTracking: Route load failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRouteData();
    }, [stopsList]);

    // 3. Real ETA Calculation based on Backend Processing
    useEffect(() => {
        if (!liveLocation || !busData?._id) return;

        const updateRealEtas = async () => {
            try {
                const response = await getCityBusEtaApi(busData._id);
                if (response.success && response.etas) {
                    const backendEtas = response.etas;
                    const updatedStops = stopsList.map(s => {
                        const backendEta = backendEtas.find((e: any) => e.name === s.name);
                        return {
                            ...s,
                            eta: backendEta ? (backendEta.minutes === 0 ? 'Now' : `${backendEta.minutes}m`) : 'Soon',
                            status: backendEta ? (backendEta.minutes === 0 ? 'Arrived' : 'Upcoming') : 'Upcoming'
                        };
                    });
                    setStopsWithEta(updatedStops);
                }
            } catch (err) {
                console.log("Real ETA Update failed", err);
            }
        };

        const timeout = setTimeout(updateRealEtas, 5000);
        return () => clearTimeout(timeout);
    }, [liveLocation, busData?._id, stopsList]);

    const region = useMemo(() => {
        const loc = liveLocation || (stopsList.length > 0 ? stopsList[0].coord : FALLBACK_KTM);
        return {
            latitude: loc.lat,
            longitude: loc.lng,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
        };
    }, [liveLocation, stopsList]);

    if (!busData) return null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={region}
                    region={region}
                    userInterfaceStyle="dark"
                >
                    {routeCoordinates.length > 1 && (
                        <Polyline coordinates={routeCoordinates.map(c => ({ latitude: c.lat, longitude: c.lng }))} strokeColor="#59f20d" strokeWidth={5} />
                    )}

                    {stopsList.map((stop, i) => (
                        <Marker key={i} coordinate={{ latitude: stop.coord.lat, longitude: stop.coord.lng }}>
                            <View style={styles.stopMarker}>
                                <View style={styles.stopInner} />
                            </View>
                        </Marker>
                    ))}

                    {liveLocation && (
                        <Marker coordinate={{ latitude: liveLocation.lat, longitude: liveLocation.lng }} anchor={{ x: 0.5, y: 0.5 }}>
                            <View style={styles.busMarkerContainer}>
                                <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
                                <View style={styles.busIcon}>
                                    <FontAwesome5 name="bus" size={16} color="#0d140a" />
                                </View>
                            </View>
                        </Marker>
                    )}
                </MapView>

                {/* Top Nav */}
                <SafeAreaView style={styles.topNav}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.busNumText}>{busData.busNumber}</Text>
                        <Text style={styles.yatayatText}>{busData.yatayatName || "City Commuter"}</Text>
                    </View>
                </SafeAreaView>
            </View>

            {/* Dynamic Stop Sheet */}
            <View style={styles.stopSheet}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                    <View style={[styles.liveBadge, busStatus === 'break' && { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                        <View style={[styles.liveDot, { backgroundColor: isOffline ? '#ef4444' : (busStatus === 'break' ? '#f59e0b' : '#59f20d') }]} />
                        <Text style={[styles.liveText, busStatus === 'break' && { color: '#f59e0b' }]}>
                            {isOffline ? 'OFFLINE' : (busStatus === 'break' ? 'ON BREAK' : 'LIVE ON ROUTE')}
                        </Text>
                    </View>
                    <Text style={styles.nextStopLabel}>
                        Next: {stopsWithEta.find(s => s.status === 'Upcoming')?.name || stopsList[stopsList.length - 1]?.name || 'Destination'}
                    </Text>
                </View>

                <ScrollView style={styles.stopList} showsVerticalScrollIndicator={false}>
                    {stopsWithEta.map((stop, index) => {
                        const isArrived = stop.status === 'Arrived';
                        const isLast = index === stopsWithEta.length - 1;

                        return (
                            <View key={index} style={styles.stopRow}>
                                <View style={styles.timelineCol}>
                                    <View style={[styles.timelineDot, isArrived && styles.dotActive]} />
                                    {!isLast && <View style={[styles.timelineLine, isArrived && styles.lineActive]} />}
                                </View>
                                <View style={styles.stopDetails}>
                                    <Text style={[styles.stopName, isArrived && styles.textActive]}>{stop.name}</Text>
                                    <Text style={styles.stopSub}>{isArrived ? 'Arrived' : 'Approaching'}</Text>
                                </View>
                                <View style={styles.etaCol}>
                                    <Text style={[styles.etaText, isArrived && styles.textActive]}>{stop.eta}</Text>
                                </View>
                            </View>
                        );
                    })}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    mapContainer: { height: height * 0.55, position: 'relative' },
    map: { ...StyleSheet.absoluteFillObject },
    
    topNav: { position: 'absolute', top: 0, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
    backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(13, 20, 10, 0.8)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerInfo: { flex: 1, backgroundColor: 'rgba(13, 20, 10, 0.8)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    busNumText: { color: '#59f20d', fontSize: 16, fontWeight: 'bold' },
    yatayatText: { color: '#9ca3af', fontSize: 11, marginTop: 2 },

    stopMarker: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#1c2619', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#59f20d' },
    stopInner: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#0d140a' },

    busMarkerContainer: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
    pulseRing: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(89, 242, 13, 0.3)' },
    busIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#59f20d', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },

    stopSheet: { flex: 1, backgroundColor: '#11180d', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, marginTop: -30, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 20 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#2e3928', alignSelf: 'center', marginBottom: 20 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(89, 242, 13, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveText: { color: '#59f20d', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    nextStopLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },

    stopList: { flex: 1 },
    stopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
    timelineCol: { width: 20, alignItems: 'center', marginRight: 20 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2e3928', marginTop: 5 },
    dotActive: { backgroundColor: '#59f20d', shadowColor: '#59f20d', shadowRadius: 5, shadowOpacity: 0.5 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#2e3928', height: 40 },
    lineActive: { backgroundColor: '#59f20d' },

    stopDetails: { flex: 1, paddingBottom: 25 },
    stopName: { color: '#9ca3af', fontSize: 15, fontWeight: 'bold' },
    textActive: { color: '#fff' },
    stopSub: { color: '#4b5563', fontSize: 11, marginTop: 4 },

    etaCol: { width: 50, alignItems: 'flex-end' },
    etaText: { color: '#4b5563', fontSize: 13, fontWeight: 'bold' },
});
