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

const { width } = Dimensions.get('window');

/**
 * CITYIN SCREEN - Urban Commute Hub
 * Redesigned to match 'City to City' visually (Horizontal single-column format).
 */
export default function CityinScreen() {
    const router = useRouter();
    const { fetchBuses, cityBuses, loading, error } = useBusStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSort, setActiveSort] = useState("All");

    useEffect(() => {
        fetchBuses();
    }, []);

    const hubs = ["All", "Ratnapark", "Kalanki", "Koteshwor", "Lagankhel"];

    const filteredBuses = cityBuses.filter((b: any) => {
        if (!b) return false;
        const q = searchQuery.toLowerCase();
        let rFrom = "";
        let rTo = "";

        // Safe Route Parsing
        try {
            if (b.route && typeof b.route === 'object') {
                rFrom = typeof b.route.from === 'object' ? (b.route.from?.name || "") : (b.route.from || "");
                rTo = typeof b.route.to === 'object' ? (b.route.to?.name || "") : (b.route.to || "");
            } else if (typeof b.route === 'string') {
                const parts = b.route.split('-');
                rFrom = parts[0]?.trim() || "";
                rTo = parts[1]?.trim() || "";
            }
        } catch (e) {
            console.error("Route Parse Error", e);
        }

        const matchesSearch = (b.busNumber || "").toLowerCase().includes(q) || 
                              rFrom.toLowerCase().includes(q) || 
                              rTo.toLowerCase().includes(q);
        
        const activeSortLower = activeSort.toLowerCase();
        const matchesHub = activeSort === "All" || 
                           rFrom.toLowerCase().includes(activeSortLower) || 
                           rTo.toLowerCase().includes(activeSortLower);
        
        return matchesSearch && matchesHub;
    });

    const navigateToRoute = (bus: any) => {
        router.push({
            pathname: '/(screens)/city-tracking' as any,
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
                    <Text style={styles.headerTitle}>Cityin</Text>
                    <Text style={styles.headerSub}>Explore local hub routes</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search city routes..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.hubWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hubScroll}>
                    {hubs.map((h) => (
                        <TouchableOpacity
                            key={h}
                            style={[styles.hubPill, activeSort === h && styles.hubPillActive]}
                            onPress={() => setActiveSort(h)}
                        >
                            <Text style={[styles.hubText, activeSort === h && styles.hubTextActive]}>{h}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#59f20d" style={{ marginTop: 40 }} />
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : filteredBuses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="bus-outline" size={64} color="#1c2619" />
                        <Text style={styles.emptyTitle}>No Buses Found</Text>
                        <Text style={styles.emptySub}>No local transit active for this filter.</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {filteredBuses.map((bus: any) => {
                             let fromLabel = "Point";
                             let toLabel = "Hub";
                             let stopsLabel = "Local Stops";

                             if (bus.route && typeof bus.route === 'object') {
                                 fromLabel = typeof bus.route.from === 'object' ? (bus.route.from?.name || "Point") : (bus.route.from || "Point");
                                 toLabel = typeof bus.route.to === 'object' ? (bus.route.to?.name || "Hub") : (bus.route.to || "Hub");
                                 stopsLabel = bus.route.stops?.map((s: any) => typeof s === 'object' ? s.name : s).join(' • ') || 'Local Stops';
                             } else if (typeof bus.route === 'string') {
                                 const parts = bus.route.split('-');
                                 fromLabel = parts[0]?.trim() || "Point";
                                 toLabel = parts[1]?.trim() || "Hub";
                             }

                             return (
                                <TouchableOpacity 
                                    key={bus._id || bus.id} 
                                    style={styles.bentoCardWide}
                                    onPress={() => navigateToRoute(bus)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.cardHighlight}>
                                        <View style={styles.busBadge}>
                                            <Text style={styles.busText}>{bus.busNumber || "Local"}</Text>
                                        </View>
                                        <Text style={styles.yatayatName} numberOfLines={1}>
                                            {bus.yatayatName || "City Local Service"}
                                        </Text>
                                    </View>
                                    
                                    <View style={styles.routeHeader}>
                                        <View style={styles.endpoint}>
                                            <Text style={styles.cityName} numberOfLines={1}>{fromLabel}</Text>
                                            <Text style={styles.cityLabel}>Origin</Text>
                                        </View>
 
                                        <View style={styles.stopsTimeline}>
                                            <View style={styles.timelineLine} />
                                            <View style={styles.stopsScrollContainer}>
                                                <Text style={styles.stopsText} numberOfLines={1}>
                                                    {stopsLabel}
                                                </Text>
                                            </View>
                                        </View>
 
                                        <View style={[styles.endpoint, { alignItems: 'flex-end' }]}>
                                            <Text style={styles.cityName} numberOfLines={1}>{toLabel}</Text>
                                            <Text style={styles.cityLabel}>Destination</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardStatus}>
                                        <View style={styles.statusRow}>
                                            <Ionicons name="time" size={14} color="#9ca3af" />
                                            <Text style={styles.statusText}>Every 15 mins</Text>
                                        </View>
                                        <View style={styles.liveTag}>
                                            <Text style={styles.liveText}>LIVE</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                             );
                        })}
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
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1c2619', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
    headerSub: { color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 2 },
    headerSpacer: { width: 44 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c2619', borderRadius: 16, marginHorizontal: 20, marginVertical: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    searchInput: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
    
    hubWrapper: { marginBottom: 15 },
    hubScroll: { paddingHorizontal: 20 },
    hubPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#1c2619', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    hubPillActive: { backgroundColor: '#59f20d', borderColor: '#59f20d' },
    hubText: { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
    hubTextActive: { color: '#0d140a' },

    content: { flex: 1, paddingHorizontal: 20 },
    grid: { marginTop: 10 },
    bentoCardWide: { backgroundColor: '#1c2619', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    
    cardHighlight: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    busBadge: { backgroundColor: 'rgba(89,242,13,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
    busText: { color: '#59f20d', fontSize: 11, fontWeight: 'bold' },
    yatayatName: { color: '#f9fafb', fontSize: 14, fontWeight: '600', flex: 1 },
    
    routeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, justifyContent: 'space-between' },
    endpoint: { flex: 1 },
    cityName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    cityLabel: { color: '#4b5563', fontSize: 10, marginTop: 2, fontWeight: 'bold', textTransform: 'uppercase' },
    
    stopsTimeline: { flex: 2, alignItems: 'center', paddingHorizontal: 10, position: 'relative', height: 40, justifyContent: 'center' },
    timelineLine: { position: 'absolute', height: 1.5, width: '100%', backgroundColor: 'rgba(89, 242, 13, 0.2)', top: '50%' },
    stopsScrollContainer: { backgroundColor: '#1c2619', paddingHorizontal: 8 },
    stopsText: { color: '#59f20d', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

    cardStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusText: { color: '#9ca3af', fontSize: 12, marginLeft: 6 },
    liveTag: { backgroundColor: '#59f20d', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    liveText: { color: '#0d140a', fontWeight: 'bold', fontSize: 10 },

    errorText: { color: '#ef4444', textAlign: 'center', marginTop: 20 },
    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
    emptySub: { color: '#4b5563', fontSize: 14, marginTop: 10 },
});
