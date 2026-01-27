import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useTicketStore } from '@/store/ticket.store';

export default function PassViewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { activeSubscription } = useTicketStore();

    if (!activeSubscription) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No active pass found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const qrData = JSON.stringify({
        type: 'subscription',
        id: activeSubscription._id,
        expiry: activeSubscription.endDate,
        plan: activeSubscription.planType
    });

    return (
        <View style={styles.container}>
            {/* Header Overlay */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Digital Transit Pass</Text>
                <View style={{width: 40}} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* QR Section */}
                <View style={styles.qrCard}>
                    <Text style={styles.qrTitle}>Scan to Board</Text>
                    <Text style={styles.qrSub}>Hold QR near the scanner upon entry</Text>
                    
                    <View style={styles.qrWrapper}>
                        <QRCode
                            value={qrData}
                            size={200}
                            color="#59f20d"
                            backgroundColor="#1c2619"
                        />
                    </View>
                    
                    <View style={styles.statusBox}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>ACTIVE PASS</Text>
                    </View>
                </View>

                {/* Pass Details Card */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsHeader}>
                        <MaterialIcons name="card-membership" size={24} color="#34d399" />
                        <Text style={styles.detailsHeaderText}>{activeSubscription.planType?.toUpperCase()} METRO PASS</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.infoRow}>
                        <View>
                            <Text style={styles.label}>Valid From</Text>
                            <Text style={styles.value}>{new Date(activeSubscription.startDate).toLocaleDateString()}</Text>
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            <Text style={styles.label}>Expires On</Text>
                            <Text style={[styles.value, {color: '#34d399'}]}>{new Date(activeSubscription.endDate).toLocaleDateString()}</Text>
                        </View>
                    </View>

                    <View style={[styles.infoRow, {marginTop: 20}]}>
                        <View>
                            <Text style={styles.label}>Pass ID</Text>
                            <Text style={styles.value}>#{activeSubscription._id.slice(-8).toUpperCase()}</Text>
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            <Text style={styles.label}>Zones Allowed</Text>
                            <Text style={styles.value}>All Zones (City)</Text>
                        </View>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructions}>
                    <Text style={styles.instrTitle}>Instructions</Text>
                    <View style={styles.instrRow}>
                        <Ionicons name="checkmark-circle" size={18} color="#34d399" />
                        <Text style={styles.instrText}>Present this QR code to the on-board validator.</Text>
                    </View>
                    <View style={styles.instrRow}>
                        <Ionicons name="checkmark-circle" size={18} color="#34d399" />
                        <Text style={styles.instrText}>Keep a screenshot handy in case of low signal.</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b1f16' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
    iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1f2933', borderRadius: 12 },
    headerTitle: { color: '#f9fafb', fontSize: 18, fontWeight: 'bold' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    
    // QR Section
    qrCard: { backgroundColor: '#1c2619', borderRadius: 32, padding: 30, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#59f20d' },
    qrTitle: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
    qrSub: { color: '#9ca3af', fontSize: 13, marginBottom: 30 },
    qrWrapper: { padding: 16, backgroundColor: '#1c2619', borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)' },
    statusBox: { flexDirection: 'row', alignItems: 'center', marginTop: 30, backgroundColor: 'rgba(89, 242, 13, 0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#59f20d', marginRight: 10 },
    statusText: { color: '#59f20d', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

    // Details Card
    detailsCard: { backgroundColor: '#1c2619', borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    detailsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    detailsHeaderText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginLeft: 10, letterSpacing: 0.5 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 15 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
    value: { color: '#f9fafb', fontSize: 15, fontWeight: '600' },

    // Instructions
    instructions: { padding: 10 },
    instrTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
    instrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    instrText: { color: '#9ca3af', fontSize: 14, marginLeft: 10, flex: 1 },
    errorText: { color: '#ffffff', textAlign: 'center', marginTop: 100, fontSize: 16 },
    backBtn: { alignSelf: 'center', marginTop: 20, backgroundColor: '#34d399', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
    backText: { color: '#022c22', fontWeight: 'bold' }
});
