import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrivacyScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Privacy & Security</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.placeholderText}>Your data is safe with YatriConnect. End-to-end encryption enabled.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b1f16' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2933' },
    backBtn: { marginRight: 16, padding: 4 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    content: { padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 300 },
    placeholderText: { color: '#9ca3af', fontSize: 16, textAlign: 'center' }
});
