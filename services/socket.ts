import { io } from "socket.io-client";

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || "http://192.168.1.94:4000";

export const socket = io(API_BASE, {
    transports: ["polling", "websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
});
