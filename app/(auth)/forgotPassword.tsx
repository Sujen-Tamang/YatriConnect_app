import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { forgotPasswordApi } from '@/features/auth/auth.service';

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleReset = async () => {
        if (!email) {
            setErrorMsg("Please enter your email address.");
            return;
        }

        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const data = await forgotPasswordApi(email);
            setSuccessMsg(data.message || "Password reset link sent to your email.");
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || "Failed to send reset link.");
        } finally {
            setLoading(false);
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
                    <Ionicons name="lock-closed-outline" size={40} color="#59f20d" />
                </View>
            </View>

            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
                Enter your email address to receive a password reset link.
            </Text>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                <TextInput
                    placeholder="name@example.com"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

            {/* Submit Button */}
            <TouchableOpacity
                style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
                onPress={handleReset}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#022c22" />
                ) : (
                    <Text style={styles.resetText}>Send Reset Link</Text>
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
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1c2619",
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    input: {
        flex: 1,
        color: "#fff",
        fontSize: 16,
        marginLeft: 12,
    },
    resetBtn: {
        backgroundColor: "#59f20d",
        height: 56,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    resetBtnDisabled: {
        opacity: 0.7,
    },
    resetText: {
        color: "#0d140a",
        fontSize: 18,
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
