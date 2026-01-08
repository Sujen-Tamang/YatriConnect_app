import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.102:4000/api/v1",
    timeout: 10000,
});

api.interceptors.request.use(async (config) => {
    const authData = await AsyncStorage.getItem("auth");
    if (authData) {
        const { token } = JSON.parse(authData);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Unauthenticated - can trigger a global logout event here if needed
            await AsyncStorage.removeItem("auth");
        }
        return Promise.reject(error);
    }
);

export default api;
