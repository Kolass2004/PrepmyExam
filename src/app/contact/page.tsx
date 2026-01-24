"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone, Send } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            subject: formData.get("subject"),
            message: formData.get("message"),
        };

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to send message");

            setSubmitted(true);
        } catch (err) {
            setError("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

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

            <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Get in <span className="text-primary">Touch</span></h1>
                        <p className="text-xl text-muted-foreground mb-12">
                            Have questions about our courses, pricing, or just want to say hello? We'd love to hear from you.
                        </p>

                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="p-4 bg-secondary rounded-2xl h-fit">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">Email Us</h3>
                                    <p className="text-muted-foreground">raniv2057@gmail.com</p>

                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="p-4 bg-secondary rounded-2xl h-fit">
                                    <Phone className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">Call Us</h3>
                                    <p className="text-muted-foreground">+91 97511 48603</p>
                                    <p className="text-sm text-muted-foreground mt-1">Mon-Sat from 9am to 6pm</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="p-4 bg-secondary rounded-2xl h-fit">
                                    <MapPin className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">Visit Us</h3>
                                    <p className="text-muted-foreground">
                                        Uvite Technologies<br />
                                        Dindigul, Tamil nadu - 624215

                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border p-8 rounded-[2rem] shadow-lg">
                        {submitted ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                                    <Send className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                                <p className="text-muted-foreground">
                                    Thank you for contacting us. We will get back to you shortly.
                                </p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-8 text-primary font-medium hover:underline"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium mb-2 pl-1">Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium mb-2 pl-1">Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium mb-2 pl-1">Subject</label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                                    >
                                        <option>General Inquiry</option>
                                        <option>Course Support</option>
                                        <option>Billing Issue</option>
                                        <option>Partnership</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium mb-2 pl-1">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        required
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary focus:bg-background outline-none transition-all resize-none"
                                        placeholder="How can we help you?"
                                    />
                                </div>
                                {error && (
                                    <p className="text-red-500 text-sm">{error}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Sending..." : "Send Message"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
