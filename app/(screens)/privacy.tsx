import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { updatePasswordApi } from '@/features/auth/auth.service';

export default function PrivacyScreen() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert('Error', 'Please fill in both fields.');
            return;
        }

        try {
            setIsLoading(true);
            const res = await updatePasswordApi({ currentPassword, newPassword });
            if (res.success) {
                Alert.alert("Success", "Password updated successfully.");
                setCurrentPassword('');
                setNewPassword('');
            } else {
                Alert.alert("Error", res.message || "Failed to update password.");
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} disabled={isLoading}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Privacy & Security</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.placeholderText}>Your data is safe with YatriConnect. End-to-end encryption enabled.</Text>

                <View style={styles.passwordSection}>
                    <Text style={styles.sectionTitle}>Change Password</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Current Password</Text>
                        <TextInput 
                            style={styles.input} 
                            value={currentPassword} 
                            onChangeText={setCurrentPassword}
                            placeholderTextColor="#9ca3af" 
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <TextInput 
                            style={styles.input} 
                            value={newPassword} 
                            onChangeText={setNewPassword}
                            placeholderTextColor="#9ca3af" 
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity style={styles.updateBtn} onPress={handleChangePassword} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#0b1f16" /> : <Text style={styles.updateBtnText}>Update Password</Text>}
                    </TouchableOpacity>
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
    content: { padding: 20, flex: 1 },
    placeholderText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 30 },
    passwordSection: { backgroundColor: '#112a1f', padding: 20, borderRadius: 12 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    inputGroup: { marginBottom: 16 },
    label: { color: '#9ca3af', fontSize: 13, marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: '#1f2933', color: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#374151' },
    updateBtn: { backgroundColor: '#34d399', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    updateBtnText: { color: '#0b1f16', fontSize: 16, fontWeight: 'bold' }
});
