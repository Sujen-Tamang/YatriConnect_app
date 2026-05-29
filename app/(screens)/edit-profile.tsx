import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { updateProfileApi } from '@/features/auth/auth.service';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuthStore();
    
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [appEmail, setAppEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (user) {
            setFullName(user.fullName || user.name || '');
            setPhone(user.phone || '');
            setAppEmail(user.email || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert("Error", "Name is required.");
            return;
        }

        try {
            setIsLoading(true);
            const res = await updateProfileApi({ fullName });
            
            if (res.success) {
                // The API currently might only update db, so let's update local context too
                // Ensure field maps properly to user object structure
                await updateUser({ fullName, name: fullName });
                Alert.alert("Success", "Profile updated successfully.", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                Alert.alert("Error", res.message || "Failed to update profile");
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
                <Text style={styles.title}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#34d399" /> : <Text style={styles.saveBtn}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarRegion}>
                     <View style={styles.avatarBadge}><Ionicons name="person" size={40} color="#0b1f16" /></View>
                     <Text style={styles.changePicText}>Change Picture</Text>
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput 
                        style={styles.input} 
                        value={fullName} 
                        onChangeText={setFullName}
                        placeholderTextColor="#9ca3af" 
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address (Cannot be changed)</Text>
                    <TextInput 
                        style={[styles.input, { opacity: 0.6 }]} 
                        value={appEmail} 
                        editable={false}
                        placeholderTextColor="#9ca3af" 
                        keyboardType="email-address" 
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number (Cannot be changed)</Text>
                    <TextInput 
                        style={[styles.input, { opacity: 0.6 }]} 
                        value={phone} 
                        editable={false}
                        placeholderTextColor="#9ca3af" 
                        keyboardType="phone-pad" 
                    />
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
