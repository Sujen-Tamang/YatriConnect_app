import { create } from "zustand";
import { getCityBusesApi, getIntercityBusesApi } from "@/features/bus/bus.service";

export type Point = {
    name: string;
    lat: number;
    lng: number;
};

export type RouteInfo = {
    from: Point | string;
    to: Point | string;
    stops: (Point | string)[];
    distance?: number;
    duration?: number;
};

export type CurrentLocation = {
    lat: number;
    lng: number;
    updatedAt?: string;
};

export type CityBus = {
    _id: string;
    busNumber: string;
    route: RouteInfo | string; // unified type
    currentLocation?: Point | string; 
    schedule?: any;
    yatayatName?: string;
    active?: boolean;
    status?: 'on-route' | 'break' | 'offline';
};

export type IntercityBus = {
    id: string; // the backend uses id for this endpoint instead of _id in data mapper
    yatayatName: string;
    busNumber: string;
    route: RouteInfo;
    schedule: {
        departure: string;
        arrival: string;
        frequency: string;
    };
    availableSeats: number;
    price: number;
    amenities: string[];
};

type BusState = {
    cityBuses: CityBus[];
    intercityBuses: IntercityBus[];
    loading: boolean;
    error: string | null;
    fetchBuses: (options?: { includeInactive?: boolean }) => Promise<void>;
};

export const useBusStore = create<BusState>((set) => ({
    cityBuses: [],
    intercityBuses: [],
    loading: false,
    error: null,

    fetchBuses: async (options) => {
        set({ loading: true, error: null });
        try {
            // Fetch both endpoints concurrently
            const [cityRes, interRes] = await Promise.all([
                getCityBusesApi(options),
                getIntercityBusesApi()
            ]);

            set({
                cityBuses: Array.isArray(cityRes) ? cityRes : (cityRes?.data || []),
                intercityBuses: Array.isArray(interRes) ? interRes : (interRes?.data || []),
                loading: false
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || "Failed to fetch buses",
                loading: false
            });
        }
    }
}));
