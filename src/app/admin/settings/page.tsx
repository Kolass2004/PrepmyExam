"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Save, ToggleLeft, ToggleRight, Server, Globe } from "lucide-react";

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
            <h1 className="text-3xl font-bold">System Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-card border border-border rounded-3xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Server className="w-6 h-6 text-primary" />
                        Feature Flags
                    </h2>
                    <div className="space-y-4">
                        {Object.entries(features).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                                <div>
                                    <div className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                    <div className="text-xs text-muted-foreground">Toggle system-wide behavior</div>
                                </div>
                                <button
                                    onClick={() => toggleFeature(key)}
                                    className={`transition-colors ${value ? "text-primary" : "text-muted-foreground"}`}
                                >
                                    {value ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
