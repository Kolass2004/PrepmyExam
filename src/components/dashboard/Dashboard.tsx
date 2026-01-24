"use client";

import { User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LogOut, Loader2, PlayCircle, BarChart2, Plus, Sparkles } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { FileIcon, defaultStyles } from "react-file-icon";
import Link from "next/link";
import { LogoutModal } from "./LogoutModal";
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
import { StackedLogos } from "./StackedLogos";

export function Dashboard({ user }: DashboardProps) {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Rename State
    const [editingExam, setEditingExam] = useState<Exam | null>(null);

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
                        Welcome back, <br className="md:hidden" />
                        {user.displayName?.split(' ')[0]} !
                    </h1>
                    <p className="hidden md:block text-5xl font-semibold text-muted-foreground">Ready to continue your preparation?</p>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                    <ColorPicker />
                    <ThemeToggle />
                    <UserMenu user={user} onLogout={() => setShowLogoutModal(true)} />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="dash-item bg-primary/10 border-0 p-8 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-2 relative">Overall Score</h3>
                    <p className="text-5xl font-bold text-foreground relative">{loading ? "--" : stats.overallScore.toFixed(1)}<span className="text-2xl text-muted-foreground ml-1">%</span></p>
                </div>

                <div className="dash-item bg-card border-0 p-8 rounded-[2rem] shadow-sm">
                    <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-2">Exams Available</h3>
                    <p className="text-5xl font-bold text-foreground">{exams.length}</p>
                </div>

                <div className="dash-item bg-card border-0 p-8 rounded-[2rem] shadow-sm">
                    <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-2">Total Attempts</h3>
                    <p className="text-5xl font-bold text-foreground">{loading ? "-" : stats.totalAttempts}</p>
                </div>

                <div className="dash-item h-full">
                    <Link href="/prompt" className="group relative bg-card border-0 p-8 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all flex flex-col items-center justify-center gap-6 overflow-hidden h-full w-full">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity roun" />
                        <StackedLogos className="w-auto h-12" />
                        <div className="text-center relative z-10">
                            <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Prompt Creator</h3>
                            <p className="text-xs text-muted-foreground">Generate AI Prompts</p>
                        </div>
                    </Link>
                </div>
            </div>

            <section className="dash-item">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Your Question Sets</h2>
                    <Link
                        href="/upload"
                        className="px-4 py-2 bg-card hover:bg-muted text-foreground border border-border rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Exam
                    </Link>
                </div>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : exams.length === 0 ? (
                    <div className="p-8 border border-dashed border-border rounded-3xl flex items-center justify-center text-muted-foreground bg-card/30">
                        No exams found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map(exam => (
                            <div key={exam.id} className="group bg-card hover:bg-secondary/50 border-0 shadow-sm hover:shadow-md rounded-[24px] p-6 transition-all duration-300">
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
                                    <p className="text-muted-foreground text-sm mb-6 font-medium">{exam.questionCount} Questions</p>
                                </Link>

                                <div className="flex gap-3">
                                    <Link href={`/exam-dashboard/${exam.id}`} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md">
                                        <PlayCircle className="w-5 h-5" /> View
                                    </Link>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation(); // Prevent navigation
                                            setEditingExam(exam);
                                        }}
                                        className="w-12 h-12 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground rounded-full transition-colors group-hover/edit:text-primary"
                                        title="Rename Exam"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <RenameModal
                isOpen={!!editingExam}
                currentTitle={editingExam?.title || ""}
                onClose={() => setEditingExam(null)}
                onSave={handleRename}
            />

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => {
                    localStorage.clear();
                    auth.signOut();
                }}
            />
        </div>
    );
}
