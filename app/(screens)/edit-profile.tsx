import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Profile</Text>
                <TouchableOpacity><Text style={styles.saveBtn}>Save</Text></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarRegion}>
                     <View style={styles.avatarBadge}><Ionicons name="person" size={40} color="#0b1f16" /></View>
                     <Text style={styles.changePicText}>Change Picture</Text>
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value="Alex Johnson" placeholderTextColor="#9ca3af" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput style={styles.input} value="alex.j@example.com" placeholderTextColor="#9ca3af" keyboardType="email-address" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b1f16' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2933' },
    backBtn: { padding: 4 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    saveBtn: { color: '#34d399', fontSize: 16, fontWeight: 'bold' },
    content: { padding: 20 },
    avatarRegion: { alignItems: 'center', marginVertical: 24 },
    avatarBadge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#34d399', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    changePicText: { color: '#34d399', fontSize: 14, fontWeight: 'bold' },
    inputGroup: { marginBottom: 20 },
    label: { color: '#9ca3af', fontSize: 13, marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: '#1f2933', color: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#374151' }
});
