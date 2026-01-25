"use client";

import Link from "next/link";
import { Sparkles, Upload, ArrowRight } from "lucide-react";
import { StackedLogos } from "./StackedLogos";

export function EmptyState() {
    return (
        <div className="w-full max-w-5xl mx-auto py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 px-4">
                {/* AI Prompt Option */}
                <Link
                    href="/prompt"
                    className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-transparent border border-primary/20 p-8 md:p-12 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110" />

                    <div className="relative z-10 flex flex-col h-full items-start">
                        <div className="mb-8">
                            <div className="bg-secondary/50 backdrop-blur-sm p-1.5 rounded-full inline-block border border-border/50">
                                <StackedLogos className="gap-1.5" />
                            </div>
                        </div>

                        <h3 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">Create your Exams</h3>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-sm">
                            Use our AI-powered tool to generate custom exam prompts tailored to your syllabus and needs.
                        </p>

                        <div className="mt-auto flex items-center gap-2 text-primary font-bold group-hover:gap-3 transition-all text-lg">
                            Start Creating <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                </Link>

                {/* Upload Option */}
                <Link
                    href="/upload"
                    className="group relative overflow-hidden rounded-[2.5rem] bg-card border border-border p-8 md:p-12 hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary rounded-full blur-3xl -ml-32 -mb-32 transition-transform group-hover:scale-110" />

                    <div className="relative z-10 flex flex-col h-full items-start">
                        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-foreground mb-8 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-border/50">
                            <Upload className="w-8 h-8" />
                        </div>

                        <h3 className="text-3xl font-bold mb-4 text-foreground">Upload New Exam</h3>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-sm">
                            Already have a question set? Upload your JSON file directly to start practicing immediately.
                        </p>

                        <div className="mt-auto flex items-center gap-2 text-foreground font-bold group-hover:gap-3 transition-all text-lg">
                            Upload Now <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
