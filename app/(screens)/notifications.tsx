import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
    const router = useRouter();

    const notifications = [
        { id: '1', title: 'Route Assigned', message: 'Bus KA-01-202 has been assigned to you for today.', time: '2h ago', icon: 'bus', color: '#59f20d' },
        { id: '2', title: 'Shift Bonus', message: 'You earned a performance bonus for high punctuality last week!', time: '1d ago', icon: 'star', color: '#fbbf24' },
        { id: '3', title: 'System Update', message: 'YatriConnect Driver v2.4 now includes live stop monitoring.', time: '3d ago', icon: 'sync', color: '#60a5fa' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {notifications.map(item => (
                    <TouchableOpacity key={item.id} style={styles.notifCard} activeOpacity={0.7}>
                        <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                            <Ionicons name={item.icon as any} size={20} color={item.color} />
                        </View>
                        <View style={styles.notifInfo}>
                            <View style={styles.notifHeader}>
                                <Text style={styles.notifTitle}>{item.title}</Text>
                                <Text style={styles.notifTime}>{item.time}</Text>
                            </View>
                            <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
                
                {notifications.length === 0 && (
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
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    notifInfo: { flex: 1 },
    notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    notifTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    notifTime: { color: '#4b5563', fontSize: 11, fontWeight: '600' },
    notifMessage: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },

    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyText: { color: '#2e3928', fontSize: 16, fontWeight: 'bold', marginTop: 16 }
});
