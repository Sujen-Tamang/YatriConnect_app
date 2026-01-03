import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginApi, registerApi, verifyOtpApi } from "@/features/auth/auth.service";

export type Role = "user" | "driver" | null;

type AuthState = {
    isLoggedIn: boolean;
    role: Role;
    token: string | null;
    user: any | null;
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<any>;
    verifyOtp: (data: { email: string; otp: string }) => Promise<void>;
    logout: () => Promise<void>;
    restore: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,
    role: null,
    token: null,
    user: null,

    login: async (credentials) => {
        const data = await loginApi(credentials);
        const token = data.token;
        const role = data.user?.role || "user";
        const user = data.user;

        await AsyncStorage.setItem(
            "auth",
            JSON.stringify({ isLoggedIn: true, role, token, user })
        );
        set({ isLoggedIn: true, role, token, user });
    },

    register: async (userData) => {
        // Register no longer logs the user in automatically
        const data = await registerApi(userData);
        return data;
    },

    verifyOtp: async (verificationData) => {
        const data = await verifyOtpApi(verificationData);
        // data contains { success, message, token, user }
        const token = data.token;
        const role = data.user?.role || "user";
        const user = data.user;

        await AsyncStorage.setItem(
            "auth",
            JSON.stringify({ isLoggedIn: true, role, token, user })
        );
        set({ isLoggedIn: true, role, token, user });
    },

    logout: async () => {
        await AsyncStorage.removeItem("auth");
        set({ isLoggedIn: false, role: null, token: null, user: null });
    },

    restore: async () => {
        const data = await AsyncStorage.getItem("auth");
        if (data) {
            const parsed = JSON.parse(data);
            set(parsed);
        }
    },
}));
