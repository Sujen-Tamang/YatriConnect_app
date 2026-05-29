import api from "@/services/api";

export const getMyNotificationsApi = async () => {
    const res = await api.get("/notifications/my");
    return res.data;
};

export const markNotificationReadApi = async (notificationId: string) => {
    const res = await api.put(`/notifications/${notificationId}/read`);
    return res.data;
};
