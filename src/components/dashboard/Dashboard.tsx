"use client";

import { User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LogOut, Loader2, PlayCircle, BarChart2, Plus, Sparkles, Target, BookOpen, History, MoreVertical, Trash2 } from "lucide-react";
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
import { Edit2 } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { ColorPicker } from "../color-picker";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { StackedLogos } from "./StackedLogos";
import { TermsModal } from "./TermsModal";
import { EmptyState } from "./EmptyState";

// ... imports

export function Dashboard({ user }: DashboardProps) {
    const { t } = useLanguage();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // Rename & Delete State
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    const [stats, setStats] = useState({ overallScore: 0, totalAttempts: 0 });

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
        async function fetchData() {
            try {
                // Fetch Exams
                const examsRes = await fetch(`/api/user/exams?uid=${user.uid}`);
                const examsData = await examsRes.json();
                if (examsData.exams) {
                    setExams(examsData.exams);
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

    // Check Terms Acceptance
    useEffect(() => {
        async function checkTerms() {
            try {
                const res = await fetch(`/api/user/terms?uid=${user.uid}`);
                const data = await res.json();
                if (data.hasAcceptedTerms === false) {
                    setShowTermsModal(true);
                }
            } catch (error) {
                console.error("Failed to check terms status:", error);
            }
        }
        checkTerms();
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
                // Optional: Show success toast
            }
        } catch (error) {
            console.error("Failed to accept terms:", error);
        }
    };

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
                ) : exams.length === 0 ? (
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
                                <p className="text-6xl font-bold text-foreground">{exams.length}</p>
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
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-foreground">{t('your_question_sets')}</h2>
                                <Link
                                    href="/upload"
                                    className="px-4 py-2 bg-card hover:bg-muted text-foreground border border-border rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> {t('new_exam')}
                                </Link>
                            </div>

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
