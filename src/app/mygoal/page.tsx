
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Target, ArrowRight, Sparkles, BookOpen, AlertTriangle, X, Calendar, ChevronRight, Clock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { UserGoal } from "@/lib/types";
import { differenceInDays, addWeeks } from "date-fns";
import { CalendarSync } from "./CalendarSync";

type GoalStep = 'exam-selection' | 'date-selection' | 'confirmation' | 'generating' | 'roadmap';

const QUICK_EXAMS = ["UPSC CSE", "Bank PO", "SSC CGL", "NEET", "JEE Main", "CAT"];
const WEEKLY_DRILLS = [4, 8, 12, 16, 24];

export default function MyGoalPage() {
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage();

    const [goal, setGoal] = useState<UserGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<GoalStep>('exam-selection');

    // Wizard State
    const [selectedExam, setSelectedExam] = useState("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [isWeeklyDrill, setIsWeeklyDrill] = useState(false);

    // UI State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [longLoading, setLongLoading] = useState(false);
    const [generationFailed, setGenerationFailed] = useState(false);

    async function fetchGoal() {
        if (!user || generationFailed) return;
        try {
            const res = await fetch(`/api/user/goal?uid=${user.uid}`);
            const data = await res.json();

            if (generationFailed) return; // Double check

            if (data.goal) {
                setGoal(data.goal);
                if (data.goal.status === 'completed') {
                    setStep('roadmap');
                } else if (data.goal.status === 'error') {
                    setGenerationFailed(true);
                } else {
                    if (step !== 'generating') setStep('generating');
                }
            } else {
                setStep('exam-selection');
            }
        } catch (error) {
            console.error("Failed to fetch goal:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchGoal();
    }, [user]);

    // Polling for generating status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (goal?.status === 'generating' && !generationFailed) {
            console.log("Frontend: Goal status is 'generating', starting poll...");
            setStep('generating');
            interval = setInterval(() => {
                console.log("Frontend: Polling goal status...");
                fetchGoal();
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [goal?.status, generationFailed]);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (step === 'generating' || goal?.status === 'generating') {
            timeout = setTimeout(() => {
                setLongLoading(true);
            }, 10000);
        } else {
            setLongLoading(false);
        }
        return () => clearTimeout(timeout);
    }, [step, goal?.status]);

    const handleGenerateRoadmap = async () => {
        if (!user || !selectedExam || !selectedDate) {
            console.warn("Frontend: Missing data for generation", { user: !!user, selectedExam, selectedDate });
            return;
        }
        setGenerating(true);
        setGenerationFailed(false);
        console.log("Frontend: Starting generation process...");

        try {
            // 1. Save Goal
            const newGoal: Partial<UserGoal> = {
                exam: selectedExam,
                examDate: selectedDate,
                createdAt: new Date().toISOString(),
                status: 'generating'
            };

            console.log("Frontend: Saving initial goal state...");
            await fetch('/api/user/goal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid, goal: newGoal })
            });

            // Update local state to trigger polling
            setGoal(newGoal as UserGoal);

            // 2. Trigger Generation
            console.log("Frontend: Triggering generation API...");
            const daysRemaining = differenceInDays(new Date(selectedDate), new Date());

            // We await this, but if the API times out (Vercel limit), we might catch an error.
            // However, we want the polling to continue even if this request hangs/returns 504.
            // So we might not want to await it strictly blocking the UI state, but step update is fine.

            fetch('/api/user/goal/generate-roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    examName: selectedExam,
                    examDate: selectedDate,
                    daysRemaining
                })
            }).then(res => {
                console.log("Frontend: Generation API responded", res.status);
            }).catch(e => {
                console.error("Frontend: Generation API failed request", e);
            });

            setStep('generating');
        } catch (error) {
            console.error("Error creating goal:", error);
        } finally {
            // We don't set generating false here immediately if we wait for polling?
            // Actually 'generating' state on button is fine to remove, 
            // but we move to 'generating' STEP.
            setGenerating(false);
        }
    };

    // Check for stale 'generating' state on mount/update
    useEffect(() => {
        if (goal?.status === 'generating' && goal.createdAt) {
            const createdAtTime = new Date(goal.createdAt).getTime();
            const now = Date.now();
            const elapsed = now - createdAtTime;

            // If more than 60 seconds have passed since creation and it's still 'generating',
            // consider it failed/stuck.
            if (elapsed > 60000) {
                console.warn("Frontend: Goal generation appears stuck (stale > 60s). Showing error.");
                setGenerationFailed(true);
            }
        }
    }, [goal?.status, goal?.createdAt]);

    const confirmResetGoal = async () => {
        if (!user) return;

        try {
            setResetting(true);
            const res = await fetch(`/api/user/goal?uid=${user.uid}`, { method: 'DELETE' });
            if (res.ok) {
                setGoal(null);
                setStep('exam-selection');
                setSelectedExam("");
                setSelectedDate("");
                setIsWeeklyDrill(false);
                setShowResetModal(false);
            }
        } catch (error) {
            console.error("Failed to reset goal:", error);
        } finally {
            setResetting(false);
        }
    };

    const handleWeekSelect = (week: number) => {
        const element = document.getElementById(`week-card-${week}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-primary', 'scale-[1.02]');
            setTimeout(() => element.classList.remove('ring-2', 'ring-primary', 'scale-[1.02]'), 1000);
        }
    };

    const [generatingTask, setGeneratingTask] = useState(false);
    const [generatedTaskId, setGeneratedTaskId] = useState<string | null>(null);

    // We need router to redirect to dashboard after generation
    // Ensure useRouter is imported from 'next/navigation' at the top if not already (it's not, I'll check imports)

    const handleGenerateDailyTask = async () => {
        if (!user || !goal || !goal.roadmap) return;

        setGeneratingTask(true);
        try {
            // 1. Determine Current Week
            // Simple logic: Difference in weeks from start date. 
            // If strictly based on syllabus, we might pick the "next pending" week. 
            // For now, let's pick the first week if just starting, or calculated week.
            const startDate = new Date(goal.createdAt);
            const now = new Date();
            // detailed diff in weeks
            const diffTime = Math.abs(now.getTime() - startDate.getTime());
            const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

            // Current week index (1-based)
            let currentWeekIndex = diffWeeks || 1;
            if (currentWeekIndex > goal.roadmap.length) currentWeekIndex = goal.roadmap.length;

            const weekData = goal.roadmap.find(w => w.week === currentWeekIndex) || goal.roadmap[0];

            if (!weekData) {
                console.error("No week data found", { currentWeekIndex, roadmapLength: goal.roadmap.length });
                return;
            }

            console.log("Frontend: Generating Daily Task for:", {
                uid: user.uid,
                exam: goal.exam,
                week: weekData.title,
                topics: weekData.topics
            });

            // 2. Call API
            const res = await fetch('/api/user/daily-task/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    examName: goal.exam,
                    weekTitle: weekData.title,
                    topics: weekData.topics
                })
            });

            const data = await res.json();

            if (data.success) {
                // Remove redirect, show success state locally
                setGeneratedTaskId(data.taskId);
            } else {
                console.error("Failed to generate task:", data.error);
                alert("Failed to create daily task. Please try again.");
            }

        } catch (error) {
            console.error("Error generating daily task:", error);
            alert("An error occurred.");
        } finally {
            setGeneratingTask(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // --- WIZARD STEPS ---

    if (goal?.status === 'error' || generationFailed) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Roadmap Generation Failed</h1>
                <p className="text-muted-foreground mb-8 max-w-md">
                    We encountered an issue while generating your personalized roadmap. Please try again.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={confirmResetGoal}
                        className="px-8 py-3 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors"
                    >
                        Change Goal
                    </button>
                    <button
                        onClick={handleGenerateRoadmap}
                        className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'generating' || goal?.status === 'generating') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-secondary/10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -ml-32 -mb-32 animate-pulse delay-700" />

                <div className="relative z-10 flex flex-col items-center max-w-lg">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 relative">
                        <div className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-2xl animate-spin" />
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>

                    <h1 className="text-3xl font-bold mb-4 tracking-tight">{t('building_roadmap_title')}</h1>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                        {t('building_roadmap_desc')} <span className="text-primary font-bold">{selectedExam || goal?.exam}</span>.
                    </p>

                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="flex items-center gap-3 bg-card border border-border px-5 py-3 rounded-full shadow-sm animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-sm font-medium">{t('please_wait')}</span>
                        </div>

                        {longLoading && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 flex flex-col items-center gap-3">
                                <p className="text-sm text-muted-foreground">It's taking a bit longer than usual. You can explore the dashboard while we finish up.</p>
                                <Link
                                    href="/"
                                    className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-medium rounded-xl transition-colors flex items-center gap-2"
                                >
                                    Explore Homepage <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'confirmation') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <button
                        onClick={() => setStep('date-selection')}
                        className="absolute top-4 left-4 p-2 rounded-full hover:bg-secondary transition-colors"
                    >
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>

                    <div className="text-center space-y-6 pt-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-10 h-10 text-primary" />
                        </div>

                        <h2 className="text-3xl font-bold">Set Your Goal</h2>
                        <p className="text-muted-foreground">You are about to start a journey to crack <span className="text-foreground font-bold">{selectedExam}</span>.</p>

                        <div className="bg-secondary/30 rounded-2xl p-4 space-y-3 text-left">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Target Exam</span>
                                <span className="font-bold">{selectedExam}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Target Date</span>
                                <span className="font-bold">{new Date(selectedDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Duration</span>
                                <span className="font-bold">{differenceInDays(new Date(selectedDate), new Date())} Days</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateRoadmap}
                            disabled={generating}
                            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            Generate Roadmap
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'exam-selection' || step === 'date-selection') {
        return (
            <div className="min-h-screen bg-background text-foreground flex">
                {/* Left Panel - Motivational / Info */}
                <div className="hidden lg:flex w-1/2 bg-card border-r border-border p-12 flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-secondary/5 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />

                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter relative z-10 w-fit">
                        <img src="/prepmyexam.svg" alt="Logo" className="w-8 h-8" />
                        <span>PrepmyExam</span>
                    </Link>

                    <div className="relative z-10 max-w-lg">
                        {step === 'exam-selection' ? (
                            <>
                                <h1 className="text-5xl font-black tracking-tight leading-tight mb-6">
                                    "The future belongs to those who believe in the beauty of their dreams."
                                </h1>
                                <p className="text-xl text-muted-foreground">- Eleanor Roosevelt</p>
                            </>
                        ) : (
                            <>
                                <span className="text-sm font-bold text-primary uppercase tracking-widest mb-2 block">Selected Goal</span>
                                <h1 className="text-6xl font-black tracking-tighter mb-4">{selectedExam}</h1>
                                <p className="text-xl text-muted-foreground">Great choice! Now let's set a deadline to keep you on track.</p>
                            </>
                        )}
                    </div>

                    <div className="flex gap-2 relative z-10">
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'exam-selection' ? 'w-12 bg-primary' : 'w-4 bg-secondary'}`} />
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'date-selection' ? 'w-12 bg-primary' : 'w-4 bg-secondary'}`} />
                        <div className="h-1.5 w-4 rounded-full bg-secondary" /> {/* Step 3 indicator */}
                    </div>
                </div>

                {/* Right Panel - Inputs */}
                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center items-center relative">
                    <div className="w-full max-w-md space-y-8">
                        {step === 'exam-selection' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">What's your target?</h2>
                                    <p className="text-muted-foreground">Select the exam you are preparing for.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Enter exam name (e.g. UPSC CSE)"
                                            className="w-full p-4 pl-12 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                                            value={selectedExam}
                                            onChange={(e) => setSelectedExam(e.target.value)}
                                        />
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_EXAMS.map(exam => (
                                            <button
                                                key={exam}
                                                onClick={() => setSelectedExam(exam)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedExam === exam ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-secondary border-border'}`}
                                            >
                                                {exam}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep('date-selection')}
                                    disabled={!selectedExam.trim()}
                                    className="w-full py-4 bg-foreground text-background font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next Step <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {step === 'date-selection' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                                <div className="flex items-center gap-4 mb-2">
                                    <button onClick={() => setStep('exam-selection')} className="p-2 hover:bg-secondary rounded-full -ml-2">
                                        <ArrowRight className="w-5 h-5 rotate-180" />
                                    </button>
                                    <div>
                                        <h2 className="text-3xl font-bold">When is the exam?</h2>
                                        <p className="text-muted-foreground">Set your target date or choose a duration.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Toggle */}
                                    <div className="flex bg-secondary/50 p-1 rounded-xl">
                                        <button
                                            onClick={() => setIsWeeklyDrill(false)}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isWeeklyDrill ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Specific Date
                                        </button>
                                        <button
                                            onClick={() => setIsWeeklyDrill(true)}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isWeeklyDrill ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Weekly Drill
                                        </button>
                                    </div>

                                    {!isWeeklyDrill ? (
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full p-4 pl-12 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium appearance-none min-h-[56px]"
                                                value={selectedDate}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                            />
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-muted-foreground">I want a study plan for:</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {WEEKLY_DRILLS.map(weeks => (
                                                    <button
                                                        key={weeks}
                                                        onClick={() => setSelectedDate(addWeeks(new Date(), weeks).toISOString().split('T')[0])}
                                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${selectedDate === addWeeks(new Date(), weeks).toISOString().split('T')[0]
                                                            ? 'bg-primary/10 border-primary text-primary'
                                                            : 'bg-card hover:border-primary/50 border-border'
                                                            }`}
                                                    >
                                                        <Clock className="w-5 h-5 mb-1 opacity-80" />
                                                        <span className="font-bold text-lg">{weeks}</span>
                                                        <span className="text-xs opacity-70">Weeks</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setStep('confirmation')}
                                    disabled={!selectedDate}
                                    className="w-full py-4 bg-foreground text-background font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Review Goal <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- EXISTING ROADMAP VIEW (With modifications) ---

    if (!goal) return null; // Should be handled by steps above

    const daysRemaining = differenceInDays(new Date(goal.examDate), new Date());

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            {/* Header */}
            <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
                <div className="w-full px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                            <img src="/prepmyexam.svg" alt="Logo" className="w-8 h-8" />
                            <span>PrepmyExam</span>
                        </Link>
                        <div className="h-6 w-px bg-border/50 hidden sm:block" />
                        <Link href="/" className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group text-sm font-medium">
                            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                            {t('back_dashboard')}
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href={`/user/${user?.uid}`} className="relative group">
                            <div className="w-10 h-10 rounded-full border-2 border-border overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-secondary flex items-center justify-center text-lg font-bold">
                                        {user?.displayName?.[0] || "U"}
                                    </div>
                                )}
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative overflow-x-hidden">
                {/* Left Side - MATERIAL 3 DASHBOARD - FIXED */}
                <div className="fixed top-16 left-0 w-full md:w-1/2 bottom-0 hidden md:flex flex-col bg-background z-10 border-r border-border/50 p-6 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-secondary/5 pointer-events-none" />

                    <div className="h-full flex flex-col gap-6 relative z-10 w-full pt-4">

                        {/* 1. HERO SECTION */}
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">{t('current_focus')}</span>
                                <h1 className="text-6xl font-black tracking-tighter text-foreground leading-[0.9]">
                                    {t('crack')} <span className="text-primary">{goal.exam}</span>
                                </h1>
                            </div>
                            <button
                                onClick={() => setShowResetModal(true)}
                                className="p-2 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                                title={t('reset_goal')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                            </button>
                        </div>

                        {/* 2. STATS WIDGET (Surface Container) */}
                        <div className="bg-secondary/30 rounded-[28px] p-8 flex items-center justify-between relative overflow-hidden group hover:bg-secondary/40 transition-colors">
                            <div className="relative z-10">
                                <div className="text-8xl font-black text-foreground tabular-nums tracking-tighter">
                                    {daysRemaining}
                                </div>
                                <div className="text-base font-bold text-muted-foreground mt-1 uppercase tracking-wider">{t('days_to_go')}</div>
                            </div>

                            <div className="h-20 w-px bg-foreground/10 mx-6" />

                            <div className="relative z-10 text-right">
                                <div className="text-3xl font-bold text-foreground">
                                    {new Date(goal.examDate).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </div>
                                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-2">{t('target_date')}</div>
                            </div>
                        </div>

                        {/* 3. CALENDAR WIDGET */}
                        <div className="flex-1 bg-background border border-border/60 rounded-[28px] p-6 flex flex-col overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <CalendarSync goal={goal} onWeekSelect={handleWeekSelect} className="w-full h-full" />
                        </div>

                        {/* 4. ACTION BUTTON */}
                        {generatedTaskId ? (
                            <div className="flex flex-col gap-3 w-full">
                                <Link
                                    href={`/question-banks/daily_task/attempt/${generatedTaskId}`}
                                    className="w-full py-5 bg-primary text-primary-foreground font-bold text-base uppercase tracking-wider rounded-full flex items-center justify-center gap-3 hover:opacity-90 transition-all hover:scale-[1.01] shadow-lg active:scale-[0.99] animate-in fade-in slide-in-from-bottom-2"
                                >
                                    <PlayCircle className="w-5 h-5 fill-current" />
                                    <span>Start Today's Test</span>
                                </Link>
                                <button
                                    onClick={() => setGeneratedTaskId(null)}
                                    className="w-full py-3 text-muted-foreground font-medium hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleGenerateDailyTask}
                                disabled={generatingTask}
                                className="w-full py-5 bg-foreground text-background font-bold text-base uppercase tracking-wider rounded-full flex items-center justify-center gap-3 hover:opacity-90 transition-all hover:scale-[1.01] shadow-lg active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {generatingTask ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                ) : (
                                    <Sparkles className="w-5 h-5 text-primary" />
                                )}
                                <span>{generatingTask ? t('generating_task') : t('create_daily_task')}</span>
                            </button>
                        )}

                    </div>
                </div>

                {/* Right Side - Scrollable Roadmap - PRESERVED EXACTLY */}
                <div className="md:ml-[50%] w-full md:w-1/2 min-h-[calc(100vh-64px)] p-6 md:p-12 scroll-smooth" id="roadmap-container">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center justify-between md:hidden">
                            {/* Mobile View Header for Goal */}
                            <h1 className="text-2xl font-bold">
                                {t('crack')} <span className="text-primary">{goal.exam}</span>
                            </h1>
                            <div className="text-sm font-bold bg-secondary px-3 py-1 rounded-lg">
                                {daysRemaining} Days
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-primary" /> {t('study_roadmap')}
                            </h2>
                        </div>

                        <div className="relative border-l-2 border-border ml-4 md:ml-8 space-y-12 pb-12">
                            {goal.roadmap?.map((week, index) => (
                                <div
                                    key={index}
                                    id={`week-card-${week.week}`}
                                    className="relative pl-8 md:pl-12 group transition-all duration-500 ease-out"
                                >
                                    {/* Connector Dot */}
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-background transition-colors duration-300 ${index === 0 ? "bg-primary w-5 h-5 -left-[11px]" : "bg-muted-foreground/30 group-hover:bg-primary/50"
                                        }`} />

                                    <div className="space-y-4">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                            <h3 className="text-xl font-bold text-foreground">{week.title}</h3>
                                            <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-1 rounded uppercase tracking-wider">
                                                {t('week')} {week.week}
                                            </span>
                                        </div>

                                        {week.description && (
                                            <p className="text-muted-foreground italic">{week.description}</p>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {week.topics?.map((topic, i) => (
                                                <div key={i} className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-sm transition-all flex items-start gap-3 group/item">
                                                    <div className="mt-1 w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/10 transition-colors">
                                                        {/* Checkbox Placeholder */}
                                                    </div>
                                                    <span className="text-sm font-medium group-hover/item:text-foreground/80">{topic}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Custom Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                        onClick={() => !resetting && setShowResetModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => !resetting && setShowResetModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>

                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">{t('reset_goal_confirm_title')}</h3>
                                <p className="text-muted-foreground">
                                    {t('reset_goal_confirm_desc')}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    disabled={resetting}
                                    className="flex-1 py-3 rounded-xl font-bold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={confirmResetGoal}
                                    disabled={resetting}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {resetting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{t('resetting')}</span>
                                        </>
                                    ) : (
                                        t('yes_reset')
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
