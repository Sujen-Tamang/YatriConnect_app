import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBusStore } from '@/store/bus.store';
import { useTicketStore } from '@/store/ticket.store';

const { width } = Dimensions.get('window');

/**
 * INTERCITY SCREEN - Service Specific Page
 * Updated Title to 'Intercity' as per request.
 * Removed tabs as City to City has its own page.
 */
export default function IntercityScreen() {
    const router = useRouter();
    const { fetchBuses, intercityBuses, loading, error } = useBusStore();
    const { fetchTickets, bookings } = useTicketStore();
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchBuses();
        fetchTickets();
    }, []);

    const bookedBuses = (bookings || [])
        .filter((t: any) => t.status === 'Confirmed')
        .map((t: any) => t.bus);

    const filteredBuses = intercityBuses.filter((b: any) => {
        const q = searchQuery.toLowerCase();
        let rFrom = "";
        let rTo = "";

        if (typeof b.route === 'object' && b.route !== null) {
            rFrom = typeof b.route.from === 'object' ? b.route.from?.name || "" : b.route.from || "";
            rTo = typeof b.route.to === 'object' ? b.route.to?.name || "" : b.route.to || "";
        } else if (typeof b.route === 'string' && b.route) {
            const parts = b.route.split('-');
            rFrom = parts[0]?.trim() || "";
            rTo = parts[1]?.trim() || "";
        }

        return (b.busNumber?.toLowerCase() || "").includes(q) || 
               (rFrom?.toLowerCase() || "").includes(q) || 
               (rTo?.toLowerCase() || "").includes(q);
    });

    const navigateToRoute = (bus: any) => {
        router.push({
            pathname: '/booking' as any,
            params: { busData: JSON.stringify(bus) }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Intercity</Text>
                    <Text style={styles.headerSub}>Major city connections</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search intercity routes..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {bookedBuses.length > 0 && (
                    <View style={styles.bookedSection}>
                        <Text style={styles.sectionTitle}>Your Booked Routes</Text>
                        {bookedBuses.map((bus: any, idx: number) => bus && (
                            <TouchableOpacity 
                                key={`booked-${idx}`} 
                                style={styles.bookedCard}
                                onPress={() => router.push({
                                    pathname: '/(screens)/live-tracking' as any,
                                    params: { busData: JSON.stringify(bus) }
                                })}
                            >
                                <View style={styles.bookedInfo}>
                                    <View>
                                        <Text style={styles.bookedBusNum}>{bus.busNumber}</Text>
                                        <Text style={styles.bookedYatayat}>{bus.yatayatName || "Intercity Express"}</Text>
                                    </View>
                                    <View style={styles.trackBadge}>
                                        <Ionicons name="map" size={16} color="#0d140a" />
                                        <Text style={styles.trackBadgeText}>TRACK LIVE</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator size="large" color="#59f20d" style={{ marginTop: 40 }} />
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <View style={styles.grid}>
                        {filteredBuses.map((bus: any) => (
                            <TouchableOpacity 
                                key={bus._id || bus.id} 
                                style={[styles.bentoCard, styles.intercityAccent]}
                                onPress={() => navigateToRoute(bus)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardHighlight}>
                                    <View style={styles.busBadge}>
                                        <Text style={styles.busText}>{bus.busNumber}</Text>
                                    </View>
                                    <Text style={styles.yatayatName} numberOfLines={1}>
                                        {bus.yatayatName || "Intercity Express"}
                                    </Text>
                                </View>
                                
                                <View style={styles.cityPair}>
                                    <View>
                                        <Text style={styles.cityName}>
                                            {typeof bus.route === 'object' ? (bus.route.from?.name || bus.route.from || "") : (bus.route as string || "").split('-')[0]}
                                        </Text>
                                        <Text style={styles.cityLabel}>From Point</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#59f20d" style={{ marginHorizontal: 15 }} />
                                    <View>
                                        <Text style={styles.cityName}>
                                            {typeof bus.route === 'object' ? (bus.route.to?.name || bus.route.to || "") : (bus.route as string || "").split('-')[1]}
                                        </Text>
                                        <Text style={styles.cityLabel}>Destination</Text>
                                    </View>
                                </View>

                                <View style={styles.cardStatus}>
                                    <View style={styles.statusRow}>
                                        <Ionicons name="time" size={14} color="#9ca3af" />
                                        <Text style={styles.statusText}>{bus.schedule?.departure || "Departure 08:30"}</Text>
                                    </View>
                                    <View style={styles.priceTag}>
                                        <Text style={styles.priceText}>NPR {bus.price || "1200"}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1c2619', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    headerSub: { color: '#6b7280', fontSize: 13 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c2619', borderRadius: 16, marginHorizontal: 20, marginVertical: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    searchInput: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
    content: { flex: 1, paddingHorizontal: 20 },
    grid: { marginTop: 10 },
    bentoCard: { backgroundColor: '#1c2619', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    intercityAccent: { borderLeftWidth: 4, borderLeftColor: '#59f20d' },
    cardHighlight: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    busBadge: { backgroundColor: 'rgba(89,242,13,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
    busText: { color: '#59f20d', fontSize: 11, fontWeight: 'bold' },
    yatayatName: { color: '#f9fafb', fontSize: 14, fontWeight: '600', flex: 1 },
    cityPair: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    cityName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    cityLabel: { color: '#4b5563', fontSize: 10, marginTop: 2, fontWeight: 'bold' },
    cardStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusText: { color: '#9ca3af', fontSize: 12, marginLeft: 6 },
    priceTag: { backgroundColor: '#59f20d', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    priceText: { color: '#0d140a', fontWeight: 'bold', fontSize: 14 },
    errorText: { color: '#ef4444', textAlign: 'center', marginTop: 20 },
    bookedSection: { marginBottom: 30, marginTop: 10 },
    sectionTitle: { color: '#4b5563', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 15, textTransform: 'uppercase' },
    bookedCard: { backgroundColor: '#1c2619', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#59f20d' },
    bookedInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bookedBusNum: { color: '#59f20d', fontSize: 18, fontWeight: 'bold' },
    bookedYatayat: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
    trackBadge: { backgroundColor: '#59f20d', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    trackBadgeText: { color: '#0d140a', fontSize: 11, fontWeight: 'bold' },
});
