import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { initiateSubscriptionApi } from '@/features/subscription/subscription.service';

const { width } = Dimensions.get('window');

const PLANS = [
    {
        id: 'weekly',
        name: 'Weekly Pass',
        price: 500,
        duration: '7 Days',
        icon: 'calendar-week',
        color: '#59f20d',
        features: ['Unlimited Cityin rides', 'Priority boarding', 'Digital pass ID']
    },
    {
        id: 'monthly',
        name: 'Monthly Pass',
        price: 1500,
        duration: '30 Days',
        icon: 'calendar-month',
        color: '#3b82f6',
        features: ['All Weekly features', 'Save 25% vs weekly', 'Monthly transit report']
    },
    {
        id: 'yearly',
        name: 'Yearly Pass',
        price: 15000,
        duration: '365 Days',
        icon: 'calendar-star',
        color: '#f59e0b',
        features: ['All Monthly features', 'Best value (2 months free)', 'Exclusive Yatri rewards']
    }
];

export default function CityPassesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handlePurchase = async (planId: string) => {
        setLoading(planId);
        try {
            const response = await initiateSubscriptionApi({ planType: planId });
            
            if (response.success && response.paymentUrl) {
                // Open Khalti Payment
                const result = await WebBrowser.openBrowserAsync(response.paymentUrl);
                
                // After returning from browser, navigate to profile or tickets to see the new sub
                // In a production app, we'd poll for status or use a deep link callback
                Alert.alert(
                    "Payment Processed",
                    "If your payment was successful, your pass will be active shortly. Please check your profile.",
                    [{ text: "OK", onPress: () => router.push('/(tabs)/profile') }]
                );
            } else {
                throw new Error("Failed to initiate payment");
            }
        } catch (error: any) {
            console.error("Subscription Error:", error);
            Alert.alert("Error", error.response?.data?.message || "Could not initiate payment. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>City Passes</Text>
                    <Text style={styles.headerSub}>Choose your transit plan</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <MaterialCommunityIcons name="ticket-confirmation" size={48} color="#59f20d" />
                    <Text style={styles.heroTitle}>Unlimited Commute</Text>
                    <Text style={styles.heroSub}>Unlock the city with a single digital pass. No more individual tickets, just tap and travel.</Text>
                </View>

                {PLANS.map((plan) => (
                    <TouchableOpacity 
                        key={plan.id} 
                        style={[styles.planCard, { borderColor: plan.color + '20' }]}
                        onPress={() => handlePurchase(plan.id)}
                        disabled={!!loading}
                    >
                        <View style={styles.planHeader}>
                            <View style={[styles.iconBox, { backgroundColor: plan.color + '15' }]}>
                                <MaterialCommunityIcons name={plan.icon as any} size={28} color={plan.color} />
                            </View>
                            <View style={styles.planTitleBox}>
                                <Text style={styles.planName}>{plan.name}</Text>
                                <Text style={styles.planDuration}>{plan.duration}</Text>
                            </View>
                            <View style={styles.priceBox}>
                                <Text style={styles.currency}>NPR</Text>
                                <Text style={styles.price}>{plan.price}</Text>
                            </View>
                        </View>

                        <View style={styles.featuresList}>
                            {plan.features.map((feature, i) => (
                                <View key={i} style={styles.featureRow}>
                                    <Ionicons name="checkmark-circle" size={16} color="#59f20d" />
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={[styles.buyBtn, { backgroundColor: plan.color }]}>
                            {loading === plan.id ? (
                                <ActivityIndicator color="#0d140a" />
                            ) : (
                                <>
                                    <Text style={styles.buyBtnText}>GET THIS PASS</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#0d140a" />
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#9ca3af" />
                    <Text style={styles.infoText}>
                        Passes are activated immediately upon successful payment and are valid for the specified duration.
                    </Text>
                </View>
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1c2619', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    headerSub: { color: '#6b7280', fontSize: 11, textAlign: 'center', marginTop: 2 },
    headerSpacer: { width: 44 },

    content: { flex: 1, paddingHorizontal: 20 },
    heroSection: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
    heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 15 },
    heroSub: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20, paddingHorizontal: 20 },

    planCard: { backgroundColor: '#1c2619', borderRadius: 32, padding: 24, marginBottom: 20, borderWidth: 1, overflow: 'hidden' },
    planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    planTitleBox: { flex: 1, marginLeft: 15 },
    planName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    planDuration: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
    priceBox: { alignItems: 'flex-end' },
    currency: { color: '#9ca3af', fontSize: 10, fontWeight: 'bold' },
    price: { color: '#fff', fontSize: 22, fontWeight: '900' },

    featuresList: { marginBottom: 25 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    featureText: { color: '#9ca3af', fontSize: 13, marginLeft: 10 },

    buyBtn: { height: 56, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    buyBtnText: { color: '#0d140a', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    infoBox: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 16, gap: 12, marginTop: 10 },
    infoText: { flex: 1, color: '#6b7280', fontSize: 11, lineHeight: 16 },
});
