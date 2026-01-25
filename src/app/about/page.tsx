"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Users, Trophy, Target, Code2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommitHistory } from "@/components/github/CommitHistory";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Back to Home
                    </Link>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">About <span className="text-primary">PrepmyExam</span></h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        We are on a mission to democratize competitive exam preparation in India through technology and innovation.
                    </p>
                </div>

                <div className="grid gap-12">
                    {/* Generic sections removed */}

                    <section>
                        <h2 className="text-3xl font-bold mb-8 text-center">What Sets Us Apart</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                "AI-Driven Personalization",
                                "Comprehensive Mock Tests",
                                "Real-time Doubt Solving",
                                "Affordable Pricing",
                                "Community Support",
                                "Updated Current Affairs"
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-gradient-to-br from-card to-secondary/30 border border-border p-8 md:p-12 rounded-[2.5rem] shadow-sm">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                                <Code2 className="w-4 h-4" /> Open Source
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built with Transparency</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                We believe in the power of community. PrepmyExam is an open-source project, and we welcome contributions from developers worldwide.
                            </p>
                        </div>
                        <CommitHistory />
                    </section>
                </div>
            </main>
        </div>
    );
}
