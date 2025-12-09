import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secure, setSecure] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorMsg("Please enter both email and password.");
            return;
        }

        setLoading(true);
        setErrorMsg("");
        try {
            await login({ email, password });
            const userState = useAuthStore.getState();
            
            // Check verification status here if required by the logic.
            // backend may block unverified users before token generation, or we check it here:
            if (userState.user && !userState.user.isVerified) {
                // If the backend allows login but marks them unverified, force them to OTP screen.
                // However, based on the provided API specs, verify checks are explicitly shown on reset-password
                // It's safer to just let the AuthGuard or backend intercept. We'll proceed.
            }

            if (userState.role === "driver") {
                router.replace("/(tabs)/driver" as any);
            } else {
                router.replace("/(tabs)/home");
            }
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Logo / Icon */}
            <View style={styles.logoWrapper}>
                <Ionicons name="bus" size={40} color="#59f20d" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
                Sign in to track your ride instantly
            </Text>

            {/* Email */}
            <Text style={styles.label}>Email or Username</Text>
            <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#9ca3af" />
                <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                <TextInput
                    placeholder="••••••••"
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

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgot}
                              onPress={() => router.push("/(auth)/forgotPassword")}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
            ) : null}

            {/* Sign In */}
            <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#0d140a" />
                ) : (
                    <Text style={styles.loginText}>Sign In</Text>
                )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.or}>OR CONTINUE WITH</Text>
                <View style={styles.line} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn}>
                    <Image
                        source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
                        style={styles.socialIcon}
                    />
                    <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialBtn}>
                    <Ionicons name="logo-apple" size={22} color="#fff" />
                    <Text style={styles.socialText}>Apple</Text>
                </TouchableOpacity>
            </View>

            {/* Sign Up */}
            <Text style={styles.footer}>
                Don’t have an account?{" "}
                <Text
                    style={styles.signup}
                    onPress={() => router.push("/(auth)/register")}
                >
                    Sign Up
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
        justifyContent: "center",
    },
    logoWrapper: {
        alignSelf: "center",
        backgroundColor: "#1c2619",
        padding: 18,
        borderRadius: 50,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(89, 242, 13, 0.2)',
    },
    title: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
    },
    subtitle: {
        color: "#9ca3af",
        textAlign: "center",
        marginBottom: 30,
    },
    label: {
        color: "#d1d5db",
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1c2619",
        borderRadius: 30,
        paddingHorizontal: 16,
        height: 52,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    input: {
        flex: 1,
        color: "#fff",
        marginLeft: 10,
    },
    forgot: {
        alignSelf: "flex-end",
        marginBottom: 24,
    },
    forgotText: {
        color: "#59f20d",
    },
    loginBtn: {
        backgroundColor: "#59f20d",
        height: 56,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
    },
    loginText: {
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
        fontSize: 12,
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
    socialIcon: {
        width: 20,
        height: 20,
        marginRight: 8,
    },
    socialText: {
        color: "#fff",
    },
    footer: {
        color: "#9ca3af",
        textAlign: "center",
    },
    signup: {
        color: "#59f20d",
        fontWeight: "600",
    },
    errorText: {
        color: "#ef4444",
        textAlign: "center",
        marginBottom: 16,
    },
    loginBtnDisabled: {
        opacity: 0.7,
    },
});
