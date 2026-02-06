"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
    Loader2, ArrowLeft, RefreshCcw, RotateCcw, Zap,
    CheckCircle2, XCircle, Clock, AlertTriangle, Trash2,
    Activity, FileText, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
}

interface GoalData {
    exam: string;
    examDate: string;
    createdAt: string;
}

interface ProfileData {
    status: 'active' | 'deprecated';
    consecutiveMissed: number;
    appealsUsed: number;
    lastGeneratedAt: string | null;
    lastAttemptedAt: string | null;
}

interface TaskData {
    id: string;
    title: string;
    weekNumber: number;
    weekTitle: string;
    questionCount: number;
    createdAt: string;
    expiresAt: string;
    status: string;
    score: number | null;
    attemptedAt: string | null;
}

export default function AdminDailyTaskUserDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const uid = params.uid as string;

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [goalData, setGoalData] = useState<GoalData | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [tasks, setTasks] = useState<TaskData[]>([]);

    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        if (!user || !uid) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/admin/daily-tasks/${uid}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            setUserData(data.user);
            setGoalData(data.goal);
            setProfile(data.profile);
            setTasks(data.tasks);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load user data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, uid]);

    const handleAction = async (action: string) => {
        setActionLoading(true);
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
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleGenerateTask = async () => {
        setActionLoading(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/admin/daily-tasks/${uid}/tasks`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(data.message);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteAllTasks = async () => {
        if (!confirm("This will permanently delete ALL daily tasks for this user. Are you sure?")) return;

        setActionLoading(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/admin/daily-tasks/${uid}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(data.message);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (date: string | null) => {
        if (!date) return "Never";
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!userData || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-bold">User not found or has no daily task profile</p>
                <button onClick={() => router.back()} className="mt-4 text-primary font-bold">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-black tracking-tight">{userData.displayName}</h1>
                    <p className="text-muted-foreground">{userData.email}</p>
                </div>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Card */}
                <div className="p-6 rounded-[2rem] bg-card border border-border/50">
                    <h2 className="font-bold text-lg mb-4">Daily Task Profile</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span className={cn(
                                "px-3 py-1 text-sm font-bold rounded-xl inline-flex items-center gap-2",
                                profile.status === 'active'
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-red-500/10 text-red-600"
                            )}>
                                {profile.status === 'active' ? <Activity className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {profile.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Consecutive Missed</span>
                            <span className={cn(
                                "font-bold text-xl",
                                profile.consecutiveMissed >= 2 ? "text-red-500" : "text-foreground"
                            )}>
                                {profile.consecutiveMissed}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Appeals Used</span>
                            <span className="font-bold text-xl">{profile.appealsUsed}/2</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last Generated</span>
                            <span className="text-sm font-medium">{formatDate(profile.lastGeneratedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last Attempted</span>
                            <span className="text-sm font-medium">{formatDate(profile.lastAttemptedAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Goal Card */}
                <div className="p-6 rounded-[2rem] bg-card border border-border/50">
                    <h2 className="font-bold text-lg mb-4">Goal Information</h2>
                    {goalData ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Target Exam</span>
                                <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-xl">
                                    {goalData.exam}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Exam Date</span>
                                <span className="font-medium">{goalData.examDate}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Goal Created</span>
                                <span className="text-sm font-medium">{formatDate(goalData.createdAt)}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No goal set</p>
                    )}
                </div>
            </div>

            {/* Admin Actions */}
            <div className="p-6 rounded-[2rem] bg-card border border-border/50">
                <h2 className="font-bold text-lg mb-4">Admin Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleGenerateTask}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-purple-500/10 text-purple-600 font-bold rounded-xl flex items-center gap-2 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Generate New Task
                    </button>
                    <button
                        onClick={() => handleAction('full_reset')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-500/10 text-blue-600 font-bold rounded-xl flex items-center gap-2 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Full Reset
                    </button>
                    <button
                        onClick={() => handleAction('reset_appeals')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-amber-500/10 text-amber-600 font-bold rounded-xl flex items-center gap-2 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset Appeals
                    </button>
                    {profile.status === 'active' ? (
                        <button
                            onClick={() => handleAction('deprecate')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-500/10 text-red-600 font-bold rounded-xl flex items-center gap-2 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                            <XCircle className="w-4 h-4" />
                            Deprecate Profile
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('activate')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-emerald-500/10 text-emerald-600 font-bold rounded-xl flex items-center gap-2 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Activate Profile
                        </button>
                    )}
                    <button
                        onClick={handleDeleteAllTasks}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-500/10 text-red-600 font-bold rounded-xl flex items-center gap-2 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete All Tasks
                    </button>
                </div>
            </div>

            {/* Task History */}
            <div className="p-6 rounded-[2rem] bg-card border border-border/50">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">Task History</h2>
                    <span className="text-sm text-muted-foreground">{tasks.length} tasks</span>
                </div>

                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-bold">No tasks generated yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground">{task.title}</h3>
                                        <p className="text-sm text-muted-foreground">{task.weekTitle}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={cn(
                                            "px-2 py-1 text-xs font-bold rounded-lg",
                                            task.status === 'active' && "bg-emerald-500/10 text-emerald-600",
                                            task.status === 'expired' && "bg-gray-500/10 text-gray-600",
                                            task.status === 'completed' && "bg-blue-500/10 text-blue-600"
                                        )}>
                                            {task.status}
                                        </span>
                                        {task.score !== null && (
                                            <span className="text-sm font-bold text-primary">
                                                Score: {task.score}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {task.questionCount} questions
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(task.createdAt)}
                                    </span>
                                    {task.attemptedAt && (
                                        <span className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Attempted: {formatDate(task.attemptedAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
