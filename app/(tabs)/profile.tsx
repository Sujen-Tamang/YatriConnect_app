import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useAuthStore } from '@/store/auth.store';
import { useTicketStore } from '@/store/ticket.store';

export default function ProfileScreen() {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    
    const { user, role } = useAuthStore();
    const { activeSubscription, fetchTickets } = useTicketStore();

    React.useEffect(() => {
        fetchTickets();
    }, []);
    
    const userName = user?.fullName || user?.name || "Yatri User";
    const userEmail = user?.email || user?.phone || "user@example.com";

    const daysLeft = activeSubscription ? Math.ceil((new Date(activeSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const isExpired = daysLeft <= 0;

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        setLoggingOut(true);
                        try {
                            router.replace('/login' as any);
                            Alert.alert('Success', 'You have been logged out.');
                        } catch (err) {
                            Alert.alert('Error', 'Logout failed');
                        } finally {
                            setLoggingOut(false);
                        }
                    },
                },
            ]
        );
    };

    const navigateToSubDetails = () => {
        if (activeSubscription) {
            router.push({
                pathname: '/(screens)/subscription-details' as any,
                params: { subData: JSON.stringify(activeSubscription) }
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={18} color="#f9fafb" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <Text style={styles.headerSub}>Account Management</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: user?.profileImage || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop' }} 
                                style={styles.avatar}
                            />
                        </View>
                        <TouchableOpacity style={styles.editBadge}>
                            <MaterialIcons name="add-a-photo" size={16} color="#0d140a" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.nameContainer}>
                        <Text style={styles.name}>{userName}</Text>
                        <Text style={styles.email}>{userEmail}</Text>
                        <Text style={styles.roleText}>{role === 'driver' ? 'Driver Account' : 'Passenger Account'}</Text>
                    </View>

                    <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(screens)/edit-profile' as any)}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Subscription Model Logic - Aero Dark Theme */}
                {role !== 'driver' && (
                    activeSubscription ? (
                        <TouchableOpacity 
                            style={[styles.subCard, isExpired && styles.subCardExpired]} 
                            activeOpacity={0.9}
                            onPress={navigateToSubDetails}
                        >
                            <View style={styles.subCardTop}>
                                <View>
                                    <Text style={styles.subCardTitle}>Active Explorer Pass</Text>
                                    <Text style={[styles.subCardDays, isExpired && { color: '#ef4444' }]}>{isExpired ? "0" : daysLeft} Days Left</Text>
                                </View>
                                <View style={styles.subCardMeta}>
                                    <Text style={styles.subCardPackage}>{activeSubscription.planType?.toUpperCase() || "MONTHLY"} / 1mo</Text>
                                    <View style={styles.statusBadge}>
                                        <Text style={styles.statusBadgeText}>PRO</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${Math.min(100, (daysLeft/30)*100)}%` }, isExpired && { backgroundColor: '#ef4444' }]} />
                            </View>
                            {isExpired && (
                                <View style={styles.renewAlert}>
                                    <MaterialIcons name="warning" size={14} color="#fff" />
                                    <Text style={styles.renewAlertText}>PASS EXPIRED - RENEW NOW »</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={styles.unsubscribedCard}
                            onPress={() => router.push('/tickets' as any)}
                            activeOpacity={0.9}
                        >
                            <View style={styles.unsubIconBox}>
                                <Ionicons name="sparkles" size={24} color="#59f20d" />
                            </View>
                            <View style={styles.unsubContent}>
                                <Text style={styles.unsubTitle}>Subscribe our Cityin service</Text>
                                <Text style={styles.unsubSubtitle}>Get unlimited local travel & savings</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#59f20d" />
                        </TouchableOpacity>
                    )
                )}

                {/* My Transit */}
                {role !== 'driver' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>My Transit</Text>
                        <View style={styles.card}>
                            <TouchableOpacity style={styles.cardItem} onPress={() => router.push('/(screens)/saved-routes' as any)}>
                                <View style={styles.cardItemContent}>
                                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(89, 242, 13, 0.1)' }]}>
                                        <MaterialIcons name="map" size={24} color="#59f20d" />
                                    </View>
                                    <View>
                                        <Text style={styles.cardTitle}>Saved Routes</Text>
                                        <Text style={styles.cardSubtitle}>3 Active routes</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.cardItem, styles.cardItemBorderTop]} onPress={() => router.push('/(screens)/favorite-stops' as any)}>
                                <View style={styles.cardItemContent}>
                                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                                        <MaterialIcons name="directions-bus" size={24} color="#ff9800" />
                                    </View>
                                    <View>
                                        <Text style={styles.cardTitle}>Favorite Stops</Text>
                                        <Text style={styles.cardSubtitle}>Home, Work, Downtown</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.card}>
                        {[
                            { icon: 'notifications', label: 'Notifications', hasBadge: true, route: '/(screens)/notifications' },
                            { icon: 'language', label: 'Language', value: 'English', route: '/(screens)/language' },
                            { icon: 'shield', label: 'Privacy & Security', route: '/(screens)/privacy' },
                            { icon: 'help', label: 'Help & Support', route: '/(screens)/help' },
                        ].map((item, index) => (
                            <TouchableOpacity
                                key={item.label}
                                style={[styles.preferenceItem, index > 0 && styles.preferenceBorderTop]}
                                onPress={() => router.push(item.route as any)}
                            >
                                <View style={styles.preferenceContent}>
                                    <View style={styles.smallIconContainer}>
                                        <MaterialIcons name={item.icon as any} size={20} color="#9ca3af" />
                                    </View>
                                    <Text style={styles.preferenceLabel}>{item.label}</Text>
                                </View>
                                <View style={styles.rightSide}>
                                    {item.hasBadge && <View style={styles.redDot} />}
                                    {item.value && <Text style={styles.valueText}>{item.value}</Text>}
                                    {!item.value && <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Logout */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>Version 2.4.1 (Build 204)</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1c2619', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
    headerSub: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 1 },
    headerSpacer: { width: 44 },

    scrollContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 140 },
    profileSection: { alignItems: 'center', marginBottom: 32 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatarWrapper: { width: 112, height: 112, borderRadius: 56, overflow: 'hidden', borderWidth: 4, borderColor: '#1c2619', backgroundColor: '#1c2619' },
    avatar: { width: '100%', height: '100%' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#59f20d', padding: 6, borderRadius: 20, borderWidth: 2, borderColor: '#0d140a' },
    
    nameContainer: { alignItems: 'center', marginBottom: 20 },
    name: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
    email: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    roleText: { fontSize: 11, color: '#59f20d', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 },
    editButton: { width: 160, height: 38, backgroundColor: '#59f20d', borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    editButtonText: { color: '#0d140a', fontSize: 13, fontWeight: 'bold' },

    // Sub Model - Matched to Theme
    subCard: { backgroundColor: '#1c2619', borderRadius: 28, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(89, 242, 13, 0.3)', shadowColor: '#59f20d', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    subCardExpired: { borderColor: 'rgba(239, 68, 68, 0.3)', shadowColor: '#ef4444' },
    subCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
    subCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#9ca3af', letterSpacing: 0.5 },
    subCardDays: { fontSize: 28, fontWeight: '900', color: '#59f20d', marginTop: 6 },
    subCardMeta: { alignItems: 'flex-end', flex: 1 },
    subCardPackage: { fontSize: 12, fontWeight: 'bold', color: '#fff', textAlign: 'right' },
    statusBadge: { backgroundColor: 'rgba(89,242,13,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 10 },
    statusBadgeText: { color: '#59f20d', fontSize: 10, fontWeight: 'bold' },
    progressBarBg: { height: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#59f20d', borderRadius: 6 },
    renewAlert: { backgroundColor: '#ef4444', flexDirection: 'row', marginTop: 18, padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    renewAlertText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginLeft: 8 },

    unsubscribedCard: { backgroundColor: '#1c2619', borderRadius: 20, padding: 22, marginBottom: 32, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(89, 242, 13, 0.4)', borderStyle: 'dashed' },
    unsubIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(89,242,13,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    unsubContent: { flex: 1 },
    unsubTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    unsubSubtitle: { color: '#6b7280', fontSize: 12, marginTop: 4 },

    section: { marginBottom: 32 },
    sectionTitle: { paddingHorizontal: 8, marginBottom: 12, fontSize: 12, fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1.2 },
    card: { backgroundColor: '#1c2619', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden' },
    cardItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
    cardItemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
    cardSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    cardItemBorderTop: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
    preferenceItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
    preferenceContent: { flexDirection: 'row', alignItems: 'center' },
    smallIconContainer: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    preferenceLabel: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
    rightSide: { flexDirection: 'row', alignItems: 'center' },
    redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 8 },
    valueText: { fontSize: 12, color: '#9ca3af', marginRight: 4 },
    preferenceBorderTop: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
    logoutSection: { alignItems: 'center', paddingTop: 8, paddingBottom: 24 },
    logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' },
    versionText: { fontSize: 10, color: '#4b5563', marginTop: 16 },
    scrollView: { flex: 1 },
});