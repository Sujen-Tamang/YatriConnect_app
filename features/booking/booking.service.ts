import api from "@/services/api";

export const getMyBookingsApi = async () => {
    const res = await api.get("/bookings");
    return res.data;
};

export const getBookingByIdApi = async (id: string) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
};

export const createBookingApi = async (data: any) => {
    const res = await api.post("/bookings", data);
    return res.data;
};
