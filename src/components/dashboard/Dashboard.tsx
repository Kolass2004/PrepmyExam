"use client";

import { User } from "firebase/auth";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { Loader2, PlayCircle, Plus, Sparkles, Target, History, MoreVertical, Trash2, Clock, Edit2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { FileIcon, defaultStyles } from "react-file-icon";
import Link from "next/link";
import { LogoutModal } from "./LogoutModal";
import { DeleteExamModal } from "./DeleteExamModal";
import { formatIndianDate } from "@/lib/utils";
import { UserMenu } from "./UserMenu";

interface DashboardProps {
    user: User;
}

interface Exam {
    id: string;
    title: string;
    uploadedAt: string;
    questionCount: number;
}

import { RenameModal } from "./RenameModal";

import { ThemeToggle } from "../theme-toggle";
import { ColorPicker } from "../color-picker";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { StackedLogos } from "./StackedLogos";
import { TermsModal } from "./TermsModal";
import { EmptyState } from "./EmptyState";
import { GoalOverview } from "./GoalOverview";
import { QuestionBanksWidget } from "./QuestionBanksWidget";
import { GoalModal } from "./GoalModal";
import { UserGoal } from "@/lib/types";

import { toast } from "sonner"; // Add import

export function Dashboard({ user }: DashboardProps) {
    const { t } = useLanguage();
    // ... existing state ...

    // Insert handlers before return


    const handleViewTasks = () => {
        setActiveTab('tasks');
        const section = document.getElementById('your-content');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };
    const [exams, setExams] = useState<Exam[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recentExams, setRecentExams] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [dailyTasks, setDailyTasks] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deletingTask, setDeletingTask] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'sets' | 'recents' | 'tasks'>('sets');

    // New Goal State
    const [goal, setGoal] = useState<UserGoal | null>(null);
    const [showGoalModal, setShowGoalModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const now = useNow();


    // Modal States
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // Rename & Delete State
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const [stats, setStats] = useState({ overallScore: 0, totalAttempts: 0 });

    // Check Terms & Goal
    useEffect(() => {
        async function checkStatus() {
            try {
                // 1. Check Terms
                const termsRes = await fetch(`/api/user/terms?uid=${user.uid}`);
                const termsData = await termsRes.json();

                if (termsData.hasAcceptedTerms === false) {
                    setShowTermsModal(true);
                    return; // Stop here if terms not accepted
                }

            } catch (error) {
                console.error("Failed to check user status:", error);
            }
        }
        checkStatus();
    }, [user.uid]);

    // Check URL for tab param
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam === 'tasks') {
                setActiveTab('tasks');
            }
        }
    }, []);

    const fetchGoal = useCallback(async () => {
        try {
            const res = await fetch(`/api/user/goal?uid=${user.uid}`);
            const data = await res.json();
            if (data.goal) {
                setGoal(data.goal);
            }
        } catch (e) {
            console.error("Failed to fetch goal", e);
        }
    }, [user.uid]);

    // Fetch Dashboard Data
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Exams
                const examsRes = await fetch(`/api/user/exams?uid=${user.uid}`);
                const examsData = await examsRes.json();
                if (examsData.exams) {
                    setExams(examsData.exams);
                }

                // Fetch Recent Exams
                const recentsRes = await fetch(`/api/user/recents?uid=${user.uid}`);
                const recentsData = await recentsRes.json();
                if (recentsData.recents) {
                    setRecentExams(recentsData.recents);
                }

                // Fetch Daily Tasks
                const tasksRes = await fetch(`/api/user/daily-task?uid=${user.uid}`);
                const tasksData = await tasksRes.json();
                if (tasksData.tasks) {
                    setDailyTasks(tasksData.tasks);
                }

                // Fetch Stats
                const statsRes = await fetch(`/api/user/stats?uid=${user.uid}`);
                const statsData = await statsRes.json();
                if (statsData) {
                    setStats(statsData);
                }

                // Fetch Goal
                await fetchGoal();

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user.uid, fetchGoal]);

    const handleAcceptTerms = async () => {
        try {
            const res = await fetch("/api/user/terms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: user.uid }),
            });

            if (res.ok) {
                setShowTermsModal(false);
            }
        } catch (error) {
            console.error("Failed to accept terms:", error);
        }
    };

    const handleRename = async (newTitle: string) => {
        if (!editingExam) return;

        await fetch(`/api/exam/${editingExam.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle })
        });

        // Update local state
        setExams(prev => prev.map(e => e.id === editingExam.id ? { ...e, title: newTitle } : e));
    };

    const handleDelete = async () => {
        if (!deletingExam) return;

        try {
            await fetch(`/api/exam/${deletingExam.id}`, {
                method: "DELETE"
            });
            // Update local state
            setExams(prev => prev.filter(e => e.id !== deletingExam.id));
            setDeletingExam(null);
        } catch (error) {
            console.error("Failed to delete exam", error);
        }
    };

    const handleDeleteDailyTask = async () => {
        if (!deletingTask) return;

        try {
            await fetch(`/api/user/daily-task/${deletingTask.id}?uid=${user.uid}`, {
                method: "DELETE"
            });
            // Update local state
            setDailyTasks(prev => prev.filter(t => t.id !== deletingTask.id));
            setDeletingTask(null);
        } catch (error) {
            console.error("Failed to delete daily task", error);
        }
    };


    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuOpenId && !(event.target as Element).closest('.menu-trigger')) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [menuOpenId]);

    useEffect(() => {
        if (!loading && containerRef.current) {
            const ctx = gsap.context(() => {
                gsap.from(".dash-item", {
                    y: 20,
                    opacity: 0,
                    stagger: 0.1,
                    ease: "power2.out"
                });
            }, containerRef);
            return () => ctx.revert();
        }
    }, [loading]);

    return (
        <div ref={containerRef} className="min-h-screen bg-background p-6 md:p-12 transition-colors duration-300">
            {/* Header - PRESERVED */}
            <header className="dash-item flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 relative z-50 gap-4 md:gap-0">
                <div className="w-full md:w-auto">
                    <h1 className="text-3xl md:text-4xl text-foreground mb-2 md:mb-4">
                        {t('welcome_back')} <br className="md:hidden" />
                        {user.displayName?.split(' ')[0]} !
                    </h1>
                    <p className="hidden md:block text-5xl font-semibold text-muted-foreground">{t('ready_message')}</p>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                    <ColorPicker />
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <UserMenu user={user} onLogout={() => setShowLogoutModal(true)} />
                </div>
            </header>

            {
                loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* 1. Feature Grid: Goal & Question Banks */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 dash-item">
                            <GoalOverview
                                goal={goal}
                                onSetGoal={() => setShowGoalModal(true)}
                                onViewTasks={handleViewTasks}
                                onRefresh={fetchGoal}
                                className="lg:col-span-2 min-h-[300px]"
                            />
                            <QuestionBanksWidget className="lg:col-span-1 min-h-[300px]" />
                        </div>

                        {/* 2. Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 dash-item">
                            <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 shadow-lg shadow-primary/5 p-6 rounded-[2rem] relative overflow-hidden group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-primary text-xs font-bold uppercase tracking-wider mb-4 relative">{t('overall_score')}</h3>
                                <p className="text-5xl font-bold text-foreground relative">{stats.overallScore.toFixed(1)}<span className="text-xl text-muted-foreground ml-1">%</span></p>
                                <Target className="absolute bottom-4 right-4 w-12 h-12 text-primary opacity-20 pointer-events-none" />
                            </div>

                            <div className="bg-card border-0 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow border border-border/50">
                                <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-4">{t('total_attempts')}</h3>
                                <p className="text-5xl font-bold text-foreground">{stats.totalAttempts}</p>
                                <History className="absolute bottom-4 right-4 w-12 h-12 text-muted-foreground opacity-10 pointer-events-none group-hover:text-primary group-hover:opacity-20 transition-colors" />
                            </div>

                            <div className="bg-card border-0 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow border border-border/50">
                                <Link href="/upload" className="flex flex-col h-full justify-between relative z-10">
                                    <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-4">{t('new_exam')}</h3>
                                    <div className="flex items-center gap-2 text-primary font-bold text-lg group-hover:translate-x-1 transition-transform">
                                        Upload File <Plus className="w-5 h-5" />
                                    </div>
                                </Link>
                                <div className="absolute top-0 right-0 p-6 opacity-50">
                                    <StackedLogos className="w-auto h-8" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Your Content Section */}
                        <section id="your-content" className="dash-item bg-card/50 rounded-[2.5rem] p-6 md:p-8 border border-border/50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <h2 className="text-2xl font-bold text-foreground pl-2">{t('your_content' as any) || "Your Library"}</h2>

                                <div className="flex bg-secondary p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar">
                                    <button
                                        onClick={() => setActiveTab('sets')}
                                        className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'sets' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('your_question_sets')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('recents')}
                                        className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'recents' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('recents_exam')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('tasks')}
                                        className={`relative flex-shrink-0 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('daily_tasks')}
                                        {dailyTasks.filter(t => (new Date(t.createdAt).getTime() + 24 * 60 * 60 * 1000) > now).length > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white shadow-sm ring-2 ring-background">
                                                {dailyTasks.filter(t => (new Date(t.createdAt).getTime() + 24 * 60 * 60 * 1000) > now).length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-[200px]">
                                {activeTab === 'sets' ? (
                                    exams.length === 0 ? (
                                        <EmptyState />
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {exams.map(exam => (
                                                <div key={exam.id} className="group bg-card shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[20px] p-5 relative">
                                                    <Link href={`/exam-dashboard/${exam.id}`} className="block">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                                                <div className="w-5">
                                                                    <FileIcon extension="json" {...defaultStyles.json} />
                                                                </div>
                                                            </div>
                                                            <div className="px-2.5 py-1 bg-secondary rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                {formatIndianDate(exam.uploadedAt)}
                                                            </div>
                                                        </div>

                                                        <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">{exam.title || "Untitled Exam"}</h3>
                                                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-4">{exam.questionCount} {t('questions')}</p>
                                                    </Link>

                                                    <div className="flex gap-2">
                                                        <Link href={`/exam-dashboard/${exam.id}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-bold transition-all shadow-sm">
                                                            <PlayCircle className="w-4 h-4" /> {t('view')}
                                                        </Link>

                                                        {/* Menu Trigger */}
                                                        <div className="relative menu-trigger">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setMenuOpenId(menuOpenId === exam.id ? null : exam.id);
                                                                }}
                                                                className="w-10 h-10 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                            {menuOpenId === exam.id && (
                                                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-20 animate-in zoom-in-95 duration-200">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setEditingExam(exam);
                                                                            setMenuOpenId(null);
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors text-left"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" /> {t('rename')}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setDeletingExam(exam);
                                                                            setMenuOpenId(null);
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" /> {t('delete')}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : activeTab === 'recents' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {recentExams.length === 0 ? (
                                            <div className="col-span-full py-16 text-center bg-secondary/10 rounded-[2rem] border border-dashed border-border">
                                                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                                <p className="text-muted-foreground font-bold">{t('no_recent_exams')}</p>
                                            </div>
                                        ) : (
                                            recentExams.map(recent => {
                                                const progressPercent = Math.round((recent.progress.answeredCount / recent.questionCount) * 100) || 0;
                                                const href = recent.type === 'personal'
                                                    ? `/exam-dashboard/${recent.id}`
                                                    : `/question-banks/${recent.targetExamId}/attempt/${recent.id}`;

                                                return (
                                                    <Link key={recent.id} href={href} className="group bg-card shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[20px] p-5 flex flex-col">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                                <History className="w-5 h-5" />
                                                            </div>
                                                            <div className="px-2.5 py-1 bg-secondary rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                {new Date(recent.progress.timestamp).toLocaleDateString()}
                                                            </div>
                                                        </div>

                                                        <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">{recent.type === 'personal' ? recent.title : `[${t('bank_label')}] ${recent.title}`}</h3>
                                                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-4">{recent.progress.answeredCount} / {recent.questionCount} {t('answered')}</p>

                                                        <div className="mt-auto">
                                                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-4">
                                                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                                            </div>
                                                            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground rounded-lg text-sm font-bold transition-all">
                                                                <PlayCircle className="w-4 h-4 fill-current" /> {t('continue')}
                                                            </button>
                                                        </div>
                                                    </Link>
                                                );
                                            })
                                        )}
                                    </div>
                                ) : (
                                    // TASKS TAB CONTENT
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {dailyTasks.length === 0 ? (
                                            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-secondary/10 rounded-[2rem] border border-dashed border-border text-center p-8">
                                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                                    <Sparkles className="w-8 h-8 text-primary" />
                                                </div>
                                                <h3 className="text-xl font-bold mb-2">No Daily Tasks Yet</h3>
                                                <p className="text-muted-foreground mb-6 max-w-sm text-sm">
                                                    Go to your Roadmap to generate a personalized daily task.
                                                </p>
                                                <Link
                                                    href="/mygoal"
                                                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
                                                >
                                                    View Roadmap <Sparkles className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        ) : (
                                            dailyTasks.map(task => {
                                                const createdAt = new Date(task.createdAt).getTime();
                                                const expiresAt = createdAt + 24 * 60 * 60 * 1000;
                                                const timeLeft = expiresAt - now;
                                                const isExpired = timeLeft <= 0;

                                                return (
                                                    <div key={task.id} className="group bg-card shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[20px] p-5 flex flex-col relative overflow-hidden">
                                                        {isExpired && (
                                                            <div className="absolute top-0 right-0 bg-secondary px-3 py-1 rounded-bl-xl text-[10px] font-bold text-muted-foreground z-10">
                                                                EXPIRED
                                                            </div>
                                                        )}

                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                                                <Target className="w-5 h-5" />
                                                            </div>

                                                            {/* Menu for Delete */}
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative menu-trigger">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setMenuOpenId(menuOpenId === task.id ? null : task.id);
                                                                        }}
                                                                        className="w-8 h-8 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
                                                                    >
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </button>
                                                                    {menuOpenId === task.id && (
                                                                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-20 animate-in zoom-in-95 duration-200">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    setDeletingTask(task);
                                                                                    setMenuOpenId(null);
                                                                                }}
                                                                                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" /> {t('delete')}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">{task.title}</h3>
                                                        <p className="text-muted-foreground text-xs font-medium mb-4">{task.questionCount} Questions • {task.weekTitle}</p>

                                                        <div className="mt-auto">
                                                            {isExpired ? (
                                                                <button disabled className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-muted-foreground rounded-lg text-sm font-bold cursor-not-allowed opacity-70">
                                                                    <Clock className="w-4 h-4" /> Expired
                                                                </button>
                                                            ) : (
                                                                <Link
                                                                    href={`/exam-dashboard/${task.id}?type=daily_task`}
                                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-bold transition-all shadow-sm hover:translate-y-[-1px] active:translate-y-[0px]"
                                                                >
                                                                    <PlayCircle className="w-4 h-4 fill-current" /> {formatTimeLeft(timeLeft)}
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )
            }

            <RenameModal
                isOpen={!!editingExam}
                currentTitle={editingExam?.title || ""}
                onClose={() => setEditingExam(null)}
                onSave={handleRename}
            />

            <DeleteExamModal
                isOpen={!!deletingExam}
                examTitle={deletingExam?.title || ""}
                onClose={() => setDeletingExam(null)}
                onConfirm={handleDelete}
            />

            <DeleteExamModal
                isOpen={!!deletingTask}
                examTitle={deletingTask?.title || "Daily Task"}
                onClose={() => setDeletingTask(null)}
                onConfirm={handleDeleteDailyTask}
                description="Are you sure you want to delete this daily task? This action cannot be undone."
            />

            <GoalModal
                isOpen={showGoalModal}
                onClose={() => setShowGoalModal(false)}
                user={user}
                onGoalSet={fetchGoal}
            />

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={async () => {
                    localStorage.clear();
                    await auth.signOut();
                    window.location.reload();
                }}
            />

            <TermsModal
                isOpen={showTermsModal}
                onAccept={handleAcceptTerms}
            />
        </div >
    );
}

// Helper for countdown
function useNow() {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);
    return now;
}

function formatTimeLeft(ms: number) {
    if (ms <= 0) return "00:00:00";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
