import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert, 
    Dimensions,
    Image,
    ScrollView,
    Vibration,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import api from '@/services/api';
import { socket } from '@/services/socket';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function DriverDashboard() {
    const router = useRouter();
    const { role, user } = useAuthStore();
    const [shiftStatus, setShiftStatus] = useState<'offline' | 'on-route' | 'break'>('offline');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [assignedBus, setAssignedBus] = useState<any>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const locationSubscription = useRef<any>(null);

    useEffect(() => {
        setupSocket();
        fetchCurrentTask();
        return () => {
            stopLiveTracking();
        };
    }, []);

    const setupSocket = async () => {
        if (!socket.connected) {
            const authData = await AsyncStorage.getItem('auth');
            if (authData) {
                const { token } = JSON.parse(authData);
                socket.auth = { token };
                socket.connect();
            }
        }
    };

    const startLiveTracking = async (): Promise<boolean> => {
        if (!assignedBus) {
            Alert.alert("Missing Assignment", "Could not identify your assigned vehicle. Please contact dispatch.");
            return false;
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Refused", "Precise location is required to broadcast your bus position to passengers.");
            return false;
        }

        // Clean existing
        stopLiveTracking();

        // 1. Immediate lock-on ping (Non-blocking & Timeout safe)
        try {
            // We give it 3 seconds to get a lock, otherwise we just let the watchPosition handle it
            const currentLoc = await Promise.race([
                Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
            ]) as any;

            if (currentLoc && currentLoc.coords) {
                socket.emit('driver-location-update', {
                    busId: assignedBus._id,
                    location: { lat: currentLoc.coords.latitude, lng: currentLoc.coords.longitude }
                });
            }
        } catch (err) {
            console.log("Initial ping timed out or failed, proceeding to watcher...");
        }

        // 2. Start continuous high-frequency telemetry (1s / 3m)
        locationSubscription.current = await Location.watchPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 3,
        }, (loc) => {
            socket.emit('driver-location-update', {
                busId: assignedBus._id,
                location: { lat: loc.coords.latitude, lng: loc.coords.longitude }
            });
        });

        return true;
    };

    const stopLiveTracking = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
    };

    const fetchCurrentTask = async () => {
        try {
            const res = await api.get('/city-buses/assigned');
            if (res.data.data.length > 0) {
                setAssignedBus(res.data.data[0]); // Take first assigned bus
            }
        } catch (e) {
            console.error("Task fetch failed", e);
        }
    };

    const handleShiftAction = async (status: 'on-route' | 'break' | 'offline') => {
        if (!assignedBus) {
            Alert.alert("No Vehicle", "You have not been assigned any vehicle yet.");
            return;
        }

        if (status === 'on-route') {
            const hasPermission = await startLiveTracking();
            if (!hasPermission) return; // Don't proceed if permission denied
        } else {
            stopLiveTracking();
        }

        socket.emit('driver-status-update', { 
            busId: assignedBus._id, 
            status: status 
        });

        setShiftStatus(status);
        Vibration.vibrate(50);
    };

    const handleBarcodeScanned = async ({ data }: { data: string }) => {
        setScanned(true);
        Vibration.vibrate(50);

        try {
            const res = await api.post('/city-buses/verify-ticket', { ticketData: data });
            
            if (res.data.status === 'VALID') {
                Vibration.vibrate([0, 100, 50, 100]);
                Alert.alert(
                    "Verification Successful",
                    `Passenger: ${res.data.details.passenger}\nType: ${res.data.message}\nStatus: ${res.data.status}`,
                    [{ text: "CONFIRM ENTRY", onPress: () => setScanned(false) }]
                );
            } else {
                Vibration.vibrate(500);
                Alert.alert(
                    "Invalid Ticket",
                    `${res.data.message}\nPassenger: ${res.data.details.passenger}`,
                    [{ text: "DENY ENTRY", style: 'destructive', onPress: () => setScanned(false) }]
                );
            }
        } catch (error: any) {
            console.error("Verification error", error);
            Alert.alert("Error", error.response?.data?.message || "Failed to verify ticket. Please try again.");
            setScanned(false);
        }
    };

    if (role === 'user') {
        return (
            <SafeAreaView style={styles.container}>
               <View style={styles.unauthorizedBox}>
                   <Ionicons name="lock-closed" size={64} color="#1c2619" />
                   <Text style={styles.unauthorizedTitle}>Access Restricted</Text>
                   <Text style={styles.unauthorizedDesc}>Captain permission is required to access the Driver Hub.</Text>
                   <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/home' as any)}>
                       <Text style={styles.backBtnText}>GOTO TRAVEL HOME</Text>
                   </TouchableOpacity>
               </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                <View>
                    <Text style={styles.subGreeting}>Namaste Captain,</Text>
                    <Text style={styles.driverName}>{user?.fullName?.split(' ')[0] || "Panel"}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/(screens)/notifications' as any)}>
                        <Ionicons name="notifications-outline" size={22} color="#fff" />
                        <View style={styles.redBadge} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/(tabs)/profile' as any)}>
                        <Ionicons name="person-outline" size={22} color="#59f20d" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* 1. Shift Module - The Controls */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Shift Management</Text>
                    <View style={styles.shiftStack}>
                        <View style={styles.shiftPrimary}>
                            <TouchableOpacity 
                                style={[styles.mainShiftBtn, shiftStatus === 'on-route' ? styles.btnActive : styles.btnInactive]} 
                                onPress={() => handleShiftAction('on-route')}
                                activeOpacity={0.9}
                            >
                                <Ionicons name={shiftStatus === 'on-route' ? 'radio-outline' : 'play'} size={32} color={shiftStatus === 'on-route' ? '#0d140a' : '#fff'} />
                                <Text style={[styles.mainBtnLabel, { color: shiftStatus === 'on-route' ? '#0d140a' : '#fff' }]}>
                                    {shiftStatus === 'on-route' ? 'ON ROUTE' : 'START SHIFT'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.shiftSecondary}>
                            <TouchableOpacity 
                                style={[styles.subShiftBtn, { backgroundColor: '#1c2619' }, shiftStatus === 'break' && { borderColor: '#f59e0b', borderWidth: 1 }]}
                                onPress={() => handleShiftAction('break')}
                            >
                                <Ionicons name="pause" size={24} color={shiftStatus === 'break' ? '#f59e0b' : '#9ca3af'} />
                                <Text style={[styles.subBtnLabel, { color: shiftStatus === 'break' ? '#f59e0b' : '#9ca3af' }]}>BREAK</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.subShiftBtn, { backgroundColor: '#ef444420' }]}
                                onPress={() => handleShiftAction('offline')}
                            >
                                <Ionicons name="stop" size={24} color="#ef4444" />
                                <Text style={[styles.subBtnLabel, { color: '#ef4444' }]}>END</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* 2. QR Scanner Module */}
                <TouchableOpacity 
                    style={styles.scannerTile} 
                    onPress={() => {
                        if (!permission?.granted) requestPermission();
                        setIsScannerOpen(!isScannerOpen);
                    }}
                    activeOpacity={0.9}
                >
                    <View style={isScannerOpen ? styles.scannerBodyOpen : styles.scannerBodyClosed}>
                        {isScannerOpen ? (
                             <CameraView
                                style={StyleSheet.absoluteFillObject}
                                facing="back"
                                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                             />
                        ) : (
                            <View style={styles.scannerPlaceholder}>
                                 <View style={styles.scannerIconCircle}>
                                     <Ionicons name="qr-code-outline" size={40} color="#59f20d" />
                                 </View>
                                 <Text style={styles.scannerTitle}>Quick Ticket Scan</Text>
                                 <Text style={styles.scannerDesc}>Verify passenger entry instantly</Text>
                            </View>
                        )}
                        {isScannerOpen && <View style={styles.scannerFrame} />}
                    </View>
                    <View style={styles.scannerBadge}>
                         <Text style={styles.scannerBadgeText}>{isScannerOpen ? "CLOSE SCANNER" : "TAP TO SCAN TICKET"}</Text>
                    </View>
                </TouchableOpacity>

                {/* Assigned Vehicle Summary */}
                {assignedBus && (
                    <View style={styles.vehicleSummary}>
                        <Ionicons name="bus" size={20} color="#59f20d" />
                        <Text style={styles.vehicleText}>Vehicle <Text style={{ color: '#fff', fontWeight: 'bold' }}>{assignedBus.busNumber}</Text> is currently assigned to you.</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
    subGreeting: { color: '#6b7280', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    driverName: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 2 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1c2619', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    redBadge: { position: 'absolute', top: 12, right: 12, width: 7, height: 7, backgroundColor: '#ef4444', borderRadius: 4, borderWidth: 1.5, borderColor: '#1c2619' },
    statusIndicator: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    statusText: { color: '#0d140a', fontSize: 10, fontWeight: 'bold' },

    scrollContent: { paddingHorizontal: 16 },

    card: { backgroundColor: '#1c2619', borderRadius: 32, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardTitle: { color: '#4b5563', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },

    shiftStack: { gap: 12 },
    shiftPrimary: { width: '100%' },
    mainShiftBtn: { height: 80, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    btnActive: { backgroundColor: '#59f20d' },
    btnInactive: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    mainBtnLabel: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },

    shiftSecondary: { flexDirection: 'row', gap: 12 },
    subShiftBtn: { flex: 1, height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    subBtnLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },

    scannerTile: { backgroundColor: '#1c2619', borderRadius: 32, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    scannerBodyClosed: { height: 200, justifyContent: 'center', alignItems: 'center' },
    scannerBodyOpen: { height: 350 },
    scannerPlaceholder: { alignItems: 'center' },
    scannerIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(89,242,13,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    scannerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    scannerDesc: { color: '#6b7280', fontSize: 13, marginTop: 4 },
    scannerFrame: { position: 'absolute', top: '20%', left: '10%', right: '10%', bottom: '20%', borderWidth: 2, borderColor: '#59f20d', borderRadius: 20, borderStyle: 'dashed' },
    scannerBadge: { backgroundColor: '#0d140a', paddingVertical: 12, alignItems: 'center' },
    scannerBadgeText: { color: '#59f20d', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },

    linkGrid: { gap: 12, marginBottom: 16 },
    gridItem: { backgroundColor: '#1c2619', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    gridIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    gridLabel: { flex: 1, color: '#fff', fontSize: 16, fontWeight: 'bold' },
    notifDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#1c2619' },

    vehicleSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(89,242,13,0.05)', padding: 16, borderRadius: 20, marginHorizontal: 8 },
    vehicleText: { flex: 1, color: '#a6ba9c', fontSize: 12, lineHeight: 18 },

    unauthorizedBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    unauthorizedTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 24 },
    unauthorizedDesc: { color: '#6b7280', fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 },
    backBtn: { marginTop: 40, backgroundColor: '#59f20d', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 30 },
    backBtnText: { color: '#0d140a', fontWeight: 'bold', fontSize: 15 }
});
