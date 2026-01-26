"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function MaintenanceCheck() {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Skip check for admin routes to avoid locking out admins
        if (pathname?.startsWith("/admin")) return;

        const checkStatus = async () => {
            try {
                const res = await fetch("/api/system/status");
                const data = await res.json();

                if (data.maintenanceMode) {
                    if (pathname !== "/maintenance") {
                        router.push("/maintenance");
                    }
                } else {
                    if (pathname === "/maintenance") {
                        router.push("/");
                    }
                }
            } catch (error) {
                console.error("Failed to check system status");
            }
        };

        // Check immediately
        checkStatus();

        // Optional: Poll every 30 seconds to catch updates live
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [pathname, router]);

    return null;
}
