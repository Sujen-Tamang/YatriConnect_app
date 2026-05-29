import api from "@/services/api";

export const getCityBusesApi = async (options?: { includeInactive?: boolean }) => {
    const endpoint = options?.includeInactive ? "/city-buses" : "/city-buses/active";
    const res = await api.get(endpoint);
    return res.data;
};

export const getCityBusEtaApi = async (busId: string) => {
    const res = await api.get(`/city-buses/eta/${busId}`);
    return res.data;
};

export const getIntercityBusesApi = async (params?: any) => {
    const res = await api.get("/buses", { params });
    return res.data;
};

export const getAvailableSeatsApi = async (busId: string) => {
    const res = await api.get(`/buses/${busId}/seats`);
    return res.data;
};

export const reserveSeatsApi = async (busId: string, seats: string[]) => {
    const res = await api.post(`/buses/${busId}/seats/reserve`, { seats });
    return res.data;
};

export const cancelReservationApi = async (busId: string, seats: string[]) => {
    const res = await api.post(`/buses/${busId}/seats/cancel-reservation`, { seats });
    return res.data;
};
