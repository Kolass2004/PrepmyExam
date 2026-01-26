"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalUsers: "--", activeExams: "--", systemStatus: "Checking..." });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchStats() {
            try {
                const token = await user?.getIdToken();
                const res = await fetch("/api/admin/stats", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats({
                        totalUsers: data.totalUsers.toString(),
                        activeExams: data.activeExams.toString(),
                        systemStatus: data.systemStatus
                    });
                }
            } catch (e) {
                console.error(e);
                setStats(prev => ({ ...prev, systemStatus: "Error" }));
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [user]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-secondary/30 border border-border">
                    <h3 className="text-lg font-bold mb-2">Total Users</h3>
                    <p className="text-4xl font-black text-primary flex items-center">
                        {loading && stats.totalUsers === "--" ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /> : stats.totalUsers}
                    </p>
                </div>
                <div className="p-6 rounded-3xl bg-secondary/30 border border-border">
                    <h3 className="text-lg font-bold mb-2">Active Exams</h3>
                    <p className="text-4xl font-black text-primary flex items-center">
                        {loading && stats.activeExams === "--" ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /> : stats.activeExams}
                    </p>
                </div>
                <div className="p-6 rounded-3xl bg-secondary/30 border border-border">
                    <h3 className="text-lg font-bold mb-2">System Status</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-600 text-sm font-bold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {stats.systemStatus}
                    </div>
                </div>
            </div>
        </div>
    );
}
