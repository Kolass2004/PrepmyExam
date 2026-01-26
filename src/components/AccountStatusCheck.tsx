"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { AlertTriangle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function AccountStatusCheck() {
    const { user } = useAuth();
    const [disabled, setDisabled] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            setDisabled(false);
            return;
        }

        const checkStatus = async () => {
            try {
                const token = await user.getIdToken();
                const res = await fetch("/api/user/status", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.disabled) {
                        setDisabled(true);
                    } else {
                        setDisabled(false); // Can re-enable if admin re-enables
                    }
                }
            } catch (e) {
                // Ignore network errors, don't block user if just offline slightly
                console.error("Status check failed", e);
            }
        };

        // Check immediately
        checkStatus();

        // Poll every 30 seconds
        const interval = setInterval(checkStatus, 30000);

        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = async () => {
        await signOut(auth);
        setDisabled(false);
        router.push("/auth/login");
    };

    if (!disabled) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8" />
                    </div>

                    <h2 className="text-2xl font-bold text-foreground">Account Access Suspended</h2>

                    <div className="text-muted-foreground">
                        <p>Your account has been administratively disabled.</p>
                        <p className="mt-2 text-sm">If you believe this is an error, please contact support.</p>
                    </div>

                    <div className="w-full pt-4">
                        <button
                            onClick={handleLogout}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
