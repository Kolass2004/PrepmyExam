"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
    Loader2, Users, AlertTriangle, CheckCircle2, RefreshCcw,
    RotateCcw, Zap, Search, ChevronLeft, ChevronRight,
    Activity, XCircle, Clock, Sparkles, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    exam: string;
    profile: {
        status: 'active' | 'deprecated';
        consecutiveMissed: number;
        appealsUsed: number;
        lastGeneratedAt: string | null;
        lastAttemptedAt: string | null;
    };
    latestTask: {
        title: string;
        createdAt: string;
        questionCount: number;
    } | null;
}

interface Stats {
    total: number;
    active: number;
    deprecated: number;
    totalAppealsUsed: number;
    generatedToday: number;
}

export default function AdminDailyTasksPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deprecated'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [generatingAll, setGeneratingAll] = useState(false);
    const [cleanupLoading, setCleanupLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch data
    const fetchData = async (page = 1) => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                status: statusFilter,
                search: debouncedSearch
            });

            const res = await fetch(`/api/admin/daily-tasks?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            setUsers(data.users);
            setStats(data.stats);
            setPagination(data.pagination);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1);
    }, [user, statusFilter, debouncedSearch]);

    // Action handler
    const handleAction = async (uid: string, action: string) => {
        setActionLoading(uid);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/admin/daily-tasks/${uid}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(data.message);
            fetchData(pagination.page);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Generate for user
    const handleGenerateForUser = async (uid: string) => {
        setActionLoading(uid);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/admin/daily-tasks/${uid}/tasks`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(data.message);
            fetchData(pagination.page);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Generate all
    const handleGenerateAll = async () => {
        if (!confirm("This will generate daily tasks for ALL eligible users. Continue?")) return;

        setGeneratingAll(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/admin/daily-tasks/generate-all", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(data.message);
            fetchData(1);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setGeneratingAll(false);
        }
    };

    const handleCleanup = async () => {
        if (!confirm("This will permanently delete 'unknown' users (zombie records) from the database. proceed?")) return;

        setCleanupLoading(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/admin/daily-tasks/cleanup`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast.success(data.message);
            fetchData(1);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCleanupLoading(false);
        }
    };

    const formatDate = (date: string | null) => {
        if (!date) return "Never";
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Daily Task Management</h1>
                    <p className="text-muted-foreground mt-1">Monitor and manage user daily task profiles</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCleanup}
                        disabled={cleanupLoading}
                        className="px-6 py-3 bg-red-500/10 text-red-600 font-bold rounded-2xl flex items-center gap-2 hover:bg-red-500/20 transition-all disabled:opacity-50 shadow-lg"
                    >
                        {cleanupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        {cleanupLoading ? "Cleaning up..." : "Cleanup Invalid Users"}
                    </button>
                    <button
                        onClick={handleGenerateAll}
                        disabled={generatingAll}
                        className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                    >
                        {generatingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        {generatingAll ? "Generating..." : "Generate All Tasks"}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard
                        label="Total Profiles"
                        value={stats.total}
                        icon={<Users className="w-5 h-5" />}
                        color="text-blue-500"
                    />
                    <StatCard
                        label="Active"
                        value={stats.active}
                        icon={<CheckCircle2 className="w-5 h-5" />}
                        color="text-emerald-500"
                    />
                    <StatCard
                        label="Deprecated"
                        value={stats.deprecated}
                        icon={<AlertTriangle className="w-5 h-5" />}
                        color="text-red-500"
                    />
                    <StatCard
                        label="Appeals Used"
                        value={stats.totalAppealsUsed}
                        icon={<RotateCcw className="w-5 h-5" />}
                        color="text-amber-500"
                    />
                    <StatCard
                        label="Generated Today"
                        value={stats.generatedToday}
                        icon={<Sparkles className="w-5 h-5" />}
                        color="text-purple-500"
                    />
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by email or UID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-card border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'active', 'deprecated'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-4 py-2 rounded-xl font-bold text-sm transition-all capitalize",
                                statusFilter === status
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => fetchData(pagination.page)}
                    className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                    <RefreshCcw className="w-5 h-5" />
                </button>
            </div>

            {/* User Table */}
            <div className="bg-card rounded-[2rem] border border-border/50 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Users className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-bold">No users found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary/30 border-b border-border/50">
                                <tr>
                                    <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">User</th>
                                    <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Exam</th>
                                    <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="text-center p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Missed</th>
                                    <th className="text-center p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Appeals</th>
                                    <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Last Generated</th>
                                    <th className="text-right p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {users.map((u) => (
                                    <tr key={u.uid} className="hover:bg-secondary/20 transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-bold text-foreground">{u.displayName}</p>
                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">
                                                {u.exam}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "px-2 py-1 text-xs font-bold rounded-lg inline-flex items-center gap-1",
                                                u.profile.status === 'active'
                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                    : "bg-red-500/10 text-red-600"
                                            )}>
                                                {u.profile.status === 'active' ? <Activity className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {u.profile.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={cn(
                                                "font-bold",
                                                u.profile.consecutiveMissed >= 2 ? "text-red-500" : "text-foreground"
                                            )}>
                                                {u.profile.consecutiveMissed}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-bold">{u.profile.appealsUsed}/2</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="w-4 h-4" />
                                                {formatDate(u.profile.lastGeneratedAt)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleGenerateForUser(u.uid)}
                                                    disabled={actionLoading === u.uid}
                                                    className="p-2 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                                                    title="Generate Task"
                                                >
                                                    {actionLoading === u.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleAction(u.uid, 'reset_profile')}
                                                    disabled={actionLoading === u.uid}
                                                    className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                                    title="Reset Profile"
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(u.uid, 'reset_appeals')}
                                                    disabled={actionLoading === u.uid}
                                                    className="p-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                                    title="Reset Appeals"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                                {u.profile.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleAction(u.uid, 'deprecate')}
                                                        disabled={actionLoading === u.uid}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                        title="Deprecate"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAction(u.uid, 'activate')}
                                                        disabled={actionLoading === u.uid}
                                                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                                        title="Activate"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => router.push(`/admin/daily-tasks/${u.uid}`)}
                                                    className="px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs font-bold transition-colors"
                                                >
                                                    Details
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-border/50">
                        <span className="text-sm text-muted-foreground">
                            Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchData(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fetchData(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    return (
        <div className="p-6 rounded-[1.5rem] bg-card border border-border/50 hover:shadow-lg transition-all">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color.replace('text-', 'bg-').replace('500', '500/10'))}>
                <span className={color}>{icon}</span>
            </div>
            <p className="text-3xl font-black text-foreground">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
        </div>
    );
}
