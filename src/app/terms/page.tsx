"use client";

import Link from "next/link";
import { ArrowLeft, Scale, Gavel, UserX, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TermsPage() {
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
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Terms of <span className="text-primary">Service</span></h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Please read these terms carefully before using PrepmyExam platform.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        Last Updated: January 25, 2026
                    </p>
                </div>

                <div className="space-y-12">
                    <section className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                <Scale className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
                        </div>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                By accessing or using the Uvite Technologies website and PrepmyExam platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                            </p>
                        </div>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                <Gavel className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">2. Use License</h2>
                        </div>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                Permission is granted to temporarily download one copy of the materials (information or software) on Uvite Technologies' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Modify or copy the materials;</li>
                                <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                                <li>Attempt to decompile or reverse engineer any software contained on the website;</li>
                                <li>Remove any copyright or other proprietary notations from the materials; or</li>
                                <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                                <UserX className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">3. User Accounts</h2>
                        </div>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                            </p>
                            <p>
                                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                            </p>
                        </div>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">4. Disclaimer</h2>
                        </div>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                The materials on Uvite Technologies' website are provided on an "as is" basis. Uvite Technologies makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                            </p>
                        </div>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">5. Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
