"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Question {
    id: string | number;
    content: string; // Markdown supported
    options: Record<string, string>; // e.g. { "a": "Option A", "b": "Option B" }
    correctAnswer: string;
}

interface QuestionCardProps {
    question: Question;
    selectedOption: string | null;
    onOptionSelect: (optionKey: string) => void;
    showResult?: boolean;
    isSubmitting?: boolean;
}

export function QuestionCard({ question, selectedOption, onOptionSelect, showResult = false, isSubmitting = false }: QuestionCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Animate when question changes
    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(cardRef.current,
                { opacity: 0, x: 20 },
                { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
            );
        }
    }, [question.id]);

    return (
        <div ref={cardRef} className="w-full max-w-4xl mx-auto">
            <div className="bg-card backdrop-blur-md border-0 rounded-[2.5rem] p-8 md:p-12 shadow-xl elevation-2">
                <div className="prose prose-lg dark:prose-invert max-w-none mb-10 text-foreground">
                    {/* Render Question Content (Markdown) */}
                    <div className="font-bold text-xl md:text-3xl"><ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {question.content}
                    </ReactMarkdown></div>
                </div>

                <div className="grid gap-4">
                    {Object.entries(question.options)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, value]) => {
                            const isSelected = selectedOption === key;
                            const isCorrect = key === question.correctAnswer;

                            let containerClass = "bg-secondary hover:bg-secondary/80 border-0";
                            let icon = <Circle className="w-6 h-6 text-muted-foreground" />;
                            let textClass = "text-foreground";

                            if (showResult) {
                                if (isCorrect) {
                                    if (isSelected) {
                                        // Correct and Selected: Green Background
                                        containerClass = "bg-green-500/10 ring-2 ring-green-500";
                                        icon = <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500" />;
                                        textClass = "text-green-700 dark:text-green-300 font-bold";
                                    } else {
                                        // Correct but NOT selected: Green Ring/Outline (if user was wrong)
                                        // If user was right, this block won't be relevant for the correct answer since isSelected would be true.
                                        // But if user picked something else, this block runs for the correct answer.
                                        // We should only emphasize this if the user picked WRONG.
                                        // BUT, standard behavior is usually to always show the correct answer.
                                        // User said: "if they clicked wrong option ... show green outline one the correct answer"
                                        containerClass = "bg-green-500/5 ring-1 ring-green-500 border border-transparent";
                                        icon = <CheckCircle2 className="w-6 h-6 text-green-500 opacity-70" />;
                                        textClass = "text-green-600 dark:text-green-400 font-medium";
                                    }
                                } else if (isSelected) {
                                    // Selected but NOT correct: Red Background
                                    containerClass = "bg-red-500/10 ring-2 ring-red-500";
                                    icon = <Circle className="w-6 h-6 text-red-600 dark:text-red-500" />;
                                    textClass = "text-red-700 dark:text-red-300 font-bold";
                                }
                            } else if (isSelected) {
                                containerClass = "bg-primary/10 ring-2 ring-primary";
                                icon = <CheckCircle2 className="w-6 h-6 text-primary" />;
                                textClass = "text-primary font-bold";
                            }

                            return (
                                <button
                                    key={key}
                                    onClick={() => !showResult && onOptionSelect(key)}
                                    disabled={showResult}
                                    className={cn(
                                        "flex items-center gap-5 w-full text-left p-5 rounded-[1.25rem] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.99]",
                                        containerClass
                                    )}
                                >
                                    <div className="flex-shrink-0">
                                        {icon}
                                    </div>
                                    <div className={cn("flex-1 text-lg", textClass)}>
                                        <span className="opacity-50 mr-3 uppercase text-sm font-bold tracking-wider">{key}</span>
                                        {value}
                                    </div>
                                    {isSelected && isSubmitting && (
                                        <div className="flex-shrink-0 animate-in fade-in zoom-in duration-300">
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
