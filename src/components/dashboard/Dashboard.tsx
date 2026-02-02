"use client";

import { User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LogOut, Loader2, PlayCircle, BarChart2, Plus, Sparkles, Target, BookOpen, History, MoreVertical, Trash2, Clock, Edit2 } from "lucide-react";
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

export function Dashboard({ user }: DashboardProps) {
    const { t } = useLanguage();
    const [exams, setExams] = useState<Exam[]>([]);
    const [recentExams, setRecentExams] = useState<any[]>([]);
    const [dailyTasks, setDailyTasks] = useState<any[]>([]); // New state for daily tasks
    const [deletingTask, setDeletingTask] = useState<any | null>(null); // For daily task deletion
    const [activeTab, setActiveTab] = useState<'sets' | 'recents' | 'tasks'>('sets');
    const [loading, setLoading] = useState(true);


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


    // ... previous useEffect ...

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
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user.uid]);

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
                ) : (exams.length === 0 && dailyTasks.length === 0) ? (
                    <EmptyState />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <div className="dash-item bg-primary/10 border-0 p-8 rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-shadow">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-6 relative">{t('overall_score')}</h3>
                                <p className="text-6xl font-bold text-foreground relative">{stats.overallScore.toFixed(1)}<span className="text-2xl text-muted-foreground ml-1">%</span></p>
                                <Target className="absolute bottom-6 right-6 w-16 h-16 text-primary opacity-20 pointer-events-none" />
                            </div>

                            <div className="dash-item bg-card border-0 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow">
                                <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-6">{t('exams_available')}</h3>
                                <p className="text-6xl font-bold text-foreground">{exams.length + dailyTasks.length}</p>
                                <BookOpen className="absolute bottom-6 right-6 w-16 h-16 text-muted-foreground opacity-10 pointer-events-none group-hover:text-primary group-hover:opacity-20 transition-colors" />
                            </div>

                            <div className="dash-item bg-card border-0 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow">
                                <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-6">{t('total_attempts')}</h3>
                                <p className="text-6xl font-bold text-foreground">{stats.totalAttempts}</p>
                                <History className="absolute bottom-6 right-6 w-16 h-16 text-muted-foreground opacity-10 pointer-events-none group-hover:text-primary group-hover:opacity-20 transition-colors" />
                            </div>

                            <div className="dash-item h-full">
                                <Link href="/prompt" className="group relative bg-card border-0 p-8 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all flex flex-col items-center justify-center gap-6 overflow-hidden h-full w-full">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity roun" />
                                    <StackedLogos className="w-auto h-12" />
                                    <div className="text-center relative z-10">
                                        <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{t('create_your_exams')}</h3>
                                        <p className="text-xs text-muted-foreground">{t('generate_ai_prompts')}</p>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        <section className="dash-item">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div className="flex bg-secondary/50 rounded-xl p-1 gap-1 w-full md:w-auto">
                                    <button
                                        onClick={() => setActiveTab('sets')}
                                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'sets' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('your_question_sets')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('recents')}
                                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'recents' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('recents_exam')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('tasks')}
                                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('daily_tasks')}
                                    </button>
                                </div>
                                <div className="flex items-center gap-4">
                                    {activeTab === 'sets' && (
                                        <Link
                                            href="/upload"
                                            className="px-4 py-2 bg-card hover:bg-muted text-foreground border border-border rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> {t('new_exam')}
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {activeTab === 'sets' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {exams.map(exam => (
                                        <div key={exam.id} className="group bg-card hover:bg-secondary/50 border-0 shadow-sm hover:shadow-md rounded-[24px] p-6 transition-all duration-300 relative">
                                            <Link href={`/exam-dashboard/${exam.id}`} className="block">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-primary">
                                                        <div className="w-6">
                                                            <FileIcon extension="json" {...defaultStyles.json} />
                                                        </div>
                                                    </div>
                                                    <div className="px-3 py-1 bg-secondary rounded-full text-xs font-medium text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        {formatIndianDate(exam.uploadedAt)}
                                                    </div>
                                                </div>

                                                <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{exam.title || "Untitled Exam"}</h3>
                                                <p className="text-muted-foreground text-sm mb-6 font-medium">{exam.questionCount} {t('questions')}</p>
                                            </Link>

                                            <div className="flex gap-3">
                                                <Link href={`/exam-dashboard/${exam.id}`} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md">
                                                    <PlayCircle className="w-5 h-5" /> {t('view')}
                                                </Link>

                                                {/* Menu Trigger */}
                                                <div className="relative menu-trigger">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setMenuOpenId(menuOpenId === exam.id ? null : exam.id);
                                                        }}
                                                        className="w-12 h-12 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground rounded-full transition-colors"
                                                        title="More Options"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {menuOpenId === exam.id && (
                                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-secondary border border-border rounded-xl shadow-xl overflow-hidden z-20 animate-in zoom-in-95 duration-200">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setEditingExam(exam);
                                                                    setMenuOpenId(null);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
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
                            ) : activeTab === 'recents' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recentExams.length === 0 ? (
                                        <div className="col-span-full py-20 text-center bg-secondary/20 rounded-[2rem] border border-dashed border-border">
                                            <p className="text-muted-foreground font-medium">{t('no_recent_exams')}</p>
                                        </div>
                                    ) : (
                                        recentExams.map(recent => {
                                            const progressPercent = Math.round((recent.progress.answeredCount / recent.questionCount) * 100) || 0;
                                            const href = recent.type === 'personal'
                                                ? `/exam-dashboard/${recent.id}`
                                                : `/question-banks/${recent.targetExamId}/attempt/${recent.id}`;

                                            return (
                                                <Link key={recent.id} href={href} className="group bg-card hover:bg-secondary/50 border-0 shadow-sm hover:shadow-md rounded-[24px] p-6 transition-all duration-300 flex flex-col">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                                            <div className="w-6">
                                                                <History className="w-6 h-6" />
                                                            </div>
                                                        </div>
                                                        <div className="px-3 py-1 bg-secondary rounded-full text-xs font-medium text-muted-foreground">
                                                            {new Date(recent.progress.timestamp).toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    <h3 className="text-xl font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{recent.type === 'personal' ? recent.title : `[${t('bank_label')}] ${recent.title}`}</h3>
                                                    <p className="text-muted-foreground text-sm mb-4 font-medium">{recent.progress.answeredCount} / {recent.questionCount} {t('answered')}</p>

                                                    <div className="mt-auto">
                                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-4">
                                                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                                        </div>
                                                        <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground rounded-full text-sm font-bold transition-all">
                                                            <PlayCircle className="w-5 h-5 fill-current" /> {t('continue')}
                                                        </button>
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                // TASKS TAB CONTENT
                                // TASKS TAB CONTENT
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {dailyTasks.length === 0 ? (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-secondary/10 rounded-[2rem] border border-dashed border-border text-center p-8">
                                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                                <Sparkles className="w-10 h-10 text-primary" />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2">No Daily Tasks Yet</h3>
                                            <p className="text-muted-foreground mb-8 max-w-md">
                                                Go to your Roadmap to generate a personalized daily task.
                                            </p>
                                            <Link
                                                href="/mygoal"
                                                className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
                                            >
                                                View Roadmap <Sparkles className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    ) : (
                                        dailyTasks.map(task => (
                                            <div key={task.id} className="group bg-card hover:bg-secondary/50 border-0 shadow-sm hover:shadow-md rounded-[24px] p-6 transition-all duration-300 flex flex-col relative overflow-hidden">
                                                {task.isExpired && (
                                                    <div className="absolute top-0 right-0 bg-secondary px-3 py-1 rounded-bl-xl text-xs font-bold text-muted-foreground">
                                                        EXPIRED
                                                    </div>
                                                )}

                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${task.isExpired ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                                        <div className="w-6">
                                                            <Target className="w-6 h-6" />
                                                        </div>
                                                    </div>

                                                    {/* Menu for Delete */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="px-3 py-1 bg-secondary rounded-full text-xs font-medium text-muted-foreground">
                                                            {new Date(task.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <div className="relative menu-trigger">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setMenuOpenId(menuOpenId === task.id ? null : task.id);
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground rounded-full transition-colors"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                            {menuOpenId === task.id && (
                                                                <div className="absolute right-0 top-full mt-2 w-48 bg-secondary border border-border rounded-xl shadow-xl overflow-hidden z-20 animate-in zoom-in-95 duration-200">
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

                                                <h3 className="text-xl font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{task.title}</h3>
                                                <p className="text-muted-foreground text-sm mb-4 font-medium">{task.questionCount} Questions • {task.weekTitle}</p>

                                                <div className="mt-auto">
                                                    {task.isExpired ? (
                                                        <button disabled className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-muted-foreground rounded-full text-sm font-bold cursor-not-allowed opacity-70">
                                                            <Clock className="w-5 h-5" /> Expired
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            href={`/exam-dashboard/${task.id}?type=daily_task`}
                                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-sm font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                                                        >
                                                            <PlayCircle className="w-5 h-5 fill-current" /> View Task
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </section>
                    </>
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
