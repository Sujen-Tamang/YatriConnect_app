import React, { useState, useEffect, useMemo } from 'react';
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
import { getRouteDirections } from '@/services/directions';

const { width } = Dimensions.get('window');

/**
 * CITY TO CITY SCREEN - Specific Service Page
 * Distinct from Intercity as per user request.
 */
export default function CityToCityScreen() {
    const router = useRouter();
    const { fetchBuses, intercityBuses, loading, error } = useBusStore();
    const { fetchTickets, bookings } = useTicketStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [fromFilter, setFromFilter] = useState("");
    const [toFilter, setToFilter] = useState("");

    useEffect(() => {
        fetchBuses();
        fetchTickets();
    }, []);

    // Memoize booked buses to prevent re-renders and handle potential data issues
    const confirmedBookings = useMemo(() => {
        return (bookings || []).filter((t: any) => t.status === 'Confirmed' && t.bus);
    }, [bookings]);

    const filteredBuses = useMemo(() => {
        return (intercityBuses || []).filter((b: any) => {
            const q = searchQuery.toLowerCase();
            const fromQ = fromFilter.toLowerCase();
            const toQ = toFilter.toLowerCase();

            let rFrom = "";
            let rTo = "";

            if (b.route && typeof b.route === 'object') {
                rFrom = typeof b.route.from === 'object' ? (b.route.from.name || "") : (b.route.from || "");
                rTo = typeof b.route.to === 'object' ? (b.route.to.name || "") : (b.route.to || "");
            } else if (typeof b.route === 'string') {
                const parts = b.route.split('-');
                rFrom = parts[0]?.trim() || "";
                rTo = parts[1]?.trim() || "";
            }

            const matchesSearch = !q || (b.busNumber?.toLowerCase() || "").includes(q) ||
                (rFrom.toLowerCase().includes(q)) ||
                (rTo.toLowerCase().includes(q));

            const matchesFrom = !fromQ || rFrom.toLowerCase().includes(fromQ);
            const matchesTo = !toQ || rTo.toLowerCase().includes(toQ);

            return matchesSearch && matchesFrom && matchesTo;
        });
    }, [intercityBuses, searchQuery, fromFilter, toFilter]);

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
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>City to City</Text>
                    <Text style={styles.headerSub}>Intercity Hub Booking</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Search Hero - Matching Web Flow */}
                <View style={styles.searchHero}>
                    <View style={styles.searchRow}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="location-outline" size={18} color="#59f20d" />
                            <TextInput
                                style={styles.heroInput}
                                placeholder="From"
                                placeholderTextColor="#6b7280"
                                value={fromFilter}
                                onChangeText={setFromFilter}
                            />
                        </View>
                        <View style={styles.searchDivider}>
                            <Ionicons name="swap-horizontal" size={16} color="#374151" />
                        </View>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="map-outline" size={18} color="#59f20d" />
                            <TextInput
                                style={styles.heroInput}
                                placeholder="To"
                                placeholderTextColor="#6b7280"
                                value={toFilter}
                                onChangeText={setToFilter}
                            />
                        </View>
                    </View>
                    <View style={[styles.searchInputWrapper, { marginTop: 12 }]}>
                        <Ionicons name="search-outline" size={18} color="#9ca3af" />
                        <TextInput
                            style={styles.heroInput}
                            placeholder="Search bus number or company..."
                            placeholderTextColor="#6b7280"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Booked Routes Section */}
                {confirmedBookings.length > 0 && (
                    <View style={styles.bookedSection}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Active Bookings</Text>
                            <View style={styles.activeDot} />
                        </View>
                        {confirmedBookings.map((booking: any) => (
                            <TouchableOpacity
                                key={booking._id}
                                style={styles.bookedCard}
                                onPress={() => router.push({
                                    pathname: '/(screens)/live-tracking' as any,
                                    params: { busData: JSON.stringify(booking.bus) }
                                })}
                            >
                                <View style={styles.bookedInfo}>
                                    <View>
                                        <Text style={styles.bookedBusNum}>{booking.bus.busNumber}</Text>
                                        <Text style={styles.bookedYatayat}>{booking.bus.yatayatName || "Intercity Express"}</Text>
                                        <Text style={styles.bookedSeats}>{booking.seats?.length} Seats • {booking.seats?.join(', ')}</Text>
                                    </View>
                                    <View style={styles.trackBadge}>
                                        <Ionicons name="map" size={16} color="#0d140a" />
                                        <Text style={styles.trackBadgeText}>TRACK</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <Text style={styles.sectionTitle}>Available Buses</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#59f20d" style={{ marginTop: 40 }} />
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={fetchBuses}>
                            <Text style={styles.retryText}>Retry Fetch</Text>
                        </TouchableOpacity>
                    </View>
                ) : filteredBuses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bus-outline" size={60} color="#1c2619" />
                        <Text style={styles.emptyText}>No buses found for this route.</Text>
                        <TouchableOpacity onPress={() => { setFromFilter(""); setToFilter(""); setSearchQuery(""); }}>
                            <Text style={styles.clearText}>Clear Filters</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {filteredBuses.map((bus: any) => {
                            const rFrom = typeof bus.route === 'object' ? (bus.route.from?.name || bus.route.from || "Point A") : (bus.route as string || "").split('-')[0] || "Point A";
                            const rTo = typeof bus.route === 'object' ? (bus.route.to?.name || bus.route.to || "Point B") : (bus.route as string || "").split('-')[1] || "Point B";

                            return (
                                <TouchableOpacity
                                    key={bus._id || bus.id}
                                    style={styles.bentoCard}
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
                                        <TouchableOpacity 
                                            style={styles.cardTrackBtn}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                router.push({
                                                    pathname: '/(screens)/live-tracking' as any,
                                                    params: { busData: JSON.stringify(bus) }
                                                });
                                            }}
                                        >
                                            <Ionicons name="map" size={12} color="#0d140a" />
                                            <Text style={styles.cardTrackBtnText}>TRACK</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.cityPair}>
                                        <View style={styles.cityEndpoint}>
                                            <Text style={styles.cityName} numberOfLines={1}>{rFrom}</Text>
                                            <Text style={styles.cityLabel}>Origin</Text>
                                        </View>
                                        <View style={styles.routeConnector}>
                                            <View style={styles.connectorLine} />
                                            <Ionicons name="arrow-forward" size={14} color="#59f20d" />
                                        </View>
                                        <View style={[styles.cityEndpoint, { alignItems: 'flex-end' }]}>
                                            <Text style={styles.cityName} numberOfLines={1}>{rTo}</Text>
                                            <Text style={styles.cityLabel}>Destination</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardStatus}>
                                        <RouteMetrics bus={bus} />
                                        <View style={styles.priceContainer}>
                                            <Text style={styles.priceLabel}>NPR</Text>
                                            <Text style={styles.priceValue}>{bus.price ?? "850"}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                <View style={{ height: 120 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const RouteMetrics = ({ bus }: { bus: any }) => {
    const [metrics, setMetrics] = useState<{ duration: string, distance: string } | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!bus.route || typeof bus.route === 'string') return;
            try {
                const directions = await getRouteDirections(
                    { lat: bus.route.from.lat, lng: bus.route.from.lng },
                    { lat: bus.route.to.lat, lng: bus.route.to.lng },
                    bus.route.stops?.map((s: any) => ({ lat: s.lat, lng: s.lng })) || []
                );
                
                setMetrics({
                    duration: directions.duration ? `${Math.round(directions.duration / 3600)}h ${Math.round((directions.duration % 3600) / 60)}m` : '--',
                    distance: directions.distance ? `${(directions.distance / 1000).toFixed(1)} km` : '--'
                });
            } catch (err) {
                console.log("Metrics fetch failed", err);
            }
        };
        fetchMetrics();
    }, [bus.route]);

    return (
        <View style={styles.metricsRow}>
            <View style={styles.statusRow}>
                <Ionicons name="time-outline" size={14} color="#9ca3af" />
                <Text style={styles.statusText}>{metrics?.duration || bus.schedule?.departure || "09:00 AM"}</Text>
            </View>
            <View style={[styles.statusRow, { marginLeft: 15 }]}>
                <Ionicons name="map-outline" size={14} color="#9ca3af" />
                <Text style={styles.statusText}>{metrics?.distance || "--"}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1c2619', justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    headerSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
    headerSpacer: { width: 44 },

    content: { flex: 1, paddingHorizontal: 20 },

    searchHero: { backgroundColor: '#1c2619', borderRadius: 24, padding: 16, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d140a', borderRadius: 12, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    searchDivider: { width: 30, alignItems: 'center' },
    heroInput: { flex: 1, color: '#fff', fontSize: 14, marginLeft: 8 },

    bookedSection: { marginBottom: 30 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 8 },
    sectionTitle: { color: '#6b7280', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#59f20d' },

    bookedCard: { backgroundColor: '#1c2619', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(89, 242, 13, 0.3)', marginBottom: 12 },
    bookedInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bookedBusNum: { color: '#59f20d', fontSize: 20, fontWeight: 'bold' },
    bookedYatayat: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 2 },
    bookedSeats: { color: '#9ca3af', fontSize: 11, marginTop: 4 },
    trackBadge: { backgroundColor: '#59f20d', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    trackBadgeText: { color: '#0d140a', fontSize: 12, fontWeight: 'bold' },

    grid: { marginTop: 15 },
    bentoCard: { backgroundColor: '#1c2619', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHighlight: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    busBadge: { backgroundColor: 'rgba(89,242,13,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
    busText: { color: '#59f20d', fontSize: 11, fontWeight: 'bold' },
    yatayatName: { color: '#f9fafb', fontSize: 15, fontWeight: '600', flex: 1 },
    cardTrackBtn: { backgroundColor: '#59f20d', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardTrackBtnText: { color: '#0d140a', fontSize: 10, fontWeight: 'bold' },

    cityPair: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, justifyContent: 'space-between' },
    cityEndpoint: { flex: 1 },
    cityName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    cityLabel: { color: '#4b5563', fontSize: 10, marginTop: 4, fontWeight: 'bold', textTransform: 'uppercase' },
    routeConnector: { flex: 0.5, alignItems: 'center', justifyContent: 'center' },
    connectorLine: { position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', top: '50%' },

    cardStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    metricsRow: { flexDirection: 'row', alignItems: 'center' },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusText: { color: '#9ca3af', fontSize: 13, marginLeft: 8 },
    priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    priceLabel: { color: '#6b7280', fontSize: 10, fontWeight: 'bold' },
    priceValue: { color: '#59f20d', fontSize: 18, fontWeight: 'bold' },

    errorContainer: { alignItems: 'center', marginTop: 40, padding: 20 },
    errorText: { color: '#ef4444', textAlign: 'center', marginTop: 12, fontSize: 14 },
    retryBtn: { marginTop: 20, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    retryText: { color: '#ef4444', fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#6b7280', fontSize: 15, marginTop: 15 },
    clearText: { color: '#59f20d', fontSize: 14, fontWeight: 'bold', marginTop: 10 },
});
