import api from "@/services/api";

export const getMySubscriptionApi = async () => {
    const res = await api.get("/subscriptions/my-subscription");
    return res.data;
};

export const initiateSubscriptionApi = async (data: any) => {
    const res = await api.post("/subscriptions/initiate", data);
    return res.data;
};

export const verifySubscriptionPaymentApi = async (data: any) => {
    const res = await api.post("/subscriptions/verify", data);
    return res.data;
};
