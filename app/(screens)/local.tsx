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

export default function LocalScreen() {
    const router = useRouter();
    const { fetchBuses, cityBuses, loading, error } = useBusStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSort, setActiveSort] = useState("All");

    useEffect(() => {
        fetchBuses();
    }, []);

    const sorts = ["All", "Ratnapark", "Kalanki", "Koteshwor"];

    const filteredBuses = cityBuses.filter((b: any) => {
        const q = searchQuery.toLowerCase();
        let rFrom = "";
        let rTo = "";

        if (typeof b.route === 'object') {
            rFrom = typeof b.route.from === 'object' ? b.route.from.name : b.route.from;
            rTo = typeof b.route.to === 'object' ? b.route.to.name : b.route.to;
        } else if (typeof b.route === 'string' && b.route) {
            const parts = b.route.split('-');
            rFrom = parts[0]?.trim() || "";
            rTo = parts[1]?.trim() || "";
        }

        const matchesSearch = b.busNumber.toLowerCase().includes(q) || rFrom.toLowerCase().includes(q) || rTo.toLowerCase().includes(q);
        const matchesSort = activeSort === "All" || rFrom.includes(activeSort) || rTo.includes(activeSort);
        
        return matchesSearch && matchesSort;
    });

    const navigateToRoute = (bus: any) => {
        router.push({
            pathname: '/(screens)/live-tracking' as any,
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
                    <Text style={styles.headerTitle}>Cityin</Text>
                    <Text style={styles.headerSub}>Local Transit</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search city routes..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Sub-page Bento Sort Section */}
            <View style={styles.sortWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
                    {sorts.map((s) => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.sortPill, activeSort === s && styles.sortPillActive]}
                            onPress={() => setActiveSort(s)}
                        >
                            <Text style={[styles.sortText, activeSort === s && styles.sortTextActive]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#59f20d" style={{ marginTop: 40 }} />
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <View style={styles.grid}>
                        {filteredBuses.map((bus: any) => (
                            <TouchableOpacity 
                                key={bus._id || bus.id} 
                                style={styles.bentoCard}
                                onPress={() => navigateToRoute(bus)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.busIdWrapper}>
                                        <Text style={styles.busIdText}>{bus.busNumber}</Text>
                                    </View>
                                    <Ionicons name="bus-outline" size={18} color="#59f20d" />
                                </View>
                                
                                <View style={styles.routeInfo}>
                                    <Text style={styles.routeName} numberOfLines={1}>
                                        {typeof bus.route === 'object' ? bus.route.from : (bus.route as string || "").split('-')[0]}
                                    </Text>
                                    <View style={styles.connector}>
                                        <View style={styles.dot} />
                                        <View style={styles.line} />
                                        <View style={[styles.dot, { backgroundColor: '#59f20d' }]} />
                                    </View>
                                    <Text style={styles.routeName} numberOfLines={1}>
                                        {typeof bus.route === 'object' ? bus.route.to : (bus.route as string || "").split('-')[1]}
                                    </Text>
                                </View>

                                <View style={styles.cardFooter}>
                                    <Text style={styles.yatayatName} numberOfLines={1}>
                                        {bus.yatayatName || "Local Service"}
                                    </Text>
                                    <View style={styles.freqBadge}>
                                        <Text style={styles.freqText}>15m</Text>
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
    
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c2619', borderRadius: 16, marginHorizontal: 20, marginVertical: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    searchInput: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
    
    sortWrapper: { marginBottom: 15 },
    sortScroll: { paddingHorizontal: 20 },
    sortPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#1c2619', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    sortPillActive: { backgroundColor: '#59f20d', borderColor: '#59f20d' },
    sortText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
    sortTextActive: { color: '#0d140a' },

    content: { flex: 1, paddingHorizontal: 20 },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 5 },
    bentoCard: { backgroundColor: '#1c2619', width: (width - 55) / 2, borderRadius: 24, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    busIdWrapper: { backgroundColor: 'rgba(89,242,13,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    busIdText: { color: '#59f20d', fontWeight: 'bold', fontSize: 12 },
    
    routeInfo: { marginBottom: 15 },
    routeName: { color: '#f9fafb', fontSize: 15, fontWeight: '600' },
    connector: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, paddingLeft: 4 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4b5563' },
    line: { width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 10 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
    yatayatName: { color: '#6b7280', fontSize: 11, flex: 1, marginRight: 5 },
    freqBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    freqText: { color: '#d1d5db', fontSize: 10, fontWeight: 'bold' },

    errorText: { color: '#ef4444', textAlign: 'center', marginTop: 20 },
});
