"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/components/ui/AlertModal";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [modalError, setModalError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setModalError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/admin");
        } catch (err: any) {
            console.error("Login failed", err);
            if (err.code === "auth/user-disabled") {
                setModalError("This admin account has been disabled. Please contact the system administrator.");
            } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
                setError("Invalid credentials.");
            } else {
                setError("Access denied. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
            <div className="w-full max-w-md p-8 bg-card border border-border rounded-3xl shadow-xl">
                <div className="flex flex-col items-center mb-8">
                    <img src="/prepmyexam.svg" alt="PrepMyExam Admin" className="w-16 h-16 mb-4 object-contain" />
                    <h1 className="text-2xl font-bold tracking-tight">Admin Access</h1>
                    <p className="text-muted-foreground text-sm">Restricted to authorized personnel only.</p>
                </div>

                <AlertModal
                    isOpen={!!modalError}
                    onClose={() => setModalError("")}
                    title="Access Denied"
                    message={modalError}
                />

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-4 bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="admin@prepmyexam.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-4 bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full py-4 mt-2 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                            loading && "opacity-80 cursor-wait"
                        )}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate"}
                    </button>
                </form>
            </div>
        </div>
    );
}
