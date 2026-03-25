import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LanguageScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Language</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.optionRow}>
                    <Text style={styles.optionText}>English (Default)</Text>
                    <Ionicons name="checkmark-circle" size={24} color="#34d399" />
                </View>
                <View style={styles.optionRow}>
                    <Text style={styles.optionText}>Nepali</Text>
                    <Ionicons name="ellipse-outline" size={24} color="#9ca3af" />
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
    optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f2933', padding: 16, borderRadius: 12, marginBottom: 12 },
    optionText: { color: '#f9fafb', fontSize: 16, fontWeight: '500' }
});
