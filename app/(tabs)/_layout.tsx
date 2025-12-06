// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { socket } from '@/services/socket';

// Define tab item type (helps TypeScript a lot)
type TabItem = {
    name: string;
    route: string;
    icon: string;
    label: string;
    filled?: boolean;
};

export default function TabLayout() {
    const role = useAuthStore((s) => s.role);
    const pathname = usePathname();

    React.useEffect(() => {
        socket.connect();
        return () => {
            socket.disconnect();
        };
    }, []);

    // @ts-ignore
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'none' }, // hide default bottom bar
            }}
        >
            <Tabs.Screen name="home" options={{}} />
            {role === 'driver' ? (
                <Tabs.Screen name="driver" options={{}} />
            ) : (
                <Tabs.Screen name="tickets" options={{}} />
            )}
            <Tabs.Screen name="profile" options={{}} />
        </Tabs>
    );
}

function FloatingNav({
                         role,
                         currentPath,
                     }: {
    role: string | null;
    currentPath: string;
}) {
    const router = useRouter();

    const tabs: TabItem[] = [
        { name: 'home', route: '/(tabs)/home', icon: 'home', label: 'Home' },
        ...(role === 'driver'
            ? [{ name: 'driver', route: '/(tabs)/driver', icon: 'directions-bus', label: 'Driver' }]
            : [{ name: 'tickets', route: '/(tabs)/tickets', icon: 'receipt', label: 'Ticket' }]),
        { name: 'profile', route: '/(tabs)/profile', icon: 'person', label: 'Profile' },
    ];

    const isActive = (route: string) => currentPath.includes(route);

    return (
        <View style={styles.floatingContainer}>
            <View style={styles.floatingBar}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.name}
                        style={[
                            styles.sideTab,
                            isActive(tab.route) && styles.sideTabActive,
                        ]}
                        onPress={() => router.replace(tab.route as any)}
                    >
                        <MaterialIcons
                            name={tab.icon as any}
                            size={24}
                            color={isActive(tab.route) ? '#59f20d' : '#9ca3af'}
                        />
                        <Text style={[styles.sideLabel, isActive(tab.route) && styles.sideLabelActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    floatingContainer: {
        position: 'absolute',
        bottom: 28,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    floatingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#1c2619',
        borderRadius: 32,
        paddingVertical: 12,
        paddingHorizontal: 16,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        width: '85%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    sideTab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sideTabActive: {
        backgroundColor: 'rgba(89, 242, 13, 0.1)',
        borderRadius: 16,
    },
    sideLabel: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 4,
        fontWeight: '500',
    },
    sideLabelActive: {
        color: '#59f20d',
        fontWeight: '600',
    },
});