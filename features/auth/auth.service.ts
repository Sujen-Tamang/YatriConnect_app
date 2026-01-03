import api from "@/services/api";

export const loginApi = async (data: any) => {
    const res = await api.post("/auth/login", data);
    return res.data;
};

export const registerApi = async (data: any) => {
    const payload = { ...data, role: "user" };
    const res = await api.post("/auth/register", payload);
    return res.data;
};

export const sendVerificationApi = async (email: string) => {
    const res = await api.post("/auth/send-verification", { email });
    return res.data;
};

export const verifyOtpApi = async (data: { email: string; otp: string }) => {
    const res = await api.post("/auth/verify-otp", data);
    return res.data;
};

export const forgotPasswordApi = async (email: string) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
};

export const resetPasswordApi = async (token: string, data: any) => {
    const res = await api.put(`/auth/reset-password/${token}`, data);
    return res.data;
};
