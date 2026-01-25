"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { QuestionCard } from "./QuestionCard";
import { Loader2, ArrowRight, ArrowLeft, Pause, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { PauseModal } from "./PauseModal";
import { SubmitModal } from "./SubmitModal";
import { ExitModal } from "./ExitModal";
import { AISidebar } from "./AISidebar";
import { useLanguage } from "@/context/LanguageContext";

interface ExamContainerProps {
    examId: string;
}

export function ExamContainer({ examId }: ExamContainerProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();

    const [exam, setExam] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({}); // index -> optionKey
    const [loading, setLoading] = useState(true);

    const [showingFeedback, setShowingFeedback] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    useEffect(() => {
        async function loadExamAndProgress() {
            setLoading(true);
            try {
                // 1. Fetch Exam Direct from Firestore (Client-Side)
                const examRef = doc(db, "exams", examId);
                const examSnap = await getDoc(examRef);

                if (!examSnap.exists()) {
                    throw new Error("Exam not found");
                }
                const examData = examSnap.data();
                setExam(examData);

                // 2. Fetch Progress Direct from Firestore (Client-Side)
                if (user) {
                    const progressRef = doc(db, "users", user.uid, "progress", examId);
                    const progressSnap = await getDoc(progressRef);

                    if (progressSnap.exists()) {
                        const progData = progressSnap.data();
                        const savedAnswers = progData.answers || {};
                        let savedIndex = progData.currentQuestionIndex || 0;

                        // If the saved index is already answered, and it's not the last question, move to next
                        if (savedAnswers[savedIndex] && savedIndex < examData.questions.length - 1) {
                            savedIndex++;
                        }

                        setAnswers(savedAnswers);
                        setCurrentQuestionIndex(savedIndex);
                    }
                }
            } catch (err) {
                console.error("Error loading exam:", err);
            } finally {
                setLoading(false);
            }
        }
        if (user) {
            loadExamAndProgress();
        }
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
        if (showingFeedback) return;

        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: key }));
        setShowingFeedback(true);

        // Auto-advance
        setTimeout(() => {
            setShowingFeedback(false);
            if (currentQuestionIndex < exam.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        }, 2000);
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

            // Clear progress after successful submission
            try {
                await fetch(`/api/exam/${examId}/progress`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.uid })
                });
            } catch (err) {
                console.error("Failed to cleanup progress:", err);
            }
        }

        router.push(`/exam-dashboard/${examId}`);
    };

    if (submitting) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-3 text-white">{t('loading')}</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col transition-colors duration-500 overflow-hidden relative">
            {/* Header */}
            <header className="h-20 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 shadow-sm elevation-1">
                <div className="flex items-center gap-4">
                    <div className="text-foreground font-bold text-lg">
                        {t('question_idx')} {currentQuestionIndex + 1} <span className="text-muted-foreground font-normal">/ {exam.questions.length}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAISidebarOpen(true)}
                        className="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" /> <span className="hidden md:inline">{t('ask_ai')}</span>
                    </button>

                    {Object.keys(answers).length === 0 ? (
                        <button
                            onClick={() => setShowExitModal(true)}
                            className="px-6 py-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> <span className="hidden md:inline">{t('exit')}</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowPauseModal(true)}
                            className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-transparent hover:border-border rounded-full text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <Pause className="w-4 h-4" /> <span className="hidden md:inline">{t('pause')}</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content Wrapper for Sidebar Shift */}
            <div className={`flex flex-col flex-1 transition-transform duration-500 ease-in-out ${isAISidebarOpen ? "md:mr-[450px]" : ""}`}>
                <main className="flex-1 flex flex-col justify-center p-6 md:p-12 overflow-y-auto w-full max-w-5xl mx-auto">
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
                            showResult={showingFeedback || !!answers[currentQuestionIndex]}
                            isSubmitting={showingFeedback}
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
                        <ArrowLeft className="w-5 h-5" /> {t('previous')}
                    </button>
                    {currentQuestionIndex === exam.questions.length - 1 ? (
                        Object.keys(answers).length === 0 ? (
                            <button
                                onClick={() => setShowExitModal(true)}
                                className="px-8 py-3.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 border border-border shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-bold text-lg"
                            >
                                {t('close_exam')} <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitClick}
                                className="px-8 py-3.5 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-bold text-lg"
                            >
                                {t('submit_exam')} <ArrowRight className="w-5 h-5" />
                            </button>
                        )
                    ) : (
                        <button
                            onClick={handleSkip}
                            disabled={showingFeedback}
                            className="px-8 py-3.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-all flex items-center gap-2 font-medium text-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('skip')} <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </footer>
            </div>

            <AISidebar
                isOpen={isAISidebarOpen}
                onClose={() => setIsAISidebarOpen(false)}
                questionContext={`
                    Question Number: ${currentQuestionIndex + 1}
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
