import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getMyNotificationsApi, markNotificationReadApi } from '@/features/notification/notification.service';

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTypeMeta = (type?: string) => {
        switch (type) {
            case 'promo':
                return { icon: 'megaphone-outline', color: '#59f20d' };
            case 'announcement':
                return { icon: 'megaphone-outline', color: '#f59e0b' };
            case 'payment':
                return { icon: 'card-outline', color: '#60a5fa' };
            case 'assignment':
                return { icon: 'bus-outline', color: '#22c55e' };
            case 'bus-online':
                return { icon: 'radio-outline', color: '#10b981' };
            case 'bus-status':
                return { icon: 'walk-outline', color: '#f97316' };
            case 'booking':
                return { icon: 'ticket-outline', color: '#a855f7' };
            case 'route-update':
                return { icon: 'git-branch-outline', color: '#38bdf8' };
            case 'system':
                return { icon: 'information-circle-outline', color: '#9ca3af' };
            default:
                return { icon: 'notifications-outline', color: '#9ca3af' };
        }
    };

    const formatTimeAgo = (dateValue?: string) => {
        if (!dateValue) return '';
        const now = Date.now();
        const time = new Date(dateValue).getTime();
        const diffMs = Math.max(0, now - time);
        const minutes = Math.floor(diffMs / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const fetchNotifications = useCallback(async () => {
        setError(null);
        try {
            const res = await getMyNotificationsApi();
            if (res.success) {
                setNotifications(res.data || []);
            } else {
                setError(res.message || 'Failed to load notifications');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load notifications');
        }
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchNotifications();
            setLoading(false);
        })();
    }, [fetchNotifications]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    }, [fetchNotifications]);

    const handleMarkRead = async (notificationId: string) => {
        try {
            await markNotificationReadApi(notificationId);
            setNotifications((prev) =>
                prev.map((item) => item._id === notificationId ? { ...item, isRead: true } : item)
            );
        } catch (err) {
            // Ignore read errors to avoid blocking the UI.
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={handleRefresh}>
                    <Ionicons name="refresh" size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#59f20d" />}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#59f20d" />
                    </View>
                ) : error ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="alert-circle-outline" size={56} color="#ef4444" />
                        <Text style={[styles.emptyText, { color: '#ef4444' }]}>{error}</Text>
                    </View>
                ) : (
                    notifications.map((item) => {
                        const meta = getTypeMeta(item.type);
                        return (
                            <TouchableOpacity
                                key={item._id}
                                style={[styles.notifCard, !item.isRead && styles.notifUnread]}
                                activeOpacity={0.7}
                                onPress={() => handleMarkRead(item._id)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: `${meta.color}20` }]}> 
                                    <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                                </View>
                                <View style={styles.notifInfo}>
                                    <View style={styles.notifHeader}>
                                        <Text style={styles.notifTitle}>{item.title}</Text>
                                        <Text style={styles.notifTime}>{formatTimeAgo(item.createdAt)}</Text>
                                    </View>
                                    <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
                                </View>
                                {!item.isRead && <View style={styles.unreadDot} />}
                            </TouchableOpacity>
                        );
                    })
                )}

                {!loading && !error && notifications.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color="#1c2619" />
                        <Text style={styles.emptyText}>All caught up!</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1c2619', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
    
    scrollContent: { padding: 16 },
    notifCard: { 
        flexDirection: 'row', 
        backgroundColor: '#1c2619', 
        padding: 16, 
        borderRadius: 24, 
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)'
    },
    notifUnread: {
        borderColor: 'rgba(89,242,13,0.35)'
    },
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    notifInfo: { flex: 1 },
    notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    notifTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    notifTime: { color: '#4b5563', fontSize: 11, fontWeight: '600' },
    notifMessage: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#59f20d', marginLeft: 8, alignSelf: 'center' },

    loadingContainer: { paddingTop: 80 },

    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyText: { color: '#2e3928', fontSize: 16, fontWeight: 'bold', marginTop: 16 }
});
