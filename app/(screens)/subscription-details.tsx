import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';

const { width } = Dimensions.get('window');

/**
 * SUBSCRIPTION DETAILS SCREEN - Aero Dark Theme
 * Nested detail view for Cityin service.
 */
export default function SubscriptionDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const { user } = useAuthStore();

    // Fallback data if params missing
    const sub = params.subData ? JSON.parse(params.subData as string) : null;
    
    const daysLeft = sub ? Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const isExpired = daysLeft <= 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Section - Dark Circular Display */}
            <View style={styles.topSection}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Pass Details</Text>
                        <Text style={styles.headerSub}>Subscription Overview</Text>
                    </View>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.progressWrapper}>
                    <View style={[styles.circularProgress, isExpired && { borderColor: '#ef4444' }]}>
                        <Text style={[styles.daysCount, isExpired && { color: '#ef4444' }]}>{isExpired ? "0" : daysLeft}</Text>
                        <Text style={styles.daysLabel}>Days left</Text>
                    </View>
                </View>

                <View style={styles.planInfoBox}>
                    <Text style={styles.planName}>{sub?.planType?.toUpperCase() || "CITY EXPLORER"} PASS</Text>
                    <Text style={[styles.planTag, isExpired && { color: '#ef4444' }]}>{isExpired ? "EXPIRED" : "ACTIVE SERVICE"}</Text>
                </View>
            </View>

            {/* Content Section - Aero Dark Style */}
            <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Digital Transit ID</Text>
                </View>

                <View style={styles.idCard}>
                    <View style={styles.idHeader}>
                        <MaterialIcons name="verified-user" size={16} color="#59f20d" />
                        <Text style={styles.idHeaderText}>VERIFIED PASSENGER ID</Text>
                    </View>
                    <View style={styles.idBody}>
                        <Image 
                            source={{ uri: user?.profileImage || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop' }} 
                            style={styles.transitPhoto} 
                        />
                        <View style={styles.idInfo}>
                            <Text style={styles.idName}>{user?.fullName || "Yatri User"}</Text>
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={12} color="#59f20d" />
                                <Text style={styles.verifiedText}>Yatri Hub Certified</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Plan Information</Text>
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}>
                            <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                        </View>
                        <View style={styles.infoLabelContent}>
                            <Text style={styles.infoValue}>{sub?.startDate ? new Date(sub.startDate).toLocaleDateString() : "March 20, 2026"}</Text>
                            <Text style={styles.infoLabel}>Activation Date</Text>
                        </View>
                    </View>

                    <View style={[styles.infoRow, styles.infoBorderTop]}>
                        <View style={styles.infoIconBox}>
                             <Ionicons name="time-outline" size={18} color="#9ca3af" />
                        </View>
                        <View style={styles.infoLabelContent}>
                            <Text style={styles.infoValue}>{sub?.endDate ? new Date(sub.endDate).toLocaleDateString() : "April 20, 2026"}</Text>
                            <Text style={styles.infoLabel}>Renewal Due Date</Text>
                        </View>
                    </View>

                    <View style={[styles.infoRow, styles.infoBorderTop]}>
                        <View style={styles.infoIconBox}>
                             <Ionicons name="shield-checkmark-outline" size={18} color="#59f20d" />
                        </View>
                        <View style={styles.infoLabelContent}>
                            <Text style={styles.infoValue}>Unlimited Cityin</Text>
                            <Text style={styles.infoLabel}>Membership Tier</Text>
                        </View>
                    </View>
                </View>

                {isExpired ? (
                        <TouchableOpacity 
                            style={styles.renewBtn}
                            onPress={() => router.push('/(screens)/city-passes' as any)}
                        >
                            <Text style={styles.renewBtnText}>RENEW NOW</Text>
                            <Ionicons name="refresh" size={20} color="#0d140a" />
                        </TouchableOpacity>
                ) : (
                    <View style={styles.noticeBox}>
                        <Text style={styles.noticeText}>For uninterrupted local service, ensure renewal is processed before the due date.</Text>
                    </View>
                )}
                
                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    topSection: { backgroundColor: '#1c2619', paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    headerSub: { color: '#6b7280', fontSize: 11, textAlign: 'center', marginTop: 1 },
    headerSpacer: { width: 44 },

    progressWrapper: { alignItems: 'center', marginTop: 30 },
    circularProgress: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 12,
        borderColor: '#59f20d',
        borderTopColor: 'rgba(255,255,255,0.05)', 
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '-45deg' }],
        shadowColor: '#59f20d',
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    daysCount: { color: '#fff', fontSize: 48, fontWeight: '900', transform: [{ rotate: '45deg' }] },
    daysLabel: { color: '#9ca3af', fontSize: 16, fontWeight: '800', transform: [{ rotate: '45deg' }], marginTop: 5 },

    planInfoBox: { alignItems: 'center', marginTop: 35 },
    planName: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 0.5 },
    planTag: { color: '#59f20d', fontSize: 13, marginTop: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

    detailsContent: { flex: 1, paddingHorizontal: 20 },
    sectionHeader: { marginTop: 35, marginBottom: 15 },
    sectionTitle: { color: '#4b5563', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5 },
    
    idCard: { backgroundColor: '#1c2619', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    idHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, opacity: 0.9 },
    idHeaderText: { color: '#9ca3af', fontSize: 10, fontWeight: 'bold', marginLeft: 10, letterSpacing: 0.5 },
    idBody: { flexDirection: 'row', alignItems: 'center' },
    transitPhoto: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#0d140a' },
    idInfo: { marginLeft: 20 },
    idName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    verifiedText: { color: '#59f20d', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },

    infoGrid: { backgroundColor: '#1c2619', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    infoRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    infoBorderTop: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)' },
    infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginRight: 18 },
    infoLabelContent: { flex: 1 },
    infoValue: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
    infoLabel: { fontSize: 11, color: '#6b7280', marginTop: 3, fontWeight: '600' },

    renewBtn: { backgroundColor: '#59f20d', paddingVertical: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, shadowColor: '#59f20d', shadowOpacity: 0.3, shadowRadius: 10 },
    renewBtnText: { color: '#0d140a', fontSize: 16, fontWeight: '900', marginRight: 12 },
    
    noticeBox: { marginTop: 30, padding: 20, backgroundColor: 'rgba(89,242,13,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(89,242,13,0.1)' },
    noticeText: { color: '#9ca3af', fontSize: 13, lineHeight: 20, textAlign: 'center', fontWeight: '500' },
});
