"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { QuestionCard } from "./QuestionCard";
import { Loader2, ArrowRight, ArrowLeft, Pause, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { PauseModal } from "./PauseModal";
import { SubmitModal } from "./SubmitModal";
import { ExitModal } from "./ExitModal";
import { AISidebar } from "./AISidebar";

interface ExamContainerProps {
    examId: string;
}

export function ExamContainer({ examId }: ExamContainerProps) {
    const { user } = useAuth();
    const router = useRouter();

    const [exam, setExam] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({}); // index -> optionKey
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

    useEffect(() => {
        async function loadExamAndProgress() {
            try {
                // Fetch Exam
                const res = await fetch(`/api/exam/${examId}`);
                if (!res.ok) throw new Error("Failed to load exam");
                const data = await res.json();
                setExam(data);

                // Fetch Progress
                if (user) {
                    const progRes = await fetch(`/api/exam/${examId}/progress?uid=${user.uid}`);
                    const progData = await progRes.json();
                    if (progData.progress) {
                        setAnswers(progData.progress.answers || {});
                        setCurrentQuestionIndex(progData.progress.currentQuestionIndex || 0);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadExamAndProgress();
    }, [examId, user]);

    if (loading || !exam) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];

    const handleOptionSelect = (key: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: key }));
        // Auto-advance
        setTimeout(() => {
            if (currentQuestionIndex < exam.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        }, 400);
    };

    const handleNext = () => {
        if (currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleSkip = () => {
        // If skipping, ensure we don't have an answer recorded for this index?
        // Or just move next? User said "skipped count", so we should probably not count this as answered.
        // If they previously selected an answer, clicking Skip might arguably clear it, or just ignore it.
        // For safety/clarity: Skip just moves next. If they selected, they selected. 
        // But to properly "Skip", one shouldn't answer. 
        // Let's assume Skip is just navigation here. 
        // Actually, to count "skipped", we can just count how many questions have answers at the end.
        handleNext();
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const saveProgress = async () => {
        if (!user) return;
        await fetch(`/api/exam/${examId}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.uid,
                answers,
                currentQuestionIndex,
                timestamp: new Date().toISOString()
            })
        });
    };

    const handlePause = async () => {
        setSubmitting(true); // show generic loading
        await saveProgress();
        router.push(`/exam-dashboard/${examId}`);
    };

    const handleExit = () => {
        router.push(`/exam-dashboard/${examId}`);
    };

    const handleSubmitClick = () => {
        setShowSubmitModal(true);
    };

    const handleConfirmSubmit = async () => {
        setShowSubmitModal(false);
        setSubmitting(true);

        let correctCount = 0;
        let answeredCount = 0;

        exam.questions.forEach((q: any, idx: number) => {
            if (answers[idx]) {
                answeredCount++;
                const correct = q.correct_answer || q.correctAnswer;
                if (answers[idx] === correct) {
                    correctCount++;
                }
            }
        });

        const score = (correctCount / exam.questions.length) * 100;
        const skippedCount = exam.questions.length - answeredCount;

        if (user) {
            await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examId,
                    userId: user.uid,
                    answers,
                    score,
                    skippedCount,
                    completedAt: new Date().toISOString()
                })
            });

            // Clear progress
            // Actually, we might want to keep it or delete it. Let's delete it or just ignore it next time.
            // For now, I won't explicitly delete, but logic could be added.
        }

        router.push(`/exam-dashboard/${examId}`);
    };

    if (submitting) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-3 text-white">Saving...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col transition-colors duration-500 overflow-hidden relative">
            {/* Header */}
            <header className="h-20 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 shadow-sm elevation-1">
                <div className="flex items-center gap-4">
                    <div className="text-foreground font-bold text-lg">
                        Question {currentQuestionIndex + 1} <span className="text-muted-foreground font-normal">/ {exam.questions.length}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAISidebarOpen(true)}
                        className="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" /> <span className="hidden md:inline">Ask AI</span>
                    </button>

                    {currentQuestionIndex === 0 && Object.keys(answers).length === 0 ? (
                        <button
                            onClick={() => setShowExitModal(true)}
                            className="px-6 py-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> <span className="hidden md:inline">Exit</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowPauseModal(true)}
                            className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-transparent hover:border-border rounded-full text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <Pause className="w-4 h-4" /> <span className="hidden md:inline">Pause Exam</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content Wrapper for Sidebar Shift */}
            <div className={`flex flex-col flex-1 transition-transform duration-500 ease-in-out ${isAISidebarOpen ? "md:mr-[450px]" : ""}`}>
                <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full max-w-5xl mx-auto">
                    {currentQuestion && (
                        <QuestionCard
                            question={{
                                id: currentQuestionIndex,
                                content: currentQuestion.question || currentQuestion.content,
                                options: currentQuestion.options,
                                correctAnswer: currentQuestion.correct_answer || currentQuestion.correctAnswer
                            }}
                            selectedOption={answers[currentQuestionIndex] || null}
                            onOptionSelect={handleOptionSelect}
                        />
                    )}
                </main>

                {/* Footer Navigation */}
                <footer className="h-24 border-t border-border bg-card/80 backdrop-blur-md flex items-center justify-center gap-6 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] elevation-2">
                    <button
                        onClick={handlePrev}
                        disabled={currentQuestionIndex === 0}
                        className="px-8 py-3.5 rounded-full border border-border text-foreground disabled:opacity-30 hover:bg-secondary transition-all flex items-center gap-2 font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" /> Previous
                    </button>
                    {currentQuestionIndex === exam.questions.length - 1 ? (
                        <button
                            onClick={handleSubmitClick}
                            className="px-8 py-3.5 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-bold text-lg"
                        >
                            Submit Exam <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSkip}
                            className="px-8 py-3.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-all flex items-center gap-2 font-medium text-lg border border-border"
                        >
                            Skip <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </footer>
            </div>

            <AISidebar
                isOpen={isAISidebarOpen}
                onClose={() => setIsAISidebarOpen(false)}
                questionContext={`
                    Question: ${currentQuestion?.question || currentQuestion?.content}
                    Options:
                    ${JSON.stringify(currentQuestion?.options)}
                    Correct Answer: ${currentQuestion?.correct_answer || currentQuestion?.correctAnswer}
                `}
            />

            <PauseModal
                isOpen={showPauseModal}
                onClose={() => setShowPauseModal(false)}
                onConfirm={handlePause}
            />
            <SubmitModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleConfirmSubmit}
            />
            <ExitModal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                onConfirm={handleExit}
            />
        </div>
    );
}
