import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { getAvailableSeatsApi, reserveSeatsApi, cancelReservationApi } from '@/features/bus/bus.service';
import { initiateKhaltiPaymentApi } from '@/features/payment/payment.service';
import { useAuthStore } from '@/store/auth.store';

const { width } = Dimensions.get('window');

/**
 * BOOKING SCREEN
 * Handles seat selection, passenger info, and Khalti payment initiation.
 */
export default function BookingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user, isLoggedIn } = useAuthStore();
    
    const busData = useMemo(() => params.busData ? JSON.parse(params.busData as string) : null, [params.busData]);
    
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [availableSeats, setAvailableSeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    
    const [reserved, setReserved] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!busData) {
            router.back();
            return;
        }
        fetchSeats();
    }, [busData?.id]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (reserved && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (reserved && timeLeft === 0) {
            handleAutoCancel();
        }
        return () => clearInterval(interval);
    }, [reserved, timeLeft]);

    const handleAutoCancel = async () => {
        setReserved(false);
        const seatsToCancel = [...selectedSeats];
        setSelectedSeats([]);
        Alert.alert("Session Expired", "Your seat reservation has expired. Please select again.");
        try {
            await cancelReservationApi(busData.id || busData._id, seatsToCancel);
        } catch (e) {}
        fetchSeats();
    };

    const fetchSeats = async () => {
        try {
            setLoading(true);
            const response = await getAvailableSeatsApi(busData.id || busData._id);
            if (response.success && response.data?.seats) {
                setAvailableSeats(response.data.seats);
            } else {
                // Fallback seats if API fails or returns empty
                generateFallbackSeats();
            }
        } catch (error) {
            console.error("Failed to fetch seats:", error);
            generateFallbackSeats();
        } finally {
            setLoading(false);
        }
    };

    const generateFallbackSeats = () => {
        const seats = [];
        const letters = ['A', 'B', 'C', 'D'];
        for (let i = 1; i <= 8; i++) {
            for (const L of letters) {
                seats.push({
                    number: `${i}${L}`,
                    available: false, // Default to unavailable if we can't fetch real data
                });
            }
        }
        setAvailableSeats(seats);
        Alert.alert("Error", "Could not fetch real-time seat availability. Please try again later.");
    };

    const toggleSeat = (seatNumber: string) => {
        if (reserved) return; // Prevent selection changes while reserved
        setSelectedSeats(prev => 
            prev.includes(seatNumber) 
                ? prev.filter(s => s !== seatNumber)
                : [...prev, seatNumber]
        );
    };

    const handleReserve = async () => {
        if (!isLoggedIn) {
            Alert.alert("Authentication Required", "Please log in to continue booking.");
            return;
        }
        if (selectedSeats.length === 0) {
            Alert.alert("Selection Required", "Please select at least one seat.");
            return;
        }
        try {
            setPaymentLoading(true);
            const response = await reserveSeatsApi(busData.id || busData._id, selectedSeats);
            if (response.success) {
                setReserved(true);
                setTimeLeft(300); // 5 minutes
            }
        } catch (error: any) {
            Alert.alert("Reservation Failed", error.response?.data?.message || "Failed to reserve seats. They might be taken.");
            fetchSeats();
        } finally {
            setPaymentLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!isLoggedIn) {
            Alert.alert("Authentication Required", "Please log in to continue booking.");
            return;
        }

        if (selectedSeats.length === 0) {
            Alert.alert("Selection Required", "Please select at least one seat.");
            return;
        }

        try {
            setPaymentLoading(true);
            const bookingData = {
                amount: busData.price * selectedSeats.length,
                busId: busData.id || busData._id,
                seats: selectedSeats,
                journeyDate: new Date().toISOString(), // In a real app, this would be selected by user
            };

            const response = await initiateKhaltiPaymentApi(bookingData);
            
            if (response.success && response.payment_url) {
                const result = await WebBrowser.openBrowserAsync(response.payment_url);
                
                // After returning from browser, we should check status
                // For now, let's navigate to a "success" or "ticket" view if they come back
                // In production, we'd verify the payment first
                if (result.type === 'cancel') {
                    // User closed the browser, check if payment was actually done
                }
                
                // Navigate to ticket view with the booking ID
                router.push({
                    pathname: '/ticket-view' as any,
                    params: { booking: JSON.stringify({ ...bookingData, status: 'Confirmed', bookingId: response.bookingId, bus: busData }) }
                });
            } else {
                Alert.alert("Payment Error", response.message || "Failed to initiate payment.");
            }
        } catch (error: any) {
            Alert.alert("Payment Failure", error.response?.data?.message || "An error occurred during payment initiation.");
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#59f20d" />
                <Text style={styles.loadingText}>Fetching available seats...</Text>
            </SafeAreaView>
        );
    }

    const totalPrice = (busData?.price || 850) * selectedSeats.length;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Seats</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Bus Info */}
                <View style={styles.busInfoCard}>
                    <View style={styles.busHeader}>
                        <Text style={styles.busNumber}>{busData?.busNumber}</Text>
                        <Text style={styles.yatayatName}>{busData?.yatayatName}</Text>
                    </View>
                    <View style={styles.routeRow}>
                        <Text style={styles.routeText}>
                            {typeof busData?.route === 'object' ? busData.route.from : (busData?.route as string || "").split('-')[0]}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color="#59f20d" style={{ marginHorizontal: 10 }} />
                        <Text style={styles.routeText}>
                            {typeof busData?.route === 'object' ? busData.route.to : (busData?.route as string || "").split('-')[1]}
                        </Text>
                    </View>
                </View>

                {/* Seat Legend */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.seatLegend, styles.seatAvailable]} />
                        <Text style={styles.legendText}>Available</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.seatLegend, styles.seatSelected]} />
                        <Text style={styles.legendText}>Selected</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.seatLegend, styles.seatUnavailable]} />
                        <Text style={styles.legendText}>Booked</Text>
                    </View>
                </View>

                {/* Seat Selection Area */}
                <View style={styles.selectionArea}>
                    <View style={styles.frontArea}>
                        <MaterialCommunityIcons name="steering" size={30} color="#6b7280" />
                        <View style={styles.entryDoor}>
                            <Text style={styles.doorText}>ENTRY</Text>
                        </View>
                    </View>

                    <View style={styles.seatGrid}>
                        {/* Process seats in rows of 4 */}
                        {[...Array(Math.ceil(availableSeats.length / 4))].map((_, rowIndex) => (
                            <View key={`row-${rowIndex}`} style={styles.seatRow}>
                                {availableSeats.slice(rowIndex * 4, rowIndex * 4 + 4).map((seat, colIndex) => (
                                    <React.Fragment key={seat.number}>
                                        <TouchableOpacity
                                            onPress={() => toggleSeat(seat.number)}
                                            disabled={!seat.available}
                                            style={[
                                                styles.seat,
                                                !seat.available ? styles.seatUnavailable : 
                                                selectedSeats.includes(seat.number) ? styles.seatSelected : styles.seatAvailable
                                            ]}
                                        >
                                            <Text style={[
                                                styles.seatText,
                                                selectedSeats.includes(seat.number) && { color: '#0d140a' }
                                            ]}>{seat.number}</Text>
                                        </TouchableOpacity>
                                        {colIndex === 1 && <View style={styles.aisle} />}
                                    </React.Fragment>
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
                
                <View style={{height: 120}} />
            </ScrollView>

            {/* Bottom Booking Summary */}
            <View style={styles.bottomSheet}>
                <View style={styles.summaryRow}>
                    <View>
                        <Text style={styles.summarySeats}>
                            {selectedSeats.length > 0 ? `${selectedSeats.length} Seats: ${selectedSeats.join(', ')}` : 'No seats selected'}
                        </Text>
                        <Text style={styles.summaryPrice}>Total: NPR {totalPrice}</Text>
                        {reserved && (
                            <Text style={{color: '#ef4444', fontSize: 12, marginTop: 4, fontWeight: 'bold'}}>
                                Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </Text>
                        )}
                    </View>
                    {!reserved ? (
                        <TouchableOpacity 
                            style={[styles.payBtn, (selectedSeats.length === 0 || paymentLoading) && styles.payBtnDisabled]}
                            onPress={handleReserve}
                            disabled={selectedSeats.length === 0 || paymentLoading}
                        >
                            {paymentLoading ? (
                                <ActivityIndicator size="small" color="#0d140a" />
                            ) : (
                                <Text style={styles.payBtnText}>RESERVE</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.payBtn, (paymentLoading) && styles.payBtnDisabled]}
                            onPress={handlePayment}
                            disabled={paymentLoading}
                        >
                            {paymentLoading ? (
                                <ActivityIndicator size="small" color="#0d140a" />
                            ) : (
                                <>
                                    <Text style={styles.payBtnText}>PAY NOW</Text>
                                    <MaterialCommunityIcons name="credit-card-outline" size={20} color="#0d140a" />
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d140a' },
    loadingContainer: { flex: 1, backgroundColor: '#0d140a', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#9ca3af', marginTop: 15, fontSize: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1c2619', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    busInfoCard: { backgroundColor: '#1c2619', borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    busHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    busNumber: { color: '#59f20d', fontSize: 16, fontWeight: 'bold' },
    yatayatName: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
    routeRow: { flexDirection: 'row', alignItems: 'center' },
    routeText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    legend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30, backgroundColor: 'rgba(28,38,25,0.5)', padding: 15, borderRadius: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    seatLegend: { width: 14, height: 14, borderRadius: 4, marginRight: 8 },
    legendText: { color: '#9ca3af', fontSize: 12, fontWeight: '500' },
    selectionArea: { backgroundColor: '#1c2619', borderRadius: 32, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    frontArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, paddingHorizontal: 10 },
    entryDoor: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
    doorText: { color: '#374151', fontSize: 10, fontWeight: 'bold' },
    seatGrid: { paddingHorizontal: 10 },
    seatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    seat: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
    seatAvailable: { backgroundColor: 'transparent', borderColor: '#374151' },
    seatSelected: { backgroundColor: '#59f20d', borderColor: '#59f20d' },
    seatUnavailable: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' },
    seatText: { color: '#9ca3af', fontSize: 13, fontWeight: 'bold' },
    aisle: { width: 30 },
    bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(13, 20, 10, 0.95)', padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', height: 100 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summarySeats: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
    summaryPrice: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    payBtn: { backgroundColor: '#59f20d', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
    payBtnDisabled: { opacity: 0.5 },
    payBtnText: { color: '#0d140a', fontSize: 15, fontWeight: '900' },
});
