import { socket } from '@/services/socket';

export interface BusLocation {
    busId: string;
    location: {
        lat: number;
        lng: number;
        status: string;
        busNumber: string;
    };
}

class TrackingService {
    private activeBuses: Map<string, BusLocation> = new Map();
    private listeners: Set<(buses: BusLocation[]) => void> = new Set();

    constructor() {
        this.setupSocketListeners();
    }

    private setupSocketListeners() {
        socket.on('bus-location-update', (data: BusLocation) => {
            this.activeBuses.set(data.busId, data);
            this.notifyListeners();
        });

        socket.on('bus-status-changed', ({ busId, status, active }: { busId: string; status: string; active: boolean }) => {
            if (!active) {
                this.activeBuses.delete(busId);
            }
            this.notifyListeners();
        });

        socket.on('bus-deactivated', ({ busId }: { busId: string }) => {
            this.activeBuses.delete(busId);
            this.notifyListeners();
        });

        socket.on('active-buses', (buses: Record<string, any>) => {
            this.activeBuses.clear();
            Object.entries(buses).forEach(([busId, location]) => {
                this.activeBuses.set(busId, { busId, location });
            });
            this.notifyListeners();
        });
    }

    subscribe(callback: (buses: BusLocation[]) => void) {
        this.listeners.add(callback);
        // Send current state immediately
        callback(Array.from(this.activeBuses.values()));
        return () => this.listeners.delete(callback);
    }

    private notifyListeners() {
        const buses = Array.from(this.activeBuses.values());
        this.listeners.forEach(callback => callback(buses));
    }

    requestActiveBuses() {
        socket.emit('request-buses');
    }

    trackBus(busId: string) {
        socket.emit('trackBus', busId);
    }
}

export const trackingService = new TrackingService();
