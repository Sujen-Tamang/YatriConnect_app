import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/store/auth.store";

export default function AuthGuard({
                                      children,
                                  }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const segments = useSegments();
    
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const role = useAuthStore((s) => s.role);

    useEffect(() => {
        // Expo-Router's useSegments can be tricky with string union types.
        // We cast to string to avoid "no overlap" TS errors.
        const firstSegment = (segments[0] as string) || "";
        const inAuthGroup = firstSegment === "(auth)";
        const atRoot = firstSegment === "" || firstSegment === "index";

        // Delay execution slightly to allow mount
        setTimeout(() => {
            if (!isLoggedIn) {
                // If not logged in and not already in (auth) group or root (index), go to index
                if (!inAuthGroup && !atRoot) {
                    router.replace("/");
                }
            } else {
                // If logged in and trying to access auth screens or root, redirect to home
                if (inAuthGroup || atRoot) {
                    if (role === 'driver') {
                        router.replace("/(tabs)/driver" as any);
                    } else {
                        router.replace("/(tabs)/home");
                    }
                }
            }
        }, 1);
    }, [isLoggedIn, segments, role]);

    return <>{children}</>;
}
