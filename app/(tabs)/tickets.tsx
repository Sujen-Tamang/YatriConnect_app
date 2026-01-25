import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTicketStore } from '@/store/ticket.store';
import { useRouter } from 'expo-router';

export default function MyTicketsScreen() {
    const router = useRouter();
    const { bookings, activeSubscription, loading, error, fetchTickets } = useTicketStore();

    useEffect(() => {
        fetchTickets();
    }, []);

    const onRefresh = () => {
        fetchTickets();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.title}>My Transit</Text>
                    <Text style={styles.subtitle}>Passes and Bookings</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#59f20d" />
                }
            >
                {/* Active Subscription Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>ACTIVE CITY PASS</Text>
                    {activeSubscription ? (
                        <TouchableOpacity 
                            style={styles.passCard} 
                            activeOpacity={0.9}
                            onPress={() => router.push('/(screens)/pass-view' as any)}
                        >
                            <View style={styles.passHeader}>
                                <View style={styles.passIconBox}>
                                    <MaterialIcons name="qr-code-2" size={24} color="#59f20d" />
                                </View>
                                <View style={styles.passInfo}>
                                    <Text style={styles.passPlan}>{activeSubscription.planType?.toUpperCase()} PASS</Text>
                                    <Text style={styles.passExpiry}>Expires: {new Date(activeSubscription.endDate).toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.statusPill}>
                                    <Text style={styles.statusPillText}>ACTIVE</Text>
                                </View>
                            </View>
                            <View style={styles.passFooter}>
                                <Text style={styles.passFooterText}>Valid for all City Bus Routes</Text>
                                <Ionicons name="chevron-forward" size={16} color="#59f20d" />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No active pass. Subscribe to travel locally.</Text>
                            <TouchableOpacity 
                                style={styles.buyBtn}
                                onPress={() => router.push('/(screens)/city-passes' as any)}
                            >
                                <Text style={styles.buyBtnText}>Get Pass</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Bookings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>INTERCITY TICKETS</Text>
                    {loading && bookings.length === 0 ? (
                        <ActivityIndicator size="large" color="#59f20d" style={{ marginTop: 20 }} />
                    ) : bookings.length > 0 ? (
                        [...bookings]
                            .sort((a, b) => {
                                const order: { [key: string]: number } = { 'Confirmed': 1, 'Pending': 2, 'Cancelled': 3 };
                                return (order[a.status] || 4) - (order[b.status] || 4);
                            })
                            .map(booking => {
                            const isConfirmed = booking.status === 'Confirmed';
                            const isPending = booking.status === 'Pending';
                            const isCancelled = booking.status === 'Cancelled';
                            
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
                                <TouchableOpacity 
                                    key={booking._id} 
                                    style={[styles.ticketCard, isCancelled && { opacity: 0.6 }]} 
                                    activeOpacity={0.9}
                                    onPress={() => router.push({
                                        pathname: '/(screens)/ticket-view' as any,
                                        params: { booking: JSON.stringify(booking) }
                                    })}
                                >
                                    <View style={styles.ticketHeader}>
                                        <View style={styles.busInfo}>
                                            <View style={[styles.iconBox, isConfirmed ? styles.iconBoxActive : styles.iconBoxInactive]}>
                                                <MaterialIcons name="directions-bus" size={20} color={isConfirmed ? "#59f20d" : "#9ca3af"} />
                                            </View>
                                            <Text style={styles.busNumber}>{booking.bus?.busNumber || 'BUS'}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, isConfirmed ? styles.statusActive : isPending ? styles.statusPending : styles.statusCompleted]}>
                                            <Text style={[styles.statusText, isConfirmed ? styles.statusTextActive : isPending ? styles.statusTextPending : styles.statusTextCompleted]}>
                                                {booking.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.ticketBody}>
                                        <View style={styles.routeContainer}>
                                            <View style={styles.routePoint}>
                                                <View style={styles.dot} />
                                                <Text style={styles.routeText}>{routeFrom}</Text>
                                            </View>
                                            <View style={styles.routeLine} />
                                            <View style={styles.routePoint}>
                                                <View style={[styles.dot, styles.dotEnd]} />
                                                <Text style={styles.routeText}>{routeTo}</Text>
                                            </View>
                                        </View>

                                        {isPending && (
                                            <View style={styles.pendingNotice}>
                                                <MaterialIcons name="info-outline" size={16} color="#f59e0b" />
                                                <Text style={styles.pendingNoticeText}>Complete payment to generate QR</Text>
                                            </View>
                                        )}

                                        <View style={styles.divider} />

                                        <View style={styles.ticketFooter}>
                                            <View>
                                                <Text style={styles.label}>Departure Date</Text>
                                                <Text style={styles.value}>{formatDate(booking.travelDate)}</Text>
                                            </View>
                                            <View style={{alignItems: 'flex-end'}}>
                                                <Text style={styles.label}>Seat(s)</Text>
                                                <Text style={styles.value}>{booking.seats.join(', ')}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Ticket Tear Effect */}
                                    <View style={[styles.cutout, styles.cutoutLeft]} />
                                    <View style={[styles.cutout, styles.cutoutRight]} />
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No intercity bookings yet.</Text>
                        </View>
                    )}
                </View>

                {error && (
                    <Text style={styles.errorText}>{error}</Text>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0d140a' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: 10, 
        paddingBottom: 20 
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#1c2619',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 0, // Reset since we are using headerSpacer
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', letterSpacing: -0.5, textAlign: 'center' },
    subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 2, textAlign: 'center' },
    headerSpacer: { width: 44 },
    scrollContent: { paddingHorizontal: 20 },
    
    section: { marginBottom: 30 },
    sectionHeader: { color: '#6b7280', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15 },
    
    // Pass Card
    passCard: {
        backgroundColor: '#1c2619',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(89, 242, 13, 0.3)',
        shadowColor: '#59f20d',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    passHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    passIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(89, 242, 13, 0.1)', justifyContent: 'center', alignItems: 'center' },
    passInfo: { flex: 1, marginLeft: 16 },
    passPlan: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    passExpiry: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
    statusPill: { backgroundColor: '#59f20d', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusPillText: { color: '#0d140a', fontSize: 10, fontWeight: 'bold' },
    passFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    passFooterText: { color: '#59f20d', fontSize: 12, fontWeight: '500' },

    // Empty State
    emptyCard: { backgroundColor: '#1c2619', borderRadius: 20, padding: 30, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#374151' },
    emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 16 },
    buyBtn: { backgroundColor: 'rgba(89, 242, 13, 0.1)', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 30 },
    buyBtnText: { color: '#59f20d', fontWeight: 'bold', fontSize: 14 },

    // Ticket Card
    ticketCard: { backgroundColor: '#1c2619', borderRadius: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
    busInfo: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    iconBoxActive: { backgroundColor: 'rgba(89, 242, 13, 0.15)' },
    iconBoxInactive: { backgroundColor: 'rgba(156, 163, 175, 0.1)' },
    busNumber: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusActive: { backgroundColor: 'rgba(89, 242, 13, 0.15)' },
    statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
    statusCompleted: { backgroundColor: 'rgba(156, 163, 175, 0.1)' },
    statusText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    statusTextActive: { color: '#59f20d' },
    statusTextPending: { color: '#f59e0b' },
    statusTextCompleted: { color: '#9ca3af' },
    ticketBody: { padding: 20 },
    routeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    routePoint: { alignItems: 'center', flex: 1 },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#59f20d', borderWidth: 2, borderColor: '#0d140a', marginBottom: 8, zIndex: 2 },
    dotEnd: { backgroundColor: '#3b82f6' },
    routeLine: { flex: 1, height: 2, backgroundColor: '#374151', position: 'absolute', top: 5, left: '25%', right: '25%', zIndex: 1 },
    routeText: { color: '#f9fafb', fontSize: 14, fontWeight: '600', textAlign: 'center' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },
    ticketFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
    value: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
    cutout: { position: 'absolute', top: 60, width: 20, height: 20, borderRadius: 10, backgroundColor: '#0d140a' },
    cutoutLeft: { left: -10 },
    cutoutRight: { right: -10 },
    errorText: { color: '#ef4444', textAlign: 'center', marginTop: 10 },
    pendingNotice: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(245, 158, 11, 0.1)', 
        padding: 10, 
        borderRadius: 8, 
        marginTop: 15,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)'
    },
    pendingNoticeText: { 
        color: '#f59e0b', 
        fontSize: 12, 
        fontWeight: '600', 
        marginLeft: 8 
    },
});