"use client";

import Link from "next/link";
import { LoginButton } from "@/components/auth/LoginButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    BookOpen,
    Target,
    TrendingUp,
    Users,
    Award,
    CheckCircle2,
    BrainCircuit,
    GraduationCap,
    Landmark,
    Train,
    Scale,
    Building2,
    Menu,
    X
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function LoginPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Hero Animation
            const tl = gsap.timeline();
            tl.from(".hero-content > *", {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power4.out"
            });

            // Section Animations
            gsap.utils.toArray(".reveal-section").forEach((section: any) => {
                gsap.from(section, {
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    },
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out"
                });
            });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    const categories = [
        { title: "Banking & Insurance", icon: <Landmark className="w-8 h-8" />, exams: "IBPS PO, SBI PO, RBI Grade B, LIC AAO", color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Central Govt", icon: <Building2 className="w-8 h-8" />, exams: "SSC CGL, CHSL, MTS, CPO", color: "text-amber-500", bg: "bg-amber-500/10" },
        { title: "UPSC & State PSC", icon: <Scale className="w-8 h-8" />, exams: "UPSC CSE, TNPSC, KPSC, UPPSC", color: "text-purple-500", bg: "bg-purple-500/10" },
        { title: "Railways", icon: <Train className="w-8 h-8" />, exams: "RRB NTPC, Group D, ALP", color: "text-green-500", bg: "bg-green-500/10" },
    ];

    const features = [
        { title: "AI-Powered Tutoring", desc: "Get instant doubt resolution and personalized explanations from our advanced AI tutor.", icon: <BrainCircuit className="w-10 h-10" /> },
        { title: "Real Exam Interface", desc: "Practice in an environment that exactly mimics the actual exam interface to boost confidence.", icon: <Target className="w-10 h-10" /> },
        { title: "Smart Analytics", desc: "Track your performance with deep insights and improve your weak areas systematically.", icon: <TrendingUp className="w-10 h-10" /> },
    ];

    return (
        <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <GraduationCap className="w-8 h-8 text-primary" />
                        <span>PrepmyExam</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {/* Spacer or additional links if needed */}
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm font-medium hover:text-primary transition-colors">Home</button>
                        <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
                        <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">Contact Us</Link>
                        <ThemeToggle />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-foreground"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="absolute top-16 left-0 w-full bg-background border-b border-border p-6 flex flex-col gap-6 shadow-2xl md:hidden animate-in slide-in-from-top-4">
                        <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setIsMobileMenuOpen(false); }} className="text-lg font-medium hover:text-primary transition-colors text-left">Home</button>
                        <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary transition-colors">About</Link>
                        <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary transition-colors">Contact Us</Link>
                        <div className="flex items-center justify-between border-t border-border pt-4">
                            <span className="text-sm text-muted-foreground">Switch Theme</span>
                            <ThemeToggle />
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <header ref={heroRef} className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
                <div className="absolute right-0 top-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />
                <div className="absolute left-0 bottom-0 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] -z-10" />

                <div className="max-w-4xl mx-auto text-center hero-content">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
                        <Award className="w-4 h-4 text-primary" /> #1 Platform for Indian Competitive Exams
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-balance">
                        Master Your <span className="text-primary">Competitive Exams</span> with Confidence
                    </h1>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
                        Comprehensive preparation for Banking, SSC, UPSC, Railways, and State PSCs with AI-powered tutoring and real-time analytics.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div className="p-1 rounded-xl bg-gradient-to-r from-primary to-amber-500 p-[1px]">
                            <div className="bg-background rounded-[11px]">
                                <LoginButton className="w-full sm:w-auto text-lg px-8 py-6 h-auto shadow-none border-0" text="Start Preparing Now" />
                            </div>
                        </div>

                    </div>

                    <div className="mt-16 flex items-center justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholder Logos */}
                        <span className="text-2xl font-black text-muted-foreground">IBPS</span>
                        <span className="text-2xl font-black text-muted-foreground">SSC</span>
                        <span className="text-2xl font-black text-muted-foreground">UPSC</span>
                        <span className="text-2xl font-black text-muted-foreground">RRB</span>
                    </div>
                </div>
            </header>

            {/* Categories Section */}
            <section className="py-20 px-6 bg-secondary/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 reveal-section">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Exams We Cover</h2>
                        <p className="text-lg text-muted-foreground">Everything you need for Central and State government exams.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 reveal-section">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="bg-card hover:bg-card/50 border border-border p-6 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-1 group">
                                <div className={`w-14 h-14 ${cat.bg} ${cat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    {cat.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{cat.exams}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center reveal-section">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Choose Examprep?</h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                We combine cutting-edge technology with expert-curated content to give you the competitive edge.
                            </p>

                            <div className="space-y-6">
                                {features.map((feat, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                            {feat.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold mb-1">{feat.title}</h4>
                                            <p className="text-muted-foreground">{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-amber-500/20 rounded-3xl blur-3xl" />
                            <div className="relative bg-card border border-border rounded-3xl p-8 shadow-2xl">
                                {/* Mock UI for Feature Showcase */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="h-4 w-32 bg-secondary rounded-full" />
                                        <div className="h-8 w-8 bg-green-500/20 rounded-full" />
                                    </div>
                                    <div className="h-32 bg-secondary/50 rounded-xl w-full mb-4" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-12 bg-primary/10 border border-primary/20 rounded-lg" />
                                        <div className="h-12 bg-secondary rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-card border-t border-border py-12 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter mb-4">
                            <GraduationCap className="w-8 h-8 text-primary" />
                            <span>PrepmyExam</span>
                        </div>
                        <p className="text-muted-foreground max-w-sm">
                            Empowering aspirants to achieve their dreams through accessible, high-quality education technology.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Exams</h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li><a href="https://www.ibps.in/" className="hover:text-primary">Banking</a></li>
                            <li><a href="https://ssc.gov.in/" className="hover:text-primary">SSC</a></li>
                            <li><a href="https://www.rrbapply.gov.in/" className="hover:text-primary">Railways</a></li>
                            <li><a href="https://ctet.nic.in/" className="hover:text-primary">Teaching</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Company</h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li><a href="/about" className="hover:text-primary">About Us</a></li>
                            <li><a href="/contact" className="hover:text-primary">Contact</a></li>
                            <li><a href="/privacy" className="hover:text-primary">Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-primary">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto pt-8 border-t border-border text-center text-muted-foreground">
                    © 2026 Uvite Technologies. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
