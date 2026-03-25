import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function FavoriteStopsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Favorite Stops</Text>
                    <Text style={styles.subtitle}>Daily Hubs</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="location-outline" size={80} color="#1c2619" />
                    <Text style={styles.placeholderText}>No favorite stops found</Text>
                    <Text style={styles.subText}>Mark hubs as favorite for quicker access</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1c2619', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    subtitle: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
    content: { flex: 1, justifyContent: 'center', padding: 20 },
    emptyContainer: { alignItems: 'center' },
    placeholderText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
    subText: { color: '#4b5563', fontSize: 13, marginTop: 10, textAlign: 'center' }
});
