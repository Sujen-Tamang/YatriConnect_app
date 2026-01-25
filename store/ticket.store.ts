import { create } from "zustand";
import { getMyBookingsApi } from "@/features/booking/booking.service";
import { getMySubscriptionApi } from "@/features/subscription/subscription.service";

export type Booking = {
    _id: string;
    bookingId: string;
    bus: {
        _id: string;
        busNumber: string;
        yatayatName: string;
        route: any;
    };
    seats: string[];
    travelDate: string;
    totalPrice: number;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
    createdAt: string;
};

export type SubscriptionData = {
    _id: string;
    planType: 'weekly' | 'monthly' | 'yearly';
    startDate: string;
    endDate: string;
    status: 'active' | 'expired' | 'cancelled' | 'pending';
};

type TicketState = {
    bookings: Booking[];
    activeSubscription: SubscriptionData | null;
    loading: boolean;
    error: string | null;
    fetchTickets: () => Promise<void>;
};

export const useTicketStore = create<TicketState>((set) => ({
    bookings: [],
    activeSubscription: null,
    loading: false,
    error: null,

    fetchTickets: async () => {
        set({ loading: true, error: null });
        try {
            const [bookingRes, subRes] = await Promise.all([
                getMyBookingsApi(),
                getMySubscriptionApi()
            ]);

            set({
                bookings: bookingRes.data || [],
                activeSubscription: subRes.data || null,
                loading: false
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || "Failed to fetch tickets",
                loading: false
            });
        }
    }
}));
