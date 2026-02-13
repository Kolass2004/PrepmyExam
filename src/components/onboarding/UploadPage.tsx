"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface UploadPageProps {
    onUploadSuccess: () => void;
}

export function UploadPage({ onUploadSuccess }: UploadPageProps) {
    const { user } = useAuth();
    const { t } = useLanguage();

    const [jsonContent, setJsonContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".anim-item", {
                y: 20,
                opacity: 0,
                stagger: 0.1,
                duration: 0.6,
                ease: "power2.out"
            });
        }, containerRef);

        // Check for pending paste
        const pending = localStorage.getItem("pendingExamUpload");
        if (pending) {
            setJsonContent(pending);
            localStorage.removeItem("pendingExamUpload");
            // Optional: You could show a small toast here
        }

        return () => ctx.revert();
    }, []);

    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);

        try {
            let data;
            let title = null;
            try {
                const parsed = JSON.parse(jsonContent);
                if (Array.isArray(parsed)) {
                    // Check if it's an array of questions or an array wrapper around an exam object
                    if (parsed.length > 0 && parsed[0].questions && Array.isArray(parsed[0].questions)) {
                        // Case: [{ title: "...", questions: [...] }]
                        data = parsed[0].questions;
                        if (parsed[0].title) title = parsed[0].title;
                    } else {
                        // Case: [ {id:1, ...}, {id:2, ...} ]
                        data = parsed;
                    }
                } else if (parsed.questions && Array.isArray(parsed.questions)) {
                    data = parsed.questions;
                    if (parsed.title) title = parsed.title;
                } else {
                    throw new Error("Invalid structure");
                }
            } catch (e) {
                throw new Error("Invalid JSON format. Expected an array of questions or an object with 'questions' array.");
            }

            const res = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questions: data, userId: user.uid, title }),
            });

            if (!res.ok) throw new Error("Failed to save data");

            onUploadSuccess();
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center p-6 bg-background transition-colors duration-500 relative">
            <Link
                href="/"
                className="absolute top-6 left-6 md:top-12 md:left-12 inline-flex items-center gap-2 text-muted-foreground text-primary transition-colors px-4 py-2 bg-secondary rounded-full font-medium"
            >
                <ArrowLeft className="w-4 h-4" /> {t('back_dashboard')}
            </Link>

            <div className="anim-item w-full max-w-2xl text-center mb-10 mt-12 md:mt-0">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-4 tracking-tight">
                    {t('upload_welcome')}
                </h2>
                <p className="text-muted-foreground text-lg">
                    {t('upload_desc')}
                </p>
            </div>

            <div className="anim-item w-full max-w-3xl bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl elevation-2">
                <div className="p-8">
                    <textarea
                        value={jsonContent}
                        onChange={(e) => setJsonContent(e.target.value)}
                        placeholder='{ "questions": [...] }'
                        className="w-full h-64 bg-secondary/50 border border-input rounded-2xl p-4 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={!jsonContent || isLoading}
                            className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                t('processing')
                            ) : (
                                <>
                                    {t('continue')} <CheckCircle2 className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Your Own Exam CTA */}
            <div className="anim-item w-full max-w-3xl mt-6">
                <Link href="/prompt" className="group relative block w-full p-[1px] rounded-2xl bg-gradient-to-r from-primary via-accent to-primary overflow-hidden">
                    <div className="relative flex items-center justify-between gap-4 bg-card rounded-2xl px-8 py-5 transition-all group-hover:bg-card/80">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-foreground font-bold text-base">Create Your Own Exam</h3>
                                <p className="text-muted-foreground text-sm">Generate custom exams with AI — just describe what you need</p>
                            </div>
                        </div>
                        <div className="text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform whitespace-nowrap">Try it →</div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
