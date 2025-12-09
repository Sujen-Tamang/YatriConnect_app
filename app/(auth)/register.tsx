import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { sendVerificationApi } from "@/features/auth/auth.service";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";

export default function SignUp() {
    const router = useRouter();
    const register = useAuthStore((s) => s.register);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("+977");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [secure, setSecure] = useState(true);
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSignUp = async () => {
        if (!name || !email || !phone || !password || !confirmPassword) {
            setErrorMsg("Please fill in all fields.");
            return;
        }

        if (!/^\+977\d{10}$/.test(phone)) {
            setErrorMsg("Invalid phone format. Start with +977 and exactly 10 digits.");
            return;
        }

        if (!agree) {
            setErrorMsg("Please agree to Terms & Privacy Policy");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match");
            return;
        }

        setLoading(true);
        setErrorMsg("");

        try {
            await register({ name, email, phone, password });
            
            // Auto trigger verification email send
            await sendVerificationApi(email);
            
            // Route to OTP screen
            router.push({
                pathname: "/(auth)/verify-otp",
                params: { email }
            });
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color="#59f20d" />
            </TouchableOpacity>

            {/* Header */}
            <Text style={styles.title}>Sign Up</Text>
            <Text style={styles.subtitle}>
                Create an account to start tracking buses and saving your favorite
                stops.
            </Text>

            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    placeholder="John Doe"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                />
                <Ionicons name="person-outline" size={20} color="#9ca3af" />
            </View>

            {/* Email */}
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    placeholder="name@example.com"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <Ionicons name="mail-outline" size={20} color="#9ca3af" />
            </View>

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    placeholder="+977XXXXXXXXXX"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                />
                <Ionicons name="call-outline" size={20} color="#9ca3af" />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    placeholder="Create a password"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    secureTextEntry={secure}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setSecure(!secure)}>
                    <Ionicons
                        name={secure ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#9ca3af"
                    />
                </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    placeholder="Re-enter your password"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    secureTextEntry={secure}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                <Ionicons name="eye-off-outline" size={20} color="#9ca3af" />
            </View>

            {/* Terms */}
            <View style={styles.checkboxRow}>
                <Checkbox
                    value={agree}
                    onValueChange={setAgree}
                    color={agree ? "#59f20d" : undefined}
                />
                <Text style={styles.checkboxText}>
                    I agree to the{" "}
                    <Text style={styles.link}>Terms of Service</Text> and{" "}
                    <Text style={styles.link}>Privacy Policy</Text>
                </Text>
            </View>

            {/* Error Message */}
            {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
            ) : null}

            {/* Sign Up */}
            <TouchableOpacity
                style={[styles.signupBtn, loading && styles.signupBtnDisabled]}
                onPress={handleSignUp}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#0d140a" />
                ) : (
                    <Text style={styles.signupText}>Sign Up</Text>
                )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.or}>Or continue with</Text>
                <View style={styles.line} />
            </View>

            {/* Social */}
            <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn}>
                    <Ionicons name="logo-google" size={20} color="#fff" />
                    <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialBtn}>
                    <Ionicons name="logo-github" size={20} color="#fff" />
                    <Text style={styles.socialText}>GitHub</Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Already have an account?{" "}
                <Text style={styles.link} onPress={() => router.back()}>
                    Sign In
                </Text>
            </Text>
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
    title: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "700",
        marginBottom: 10,
    },
    subtitle: {
        color: "#9ca3af",
        lineHeight: 22,
        marginBottom: 30,
    },
    label: {
        color: "#e5e7eb",
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1c2619",
        borderRadius: 30,
        paddingHorizontal: 16,
        height: 52,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    input: {
        flex: 1,
        color: "#fff",
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 30,
    },
    checkboxText: {
        color: "#d1d5db",
        marginLeft: 10,
        flex: 1,
    },
    link: {
        color: "#59f20d",
        fontWeight: "600",
    },
    signupBtn: {
        backgroundColor: "#59f20d",
        height: 56,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
    },
    signupText: {
        color: "#0d140a",
        fontSize: 18,
        fontWeight: "600",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
    },
    or: {
        color: "#9ca3af",
        marginHorizontal: 10,
    },
    socialRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
    },
    socialBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1c2619",
        height: 52,
        borderRadius: 30,
        marginHorizontal: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    socialText: {
        color: "#fff",
        marginLeft: 8,
    },
    footer: {
        color: "#9ca3af",
        textAlign: "center",
    },
    errorText: {
        color: "#ef4444",
        textAlign: "center",
        marginBottom: 16,
    },
    signupBtnDisabled: {
        opacity: 0.7,
    },
});



