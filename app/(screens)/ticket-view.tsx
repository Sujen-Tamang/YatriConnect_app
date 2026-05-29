import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { getBookingByIdApi } from '@/features/booking/booking.service';

const { width } = Dimensions.get('window');

export default function TicketViewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const initialBooking = useMemo(() => {
        if (params.booking) {
            try {
                return JSON.parse(params.booking as string);
            } catch (e) {
                console.error("Failed to parse booking param", e);
            }
        }
        return null;
    }, [params.booking]);

    const [booking, setBooking] = useState<any>(initialBooking);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialBooking) {
            setBooking(initialBooking);
        } else if (params.bookingId) {
            fetchBooking(params.bookingId as string);
        }
    }, [initialBooking, params.bookingId]);

    const fetchBooking = async (id: string) => {
        try {
            setLoading(true);
            const response = await getBookingByIdApi(id);
            if (response.success && response.data) {
                setBooking(response.data);
            } else {
                Alert.alert("Error", "Failed to retrieve booking details.");
            }
        } catch (error) {
            console.error("Failed to fetch booking:", error);
            Alert.alert("Error", "An error occurred while loading booking details.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#59f20d" />
                <Text style={{ color: '#9ca3af', marginTop: 15, fontSize: 16 }}>Loading boarding pass...</Text>
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No booking details found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>Go Back</Text></TouchableOpacity>
            </View>
        );
    }

    const qrData = JSON.stringify({
        type: 'booking',
        id: booking._id,
        bookingId: booking.bookingId,
        bus: booking.bus?.busNumber,
        seats: booking.seats
    });

    // Parse route if available
    let routeFrom = "Origin";
    let routeTo = "Destination";
    if (booking.bus?.route) {
        if (typeof booking.bus.route === 'object') {
            routeFrom = typeof booking.bus.route.from === 'object' ? booking.bus.route.from.name : booking.bus.route.from;
            routeTo = typeof booking.bus.route.to === 'object' ? booking.bus.route.to.name : booking.bus.route.to;
        } else if (typeof booking.bus.route === 'string') {
            const parts = booking.bus.route.split('-');
            routeFrom = parts[0]?.trim() || "Start";
            routeTo = parts[1]?.trim() || "End";
        }
    }

    return (
        <View style={styles.container}>
             {/* Header */}
             <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    if (params.fromBooking === 'true') {
                        router.replace('/(tabs)/home' as any);
                    } else {
                        router.back();
                    }
                }} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Boarding Pass</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="share-social" size={20} color="#f9fafb" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Main Ticket */}
                <View style={styles.ticketMain}>
                    {/* Top Section - Bus & Status */}
                    <View style={styles.ticketTop}>
                        <View>
                            <Text style={styles.yatayatName}>{booking.bus?.yatayatName || 'YATRI EXPRESS'}</Text>
                            <Text style={styles.bookingId}>ID: {booking.bookingId}</Text>
                        </View>
                        <View style={styles.statusBox}>
                            <Text style={styles.statusText}>{booking.status?.toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={styles.dividerDots} />

                    {/* Route Flow */}
                    <View style={styles.routeBox}>
                        <View style={styles.routeItem}>
                            <Text style={styles.routeCode}>{routeFrom.slice(0, 3).toUpperCase()}</Text>
                            <Text style={styles.routeFull}>{routeFrom}</Text>
                        </View>
                        <View style={styles.busArt}>
                            <View style={styles.dashLine} />
                            <Ionicons name="bus" size={24} color="#3b82f6" />
                            <View style={styles.dashLine} />
                        </View>
                        <View style={[styles.routeItem, {alignItems: 'flex-end'}]}>
                            <Text style={styles.routeCode}>{routeTo.slice(0, 3).toUpperCase()}</Text>
                            <Text style={styles.routeFull}>{routeTo}</Text>
                        </View>
                    </View>

                    {/* Travel Info Grid */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoBlock}>
                            <Text style={styles.gridLabel}>Travel Date</Text>
                            <Text style={styles.gridVal}>{new Date(booking.travelDate).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.infoBlock}>
                            <Text style={styles.gridLabel}>Departure</Text>
                            <Text style={styles.gridVal}>{booking.bus?.schedule?.departure || '6:30 AM'}</Text>
                        </View>
                        <View style={styles.infoBlock}>
                            <Text style={styles.gridLabel}>Bus Number</Text>
                            <Text style={styles.gridVal}>{booking.bus?.busNumber}</Text>
                        </View>
                        <View style={styles.infoBlock}>
                            <Text style={styles.gridLabel}>Seat(s)</Text>
                            <Text style={styles.gridVal}>{booking.seats.join(', ')}</Text>
                        </View>
                    </View>

                    {/* QR Section */}
                    <View style={[styles.qrSection, (booking.status === 'Pending' || booking.status === 'Cancelled') && styles.qrSectionLocked]}>
                        {booking.status === 'Confirmed' ? (
                            <>
                                <QRCode
                                    value={qrData}
                                    size={160}
                                    color="#59f20d"
                                    backgroundColor="#1c2619"
                                />
                                <Text style={styles.scanInst}>Scan this QR at the boarding gate</Text>
                                <TouchableOpacity 
                                    style={styles.trackBtn}
                                    onPress={() => router.push({
                                        pathname: '/(screens)/live-tracking' as any,
                                        params: { busData: JSON.stringify(booking.bus) }
                                    })}
                                >
                                    <Ionicons name="map-outline" size={20} color="#0d140a" />
                                    <Text style={styles.trackBtnText}>TRACK BUS</Text>
                                </TouchableOpacity>
                            </>
                        ) : booking.status === 'Pending' ? (
                            <View style={styles.lockedContainer}>
                                <Ionicons name="card-outline" size={60} color="#f59e0b" />
                                <Text style={styles.lockedTitle}>Payment Required</Text>
                                <Text style={styles.lockedSub}>Complete your payment to generate your digital boarding pass.</Text>
                            </View>
                        ) : (
                            <View style={styles.lockedContainer}>
                                <Ionicons name="close-circle-outline" size={60} color="#ef4444" />
                                <Text style={[styles.lockedTitle, { color: '#ef4444' }]}>Booking Cancelled</Text>
                                <Text style={styles.lockedSub}>This ticket is no longer valid for travel.</Text>
                            </View>
                        )}
                    </View>

                    {/* Ticket Tear Circles */}
                    <View style={[styles.tearCircle, {left: -15, top: 90}]} />
                    <View style={[styles.tearCircle, {right: -15, top: 90}]} />
                </View>

                {/* Footer Notes */}
                <View style={styles.footer}>
                    <Text style={styles.footerTitle}>Important Notes</Text>
                    <Text style={styles.footerNote}>• Please arrive 30 minutes before departure scheduled time.</Text>
                    <Text style={styles.footerNote}>• Carry a valid ID for verification at the boarding gate.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
    iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c2619', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    headerTitle: { color: '#f9fafb', fontSize: 18, fontWeight: 'bold' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    
    // Ticket Body
    ticketMain: { backgroundColor: '#1c2619', borderRadius: 32, padding: 24, marginTop: 10, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    yatayatName: { color: '#59f20d', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    bookingId: { color: '#6b7280', fontSize: 11, marginTop: 2 },
    statusBox: { backgroundColor: 'rgba(89, 242, 13, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: '#59f20d', fontSize: 10, fontWeight: 'bold' },
    dividerDots: { height: 1, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed', marginVertical: 0, marginBottom: 25 },
    
    routeBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 },
    routeItem: { flex: 1 },
    routeCode: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    routeFull: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
    busArt: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    dashLine: { flex: 1, height: 1, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed', marginHorizontal: 8 },
    
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 40 },
    infoBlock: { width: '50%', marginBottom: 24 },
    gridLabel: { color: '#6b7280', fontSize: 11, marginBottom: 4, letterSpacing: 0.5 },
    gridVal: { color: '#f9fafb', fontSize: 14, fontWeight: 'bold' },

    qrSection: { alignItems: 'center', padding: 24, backgroundColor: 'rgba(89, 242, 13, 0.1)', borderRadius: 24 },
    qrSectionLocked: { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    scanInst: { color: '#59f20d', fontSize: 12, fontWeight: 'bold', marginTop: 16, marginBottom: 16, textAlign: 'center' },
    trackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#59f20d',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        gap: 8,
    },
    trackBtnText: {
        color: '#0d140a',
        fontWeight: 'bold',
        fontSize: 14,
    },
    lockedContainer: { alignItems: 'center', paddingVertical: 10 },
    lockedTitle: { color: '#f59e0b', fontSize: 18, fontWeight: 'bold', marginTop: 12 },
    lockedSub: { color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 },

    tearCircle: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: '#0d140a', zIndex: 10 },
    
    footer: { marginTop: 30, paddingHorizontal: 10 },
    footerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
    footerNote: { color: '#9ca3af', fontSize: 13, marginBottom: 10, lineHeight: 18 },

    errorText: { color: '#ffffff', textAlign: 'center', marginTop: 100, fontSize: 16 },
    backBtn: { alignSelf: 'center', marginTop: 20, backgroundColor: '#59f20d', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
    backText: { color: '#0d140a', fontWeight: 'bold' }
});
