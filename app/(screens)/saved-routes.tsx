import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export default function SavedRoutesScreen() {
    const router = useRouter();
    const [savedRoutes, setSavedRoutes] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const fetchSavedRoutes = async () => {
        try {
            const authData = await AsyncStorage.getItem('auth');
            if (!authData) return;
            const { token } = JSON.parse(authData);

            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/profile/saved-routes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setSavedRoutes(result.savedRoutes);
            }
        } catch (error) {
            console.log('Failed to fetch saved routes', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchSavedRoutes();
    }, []);

    const removeRoute = async (routeId: string) => {
        try {
            const authData = await AsyncStorage.getItem('auth');
            if (!authData) return;
            const { token } = JSON.parse(authData);

            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/profile/saved-routes/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ routeId })
            });

            const result = await response.json();
            if (result.success) {
                setSavedRoutes(prev => prev.filter((r: any) => r.routeId !== routeId));
            }
        } catch (error) {
            console.log('Failed to remove route', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Saved Routes</Text>
                    <Text style={styles.subtitle}>My Favorite Transit Paths</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.subText}>Loading your routes...</Text>
                    </View>
                ) : savedRoutes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bookmark-outline" size={80} color="#1c2619" />
                        <Text style={styles.placeholderText}>No saved routes yet</Text>
                        <Text style={styles.subText}>Save routes from the live tracking screen to see them here.</Text>
                    </View>
                ) : (
                    <View style={styles.routesList}>
                        {savedRoutes.map((route: any, index) => (
                            <View key={route.routeId || index} style={styles.routeCard}>
                                <View style={styles.routeIcon}>
                                    <FontAwesome5 
                                        name={route.type === 'city' ? "bus" : "route"} 
                                        size={20} 
                                        color="#59f20d" 
                                    />
                                </View>
                                <View style={styles.routeInfo}>
                                    <Text style={styles.routeName}>{route.name}</Text>
                                    <View style={styles.routeDetails}>
                                        <Text style={styles.routeTypeText}>
                                            {route.type === 'city' ? 'Local Route' : 'Intercity'}
                                        </Text>
                                        <Text style={styles.dot}>•</Text>
                                        <Text style={styles.routeTypeText}>{route.from} to {route.to}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => removeRoute(route.routeId)}
                                    style={styles.removeBtn}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
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
    content: { flexGrow: 1, padding: 20 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
    subText: { color: '#4b5563', fontSize: 13, marginTop: 10, textAlign: 'center' },

    routesList: { gap: 15 },
    routeCard: { 
        backgroundColor: '#1c2619', 
        borderRadius: 20, 
        padding: 15, 
        flexDirection: 'row', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    routeIcon: { 
        width: 44, 
        height: 44, 
        borderRadius: 12, 
        backgroundColor: 'rgba(89, 242, 13, 0.1)', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginRight: 15
    },
    routeInfo: { flex: 1 },
    routeName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    routeDetails: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    routeTypeText: { color: '#9ca3af', fontSize: 12 },
    dot: { color: '#4b5563', marginHorizontal: 6 },
    removeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }
});
