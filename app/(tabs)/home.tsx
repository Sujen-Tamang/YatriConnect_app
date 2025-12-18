import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBusStore } from '@/store/bus.store';
import { useTicketStore } from '@/store/ticket.store';
import { useAuthStore } from '@/store/auth.store';

const { width } = Dimensions.get('window');

/**
 * HOME SCREEN - Triple Feature Bento
 * Features: City to City, Cityin, Passes & Tickets
 * Top Nav: Greeting with User Data + Profile Avatar
 */
export default function HomeScreen() {
    const router = useRouter();
    const { fetchBuses } = useBusStore();
    const { fetchTickets } = useTicketStore();
    const { user, role } = useAuthStore();

    useEffect(() => {
        fetchBuses();
        fetchTickets();
    }, []);

    const navigateToIntercity = () => {
        router.push('/(screens)/citytocity' as any);
    };

    const navigateToCityin = () => {
        router.push('/(screens)/cityin' as any);
    };

    const navigateToTickets = () => {
        router.push('/tickets' as any);
    };

    const navigateToProfile = () => {
        router.push('/profile' as any);
    };

    if (role === 'driver') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Captain,</Text>
                        <Text style={styles.userName}>{user?.fullName || "Active Driver"}</Text>
                    </View>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                    <Ionicons name="bus" size={100} color="#1c2619" />
                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 24, textAlign: 'center' }}>Operational Hub</Text>
                    <Text style={{ color: '#a6ba9c', fontSize: 16, marginTop: 12, textAlign: 'center', lineHeight: 24 }}>
                        You are logged in with driver credentials. Booking and passenger features are restricted.
                    </Text>
                    <TouchableOpacity 
                        style={{ marginTop: 40, backgroundColor: '#59f20d', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 30 }}
                        onPress={() => router.replace('/(tabs)/driver' as any)}
                    >
                        <Text style={{ color: '#0d140a', fontWeight: '900', fontSize: 16 }}>GOTO CONSOLE</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Navigation - Profile Hub */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Namaste,</Text>
                    <Text style={styles.userName}>{user?.fullName || user?.name || "Sujen Tamang"}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.avatarBtn} 
                    onPress={navigateToProfile}
                    activeOpacity={0.8}
                >
                    <View style={styles.avatarInner}>
                        <Ionicons name="person" size={24} color="#59f20d" />
                    </View>
                    <View style={styles.avatarStatus} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Main Triple Bento Grid */}
                <View style={styles.bentoGrid}>
                    <View style={styles.gridRow}>
                        {/* 1. City to City (Primary Card) */}
                        <TouchableOpacity 
                            style={styles.largeCard}
                            onPress={navigateToIntercity}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.cardBg, { backgroundColor: '#1c2619' }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>LONG HAUL</Text>
                                    </View>
                                    <Ionicons name="navigate-circle" size={28} color="#59f20d" />
                                </View>
                                <View style={styles.cardMain}>
                                    <Text style={styles.cardTitle}>City to City</Text>
                                    <Text style={styles.cardSubtitle}>Direct long travel</Text>
                                </View>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.cardMeta}>Book Page »</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.smallColumn}>
                            {/* 2. Cityin (Local) */}
                            <TouchableOpacity 
                                style={styles.smallCard}
                                onPress={navigateToCityin}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.cardBg, { backgroundColor: '#f3f4f6' }]}>
                                    <Ionicons name="bus" size={32} color="#0d140a" />
                                    <View>
                                        <Text style={[styles.cardTitleSmall, { color: '#0d140a' }]}>Cityin</Text>
                                        <Text style={[styles.cardSubtitleSmall, { color: '#6b7280' }]}>Urban mobility</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* 3. Passes & Tickets (Combined) */}
                            <TouchableOpacity 
                                style={[styles.smallCard, { marginTop: 15 }]}
                                onPress={navigateToTickets}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.cardBg, { backgroundColor: '#1c2619', borderWidth: 1, borderColor: 'rgba(89,242,13,0.3)' }]}>
                                    <Ionicons name="receipt" size={28} color="#59f20d" />
                                    <View>
                                        <Text style={styles.cardTitleSmall}>Tickets</Text>
                                        <Text style={styles.cardSubtitleSmall}>Passes & History</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Secondary Info / Tracking */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>TRANSIT TOOLS</Text>
                </View>
                <TouchableOpacity style={styles.toolBanner} activeOpacity={0.9}>
                    <View style={styles.toolInfo}>
                        <Text style={styles.toolTitle}>Real-time Map</Text>
                        <Text style={styles.toolDesc}>Track your ride in live view</Text>
                    </View>
                    <View style={styles.toolIconBox}>
                       <Ionicons name="map" size={24} color="#0d140a" />
                    </View>
                </TouchableOpacity>

                {/* Features Badges */}
                <View style={styles.featRow}>
                    <View style={styles.featCard}>
                        <Ionicons name="shield-checkmark" size={18} color="#59f20d" />
                        <Text style={styles.featLabel}>Safe</Text>
                    </View>
                    <View style={styles.featCard}>
                        <Ionicons name="flash" size={18} color="#59f20d" />
                        <Text style={styles.featLabel}>Fast</Text>
                    </View>
                    <View style={styles.featCard}>
                        <Ionicons name="wallet" size={18} color="#59f20d" />
                        <Text style={styles.featLabel}>Saving</Text>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, marginBottom: 20 },
    greeting: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
    userName: { color: '#f9fafb', fontSize: 26, fontWeight: 'bold' },
    
    avatarBtn: { position: 'relative' },
    avatarInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1c2619', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(89, 242, 13, 0.2)' },
    avatarStatus: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#59f20d', borderWidth: 2, borderColor: '#0d140a' },
    
    content: { flex: 1 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c2619', marginHorizontal: 20, padding: 18, borderRadius: 24, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    searchText: { color: '#9ca3af', marginLeft: 12, flex: 1, fontSize: 15, fontWeight: '500' },

    bentoGrid: { paddingHorizontal: 20 },
    gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
    largeCard: { width: (width - 55) * 0.55, height: 360, borderRadius: 36, overflow: 'hidden' },
    smallColumn: { width: (width - 55) * 0.42 },
    smallCard: { width: '100%', height: 172, borderRadius: 36, overflow: 'hidden' },
    
    cardBg: { flex: 1, padding: 22, justifyContent: 'space-between' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    badge: { backgroundColor: 'rgba(89,242,13,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    badgeText: { color: '#59f20d', fontSize: 10, fontWeight: 'bold' },
    cardMain: { marginVertical: 10 },
    cardTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    cardSubtitle: { color: '#9ca3af', fontSize: 14, marginTop: 4 },
    cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 15 },
    cardMeta: { color: '#59f20d', fontSize: 13, fontWeight: '800' },
    
    cardTitleSmall: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 12 },
    cardSubtitleSmall: { color: '#9ca3af', fontSize: 12, marginTop: 2 },

    sectionHeader: { marginHorizontal: 20, marginTop: 35, marginBottom: 15 },
    sectionTitle: { color: '#4b5563', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5 },
    toolBanner: { backgroundColor: '#59f20d', marginHorizontal: 20, borderRadius: 32, padding: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    toolInfo: { flex: 1 },
    toolTitle: { color: '#0d140a', fontSize: 20, fontWeight: 'bold' },
    toolDesc: { color: 'rgba(13,20,10,0.6)', marginTop: 4, fontSize: 13, fontWeight: '600' },
    toolIconBox: { width: 44, height: 44, backgroundColor: 'rgba(13,20,10,0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    featRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 30 },
    featCard: { width: (width - 60) / 3, backgroundColor: '#1c2619', borderRadius: 20, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    featLabel: { color: '#9ca3af', fontSize: 11, fontWeight: 'bold', marginTop: 6 },
});