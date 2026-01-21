import api from "@/services/api";

export const initiateKhaltiPaymentApi = async (data: {
    amount: number;
    busId: string;
    seats: string[];
    journeyDate: string;
}) => {
    const res = await api.post("/payments/khalti/initiate", data);
    return res.data;
};

export const verifyKhaltiPaymentApi = async (pidx: string, bookingId?: string) => {
    const res = await api.post(`/payments/khalti/verify${bookingId ? `?booking=${bookingId}` : ''}`, { pidx });
    return res.data;
};
