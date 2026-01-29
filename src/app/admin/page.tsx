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
        <div className="space-y-8">
            <h1 className="text-4xl font-black tracking-tight">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 group-hover:text-primary transition-colors">Total Users</h3>
                    <p className="text-6xl font-black text-foreground flex items-center tracking-tighter">
                        {loading && stats.totalUsers === "--" ? <Loader2 className="w-12 h-12 animate-spin text-muted-foreground/50" /> : stats.totalUsers}
                    </p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 group-hover:text-primary transition-colors">Active Exams</h3>
                    <p className="text-6xl font-black text-foreground flex items-center tracking-tighter">
                        {loading && stats.activeExams === "--" ? <Loader2 className="w-12 h-12 animate-spin text-muted-foreground/50" /> : stats.activeExams}
                    </p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 group-hover:text-primary transition-colors">System Status</h3>
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 text-green-600 font-bold border border-green-500/20">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-lg">{stats.systemStatus}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
