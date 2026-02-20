import { useState, useEffect } from 'react';
import { trackingService, BusLocation } from './tracking.service';

export const useBusTracking = () => {
    const [activeBuses, setActiveBuses] = useState<BusLocation[]>([]);

    useEffect(() => {
        const unsubscribe = trackingService.subscribe(setActiveBuses);
        return () => { unsubscribe(); };
    }, []);

    return {
        activeBuses,
        requestActiveBuses: trackingService.requestActiveBuses.bind(trackingService),
        trackBus: trackingService.trackBus.bind(trackingService),
    };
};