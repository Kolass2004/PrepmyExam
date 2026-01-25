"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Lock, FileText, Eye } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PrivacyPage() {
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
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Privacy <span className="text-primary">Policy</span></h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Your privacy is important to us. We are committed to protecting your personal data.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        Last Updated: January 25, 2026
                    </p>
                </div>

                <div className="space-y-12">
                    <section className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">1. Information We Collect</h2>
                        </div>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                We collect information you provide directly to us when you create an account, update your profile, or communicate with us. This includes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Personal Information:</strong> Name, email address, and phone number (optional).</li>
                                <li><strong>Account Information:</strong> Profile picture and login credentials (managed securely via Firebase).</li>
                                <li><strong>Usage Data:</strong> Information about how you use our platform, including exam performance, time spent on questions, and feature usage.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                <Eye className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">2. How We Use Your Information</h2>
                        </div>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>We use the collected information to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Provide, maintain, and improve our services.</li>
                                <li>Personalize your learning experience with AI-driven recommendations.</li>
                                <li>Process analytical data to show you your progress and performance stats.</li>
                                <li>Send you technical notices, updates, security alerts, and support messages.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">3. Data Security</h2>
                        </div>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
                            </p>
                            <p>
                                We use Google Firebase for authentication and database services, which provides industry-standard security and encryption.
                            </p>
                        </div>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">4. Your Rights</h2>
                        </div>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>You have the right to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Access the personal information we hold about you.</li>
                                <li>Request correction of inaccurate information.</li>
                                <li>Request deletion of your account and personal data.</li>
                                <li>Opt-out of marketing communications.</li>
                            </ul>
                            <p className="mt-4">
                                To exercise these rights, please contact us at <a href="mailto:raniv2057@gmail.com" className="text-primary hover:underline">raniv2057@gmail.com</a>.
                            </p>
                        </div>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">5. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-secondary/50 rounded-xl">
                            <p className="font-medium">Uvite Technologies</p>
                            <p className="text-muted-foreground">raniv2057@gmail.com</p>
                            <p className="text-muted-foreground">Dindigul, Tamil Nadu - 624215</p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
