import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace("/(auth)/login");
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.splashContainer}>
            <StatusBar barStyle="light-content" />
            <View style={styles.splashIconWrapper}>
                <Ionicons name="bus" size={80} color="#34d399" />
            </View>
            <Text style={styles.splashTitle}>Yatri Connect</Text>
            <Text style={styles.splashTagline}>Your journey, our connection.</Text>
        </View>
    );
}


const styles = StyleSheet.create({
    splashContainer: {
        flex: 1,
        backgroundColor: "#0b1f16",
        alignItems: "center",
        justifyContent: "center",
    },
    splashIconWrapper: {
        backgroundColor: "#123b2a",
        padding: 30,
        borderRadius: 80,
        marginBottom: 24,
    },
    splashTitle: {
        color: "#ffffff",
        fontSize: 42,
        fontWeight: "bold",
        letterSpacing: 1,
    },
    splashTagline: {
        color: "#34d399",
        fontSize: 16,
        marginTop: 10,
        fontWeight: "500",
    },
});
