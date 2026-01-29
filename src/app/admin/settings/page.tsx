"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Save, ToggleLeft, ToggleRight, Server, Globe, Power } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const [features, setFeatures] = useState<Record<string, boolean>>({
        maintenanceMode: false,
        betaFeatures: false,
        allowSignup: true
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        async function fetchSettings() {
            const token = await user?.getIdToken();
            const res = await fetch("/api/admin/settings", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Object.keys(data.features).length > 0) {
                    setFeatures(prev => ({ ...prev, ...data.features }));
                }
            }
            setLoading(false);
        }
        fetchSettings();
    }, [user]);

    const toggleFeature = async (key: string) => {
        const newValue = !features[key];
        setFeatures(prev => ({ ...prev, [key]: newValue }));

        try {
            const token = await user?.getIdToken();
            await fetch("/api/admin/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ feature: key, value: newValue })
            });
        } catch (e) {
            console.error("Failed to save setting");
            setFeatures(prev => ({ ...prev, [key]: !newValue })); // Revert
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black tracking-tight">System Settings</h1>
                <p className="text-muted-foreground mt-2 text-lg">Manage global configurations and feature flags</p>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-2xl">
                <div className="p-8 bg-card border border-border/50 rounded-[2.5rem] shadow-sm">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <Server className="w-6 h-6" />
                        </div>
                        Feature Flags
                    </h2>
                    <div className="space-y-4">
                        {Object.entries(features).map(([key, value]) => (
                            <div
                                key={key}
                                className={cn(
                                    "flex items-center justify-between p-5 rounded-[1.5rem] border border-transparent transition-all duration-300",
                                    value ? "bg-primary/5 border-primary/10" : "bg-secondary/30 hover:bg-secondary/50"
                                )}
                            >
                                <div className="space-y-1">
                                    <div className="font-bold text-lg capitalize tracking-tight">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                    <div className="text-sm text-muted-foreground font-medium">Toggle system-wide behavior</div>
                                </div>
                                <button
                                    onClick={() => toggleFeature(key)}
                                    className={cn(
                                        "relative w-16 h-9 rounded-full transition-all duration-300 shadow-inner flex items-center",
                                        value ? "bg-primary" : "bg-muted"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "absolute w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center",
                                            value ? "translate-x-8" : "translate-x-1"
                                        )}
                                    >
                                        {value && <Power className="w-3 h-3 text-primary" />}
                                    </span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
