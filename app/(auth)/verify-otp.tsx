import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { sendVerificationApi } from '@/features/auth/auth.service';

export default function VerifyOtp() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const verifyOtp = useAuthStore((s) => s.verifyOtp);

    // email gets passed from register or forgot password screens
    const email = Array.isArray(params.email) ? params.email[0] : params.email || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleVerify = async () => {
        if (!otp || otp.length < 6) {
            setErrorMsg("Please enter the 6-digit OTP code.");
            return;
        }

        setLoading(true);
        setErrorMsg("");
        
        try {
            await verifyOtp({ email, otp });
            // The AuthGuard will handle routing since isLoggedIn will turn true,
            // but we can explicitly route to home as a fallback.
            const role = useAuthStore.getState().role;
            if (role === "driver") {
                router.replace("/(tabs)/driver" as any);
            } else {
                router.replace("/(tabs)/home");
            }
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setErrorMsg("");
        setSuccessMsg("");
        
        try {
            await sendVerificationApi(email);
            setSuccessMsg("Verification code resent to your email.");
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || "Failed to resend code.");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="mail-unread-outline" size={40} color="#59f20d" />
                </View>
            </View>

            <Text style={styles.title}>Verify Account</Text>
            <Text style={styles.subtitle}>
                We've sent a 6-digit verification code to <Text style={styles.highlight}>{email}</Text>
            </Text>

            {/* OTP Input */}
            <View style={styles.inputWrapper}>
                <Ionicons name="keypad-outline" size={20} color="#9ca3af" />
                <TextInput
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                />
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

            {/* Verify Button */}
            <TouchableOpacity
                style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
                onPress={handleVerify}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#022c22" />
                ) : (
                    <Text style={styles.verifyText}>Verify & Proceed</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.resendContainer} 
                onPress={handleResend}
                disabled={resendLoading}
            >
                {resendLoading ? (
                    <ActivityIndicator size="small" color="#34d399" />
                ) : (
                    <Text style={styles.resendText}>Didn't receive code? <Text style={styles.resendLink}>Resend</Text></Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0d140a",
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    backBtn: {
        position: "absolute",
        top: 50,
        left: 20,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(89, 242, 13, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    title: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 12,
    },
    subtitle: {
        color: "#9ca3af",
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 22,
    },
    highlight: {
        color: "#fff",
        fontWeight: "600",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1c2619",
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    input: {
        flex: 1,
        color: "#fff",
        fontSize: 18,
        marginLeft: 12,
        letterSpacing: 4,
    },
    verifyBtn: {
        backgroundColor: "#59f20d",
        height: 56,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    verifyBtnDisabled: {
        opacity: 0.7,
    },
    verifyText: {
        color: "#0d140a",
        fontSize: 18,
        fontWeight: "600",
    },
    resendContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    resendText: {
        color: "#9ca3af",
        fontSize: 16,
    },
    resendLink: {
        color: "#59f20d",
        fontWeight: "600",
    },
    errorText: {
        color: "#ef4444",
        textAlign: "center",
        marginBottom: 16,
    },
    successText: {
        color: "#59f20d",
        textAlign: "center",
        marginBottom: 16,
    },
});
