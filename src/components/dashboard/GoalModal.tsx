
"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Target, X, Calendar, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "date-fns";
import { User } from "firebase/auth";
import { toast } from "sonner";

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onGoalSet: () => void;
}

const EXAMS = [
    "Bank PO", "SBI Clerk", "IBPS RRB", "SSC CGL", "UPSC CSE", "Railways NTPC",
    "SSC CHSL", "SSC MTS", "RBI Grade B", "LIC AAO", "IBPS Clerk", "SBI PO",
    "TNPSC Group 1", "TNPSC Group 2", "TNPSC Group 4", "MRB", "RRB",
    "GATE", "CAT", "UPSC CDS", "UPSC EPFO"
];

export function GoalModal({ isOpen, onClose, user, onGoalSet }: GoalModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    const [selectedExam, setSelectedExam] = useState(EXAMS[0]);
    const [examDate, setExamDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Input, 2: Loading/AI, 3: Success

    useEffect(() => {
        if (isOpen) {
            const ctx = gsap.context(() => {
                gsap.fromTo(overlayRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3 }
                );
                gsap.fromTo(modalRef.current,
                    { y: 20, opacity: 0, scale: 0.95 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
                );
            });
            return () => ctx.revert();
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!examDate) return;

        // 1. Immediate UI Feedback
        onClose();
        toast.message("Building your personalized roadmap...", {
            description: "Our AI is crafting your study plan. Use the dashboard while you wait!",
            duration: 5000,
        });

        const today = new Date();
        const target = new Date(examDate);
        const diffTime = Math.abs(target.getTime() - today.getTime());
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 2. Fire & Forget (from UI perspective)
        const generatePromise = async () => {
            // Save initial status 'generating'
            const goalData = {
                exam: selectedExam,
                examDate,
                createdAt: new Date().toISOString(),
                status: 'generating'
            };

            await fetch("/api/user/goal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: user.uid, goal: goalData })
            });

            // Notify parent to refresh (so UI shows "Generating" state if on /mygoal)
            onGoalSet();

            // Trigger AI Generation
            const res = await fetch("/api/user/goal/generate-roadmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examName: selectedExam, daysRemaining, uid: user.uid })
            });

            if (!res.ok) throw new Error("Generation failed");

            // Final refresh to show results
            onGoalSet();
            return "Roadmap Ready!";
        };

        toast.promise(generatePromise(), {
            loading: 'Analyzing syllabus & previous year trends...',
            success: (data) => {
                return (
                    <div className="flex flex-col gap-2">
                        <span className="font-bold text-base">Roadmap Ready! 🚀</span>
                        <span className="text-sm text-foreground/80">Your personalized plan for {selectedExam} is live.</span>
                        <button
                            onClick={() => window.location.href = '/mygoal'}
                            className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-md w-fit mt-1 hover:opacity-90 transition-opacity"
                        >
                            View Roadmap
                        </button>
                    </div>
                );
            },
            error: 'Failed to generate roadmap. Please try again.',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                ref={modalRef}
                className="relative w-full max-w-lg bg-card border-0 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-10 -mt-10" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-full z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative z-10">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                        <Target className="w-8 h-8" />
                    </div>

                    <h3 className="text-3xl font-bold text-foreground mb-2">Set Your Goal 🎯</h3>
                    <p className="text-muted-foreground mb-8">
                        Select your target exam and date. We'll build a personalized AI roadmap for you.
                    </p>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground uppercase tracking-wider">Target Exam</label>
                            <div className="relative">
                                <select
                                    value={selectedExam}
                                    onChange={(e) => setSelectedExam(e.target.value)}
                                    className="w-full p-4 rounded-xl bg-secondary/50 border border-transparent hover:border-primary/50 focus:border-primary outline-none transition-all appearance-none cursor-pointer font-medium"
                                >
                                    {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none rotate-90" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground uppercase tracking-wider">Exam Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={examDate}
                                    onChange={(e) => setExamDate(e.target.value)}
                                    className="w-full p-4 rounded-xl bg-secondary/50 border border-transparent hover:border-primary/50 focus:border-primary outline-none transition-all font-medium"
                                />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!examDate || loading}
                            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generarting Roadmap...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 fill-current" />
                                    Generate Roadmap
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
