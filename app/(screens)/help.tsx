import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Help & Support</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Ionicons name="chatbubbles" size={32} color="#34d399" />
                    <Text style={styles.cardTitle}>Chat with Support</Text>
                    <Text style={styles.cardDesc}>Available 24/7 for your needs</Text>
                </View>
                <View style={styles.card}>
                    <Ionicons name="mail" size={32} color="#34d399" />
                    <Text style={styles.cardTitle}>Email Us</Text>
                    <Text style={styles.cardDesc}>support@yatriconnect.com</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b1f16' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2933' },
    backBtn: { marginRight: 16, padding: 4 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    content: { padding: 20 },
    card: { backgroundColor: '#1f2933', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
    cardDesc: { color: '#9ca3af', fontSize: 14 }
});
